# pyrefly: ignore-errors
# type: ignore
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User, LaboratoryStaff
from app.models.tenant import Laboratory
from app.core.security import verify_password, create_access_token
from app.core.rate_limit import limit_login_attempts
from app.core.sanitizer import sanitize_string
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse, dependencies=[Depends(limit_login_attempts)])
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    raw_identifier = req.username_or_phone or req.username
    if not raw_identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or phone number is required"
        )

    identifier = sanitize_string(raw_identifier)

    # Lookup user by username, phone, or email
    stmt = select(User).where(
        (User.username == identifier) |
        (User.phone == identifier) |
        (User.email == identifier)
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact laboratory administrator."
        )

    # Fetch associated laboratory
    stmt_staff = select(LaboratoryStaff).where(LaboratoryStaff.user_id == user.id)
    res_staff = await db.execute(stmt_staff)
    staff = res_staff.scalar_one_or_none()

    lab_id = None
    lab_name = None
    if staff:
        lab_id = staff.laboratory_id
        stmt_lab = select(Laboratory).where(Laboratory.id == lab_id)
        res_lab = await db.execute(stmt_lab)
        lab = res_lab.scalar_one_or_none()
        if lab:
            lab_name = lab.name

    token_payload = {
        "sub": user.id,
        "role": user.role,
        "lab_id": lab_id
    }
    token = create_access_token(token_payload)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        role=user.role,
        laboratory_id=lab_id,
        laboratory_name=lab_name
    )

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt_staff = select(LaboratoryStaff).where(LaboratoryStaff.user_id == current_user.id)
    res_staff = await db.execute(stmt_staff)
    staff = res_staff.scalar_one_or_none()

    lab_id = None
    lab_name = None
    if staff:
        lab_id = staff.laboratory_id
        stmt_lab = select(Laboratory).where(Laboratory.id == lab_id)
        res_lab = await db.execute(stmt_lab)
        lab = res_lab.scalar_one_or_none()
        if lab:
            lab_name = lab.name

    return UserOut(
        id=current_user.id,
        full_name=current_user.full_name,
        phone=current_user.phone,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        laboratory_id=lab_id,
        laboratory_name=lab_name
    )
