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

    # Total orders today
    stmt_orders = select(func.count(Order.id)).where(Order.laboratory_id == lab_id, Order.created_at >= today_start)
    orders_today = (await db.execute(stmt_orders)).scalar() or 0

    # Tests pending technician analysis
    stmt_tech = select(func.count(TestResult.id)).where(
        TestResult.laboratory_id == lab_id, 
        TestResult.status.in_(["PROCESSING", "DRAFT"])
    )
    pending_technician = (await db.execute(stmt_tech)).scalar() or 0

    # Samples pending verification by pathologist
    stmt_pending = select(func.count(TestResult.id)).where(
        TestResult.laboratory_id == lab_id, 
        TestResult.status == "PENDING_VERIFICATION"
    )
    pending_verifications = (await db.execute(stmt_pending)).scalar() or 0

    # Reports completed
    stmt_completed = select(func.count(TestResult.id)).where(
        TestResult.laboratory_id == lab_id, 
        TestResult.status == "VERIFIED"
    )
    completed_reports = (await db.execute(stmt_completed)).scalar() or 0

    # Invoices today: collections and pending dues
    stmt_collections = select(
        func.coalesce(func.sum(Invoice.paid_amount), 0),
        func.coalesce(func.sum(Invoice.balance), 0)
    ).where(Invoice.laboratory_id == lab_id, Invoice.created_at >= today_start)
    collected, due = (await db.execute(stmt_collections)).first()

    return {
        "today_orders": orders_today,
        "pending_technician": pending_technician,
        "pending_verifications": pending_verifications,
        "completed_reports": completed_reports,
        "today_collections": float(collected),
        "pending_dues": float(due),
        "avg_tat": "—" if orders_today == 0 else "45m",
        "tat_compliance_rate": "—" if orders_today == 0 else "100%"
    }
