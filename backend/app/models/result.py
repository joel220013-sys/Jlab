# pyrefly: ignore-errors
# type: ignore
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class ReportStatus:
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    AMENDED = "AMENDED"
    CANCELLED = "CANCELLED"

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    laboratory_id = Column(String(36), ForeignKey("laboratories.id"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False, index=True)
    sample_id = Column(String(36), ForeignKey("samples.id"), nullable=False, index=True)
    test_id = Column(String(36), ForeignKey("tests.id"), nullable=False, index=True)
    status = Column(String(50), default="PROCESSING") # PROCESSING, DRAFT, PENDING_VERIFICATION, VERIFIED
    technician_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    pathologist_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    technician_remarks = Column(Text, nullable=True)
    pathologist_remarks = Column(Text, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="test_results")
    sample = relationship("Sample", back_populates="test_results")
    test = relationship("Test")
    values = relationship("ResultValue", back_populates="test_result", cascade="all, delete-orphan")

class ResultValue(Base):
    __tablename__ = "result_values"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    test_result_id = Column(String(36), ForeignKey("test_results.id"), nullable=False, index=True)
    parameter_id = Column(String(36), ForeignKey("test_parameters.id"), nullable=False)
    numeric_value = Column(Numeric(12, 3), nullable=True)
    text_value = Column(String(255), nullable=True)
    is_abnormal = Column(Boolean, default=False)
    is_critical = Column(Boolean, default=False)
    flag = Column(String(20), default="NORMAL") # NORMAL, LOW, HIGH, CRITICAL_LOW, CRITICAL_HIGH
    delta_previous_value = Column(Numeric(12, 3), nullable=True) # Historical prior test value
    delta_previous_date = Column(String(50), nullable=True)
    is_bold_highlight = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    test_result = relationship("TestResult", back_populates="values")
    parameter = relationship("TestParameter")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    laboratory_id = Column(String(36), ForeignKey("laboratories.id"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False, unique=True)
    report_number = Column(String(50), nullable=False, index=True) # e.g. REP-YYYY-XXXXX
    status = Column(String(50), default=ReportStatus.DRAFT)
    version = Column(Integer, default=1)
    public_verification_hash = Column(String(64), unique=True, nullable=False, index=True)
    is_locked_for_billing = Column(Boolean, default=True) # True until invoice settled or credit override
    pdf_storage_path = Column(Text, nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="report")
