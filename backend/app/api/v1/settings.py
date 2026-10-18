# pyrefly: ignore-errors
# type: ignore
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from app.database import get_db
from app.models.tenant import Laboratory, Branch, SubscriptionPlan
from app.models.user import User, LaboratoryStaff, UserRole
from app.core.security import verify_password, get_password_hash
from app.core.sanitizer import sanitize_string
from app.api.deps import get_current_tenant_context, require_roles
from app.api.v1.communication import load_settings, save_settings

router = APIRouter(prefix="/settings", tags=["Laboratory Settings & Configuration"])

class LabUpdateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    legal_name: Optional[str] = None
    phone: str = Field(..., min_length=5, max_length=30)
    email: str = Field(..., min_length=3, max_length=255)
    address: str = Field(..., min_length=3)
    city: Optional[str] = "Bangalore"
    state: Optional[str] = "Karnataka"
    pincode: Optional[str] = "560001"
    logo_url: Optional[str] = None
    header_template_url: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: Optional[str] = None
    email: Optional[str] = None
    designation: Optional[str] = None
    medical_license_number: Optional[str] = None
    digital_signature_url: Optional[str] = None
    is_signatory: Optional[bool] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class BranchCreateRequest(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., min_length=2)
    code: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_main_lab: Optional[bool] = False

@router.get("")
async def get_laboratory_settings(
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    user, lab_id = user_context

    # 1. Fetch Laboratory & Plan
    stmt_lab = (
        select(Laboratory, SubscriptionPlan)
        .outerjoin(SubscriptionPlan, Laboratory.current_plan_id == SubscriptionPlan.id)
        .where(Laboratory.id == lab_id)
    )
    res_lab = (await db.execute(stmt_lab)).first()
    if not res_lab:
        raise HTTPException(status_code=404, detail="Laboratory tenant record not found")
    lab, plan = res_lab

    # 2. Fetch User & Staff Profile
    stmt_staff = select(LaboratoryStaff).where(LaboratoryStaff.user_id == user.id, LaboratoryStaff.laboratory_id == lab_id)
    staff = (await db.execute(stmt_staff)).scalar_one_or_none()

    # 3. Fetch Branches
    stmt_branches = select(Branch).where(Branch.laboratory_id == lab_id).order_by(Branch.is_main_lab.desc(), Branch.name)
    branches = (await db.execute(stmt_branches)).scalars().all()

    return {
        "laboratory": {
            "id": lab.id,
            "slug": lab.slug,
            "name": lab.name,
            "legal_name": lab.legal_name or lab.name,
            "phone": lab.phone,
            "email": lab.email,
            "address": lab.address,
            "city": lab.city or "Bangalore",
            "state": lab.state or "Karnataka",
            "pincode": lab.pincode or "560001",
            "logo_url": lab.logo_url,
            "header_template_url": lab.header_template_url,
            "subscription_status": lab.subscription_status,
            "is_active": lab.is_active,
            "plan_name": plan.name if plan else "Professional Diagnostic Tier",
            "plan_code": plan.code if plan else "PROFESSIONAL",
            "created_at": lab.created_at.strftime("%d-%b-%Y") if lab.created_at else None
        },
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "username": user.username,
            "phone": user.phone,
            "email": user.email,
            "role": user.role
        },
        "staff": {
            "designation": staff.designation if staff else "Managing Director",
            "medical_license_number": staff.medical_license_number if staff else "",
            "digital_signature_url": staff.digital_signature_url if staff else None,
            "is_signatory": staff.is_signatory if staff else True
        },
        "branches": [
            {
                "id": b.id,
                "name": b.name,
                "code": b.code,
                "is_main_lab": b.is_main_lab,
                "phone": b.phone or "",
                "address": b.address or ""
            }
            for b in branches
        ]
    }

