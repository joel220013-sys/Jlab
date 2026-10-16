# pyrefly: ignore-errors
# type: ignore
from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    username_or_phone: Optional[str] = None
    username: Optional[str] = None
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: str
    role: str
    laboratory_id: Optional[str] = None
    laboratory_name: Optional[str] = None

class UserOut(BaseModel):
    id: str
    full_name: str
    phone: str
    email: Optional[str] = None
    role: str
    is_active: bool
    laboratory_id: Optional[str] = None
    laboratory_name: Optional[str] = None
