# pyrefly: ignore-errors
# type: ignore
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PatientCreate(BaseModel):
    full_name: str
    phone: str
    gender: str # MALE, FEMALE, OTHER
    age_years: int
    age_months: Optional[int] = 0
    age_days: Optional[int] = 0
    email: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None

class PatientOut(BaseModel):
    id: str
    laboratory_id: str
    uhid: str
    full_name: str
    phone: str
    email: Optional[str] = None
    gender: str
    age_years: Optional[int] = 0
    age_months: Optional[int] = 0
    age_days: Optional[int] = 0
    blood_group: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DoctorCreate(BaseModel):
    full_name: str
    clinic_hospital_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class DoctorOut(BaseModel):
    id: str
    full_name: str
    clinic_hospital_name: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True

class BranchCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None

class BranchOut(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True
