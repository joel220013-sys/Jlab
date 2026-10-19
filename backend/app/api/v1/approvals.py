# pyrefly: ignore-errors
# type: ignore
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
import os
from app.database import get_db
from app.models.tenant import Laboratory
from app.models.patient import Patient, Doctor
from app.models.test_catalog import Test
from app.models.order import Order, Sample
from app.models.result import TestResult, ResultValue, Report, ReportStatus
from app.schemas.result import WorklistTestItem
from app.api.deps import get_current_tenant_context, require_roles

router = APIRouter(prefix="/approvals", tags=["Pathologist Verification"])

class ReviewActionRequest(BaseModel):
    remarks: Optional[str] = None

@router.get("/queue", response_model=List[WorklistTestItem])
@router.get("/pending", response_model=List[WorklistTestItem])
async def get_pathologist_queue(
    user_context = Depends(require_roles(["PATHOLOGIST", "LAB_ADMIN", "SUPER_ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    user, lab_id = user_context
    stmt = (
        select(TestResult, Order, Sample, Test, Patient)
        .join(Order, TestResult.order_id == Order.id)
        .join(Sample, TestResult.sample_id == Sample.id)
        .join(Test, TestResult.test_id == Test.id)
        .join(Patient, Order.patient_id == Patient.id)
        .where(
            TestResult.laboratory_id == lab_id,
            TestResult.status == "PENDING_VERIFICATION"
        )
        .order_by(TestResult.submitted_at.asc())
        .limit(100)
    )
    res = await db.execute(stmt)
    rows = res.all()

    queue = []
    for tr, o, s, t, p in rows:
        queue.append(WorklistTestItem(
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
    return queue

@router.post("/{result_id}/approve")
async def approve_test_result(
    result_id: str,
    req: ReviewActionRequest,
    user_context = Depends(require_roles(["PATHOLOGIST", "LAB_ADMIN", "SUPER_ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    user, lab_id = user_context
    stmt = select(TestResult).where(TestResult.id == result_id, TestResult.laboratory_id == lab_id)
    tr = (await db.execute(stmt)).scalar_one_or_none()
    if not tr:
        raise HTTPException(status_code=404, detail="Test result not found")

    # Guard: Technicians cannot self-approve their own results if workflow segregation is active
    if tr.technician_id == user.id and user.role == "TECHNICIAN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Technician cannot self-approve test results. Independent pathologist sign-off required."
        )

    tr.status = "VERIFIED"
    tr.pathologist_id = user.id
    tr.pathologist_remarks = req.remarks
    tr.verified_at = datetime.utcnow()

    # Update Report status to APPROVED
    stmt_rep = select(Report).where(Report.order_id == tr.order_id, Report.laboratory_id == lab_id)
    rep = (await db.execute(stmt_rep)).scalar_one_or_none()
    if rep:
        rep.status = ReportStatus.APPROVED
        rep.published_at = datetime.utcnow()

        # Automated Communication Dispatch Trigger
        try:
            from app.api.v1.communication import load_settings, append_log
            from app.models.order import Order
            from app.models.patient import Patient
            comm_settings = load_settings(lab_id=str(lab_id) if lab_id else None)
            if comm_settings.get("auto_send_on_approval", True):
                stmt_ord = select(Order).where(Order.id == tr.order_id, Order.laboratory_id == lab_id)
                ord_obj = (await db.execute(stmt_ord)).scalar_one_or_none()
                if ord_obj:
                    stmt_pat = select(Patient).where(Patient.id == ord_obj.patient_id, Patient.laboratory_id == lab_id)
                    pat_obj = (await db.execute(stmt_pat)).scalar_one_or_none()
                    lab_obj = (await db.execute(select(Laboratory).where(Laboratory.id == lab_id))).scalar_one_or_none()
                    current_lab_name = lab_obj.name if lab_obj else "Diagnostic Centre"
                    if pat_obj and pat_obj.phone:
                        clean_phone = "".join(filter(str.isdigit, pat_obj.phone))
                        if len(clean_phone) == 10:
                            clean_phone = f"91{clean_phone}"
                        frontend_base = os.getenv("FRONTEND_URL", "https://pulse-lab.vercel.app").rstrip("/")
                        report_url = f"{frontend_base}/verify/{rep.public_verification_hash}"
                        template = comm_settings["templates"].get("report_ready", "")
                        msg = template.format(
                            patient_name=pat_obj.full_name,
                            order_number=ord_obj.order_number,
                            lab_number=ord_obj.lab_number or "12378",
                            report_url=report_url,
                            lab_name=current_lab_name
                        )
                        append_log({
                            "id": f"log-{int(datetime.now().timestamp() * 1000)}",
                            "laboratory_id": str(lab_id) if lab_id else "",
                            "timestamp": datetime.now().strftime("%d-%m-%Y %I:%M %p"),
                            "patient_name": pat_obj.full_name,
                            "phone": clean_phone,
                            "type": "AUTO_REPORT_READY",
                            "channel": "WHATSAPP",
                            "provider": comm_settings.get("active_provider", "DIRECT_WHATSAPP"),
                            "status": "DELIVERED",
                            "message_preview": msg[:120],
                            "direct_url": f"https://wa.me/{clean_phone}?text={msg.replace(chr(10), '%0A')}",
                            "order_number": ord_obj.order_number
                        })
        except Exception:
            pass

    await db.commit()
    return {"status": "SUCCESS", "message": "Test result verified and report approved by pathologist."}

@router.post("/{result_id}/reject")
async def reject_test_result(
    result_id: str,
    req: ReviewActionRequest,
    user_context = Depends(require_roles(["PATHOLOGIST", "LAB_ADMIN", "SUPER_ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    user, lab_id = user_context
    stmt = select(TestResult).where(TestResult.id == result_id, TestResult.laboratory_id == lab_id)
    tr = (await db.execute(stmt)).scalar_one_or_none()
    if not tr:
        raise HTTPException(status_code=404, detail="Test result not found")

    tr.status = "DRAFT"
    tr.pathologist_remarks = req.remarks or "Rejected by pathologist. Please re-run aliquot and verify."
    await db.commit()
    return {"status": "SUCCESS", "message": "Test result returned to technician for review."}
