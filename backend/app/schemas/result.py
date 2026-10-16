# pyrefly: ignore-errors
# type: ignore
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ParameterEntryItem(BaseModel):
    parameter_id: str
    code: str
    numeric_value: Optional[float] = None
    text_value: Optional[str] = None
    is_bold_highlight: Optional[bool] = False

class ResultSubmitRequest(BaseModel):
    parameters: List[ParameterEntryItem]
    technician_remarks: Optional[str] = None
    is_draft: bool = False

class ValidationAlert(BaseModel):
    parameter_code: str
    severity: str # WARNING, CRITICAL, IMPOSSIBLE
    message: str

class ResultValidationResponse(BaseModel):
    is_valid: bool
    status: str # DRAFT_SAVED, SUBMITTED_FOR_VERIFICATION, VALIDATION_FAILED
    differential_sum: Optional[float] = None
    differential_message: Optional[str] = None
    alerts: List[ValidationAlert] = []

class ParameterRowOut(BaseModel):
    parameter_id: str
    code: str
    name: str
    unit: Optional[str] = None
    value_type: str
    current_numeric: Optional[float] = None
    current_text: Optional[str] = None
    reference_low: Optional[float] = None
    reference_high: Optional[float] = None
    reference_text: Optional[str] = None
    delta_previous_value: Optional[float] = None
    delta_previous_date: Optional[str] = None
    flag: str = "NORMAL"
    is_bold_highlight: Optional[bool] = False
    is_differential_part: bool = False

class WorklistTestItem(BaseModel):
    test_result_id: str
    order_id: str
    order_number: str
    lab_number: str
    barcode: str
    patient_name: str
    patient_uhid: str
    patient_age_gender: str
    doctor_name: Optional[str] = None
    test_name: str
    test_code: str
    specimen_type: str
    status: str
    created_at: datetime
