# pyrefly: ignore-errors
# type: ignore
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, LaboratoryStaff
from app.models.tenant import Laboratory

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier",
        )
    
    stmt = select(User).where(User.id == user_id, User.is_active == True)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or deactivated",
        )
    
    return user

async def get_current_tenant_context(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> tuple[User, str]:
    """
    Returns (user, laboratory_id).
    Ensures multi-tenant boundaries cannot be crossed.
    """
    stmt = select(LaboratoryStaff).where(LaboratoryStaff.user_id == current_user.id)
    res = await db.execute(stmt)
    staff = res.scalar_one_or_none()
    
    if not staff and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not affiliated with any laboratory tenant",
        )
    
    lab_id = staff.laboratory_id if staff else None
    return current_user, lab_id

def require_roles(allowed_roles: List[str]):
    async def role_checker(user_context: tuple[User, str] = Depends(get_current_tenant_context)):
        user, _ = user_context
        if user.role not in allowed_roles and user.role != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role: {user.role}",
            )
        return user_context
    return role_checker
