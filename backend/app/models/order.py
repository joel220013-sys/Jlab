# pyrefly: ignore-errors
# type: ignore
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class SampleStatus:
    REGISTERED = "REGISTERED"
    COLLECTION_PENDING = "COLLECTION_PENDING"
    COLLECTED = "COLLECTED"
    RECEIVED_AT_LAB = "RECEIVED_AT_LAB"
    PROCESSING = "PROCESSING"
    RESULT_ENTERED = "RESULT_ENTERED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class InvoiceStatus:
    UNPAID = "UNPAID"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    CREDIT_APPROVED = "CREDIT_APPROVED"
    VOID = "VOID"

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    laboratory_id = Column(String(36), ForeignKey("laboratories.id"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=True)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=True)
    order_number = Column(String(50), nullable=False, index=True) # e.g. ORD-YYYY-XXXXX
    lab_number = Column(String(50), nullable=False, index=True) # LAB accession no (e.g. 10001)
    clinical_history = Column(Text, nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    discount_amount = Column(Numeric(10, 2), default=0.00)
    tax_amount = Column(Numeric(10, 2), default=0.00)
    final_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    created_at = Column(DateTime, default=datetime.utcnow)

    laboratory = relationship("Laboratory", back_populates="orders")
    patient = relationship("Patient", back_populates="orders")
    doctor = relationship("Doctor", back_populates="orders")
    samples = relationship("Sample", back_populates="order", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="order", uselist=False, cascade="all, delete-orphan")
    test_results = relationship("TestResult", back_populates="order", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="order", uselist=False, cascade="all, delete-orphan")

class Sample(Base):
    __tablename__ = "samples"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    laboratory_id = Column(String(36), ForeignKey("laboratories.id"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False, index=True)
    barcode = Column(String(50), nullable=False, index=True) # e.g. SMP-YYYY-XXXXX
    specimen_type = Column(String(100), nullable=False) # EDTA Blood, Serum, Urine
    tube_color = Column(String(50), default="Lavender / EDTA")
    status = Column(String(50), default=SampleStatus.REGISTERED)
    collected_at = Column(DateTime, nullable=True)
    collected_by_name = Column(String(150), nullable=True)
    received_at_lab_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="samples")
    test_results = relationship("TestResult", back_populates="sample")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    laboratory_id = Column(String(36), ForeignKey("laboratories.id"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False, unique=True)
    invoice_number = Column(String(50), nullable=False, index=True)
    total = Column(Numeric(10, 2), nullable=False)
    paid_amount = Column(Numeric(10, 2), default=0.00)
    balance = Column(Numeric(10, 2), default=0.00)
    status = Column(String(50), default=InvoiceStatus.UNPAID)
    payment_method = Column(String(50), default="UPI") # CASH, UPI, CARD, CREDIT
    is_credit_override = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="invoice")
