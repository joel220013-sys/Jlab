# pyrefly: ignore-errors
# type: ignore
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.schemas.patient import PatientCreate

class OrderCreate(BaseModel):
    # Patient details (either existing patient_id or new patient info)
    patient_id: Optional[str] = None
    new_patient: Optional[PatientCreate] = None
    
    # Test selection
    test_ids: List[str]
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    ref_center: Optional[str] = None
    clinical_history: Optional[str] = None
    
    # Billing details
    total_amount: Optional[float] = Field(default=None, ge=0.0)
    custom_prices: Optional[dict[str, float]] = None
    discount_amount: float = Field(default=0.0, ge=0.0)
    payment_method: str = "UPI" # CASH, UPI, CARD, CREDIT
    initial_payment: float = Field(default=0.0, ge=0.0)

class SampleOut(BaseModel):
    id: str
    barcode: str
    specimen_type: str
    tube_color: str
    status: str
    collected_at: Optional[datetime] = None
    received_at_lab_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InvoiceOut(BaseModel):
    id: str
    invoice_number: str
    total: float
    paid_amount: float
    balance: float
    status: str
    is_credit_override: bool

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: str
    order_number: str
    lab_number: str
    patient_id: str
    patient_name: str
    patient_uhid: str
    total_amount: float
    discount_amount: float
    final_amount: float
    invoice_status: str
    samples: List[SampleOut]
    created_at: datetime

    class Config:
        from_attributes = True
