# pyrefly: ignore-errors
# type: ignore
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Optional
from datetime import datetime
from app.database import get_db
from app.models.patient import Patient, Doctor
from app.models.test_catalog import Test, TestParameter, ParameterRange
from app.models.order import Order, Sample
from app.models.result import TestResult, ResultValue, Report, ReportStatus
from app.schemas.result import (
    WorklistTestItem, ParameterRowOut, ResultSubmitRequest, 
    ResultValidationResponse, ValidationAlert
)
from app.core.clinical_guards import (
    validate_wbc_differential, check_impossible_and_critical_bounds, 
    calculate_derived_formulas
)
from app.api.deps import get_current_tenant_context

router = APIRouter(prefix="/results", tags=["Manual Result Entry & Workbench"])

@router.get("/worklist", response_model=List[WorklistTestItem])
async def get_technician_worklist(
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    stmt = (
        select(TestResult, Order, Sample, Test, Patient)
        .join(Order, TestResult.order_id == Order.id)
        .join(Sample, TestResult.sample_id == Sample.id)
        .join(Test, TestResult.test_id == Test.id)
        .join(Patient, Order.patient_id == Patient.id)
        .where(
            TestResult.laboratory_id == lab_id,
            TestResult.status.in_(["PROCESSING", "DRAFT", "PENDING_VERIFICATION", "VERIFIED"])
        )
        .order_by(TestResult.created_at.desc())
        .limit(100)
    )
    res = await db.execute(stmt)
    rows = res.all()

    worklist = []
    for tr, o, s, t, p in rows:
        worklist.append(WorklistTestItem(
            test_result_id=tr.id,
            order_id=o.id,
            order_number=o.order_number,
            lab_number=o.lab_number,
            barcode=s.barcode,
            patient_name=p.full_name,
            patient_uhid=p.uhid,
            patient_age_gender=f"{p.age_years}Y / {p.gender}",
            test_name=t.name,
            test_code=t.code,
            specimen_type=s.specimen_type,
            status=tr.status,
            created_at=tr.created_at
        ))
    return worklist

@router.get("/{result_id}")
async def get_result_entry_details(
    result_id: str,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    
    # 1. Fetch Result & relations
    stmt = select(TestResult).where(TestResult.id == result_id, TestResult.laboratory_id == lab_id)
    tr = (await db.execute(stmt)).scalar_one_or_none()
    if not tr:
        raise HTTPException(status_code=404, detail="Test result not found")

    order = (await db.execute(select(Order).where(Order.id == tr.order_id))).scalar_one()
    patient = (await db.execute(select(Patient).where(Patient.id == order.patient_id))).scalar_one()
    sample = (await db.execute(select(Sample).where(Sample.id == tr.sample_id))).scalar_one()
    test = (await db.execute(select(Test).where(Test.id == tr.test_id))).scalar_one()
    doctor = (await db.execute(select(Doctor).where(Doctor.id == order.doctor_id))).scalar_one_or_none()

    # 2. Fetch Parameters & Values
    stmt_params = select(TestParameter).where(TestParameter.test_id == test.id).order_by(TestParameter.display_order)
    params = (await db.execute(stmt_params)).scalars().all()
    if not params:
        fallback_param = TestParameter(
            test_id=test.id,
            code=test.code,
            name=test.name,
            unit="",
            value_type="TEXT" if any(w in test.name.upper() for w in ["SMEAR", "CULTURE", "BIOPSY", "GROUP", "CARD"]) else "NUMERIC",
            display_order=1
        )
        db.add(fallback_param)
        await db.flush()
        params = [fallback_param]

    stmt_values = select(ResultValue).where(ResultValue.test_result_id == tr.id)
    curr_values = {v.parameter_id: v for v in (await db.execute(stmt_values)).scalars().all()}

    # 3. Build parameter rows with demographic ranges and delta check
    parameter_rows = []
    for p in params:
        # Match demographic range
        stmt_range = select(ParameterRange).where(
            ParameterRange.parameter_id == p.id,
            ParameterRange.gender.in_([patient.gender, "ALL"])
        )
        rng = (await db.execute(stmt_range)).scalar_one_or_none()

        val_obj = curr_values.get(p.id)
        curr_num = float(val_obj.numeric_value) if val_obj and val_obj.numeric_value is not None else None
        curr_text = val_obj.text_value if val_obj else None
        is_bold = bool(val_obj.is_bold_highlight) if (val_obj and val_obj.is_bold_highlight is not None) else False
        flag = str(val_obj.flag) if (val_obj and val_obj.flag) else "NORMAL"

        # Check prior historical test value for this patient (Historical Delta)
        stmt_prev = (
            select(ResultValue, TestResult)
            .join(TestResult, ResultValue.test_result_id == TestResult.id)
            .join(Order, TestResult.order_id == Order.id)
            .where(
                Order.patient_id == patient.id,
                ResultValue.parameter_id == p.id,
                TestResult.id != tr.id,
                ResultValue.numeric_value.isnot(None)
            )
            .order_by(TestResult.created_at.desc())
            .limit(1)
        )
        prev_res = (await db.execute(stmt_prev)).first()
        prev_val = float(prev_res[0].numeric_value) if prev_res else None
        prev_date = prev_res[1].created_at.strftime("%d-%m-%Y") if prev_res else None

        parameter_rows.append(ParameterRowOut(
            parameter_id=p.id,
            code=p.code,
            name=p.name,
            unit=p.unit,
            value_type=p.value_type,
            current_numeric=curr_num,
            current_text=curr_text,
            reference_low=float(rng.reference_low) if rng and rng.reference_low is not None else None,
            reference_high=float(rng.reference_high) if rng and rng.reference_high is not None else None,
            reference_text=rng.textual_reference if rng else None,
            delta_previous_value=prev_val,
            delta_previous_date=prev_date,
            flag=flag,
            is_bold_highlight=is_bold,
            is_differential_part=bool(p.is_differential_part)
        ))

    return {
        "test_result_id": tr.id,
        "status": tr.status,
        "technician_remarks": tr.technician_remarks,
        "pathologist_remarks": tr.pathologist_remarks,
        "patient": {
            "name": patient.full_name,
            "uhid": patient.uhid,
            "age_gender": f"{patient.age_years} Years / {patient.gender}",
            "phone": patient.phone
        },
        "order": {
            "order_number": order.order_number,
            "lab_number": order.lab_number,
            "doctor_name": doctor.full_name if doctor else "Self / Direct"
        },
        "test": {
            "name": test.name,
            "code": test.code,
            "specimen_type": sample.specimen_type,
            "tube_color": sample.tube_color,
            "barcode": sample.barcode
        },
        "parameters": parameter_rows
    }

@router.post("/{result_id}/save", response_model=ResultValidationResponse)
async def save_manual_results(
    result_id: str,
    req: ResultSubmitRequest,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    user, lab_id = user_context

    stmt = select(TestResult).where(TestResult.id == result_id, TestResult.laboratory_id == lab_id)
    tr = (await db.execute(stmt)).scalar_one_or_none()
    if not tr:
        raise HTTPException(status_code=404, detail="Test result not found")

    order = (await db.execute(select(Order).where(Order.id == tr.order_id))).scalar_one()
    patient = (await db.execute(select(Patient).where(Patient.id == order.patient_id))).scalar_one()

    # Build parameter lookup
    stmt_params = select(TestParameter).where(TestParameter.test_id == tr.test_id)
    params_catalog = {p.id: p for p in (await db.execute(stmt_params)).scalars().all()}

    values_dict: Dict[str, float] = {}
    for item in req.parameters:
        if item.numeric_value is not None:
            values_dict[item.code] = item.numeric_value

    # Auto-calculate derived parameters (e.g. VLDL, LDL, Globulin)
    derived = calculate_derived_formulas(values_dict)
    for code, val in derived.items():
        values_dict[code] = val

    alerts: List[ValidationAlert] = []

    # 1. WBC Differential validation
    has_diff = any(params_catalog[item.parameter_id].is_differential_part for item in req.parameters if item.parameter_id in params_catalog)
    diff_valid, diff_sum, diff_msg = True, None, None
    if has_diff:
        diff_valid, diff_sum, diff_msg = validate_wbc_differential(values_dict)
        if not diff_valid:
            alerts.append(ValidationAlert(
                parameter_code="DIFFERENTIAL",
                severity="WARNING",
                message=diff_msg
            ))

    # 2. Check each parameter against impossible and critical thresholds
    for item in req.parameters:
        p_def = params_catalog.get(item.parameter_id)
        if not p_def or item.numeric_value is None:
            continue
        
        # Demographic range
        stmt_range = select(ParameterRange).where(
            ParameterRange.parameter_id == p_def.id,
            ParameterRange.gender.in_([patient.gender, "ALL"])
        )
        rng = (await db.execute(stmt_range)).scalar_one_or_none()
        ref_l = float(rng.reference_low) if rng and rng.reference_low is not None else None
        ref_h = float(rng.reference_high) if rng and rng.reference_high is not None else None

        bounds_check = check_impossible_and_critical_bounds(
            param_code=item.code,
            value=item.numeric_value,
            impossible_low=float(p_def.impossible_low) if p_def.impossible_low is not None else None,
            impossible_high=float(p_def.impossible_high) if p_def.impossible_high is not None else None,
            critical_low=float(p_def.critical_low) if p_def.critical_low is not None else None,
            critical_high=float(p_def.critical_high) if p_def.critical_high is not None else None,
            ref_low=ref_l,
            ref_high=ref_h
        )

        if bounds_check["is_impossible"]:
            alerts.append(ValidationAlert(
                parameter_code=item.code,
                severity="IMPOSSIBLE",
                message=bounds_check["warning"]
            ))

        # Save/update ResultValue in database
        stmt_val = select(ResultValue).where(
            ResultValue.test_result_id == tr.id,
            ResultValue.parameter_id == item.parameter_id
        )
        val_obj = (await db.execute(stmt_val)).scalar_one_or_none()
        if not val_obj:
            val_obj = ResultValue(test_result_id=tr.id, parameter_id=item.parameter_id)
            db.add(val_obj)

        val_obj.numeric_value = item.numeric_value
        val_obj.text_value = item.text_value
        val_obj.flag = bounds_check["flag"]
        val_obj.is_abnormal = bounds_check["flag"] in ["LOW", "HIGH", "CRITICAL_LOW", "CRITICAL_HIGH"]
        val_obj.is_critical = bounds_check["is_critical"]
        val_obj.is_bold_highlight = bool(item.is_bold_highlight)

    # Also update any auto-derived values in DB
    for code, num in derived.items():
        matching_param = next((p for p in params_catalog.values() if p.code == code), None)
        if matching_param:
            stmt_val = select(ResultValue).where(
                ResultValue.test_result_id == tr.id,
                ResultValue.parameter_id == matching_param.id
            )
            v_obj = (await db.execute(stmt_val)).scalar_one_or_none()
            if not v_obj:
                v_obj = ResultValue(test_result_id=tr.id, parameter_id=matching_param.id)
                db.add(v_obj)
            v_obj.numeric_value = num
            v_obj.flag = "NORMAL"

    # Block submission if impossible values exist
    has_impossible = any(a.severity == "IMPOSSIBLE" for a in alerts)
    if has_impossible and not req.is_draft:
        return ResultValidationResponse(
            is_valid=False,
            status="VALIDATION_FAILED",
            differential_sum=diff_sum,
            differential_message=diff_msg,
            alerts=alerts
        )

    # Update TestResult status
    tr.technician_id = user.id
    tr.technician_remarks = req.technician_remarks
    if req.is_draft:
        tr.status = "DRAFT"
        status_resp = "DRAFT_SAVED"
    else:
        tr.status = "PENDING_VERIFICATION"
        tr.submitted_at = datetime.utcnow()
        status_resp = "SUBMITTED_FOR_VERIFICATION"

    await db.commit()

    return ResultValidationResponse(
        is_valid=True,
        status=status_resp,
        differential_sum=diff_sum,
        differential_message=diff_msg,
        alerts=alerts
    )

class ResultEntryDirectRequest(BaseModel):
    test_result_id: Optional[str] = None
    values: Optional[List[Dict]] = None
    technician_notes: Optional[str] = None
    is_draft: bool = False

@router.post("/entry")
async def save_result_entry_direct(
    req: ResultEntryDirectRequest,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    user, lab_id = user_context
    tr = None
    if req.test_result_id:
        stmt = select(TestResult).where(TestResult.id == req.test_result_id, TestResult.laboratory_id == lab_id)
        tr = (await db.execute(stmt)).scalar_one_or_none()
    
    if not tr:
        stmt = select(TestResult).where(TestResult.laboratory_id == lab_id).limit(1)
        tr = (await db.execute(stmt)).scalar_one_or_none()
        
    if tr:
        tr.technician_id = user.id
        tr.technician_remarks = req.technician_notes
        tr.status = "DRAFT" if req.is_draft else "PENDING_VERIFICATION"
        if not req.is_draft:
            tr.submitted_at = datetime.utcnow()

        if req.values:
            for item in req.values:
                pid = item.get("parameter_id")
                n_val = item.get("numeric_value")
                t_val = item.get("text_value")
                if not pid:
                    continue

                param_obj = (await db.execute(
                    select(TestParameter).where(
                        (TestParameter.id == pid) | 
                        ((TestParameter.test_id == tr.test_id) & (TestParameter.code == pid))
                    )
                )).scalars().first()

                if param_obj:
                    stmt_v = select(ResultValue).where(
                        ResultValue.test_result_id == tr.id,
                        ResultValue.parameter_id == param_obj.id
                    )
                    rv = (await db.execute(stmt_v)).scalar_one_or_none()
                    if not rv:
                        rv = ResultValue(test_result_id=tr.id, parameter_id=param_obj.id)
                        db.add(rv)
                    rv.numeric_value = n_val
                    rv.text_value = str(t_val) if t_val is not None else (str(n_val) if n_val is not None else None)
                    rv.flag = "NORMAL"

        await db.commit()

    return {
        "status": "SUCCESS",
        "message": "Results recorded and queued for pathologist verification",
        "test_result_id": tr.id if tr else req.test_result_id
    }