@router.put("/laboratory")
async def update_laboratory_settings(
    req: LabUpdateRequest,
    user_context = Depends(require_roles(["LAB_ADMIN", "SUPER_ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    stmt = select(Laboratory).where(Laboratory.id == lab_id)
    lab = (await db.execute(stmt)).scalar_one_or_none()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory record not found")

    clean_name = sanitize_string(req.name)
    clean_legal = sanitize_string(req.legal_name or clean_name)
    clean_phone = sanitize_string(req.phone)
    clean_email = sanitize_string(req.email)
    clean_address = sanitize_string(req.address)
    clean_city = sanitize_string(req.city or "Bangalore")
    clean_state = sanitize_string(req.state or "Karnataka")
    clean_pincode = sanitize_string(req.pincode or "560001")

    lab.name = clean_name
    lab.legal_name = clean_legal
    lab.phone = clean_phone
    lab.email = clean_email
    lab.address = clean_address
    lab.city = clean_city
    lab.state = clean_state
    lab.pincode = clean_pincode
    if req.logo_url is not None:
        lab.logo_url = req.logo_url
    if req.header_template_url is not None:
        lab.header_template_url = req.header_template_url

    lab.updated_at = datetime.utcnow()

    # Synchronize communication display name for this tenant so WhatsApp and SMS reflect the updated name
    try:
        comm_settings = load_settings(lab_id=str(lab_id))
        comm_settings["lab_display_name"] = clean_name
        save_settings(comm_settings, lab_id=str(lab_id))
    except Exception:
        pass

    await db.commit()
    await db.refresh(lab)

    return {
        "status": "success",
        "message": "Laboratory information updated successfully",
        "laboratory": {
            "id": lab.id,
            "name": lab.name,
            "legal_name": lab.legal_name,
            "phone": lab.phone,
            "email": lab.email,
            "address": lab.address,
            "city": lab.city,
            "state": lab.state,
            "pincode": lab.pincode,
            "logo_url": lab.logo_url,
            "header_template_url": lab.header_template_url
        }
    }

@router.put("/profile")
async def update_user_profile(
    req: ProfileUpdateRequest,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    user, lab_id = user_context

    # 1. Update User Record
    user.full_name = sanitize_string(req.full_name)
    if req.email is not None:
        user.email = sanitize_string(req.email).lower() if req.email else None
    if req.phone is not None:
        user.phone = sanitize_string(req.phone)

    # Password Change Handling
    if req.new_password and req.new_password.strip():
        new_pw = req.new_password.strip()
        if len(new_pw) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        if req.current_password:
            if not verify_password(req.current_password, user.hashed_password):
                raise HTTPException(status_code=400, detail="Incorrect current password")
        user.hashed_password = get_password_hash(new_pw)

    user.updated_at = datetime.utcnow()

    # 2. Update LaboratoryStaff Record
    stmt_staff = select(LaboratoryStaff).where(LaboratoryStaff.user_id == user.id, LaboratoryStaff.laboratory_id == lab_id)
    staff = (await db.execute(stmt_staff)).scalar_one_or_none()
    if staff:
        if req.designation is not None:
            staff.designation = sanitize_string(req.designation)
        if req.medical_license_number is not None:
            staff.medical_license_number = sanitize_string(req.medical_license_number)
        if req.digital_signature_url is not None:
            staff.digital_signature_url = req.digital_signature_url
        if req.is_signatory is not None:
            staff.is_signatory = bool(req.is_signatory)

    await db.commit()
    await db.refresh(user)

    return {
        "status": "success",
        "message": "User profile and clinical credentials updated successfully",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "username": user.username,
            "phone": user.phone,
            "email": user.email,
            "role": user.role
        },
        "staff": {
            "designation": staff.designation if staff else "Staff",
            "medical_license_number": staff.medical_license_number if staff else "",
            "digital_signature_url": staff.digital_signature_url if staff else None,
            "is_signatory": staff.is_signatory if staff else True
        }
    }

@router.post("/branches")
async def save_branch(
    req: BranchCreateRequest,
    user_context = Depends(require_roles(["LAB_ADMIN", "SUPER_ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context

    clean_name = sanitize_string(req.name)
    clean_code = sanitize_string(req.code or f"BR-{str(uuid.uuid4().hex[:4]).upper()}")
    clean_phone = sanitize_string(req.phone or "")
    clean_addr = sanitize_string(req.address or "")

    if req.id:
        stmt = select(Branch).where(Branch.id == req.id, Branch.laboratory_id == lab_id)
        branch = (await db.execute(stmt)).scalar_one_or_none()
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        branch.name = clean_name
        branch.code = clean_code
        branch.phone = clean_phone
        branch.address = clean_addr
        if req.is_main_lab is not None:
            branch.is_main_lab = req.is_main_lab
    else:
        branch = Branch(
            laboratory_id=lab_id,
            name=clean_name,
            code=clean_code,
            is_main_lab=bool(req.is_main_lab),
            phone=clean_phone,
            address=clean_addr
        )
        db.add(branch)

    await db.commit()
    await db.refresh(branch)

    return {
        "status": "success",
        "message": "Branch / Center saved successfully",
        "branch": {
            "id": branch.id,
            "name": branch.name,
            "code": branch.code,
            "is_main_lab": branch.is_main_lab,
            "phone": branch.phone,
            "address": branch.address
        }
    }
