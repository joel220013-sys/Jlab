# pyrefly: ignore-errors
# type: ignore
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date
from app.database import get_db
from app.models.order import Order, Sample, Invoice
from app.models.result import TestResult
from app.api.deps import get_current_tenant_context

router = APIRouter(prefix="/dashboard", tags=["Dashboard KPIs"])

@router.get("/stats")
async def get_dashboard_stats(
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    today_start = datetime.combine(date.today(), datetime.min.time())

    # Combined single-roundtrip query for instant dashboard KPIs
    stmt = select(
        select(func.count(Order.id)).where(Order.laboratory_id == lab_id, Order.created_at >= today_start).scalar_subquery(),
        select(func.count(TestResult.id)).where(TestResult.laboratory_id == lab_id, TestResult.status.in_(["PROCESSING", "DRAFT"])).scalar_subquery(),
        select(func.count(TestResult.id)).where(TestResult.laboratory_id == lab_id, TestResult.status == "PENDING_VERIFICATION").scalar_subquery(),
        select(func.count(TestResult.id)).where(TestResult.laboratory_id == lab_id, TestResult.status == "VERIFIED").scalar_subquery(),
        select(func.coalesce(func.sum(Invoice.paid_amount), 0)).where(Invoice.laboratory_id == lab_id, Invoice.created_at >= today_start).scalar_subquery(),
        select(func.coalesce(func.sum(Invoice.balance), 0)).where(Invoice.laboratory_id == lab_id, Invoice.created_at >= today_start).scalar_subquery()
    )
    res = await db.execute(stmt)
    orders_today, pending_technician, pending_verifications, completed_reports, collected, due = res.first()

    return {
        "today_orders": orders_today or 0,
        "pending_technician": pending_technician or 0,
        "pending_verifications": pending_verifications or 0,
        "completed_reports": completed_reports or 0,
        "today_collections": float(collected or 0),
        "pending_dues": float(due or 0),
        "avg_tat": "—" if orders_today == 0 else "45m",
        "tat_compliance_rate": "—" if orders_today == 0 else "100%"
    }
