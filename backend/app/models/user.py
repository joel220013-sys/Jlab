# pyrefly: ignore-errors
# type: ignore
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class UserRole:
    SUPER_ADMIN = "SUPER_ADMIN"
    LAB_ADMIN = "LAB_ADMIN"
    RECEPTIONIST = "RECEPTIONIST"
    PHLEBOTOMIST = "PHLEBOTOMIST"
    TECHNICIAN = "TECHNICIAN"
    PATHOLOGIST = "PATHOLOGIST"
    DOCTOR = "DOCTOR"
    PATIENT = "PATIENT"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    staff_profile = relationship("LaboratoryStaff", back_populates="user", uselist=False)

class LaboratoryStaff(Base):
    __tablename__ = "laboratory_staff"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    laboratory_id = Column(String(36), ForeignKey("laboratories.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=True)
    role = Column(String(50), nullable=False)
    designation = Column(String(100), default="Staff")
    medical_license_number = Column(String(100), nullable=True)
    digital_signature_url = Column(Text, nullable=True)
    is_signatory = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    laboratory = relationship("Laboratory", back_populates="staff")
    user = relationship("User", back_populates="staff_profile")
    branch = relationship("Branch", back_populates="staff")
