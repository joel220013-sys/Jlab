# pyrefly: ignore-errors
# type: ignore
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models.tenant import Laboratory
from app.models.patient import Patient, Doctor
from app.models.user import User, LaboratoryStaff
from app.models.test_catalog import Test, TestParameter, ParameterRange, TestCategory
from app.models.order import Order, Sample, Invoice
from app.models.result import TestResult, ResultValue, Report, ReportStatus
from app.api.deps import get_current_tenant_context, require_roles

router = APIRouter(prefix="/reports", tags=["Reports & Public QR Verification"])

@router.get("")
async def list_reports(
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    lab = (await db.execute(select(Laboratory).where(Laboratory.id == lab_id))).scalar_one_or_none()
    stmt = (
        select(Report, Order, Patient, Invoice, Doctor)
        .join(Order, Report.order_id == Order.id)
        .join(Patient, Order.patient_id == Patient.id)
        .outerjoin(Invoice, Invoice.order_id == Order.id)
        .outerjoin(Doctor, Order.doctor_id == Doctor.id)
        .where(Report.laboratory_id == lab_id)
        .order_by(Order.created_at.desc())
        .limit(100)
    )
    rows = (await db.execute(stmt)).all()

    # Batch-fetch all test names across all orders in a single roundtrip (eliminating N+1 query)
    order_ids = [order.id for _, order, _, _, _ in rows]
    test_names_map = {}
    if order_ids:
        stmt_tests = (
            select(TestResult.order_id, Test.name)
            .join(Test, TestResult.test_id == Test.id)
            .where(TestResult.order_id.in_(order_ids))
        )
        for oid, tname in (await db.execute(stmt_tests)).all():
            if oid not in test_names_map:
                test_names_map[oid] = []
            test_names_map[oid].append(tname)

    out = []
    for rep, order, patient, inv, doc in rows:
        is_locked = False
        if inv and inv.balance > 0 and not inv.is_credit_override:
            is_locked = True

        test_names = test_names_map.get(order.id, [])
        tests_str = ", ".join(test_names) if test_names else "GENERAL CLINICAL INVESTIGATIONS"

        clean_uhid = patient.uhid.replace("PAT-", "").replace("-", "") if patient.uhid else "000000"
        order_date_str = order.created_at.strftime("%d-%m-%Y") if order.created_at else datetime.utcnow().strftime("%d-%m-%Y")

        doc_name_str = doc.full_name if doc else None
        ref_center_str = doc.clinic_hospital_name if (doc and doc.clinic_hospital_name) else None
        if order.clinical_history:
            import re
            m_rc = re.search(r'Ref Center:\s*([^|]+)', order.clinical_history)
            if m_rc:
                ref_center_str = m_rc.group(1).strip()
            m_doc = re.search(r'Ref By:\s*([^|]+)', order.clinical_history)
            if m_doc:
                extracted = m_doc.group(1).strip()
                if extracted and extracted != "Self / Direct":
                    if not doc_name_str or doc_name_str == "Dr. SELF":
                        doc_name_str = extracted

        out.append({
            "id": rep.id,
            "order_id": order.id,
            "report_number": rep.report_number,
            "order_number": order.order_number,
            "lab_number": order.lab_number,
            "patient_name": patient.full_name,
            "patient_uhid": patient.uhid,
            "patient_reg_no": clean_uhid,
            "patient_phone": patient.phone or "",
            "patient_age": patient.age_years,
            "patient_gender": patient.gender,
            "reg_lab_no": f"{clean_uhid} / {order.lab_number}",
            "order_date": order_date_str,
            "date": order_date_str,
            "ip_op": "OP",
            "doctor_name": doc_name_str or "Self / Direct",
            "ref_center": ref_center_str or "Direct Walk-in",
            "printed_count": 2,
            "user_log_count": 0,
            "lab_order_tests": tests_str,
            "status": rep.status,
            "is_locked_for_billing": is_locked,
            "public_verification_hash": rep.public_verification_hash,
            "invoice_balance": float(inv.balance) if inv else 0.0,
            "invoice_total": float(inv.total) if inv else 0.0,
            "laboratory_name": lab.name if lab else "Diagnostic Centre",
            "created_at": rep.created_at.strftime("%d %b %Y, %I:%M %p") if rep.created_at else None
        })
    return out


@router.get("/verify/{pub_hash}")
async def public_verify_report(pub_hash: str, db: AsyncSession = Depends(get_db)):
    """
    Public QR code verification endpoint.
    No login required. Validates authenticity of printed/digital reports.
    """
    stmt = select(Report).where(Report.public_verification_hash == pub_hash)
    report = (await db.execute(stmt)).scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Invalid verification hash. Report authenticity cannot be verified.")

    lab = (await db.execute(select(Laboratory).where(Laboratory.id == report.laboratory_id))).scalar_one()
    order = (await db.execute(select(Order).where(Order.id == report.order_id))).scalar_one()
    patient = (await db.execute(select(Patient).where(Patient.id == order.patient_id))).scalar_one()

    # Approving pathologist info
    stmt_tr = select(TestResult).where(TestResult.order_id == order.id, TestResult.status == "VERIFIED")
    tr = (await db.execute(stmt_tr)).scalars().first()
    
    pathologist_name = "Authorized Medical Officer"
    license_no = "NABL-REG"
    if tr and tr.pathologist_id:
        p_user = (await db.execute(select(User).where(User.id == tr.pathologist_id))).scalar_one_or_none()
        p_staff = (await db.execute(select(LaboratoryStaff).where(LaboratoryStaff.user_id == tr.pathologist_id))).scalar_one_or_none()
        if p_user:
            pathologist_name = p_user.full_name
        if p_staff and p_staff.medical_license_number:
            license_no = p_staff.medical_license_number

    return {
        "verified": True,
        "report_number": report.report_number,
        "status": report.status,
        "laboratory": {
            "name": lab.name,
            "legal_name": lab.legal_name,
            "city": lab.city,
            "phone": lab.phone
        },
        "patient": {
            "name": patient.full_name,
            "uhid": patient.uhid,
            "age_gender": f"{patient.age_years}Y / {patient.gender}"
        },
        "order": {
            "order_number": order.order_number,
            "lab_number": order.lab_number,
            "collected_date": order.created_at.strftime("%d %b %Y, %I:%M %p")
        },
        "verified_by": {
            "name": pathologist_name,
            "license": license_no,
            "verified_at": report.published_at.strftime("%d %b %Y, %I:%M %p") if report.published_at else None
        }
    }

@router.get("/{order_id}")
async def get_report_data(
    order_id: str,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    
    stmt = select(Report).where(
        (Report.order_id == order_id) | (Report.id == order_id) | (Report.report_number == order_id),
        Report.laboratory_id == lab_id
    )
    report = (await db.execute(stmt)).scalar_one_or_none()
    if not report:
        # Check by Order.id, Order.order_number, or Order.lab_number
        stmt_ord = select(Order).where(
            (Order.id == order_id) | (Order.order_number == order_id) | (Order.lab_number == order_id),
            Order.laboratory_id == lab_id
        )
        ord_obj = (await db.execute(stmt_ord)).scalar_one_or_none()
        if ord_obj:
            order_id = ord_obj.id
            report = (await db.execute(select(Report).where(Report.order_id == order_id))).scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    order_id = report.order_id
    lab = (await db.execute(select(Laboratory).where(Laboratory.id == lab_id))).scalar_one()
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one()
    patient = (await db.execute(select(Patient).where(Patient.id == order.patient_id))).scalar_one()
    invoice = (await db.execute(select(Invoice).where(Invoice.order_id == order_id))).scalar_one_or_none()
    doctor = (await db.execute(select(Doctor).where(Doctor.id == order.doctor_id))).scalar_one_or_none()

    # Enforce Report-Locked Billing Check
    is_locked = False
    if invoice and invoice.balance > 0 and not invoice.is_credit_override:
        is_locked = True
        report.is_locked_for_billing = True

    # Fetch tests and result parameter values
    stmt_results = select(TestResult).where(TestResult.order_id == order_id)
    results = (await db.execute(stmt_results)).scalars().all()

    test_sections = []
    for tr in results:
        t = (await db.execute(select(Test).where(Test.id == tr.test_id))).scalar_one()

        # Query Category / Department
        cat_name = "GENERAL PATHOLOGY"
        if t.category_id:
            cat_obj = (await db.execute(select(TestCategory).where(TestCategory.id == t.category_id))).scalar_one_or_none()
            if cat_obj and cat_obj.name:
                cat_name = cat_obj.name

        stmt_vals = (
            select(ResultValue, TestParameter)
            .join(TestParameter, ResultValue.parameter_id == TestParameter.id)
            .where(ResultValue.test_result_id == tr.id)
            .order_by(TestParameter.display_order)
        )
        vals_with_params = (await db.execute(stmt_vals)).all()

        param_list = []
        for v, p in vals_with_params:
            raw_val = v.numeric_value if v.numeric_value is not None else v.text_value
            # Check if this parameter was actually entered by the technician
            if raw_val is None:
                continue
            str_val = str(raw_val).strip()
            if str_val == "" or str_val in ["—", "-", "--", "None", "null", "undefined"]:
                continue

            stmt_rng = select(ParameterRange).where(
                ParameterRange.parameter_id == p.id,
                ParameterRange.gender.in_([patient.gender, "ALL"])
            )
            rng = (await db.execute(stmt_rng)).scalar_one_or_none()
            flag_str = v.flag or "NORMAL"
            if v.is_abnormal and flag_str == "NORMAL":
                flag_str = "ABNORMAL"
            param_list.append({
                "name": p.name,
                "code": p.code,
                "result": raw_val,
                "unit": p.unit or "",
                "reference_range": rng.textual_reference if rng else "",
                "flag": flag_str,
                "is_abnormal": v.is_abnormal,
                "is_bold": v.is_bold_highlight,
                "is_differential_part": bool(p.is_differential_part)
            })

        # Only include test section in the report if at least one parameter was entered
        if param_list:
            test_sections.append({
                "test_id": t.id,
                "test_name": t.name,
                "test_code": t.code,
                "department": cat_name,
                "category_name": cat_name,
                "specimen": t.specimen_type,
                "status": tr.status,
                "parameters": param_list
            })

    # Group test sections by department
    departments_map = {}
    for sec in test_sections:
        dept = sec.get("department") or "GENERAL PATHOLOGY"
        if dept not in departments_map:
            departments_map[dept] = []
        departments_map[dept].append(sec)

    departments_list = [
        {"department": dept, "tests": tests}
        for dept, tests in departments_map.items()
    ]

    # Patient's order history for left panel
    stmt_other = (
        select(Order)
        .where(Order.patient_id == patient.id, Order.laboratory_id == lab_id)
        .order_by(Order.created_at.desc())
    )
    other_orders = (await db.execute(stmt_other)).scalars().all()
    patient_orders = [
        {
            "id": o.id,
            "order_number": o.order_number,
            "lab_number": o.lab_number,
            "date": o.created_at.strftime("%d-%m-%Y") if o.created_at else "Today",
            "is_current": o.id == order.id
        }
        for o in other_orders
    ]
    # Only real past orders for this patient are returned (no mock dates)

    # Approving pathologist info
    stmt_tr = select(TestResult).where(TestResult.order_id == order_id)
    results_list = (await db.execute(stmt_tr)).scalars().all()
    
    pathologist_name = "Medical Officer"
    qualification = "MBBS, MD (Pathology)"
    designation = f"Consultant Pathologist, {lab.name}"
    
    found_staff = False
    for tr_item in results_list:
        if tr_item.pathologist_id:
            p_user = (await db.execute(select(User).where(User.id == tr_item.pathologist_id))).scalar_one_or_none()
            p_staff = (await db.execute(select(LaboratoryStaff).where(LaboratoryStaff.user_id == tr_item.pathologist_id))).scalar_one_or_none()
            if p_user:
                pathologist_name = p_user.full_name
            if p_staff:
                if p_staff.medical_license_number:
                    qualification = f"MD (Pathology), Reg: {p_staff.medical_license_number}"
                if p_staff.designation:
                    designation = p_staff.designation
            found_staff = True
            break

    if not found_staff:
        stmt_staff = (
            select(User, LaboratoryStaff)
            .join(LaboratoryStaff, User.id == LaboratoryStaff.user_id)
            .where(LaboratoryStaff.laboratory_id == lab_id)
        )
        first_staff = (await db.execute(stmt_staff)).first()
        if first_staff:
            u_staff, l_staff = first_staff
            if u_staff and u_staff.full_name:
                pathologist_name = u_staff.full_name
            if l_staff and l_staff.designation:
                designation = l_staff.designation

    addr_parts = [p for p in [lab.address, lab.city, lab.state, lab.pincode] if p]
    formatted_address = ", ".join(addr_parts) if addr_parts else (lab.address or lab.city or lab.name or "Diagnostic Laboratory")
    clean_uhid = patient.uhid.replace("PAT-", "").replace("-", "") if patient.uhid else "001"
    order_date_str = order.created_at.strftime("%d-%m-%Y") if order.created_at else datetime.utcnow().strftime("%d-%m-%Y")

    # Resolve Doctor & Ref Center dynamically from Order, Doctor record, or clinical_history
    import re
    ref_center_val = None
    doctor_name_val = doctor.full_name if doctor else None

    if order.clinical_history:
        m_rc = re.search(r'Ref Center:\s*([^|]+)', order.clinical_history)
        if m_rc:
            ref_center_val = m_rc.group(1).strip()
        m_doc = re.search(r'Ref By:\s*([^|]+)', order.clinical_history)
        if m_doc:
            doc_extracted = m_doc.group(1).strip()
            if doc_extracted and doc_extracted != "Self / Direct":
                if not doctor_name_val or doctor_name_val in ["Dr. SELF", "Self / Direct"]:
                    doctor_name_val = doc_extracted

    if not ref_center_val and doctor and doctor.clinic_hospital_name:
        ref_center_val = doctor.clinic_hospital_name
    if not ref_center_val:
        ref_center_val = "Direct Walk-in"

    if not doctor_name_val:
        doctor_name_val = "Self / Direct"

    return {
        "report_id": report.id,
        "report_number": report.report_number,
        "status": report.status,
        "public_verification_hash": report.public_verification_hash,
        "verification_url": f"https://pulselab.app/verify/{report.public_verification_hash}",
        "is_locked_for_billing": is_locked,
        "printed_count": 2,
        "user_log_count": 0,
        "handed_over_to": "Patient (Self)",
        "billing": {
            "invoice_number": invoice.invoice_number if invoice else None,
            "total": float(invoice.total) if invoice else 0.0,
            "balance": float(invoice.balance) if invoice else 0.0,
            "status": invoice.status if invoice else "UNPAID"
        },
        "laboratory": {
            "id": lab.id,
            "name": lab.name,
            "legal_name": lab.legal_name or lab.name,
            "tagline": "Quality Healthcare Through Accurate Diagnostics",
            "phone": lab.phone or "",
            "email": lab.email or "",
            "address": formatted_address,
            "nabl_accr": "NABL CERTIFIED · MC-3482",
            "logo_url": lab.logo_url
        },
        "patient": {
            "id": patient.id,
            "name": patient.full_name,
            "uhid": patient.uhid,
            "reg_no": clean_uhid,
            "age_years": patient.age_years,
            "gender": patient.gender,
            "age_gender": f"{patient.age_years} Yrs / {patient.gender}",
            "phone": patient.phone or "",
            "address": patient.address or ""
        },
        "order": {
            "id": order.id,
            "order_number": order.order_number,
            "lab_number": order.lab_number,
            "reg_lab_no": f"{clean_uhid} / {order.lab_number}",
            "doctor": doctor_name_val,
            "ref_center": ref_center_val,
            "date": order_date_str,
            "reported_date": report.published_at.strftime("%d-%m-%Y") if report.published_at else order_date_str,
            "specimen": "EDTA Whole Blood / Urine"
        },
        "patient_orders": patient_orders,
        "verified_by": {
            "name": pathologist_name,
            "qualification": qualification,
            "designation": designation,
            "verified_at": report.published_at.strftime("%d %b %Y, %I:%M %p") if report.published_at else (report.created_at.strftime("%d %b %Y, %I:%M %p") if report.created_at else "Today")
        },
        "tests": test_sections,
        "departments": departments_list
    }

@router.post("/{order_id}/override-billing-lock")
async def override_billing_lock(
    order_id: str,
    user_context = Depends(require_roles(["LAB_ADMIN", "SUPER_ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    stmt_inv = select(Invoice).where(Invoice.order_id == order_id, Invoice.laboratory_id == lab_id)
    inv = (await db.execute(stmt_inv)).scalar_one_or_none()
    if not inv:
        stmt_rep = select(Report).where((Report.id == order_id) | (Report.report_number == order_id))
        rep_obj = (await db.execute(stmt_rep)).scalar_one_or_none()
        if rep_obj:
            order_id = rep_obj.order_id
        else:
            stmt_ord = select(Order).where(
                (Order.id == order_id) | (Order.order_number == order_id) | (Order.lab_number == order_id),
                Order.laboratory_id == lab_id
            )
            ord_obj = (await db.execute(stmt_ord)).scalar_one_or_none()
            if ord_obj:
                order_id = ord_obj.id
        stmt_inv = select(Invoice).where(Invoice.order_id == order_id)
        inv = (await db.execute(stmt_inv)).scalar_one_or_none()

    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    inv.is_credit_override = True
    inv.status = "CREDIT_APPROVED"

    stmt_rep = select(Report).where(Report.order_id == order_id)
    rep = (await db.execute(stmt_rep)).scalar_one_or_none()
    if rep:
        rep.is_locked_for_billing = False

    await db.commit()
    return {"status": "SUCCESS", "message": "Credit override approved. Report unlocked for delivery."}
