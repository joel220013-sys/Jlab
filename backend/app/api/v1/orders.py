# pyrefly: ignore-errors
# type: ignore
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import List
from datetime import datetime
import uuid
import hashlib
from app.database import get_db
from app.models.tenant import Laboratory
from app.models.patient import Patient, Doctor
from app.models.test_catalog import Test, TestParameter
from app.models.order import Order, Sample, Invoice, SampleStatus, InvoiceStatus
from app.models.result import TestResult, ResultValue, Report, ReportStatus
from app.schemas.order import OrderCreate, OrderOut, SampleOut
from app.api.deps import get_current_tenant_context

router = APIRouter(prefix="/orders", tags=["Orders & Invoicing"])

@router.post("", response_model=OrderOut)
async def create_unified_order(
    req: OrderCreate,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    user, lab_id = user_context

    # 1. Resolve Patient
    patient = None
    if req.patient_id:
        stmt = select(Patient).where(Patient.id == req.patient_id, Patient.laboratory_id == lab_id)
        res = await db.execute(stmt)
        patient = res.scalar_one_or_none()
        if not patient:
            raise HTTPException(status_code=404, detail="Selected patient not found")
    elif req.new_patient:
        # Generate sequential 3-digit zero-padded UHID starting from 001
        count_stmt = select(func.count(Patient.id)).where(Patient.laboratory_id == lab_id)
        count_res = await db.execute(count_stmt)
        count = count_res.scalar() or 0
        seq = count + 1
        uhid = f"{seq:03d}"
        while True:
            chk = select(Patient.id).where(Patient.laboratory_id == lab_id, Patient.uhid == uhid)
            if not (await db.execute(chk)).scalar_one_or_none():
                break
            seq += 1
            uhid = f"{seq:03d}"

        patient = Patient(
            laboratory_id=lab_id,
            uhid=uhid,
            full_name=req.new_patient.full_name,
            phone=req.new_patient.phone,
            gender=req.new_patient.gender,
            age_years=req.new_patient.age_years,
            age_months=req.new_patient.age_months or 0,
            age_days=req.new_patient.age_days or 0,
            email=req.new_patient.email,
            blood_group=req.new_patient.blood_group,
            address=req.new_patient.address
        )
        db.add(patient)
        await db.flush()
    else:
        raise HTTPException(status_code=400, detail="Must provide either patient_id or new_patient details")

    # 2. Fetch Selected Tests
    if not req.test_ids:
        raise HTTPException(status_code=400, detail="At least one test must be selected")
    
    stmt_tests = select(Test).where(
        or_(
            Test.id.in_(req.test_ids),
            Test.code.in_(req.test_ids)
        ),
        Test.laboratory_id == lab_id
    )
    res_tests = await db.execute(stmt_tests)
    tests = res_tests.scalars().all()
    if not tests:
        raise HTTPException(status_code=404, detail="No matching tests found in catalog")

    # 3. Calculate Amounts
    if req.custom_prices:
        total_amount = sum(float(req.custom_prices.get(t.id, req.custom_prices.get(t.code, t.standard_price))) for t in tests)
    elif req.total_amount is not None:
        total_amount = float(req.total_amount)
    else:
        total_amount = sum(float(t.standard_price) for t in tests)
    discount = float(req.discount_amount or 0.0)
    final_amount = max(0.0, total_amount - discount)

    # 3.5 Resolve Doctor (Tenant-isolated)
    resolved_doctor_id = req.doctor_id
    if not resolved_doctor_id and req.doctor_name and req.doctor_name.strip() and req.doctor_name.strip() not in ["Self / Direct", "Dr. SELF"]:
        dname = req.doctor_name.strip()
        stmt_doc = select(Doctor).where(Doctor.laboratory_id == lab_id, func.lower(Doctor.full_name) == dname.lower())
        existing_doc = (await db.execute(stmt_doc)).scalar_one_or_none()
        if existing_doc:
            resolved_doctor_id = existing_doc.id
            if req.ref_center and not existing_doc.clinic_hospital_name:
                existing_doc.clinic_hospital_name = req.ref_center.strip()
        else:
            new_doc = Doctor(
                laboratory_id=lab_id,
                full_name=dname,
                clinic_hospital_name=req.ref_center.strip() if req.ref_center else None,
                is_active=True
            )
            db.add(new_doc)
            await db.flush()
            resolved_doctor_id = new_doc.id

    # 4. Generate Identifiers
    year = datetime.utcnow().strftime("%Y")
    order_num = f"ORD-{year}-{str(uuid.uuid4().int)[:5]}"
    lab_num = str(uuid.uuid4().int)[:5] # e.g. 23316
    invoice_num = f"INV-{year}-{str(uuid.uuid4().int)[:5]}"

    # Create Order
    order = Order(
        laboratory_id=lab_id,
        patient_id=patient.id,
        doctor_id=resolved_doctor_id,
        order_number=order_num,
        lab_number=lab_num,
        clinical_history=req.clinical_history,
        total_amount=total_amount,
        discount_amount=discount,
        final_amount=final_amount
    )
    db.add(order)
    await db.flush()

    # 5. Create Samples by tube type
    # Group tests by specimen/tube color to prevent duplicate unnecessary vials
    tube_map = {}
    for t in tests:
        color = t.tube_color or "Lavender / EDTA"
        if color not in tube_map:
            tube_map[color] = []
        tube_map[color].append(t)

    created_samples = []
    for color, test_group in tube_map.items():
        barcode = f"SMP-{year}-{str(uuid.uuid4().int)[:5]}"
        sample = Sample(
            laboratory_id=lab_id,
            order_id=order.id,
            barcode=barcode,
            specimen_type=test_group[0].specimen_type,
            tube_color=color,
            status=SampleStatus.COLLECTED,
            collected_at=datetime.utcnow()
        )
        db.add(sample)
        await db.flush()
        created_samples.append(sample)

        # 6. Initialize Test Results for each test in this sample
        for t in test_group:
            cust_p = None
            if req.custom_prices:
                cust_p = req.custom_prices.get(t.id, req.custom_prices.get(t.code))
            test_result = TestResult(
                laboratory_id=lab_id,
                order_id=order.id,
                sample_id=sample.id,
                test_id=t.id,
                status="PROCESSING",
                technician_remarks=f"PRICE:{cust_p}" if cust_p is not None else None
            )
            db.add(test_result)
            await db.flush()

            # Initialize parameter result slots
            stmt_params = select(TestParameter).where(TestParameter.test_id == t.id).order_by(TestParameter.display_order)
            res_params = await db.execute(stmt_params)
            params = res_params.scalars().all()
            if not params:
                fallback_p = TestParameter(
                    test_id=t.id,
                    code=t.code,
                    name=t.name,
                    unit="",
                    value_type="TEXT" if any(w in t.name.upper() for w in ["SMEAR", "CULTURE", "BIOPSY", "GROUP", "CARD"]) else "NUMERIC",
                    display_order=1
                )
                db.add(fallback_p)
                await db.flush()
                params = [fallback_p]

            for p in params:
                db.add(ResultValue(
                    test_result_id=test_result.id,
                    parameter_id=p.id,
                    numeric_value=None,
                    flag="NORMAL"
                ))

    # 7. Create Invoice
    paid = float(req.initial_payment or 0.0)
    balance = max(0.0, final_amount - paid)
    inv_status = InvoiceStatus.PAID if balance == 0.0 else (InvoiceStatus.PARTIALLY_PAID if paid > 0 else InvoiceStatus.UNPAID)
    
    invoice = Invoice(
        laboratory_id=lab_id,
        order_id=order.id,
        invoice_number=invoice_num,
        total=final_amount,
        paid_amount=paid,
        balance=balance,
        status=inv_status,
        payment_method=req.payment_method
    )
    db.add(invoice)

    # 8. Create Report Slot with public verification hash
    raw_hash_seed = f"{lab_id}:{order.id}:{datetime.utcnow().isoformat()}"
    pub_hash = hashlib.sha256(raw_hash_seed.encode()).hexdigest()[:24]

    report = Report(
        laboratory_id=lab_id,
        order_id=order.id,
        report_number=f"REP-{year}-{str(uuid.uuid4().int)[:5]}",
        status=ReportStatus.DRAFT,
        public_verification_hash=pub_hash,
        is_locked_for_billing=(balance > 0.0) # Locked until paid!
    )
    db.add(report)

    await db.commit()

    return OrderOut(
        id=order.id,
        order_number=order.order_number,
        lab_number=order.lab_number,
        patient_id=patient.id,
        patient_name=patient.full_name,
        patient_uhid=patient.uhid,
        total_amount=float(order.total_amount),
        discount_amount=float(order.discount_amount),
        final_amount=float(order.final_amount),
        invoice_status=inv_status,
        samples=[SampleOut(
            id=s.id,
            barcode=s.barcode,
            specimen_type=s.specimen_type,
            tube_color=s.tube_color,
            status=s.status,
            collected_at=s.collected_at,
            received_at_lab_at=s.received_at_lab_at
        ) for s in created_samples],
        created_at=order.created_at
    )

@router.get("", response_model=List[OrderOut])
async def list_orders(
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    stmt = select(Order).where(Order.laboratory_id == lab_id).order_by(Order.created_at.desc()).limit(50)
    res = await db.execute(stmt)
    orders = res.scalars().all()

    out = []
    for o in orders:
        stmt_p = select(Patient).where(Patient.id == o.patient_id)
        p = (await db.execute(stmt_p)).scalar_one()
        stmt_s = select(Sample).where(Sample.order_id == o.id)
        samples = (await db.execute(stmt_s)).scalars().all()
        stmt_inv = select(Invoice).where(Invoice.order_id == o.id)
        inv = (await db.execute(stmt_inv)).scalar_one_or_none()

        out.append(OrderOut(
            id=o.id,
            order_number=o.order_number,
            lab_number=o.lab_number,
            patient_id=p.id,
            patient_name=p.full_name,
            patient_uhid=p.uhid,
            total_amount=float(o.total_amount),
            discount_amount=float(o.discount_amount),
            final_amount=float(o.final_amount),
            invoice_status=inv.status if inv else "UNPAID",
            samples=[SampleOut(
                id=s.id,
                barcode=s.barcode,
                specimen_type=s.specimen_type,
                tube_color=s.tube_color,
                status=s.status,
                collected_at=s.collected_at,
                received_at_lab_at=s.received_at_lab_at
            ) for s in samples],
            created_at=o.created_at
        ))
    return out

@router.get("/{order_id}")
async def get_order_detail(
    order_id: str,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    stmt = select(Order).where(Order.id == order_id, Order.laboratory_id == lab_id)
    order = (await db.execute(stmt)).scalar_one_or_none()
    if not order:
        # Also check by lab_number
        stmt_lab = select(Order).where(Order.lab_number == order_id, Order.laboratory_id == lab_id)
        order = (await db.execute(stmt_lab)).scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

    # Fetch patient
    stmt_p = select(Patient).where(Patient.id == order.patient_id)
    patient = (await db.execute(stmt_p)).scalar_one()

    # Fetch doctor
    doctor_name = "Dr. SELF"
    if order.doctor_id:
        stmt_d = select(Doctor).where(Doctor.id == order.doctor_id)
        doc = (await db.execute(stmt_d)).scalar_one_or_none()
        if doc:
            doctor_name = doc.full_name

    # Extract Ref Center or Ref Doctor from clinical_history if present
    ref_center = "SAIBALAJI DIAGNOSTIC CENTER"
    if order.clinical_history:
        for part in order.clinical_history.split(" | "):
            if part.startswith("Ref Center: "):
                ref_center = part.replace("Ref Center: ", "").strip()
            elif part.startswith("Ref By: "):
                doctor_name = part.replace("Ref By: ", "").strip()

    # Fetch samples
    stmt_s = select(Sample).where(Sample.order_id == order.id)
    samples = (await db.execute(stmt_s)).scalars().all()
    sample_map = {s.id: s for s in samples}

    # Fetch test results with tests
    from app.models.test_catalog import TestCategory
    stmt_tr = (
        select(TestResult, Test, TestCategory)
        .join(Test, TestResult.test_id == Test.id)
        .outerjoin(TestCategory, Test.category_id == TestCategory.id)
        .where(TestResult.order_id == order.id)
        .order_by(Test.name)
    )
    res_tr = await db.execute(stmt_tr)
    tr_rows = res_tr.all()

    tests_data = []
    for tr, t, tc in tr_rows:
        s = sample_map.get(tr.sample_id)
        # Check values count
        stmt_val = select(ResultValue).where(ResultValue.test_result_id == tr.id)
        vals = (await db.execute(stmt_val)).scalars().all()
        has_entered = any(v.numeric_value is not None or (v.text_value and v.text_value.strip()) for v in vals)

        price_val = float(t.standard_price) if getattr(t, "standard_price", None) is not None else 0.0
        if tr.technician_remarks and tr.technician_remarks.startswith("PRICE:"):
            try:
                price_val = float(tr.technician_remarks.replace("PRICE:", ""))
            except ValueError:
                pass

        tests_data.append({
            "test_result_id": tr.id,
            "test_id": t.id,
            "name": t.name,
            "code": t.code,
            "category": tc.name if tc else "Biochemistry",
            "price": price_val,
            "sample_id": tr.sample_id,
            "sample_barcode": s.barcode if s else "",
            "tube_color": s.tube_color if s else t.tube_color or "Yellow",
            "specimen_type": s.specimen_type if s else t.specimen_type or "Serum",
            "status": tr.status,
            "has_entered_results": has_entered,
            "parameters_count": len(vals)
        })

    # Fetch invoice
    stmt_inv = select(Invoice).where(Invoice.order_id == order.id)
    inv = (await db.execute(stmt_inv)).scalar_one_or_none()

    # Fetch laboratory
    lab = (await db.execute(select(Laboratory).where(Laboratory.id == lab_id))).scalar_one_or_none()

    # Fetch patient's order history (other orders by this patient)
    stmt_patient_orders = (
        select(Order)
        .where(Order.patient_id == patient.id, Order.laboratory_id == lab_id)
        .order_by(Order.created_at.desc())
    )
    p_orders = (await db.execute(stmt_patient_orders)).scalars().all()
    history_orders = [
        {
            "id": po.id,
            "order_number": po.order_number,
            "lab_number": po.lab_number,
            "date": po.created_at.strftime("%d-%m-%Y") if po.created_at else "",
            "is_current": po.id == order.id
        }
        for po in p_orders
    ]

    clean_uhid = patient.uhid.replace("PAT-", "").replace("-", "") if patient.uhid else "003"
    order_time_str = order.created_at.strftime("%I:%M:%S %p") if order.created_at else "11:24:45 AM"
    order_date_str = order.created_at.strftime("%d-%m-%Y") if order.created_at else "16-10-2026"

    return {
        "id": order.id,
        "order_number": order.order_number,
        "lab_number": order.lab_number,
        "created_at": order.created_at.strftime("%d-%m-%Y %I:%M %p") if order.created_at else "",
        "order_date": order_date_str,
        "order_time": order_time_str,
        "total_amount": float(order.total_amount),
        "discount_amount": float(order.discount_amount),
        "final_amount": float(order.final_amount),
        "laboratory": {
            "name": lab.name if lab else "SRI SAI BALAJI DIAGNOSTICS",
            "legal_name": lab.legal_name if (lab and lab.legal_name) else "Sai Balaji Speciality Centre",
            "address": lab.address if (lab and lab.address) else "#42, 10th Main, Jayanagar 4th Block, Bangalore - 560011",
            "phone": lab.phone if (lab and lab.phone) else "+91 9880016018, 080-23456789",
            "email": lab.email if (lab and lab.email) else "contact@saibalajidiagnostics.com"
        },
        "patient": {
            "id": patient.id,
            "full_name": patient.full_name,
            "uhid": patient.uhid,
            "reg_no": clean_uhid,
            "age_years": patient.age_years,
            "age_months": patient.age_months or 0,
            "gender": patient.gender,
            "phone": patient.phone,
            "email": patient.email,
            "blood_group": patient.blood_group,
            "address": patient.address
        },
        "doctor_name": doctor_name,
        "ref_center": ref_center,
        "clinical_history": order.clinical_history,
        "invoice": {
            "id": inv.id if inv else None,
            "invoice_number": inv.invoice_number if inv else (f"INV-{order.created_at.strftime('%Y')}-{order.lab_number}" if order.created_at else f"INV-{order.lab_number}"),
            "total": float(inv.total) if inv else float(order.final_amount),
            "paid_amount": float(inv.paid_amount) if inv else float(order.final_amount),
            "balance": float(inv.balance) if inv else 0.0,
            "status": inv.status if inv else "PAID",
            "payment_method": inv.payment_method if (inv and inv.payment_method) else "CASH"
        },
        "samples": [
            {
                "id": s.id,
                "barcode": s.barcode,
                "tube_color": s.tube_color,
                "specimen_type": s.specimen_type,
                "status": s.status
            }
            for s in samples
        ],
        "tests": tests_data,
        "patient_orders": history_orders
    }
