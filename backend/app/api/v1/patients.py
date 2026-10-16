# pyrefly: ignore-errors
# type: ignore
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import List, Optional
from datetime import datetime
import uuid
from app.database import get_db
from app.models.patient import Patient, Doctor
from app.models.tenant import Branch
from app.schemas.patient import PatientCreate, PatientOut, DoctorCreate, DoctorOut, BranchCreate, BranchOut
from app.api.deps import get_current_tenant_context

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=List[PatientOut])
async def list_patients(
    search: Optional[str] = Query(None, description="Search by name, phone, or UHID"),
    name: Optional[str] = Query(None, description="Filter by patient name"),
    uhid: Optional[str] = Query(None, description="Filter by UHID / Patient No"),
    phone: Optional[str] = Query(None, description="Filter by mobile phone"),
    email: Optional[str] = Query(None, description="Filter by email"),
    limit: int = 100,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    stmt = select(Patient).where(Patient.laboratory_id == lab_id)
    
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Patient.full_name.ilike(term),
                Patient.phone.ilike(term),
                Patient.uhid.ilike(term)
            )
        )
    if name:
        stmt = stmt.where(Patient.full_name.ilike(f"%{name.strip()}%"))
    if uhid:
        stmt = stmt.where(Patient.uhid.ilike(f"%{uhid.strip()}%"))
    if phone:
        stmt = stmt.where(Patient.phone.ilike(f"%{phone.strip()}%"))
    if email:
        stmt = stmt.where(Patient.email.ilike(f"%{email.strip()}%"))
    
    stmt = stmt.order_by(Patient.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/doctors", response_model=List[DoctorOut])
async def list_doctors(
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    stmt = select(Doctor).where(Doctor.laboratory_id == lab_id, Doctor.is_active == True)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/doctors", response_model=DoctorOut)
async def create_doctor(
    req: DoctorCreate,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    name = req.full_name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Doctor name cannot be empty")
    
    # Check if doctor already exists
    stmt = select(Doctor).where(Doctor.laboratory_id == lab_id, func.lower(Doctor.full_name) == name.lower())
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        return existing

    doctor = Doctor(
        laboratory_id=lab_id,
        full_name=name,
        clinic_hospital_name=req.clinic_hospital_name.strip() if req.clinic_hospital_name else None,
        phone=req.phone.strip() if req.phone else None,
        email=req.email.strip() if req.email else None,
        is_active=True
    )
    db.add(doctor)
    await db.commit()
    await db.refresh(doctor)
    return doctor

@router.get("/branches", response_model=List[BranchOut])
async def list_branches(
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    stmt = select(Branch).where(Branch.laboratory_id == lab_id).order_by(Branch.created_at.asc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/branches", response_model=BranchOut)
async def create_branch(
    req: BranchCreate,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Center name cannot be empty")

    stmt = select(Branch).where(Branch.laboratory_id == lab_id, func.lower(Branch.name) == name.lower())
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        return existing

    code = f"BR-{str(uuid.uuid4().hex[:4]).upper()}"
    branch = Branch(
        laboratory_id=lab_id,
        name=name,
        code=code,
        is_main_lab=False,
        phone=req.phone.strip() if req.phone else None,
        address=req.address.strip() if req.address else None
    )
    db.add(branch)
    await db.commit()
    await db.refresh(branch)
    return branch

@router.get("/{patient_id}")
async def get_patient_detail(
    patient_id: str,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    stmt = select(Patient).where(Patient.id == patient_id, Patient.laboratory_id == lab_id)
    patient = (await db.execute(stmt)).scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    from app.models.order import Order
    stmt_orders = (
        select(Order)
        .where(Order.patient_id == patient_id)
        .order_by(Order.created_at.desc())
    )
    orders = (await db.execute(stmt_orders)).scalars().all()
    orders_data = []
    for ord in orders:
        orders_data.append({
            "id": ord.id,
            "order_number": ord.order_number,
            "lab_number": ord.lab_number,
            "status": getattr(ord, "status", "CONFIRMED"),
            "total_amount": float(ord.total_amount or 0),
            "created_at": ord.created_at.strftime("%d %b %Y, %I:%M %p") if ord.created_at else None
        })

    return {
        "patient": {
            "id": patient.id,
            "uhid": patient.uhid,
            "full_name": patient.full_name,
            "phone": patient.phone,
            "email": patient.email,
            "gender": patient.gender,
            "age_years": patient.age_years or 0,
            "age_months": patient.age_months or 0,
            "age_days": patient.age_days or 0,
            "blood_group": patient.blood_group,
            "address": patient.address,
            "created_at": patient.created_at.strftime("%d %b %Y, %I:%M %p") if patient.created_at else None
        },
        "orders": orders_data
    }

@router.post("", response_model=PatientOut)
async def create_patient(
    req: PatientCreate,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
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
        full_name=req.full_name,
        phone=req.phone,
        gender=req.gender,
        age_years=req.age_years,
        age_months=req.age_months or 0,
        age_days=req.age_days or 0,
        email=req.email,
        blood_group=req.blood_group,
        address=req.address
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient
