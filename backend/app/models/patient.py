# pyrefly: ignore-errors
# type: ignore
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, Integer, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    laboratory_id = Column(String(36), ForeignKey("laboratories.id"), nullable=False, index=True)
    uhid = Column(String(50), nullable=False, index=True) # Unique Health ID (e.g. PAT-YYYY-XXXXX)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    gender = Column(String(10), nullable=False) # MALE, FEMALE, OTHER
    age_years = Column(Integer, nullable=False, default=0)
    age_months = Column(Integer, default=0)
    age_days = Column(Integer, default=0)
    dob = Column(Date, nullable=True)
    blood_group = Column(String(10), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    laboratory = relationship("Laboratory", back_populates="patients")
    orders = relationship("Order", back_populates="patient", cascade="all, delete-orphan")

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    laboratory_id = Column(String(36), ForeignKey("laboratories.id"), nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    clinic_hospital_name = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    commission_percentage = Column(Numeric(5, 2), default=0.00)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="doctor")
