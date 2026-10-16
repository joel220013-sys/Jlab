# pyrefly: ignore-errors
# type: ignore
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Numeric, Integer, Text
from sqlalchemy.orm import relationship
from app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    code = Column(String(50), unique=True, nullable=False) # STARTER, PROFESSIONAL, ENTERPRISE
    name = Column(String(100), nullable=False)
    monthly_price_inr = Column(Numeric(10, 2), nullable=False)
    yearly_price_inr = Column(Numeric(10, 2), nullable=False)
    max_monthly_orders = Column(Integer, nullable=False)
    max_staff_accounts = Column(Integer, nullable=False)
    max_branches = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    laboratories = relationship("Laboratory", back_populates="plan")

class Laboratory(Base):
    __tablename__ = "laboratories"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    legal_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), default="Bangalore")
    state = Column(String(100), default="Karnataka")
    pincode = Column(String(20), default="560001")
    logo_url = Column(Text, nullable=True)
    header_template_url = Column(Text, nullable=True)
    current_plan_id = Column(String(36), ForeignKey("subscription_plans.id"), nullable=True)
    subscription_status = Column(String(30), default="ACTIVE") # TRIAL, ACTIVE, PAST_DUE, EXPIRED
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    plan = relationship("SubscriptionPlan", back_populates="laboratories")
    branches = relationship("Branch", back_populates="laboratory", cascade="all, delete-orphan")
    staff = relationship("LaboratoryStaff", back_populates="laboratory", cascade="all, delete-orphan")
    patients = relationship("Patient", back_populates="laboratory")
    tests = relationship("Test", back_populates="laboratory")
    orders = relationship("Order", back_populates="laboratory")

class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    laboratory_id = Column(String(36), ForeignKey("laboratories.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(20), nullable=False) # e.g. MAIN, SATELLITE_1
    is_main_lab = Column(Boolean, default=False)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    laboratory = relationship("Laboratory", back_populates="branches")
    staff = relationship("LaboratoryStaff", back_populates="branch")
