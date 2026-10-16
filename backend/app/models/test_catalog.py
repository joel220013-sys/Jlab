# pyrefly: ignore-errors
# type: ignore
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class TestCategory(Base):
    __tablename__ = "test_categories"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    laboratory_id = Column(String(36), ForeignKey("laboratories.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False) # e.g. HEMATOLOGY, BIOCHEMISTRY, CLINICAL PATHOLOGY
    display_order = Column(Integer, default=0)

    tests = relationship("Test", back_populates="category")

class Test(Base):
    __tablename__ = "tests"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    laboratory_id = Column(String(36), ForeignKey("laboratories.id"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("test_categories.id"), nullable=False)
    code = Column(String(50), nullable=False) # e.g. CBC, LIPID, LFT, KFT
    name = Column(String(150), nullable=False)
    specimen_type = Column(String(100), default="Whole Blood EDTA")
    standard_price = Column(Numeric(10, 2), nullable=False, default=500.00)
    expected_tat_minutes = Column(Integer, default=120)
    is_panel = Column(Boolean, default=False)
    methodology = Column(String(150), nullable=True) # e.g. Automated Cell Counter, Photometric
    tube_color = Column(String(50), default="Lavender / EDTA") # Lavender, Yellow, Red, Gray
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    laboratory = relationship("Laboratory", back_populates="tests")
    category = relationship("TestCategory", back_populates="tests")
    parameters = relationship("TestParameter", back_populates="test", cascade="all, delete-orphan", order_by="TestParameter.display_order")

class TestParameter(Base):
    __tablename__ = "test_parameters"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    test_id = Column(String(36), ForeignKey("tests.id"), nullable=False, index=True)
    code = Column(String(50), nullable=False) # e.g. HB, WBC, NEUTROPHILS
    name = Column(String(150), nullable=False)
    unit = Column(String(50), nullable=True) # g/dL, %, cells/cumm
    value_type = Column(String(20), default="NUMERIC") # NUMERIC, TEXT, OPTIONS, CALCULATED
    formula_expression = Column(Text, nullable=True) # e.g. '{TRIGLYCERIDES} / 5'
    options_json = Column(Text, nullable=True) # JSON list for categorical dropdowns
    display_order = Column(Integer, default=0)
    impossible_low = Column(Numeric(12, 3), nullable=True) # Extreme typo floor
    impossible_high = Column(Numeric(12, 3), nullable=True) # Extreme typo ceiling
    critical_low = Column(Numeric(12, 3), nullable=True) # Panic alert floor
    critical_high = Column(Numeric(12, 3), nullable=True) # Panic alert ceiling
    is_differential_part = Column(Boolean, default=False) # True if part of 100% WBC diff
    created_at = Column(DateTime, default=datetime.utcnow)

    test = relationship("Test", back_populates="parameters")
    ranges = relationship("ParameterRange", back_populates="parameter", cascade="all, delete-orphan")

class ParameterRange(Base):
    __tablename__ = "parameter_ranges"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    parameter_id = Column(String(36), ForeignKey("test_parameters.id"), nullable=False, index=True)
    gender = Column(String(10), default="ALL") # ALL, MALE, FEMALE
    min_age_days = Column(Integer, default=0)
    max_age_days = Column(Integer, default=36500) # 100 years
    reference_low = Column(Numeric(12, 3), nullable=True)
    reference_high = Column(Numeric(12, 3), nullable=True)
    textual_reference = Column(String(100), nullable=True) # e.g. '12.0 - 16.0'

    parameter = relationship("TestParameter", back_populates="ranges")
