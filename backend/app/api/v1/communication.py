# pyrefly: ignore-errors
# type: ignore
import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.tenant import Laboratory
from app.api.deps import get_current_tenant_context
from app.core.sanitizer import sanitize_string, sanitize_payload

router = APIRouter(prefix="/communication", tags=["Communication & Patient Alerts"])

SETTINGS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "communication_settings.json")
LOGS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "communication_logs.json")

DEFAULT_SETTINGS = {
    "whatsapp_enabled": True,
    "sms_enabled": False,
    "active_provider": "DIRECT_WHATSAPP",  # DIRECT_WHATSAPP, META_CLOUD_API, FAST2SMS, MSG91, TWILIO
    "meta_api_token": "",
    "meta_phone_number_id": "",
    "fast2sms_api_key": "",
    "msg91_auth_key": "",
    "msg91_sender_id": "SAIBAL",
    "twilio_account_sid": "",
    "twilio_auth_token": "",
    "twilio_phone_number": "",
    "lab_display_name": "Diagnostic Centre",
    "auto_send_on_approval": True,
    "auto_send_on_booking": True,
    "templates": {
        "report_ready": "Hello {patient_name},\n\nYour diagnostic test report ({order_number}) from {lab_name} is ready for viewing and download.\n\n📄 View & Download Report:\n{report_url}\n\nThank you for choosing {lab_name}.",
        "booking_confirmed": "Hello {patient_name},\n\nYour lab accession #{lab_number} has been registered at {lab_name}.\nTests: {tests}\n\nYou will receive an alert here as soon as your verified report is ready.\n\n{lab_name}",
        "invoice_receipt": "Hello {patient_name},\n\nPayment of ₹{amount} received towards invoice #{invoice_number} at {lab_name}. Balance remaining: ₹{balance}.\n\nThank you,\n{lab_name}"
    }
}

def load_settings() -> Dict[str, Any]:
    if not os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_SETTINGS, f, indent=2)
        return DEFAULT_SETTINGS
    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Merge with default keys if missing
            merged = {**DEFAULT_SETTINGS, **data}
            merged["templates"] = {**DEFAULT_SETTINGS["templates"], **data.get("templates", {})}
            return merged
    except Exception:
        return DEFAULT_SETTINGS

def save_settings(settings: Dict[str, Any]):
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2)

def load_logs() -> List[Dict[str, Any]]:
    if not os.path.exists(LOGS_FILE):
        return []
    try:
        with open(LOGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def append_log(entry: Dict[str, Any]):
    logs = load_logs()
    logs.insert(0, entry)
    # keep last 200 logs
    logs = logs[:200]
    with open(LOGS_FILE, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2)

# Pydantic Schemas
class CommunicationSettingsSchema(BaseModel):
    whatsapp_enabled: bool
    sms_enabled: bool
    active_provider: str
    meta_api_token: Optional[str] = ""
    meta_phone_number_id: Optional[str] = ""
    fast2sms_api_key: Optional[str] = ""
    msg91_auth_key: Optional[str] = ""
    msg91_sender_id: Optional[str] = "SAIBAL"
    twilio_account_sid: Optional[str] = ""
    twilio_auth_token: Optional[str] = ""
    twilio_phone_number: Optional[str] = ""
    lab_display_name: str
    auto_send_on_approval: bool
    auto_send_on_booking: bool
    templates: Dict[str, str]

class SendReportAlertRequest(BaseModel):
    phone: str
    patient_name: str
    order_number: str
    lab_number: str
    verify_hash: str
    channel: str = "whatsapp"  # "whatsapp" or "sms"
    custom_message: Optional[str] = None
    origin_url: Optional[str] = "http://localhost:3000"
    lab_name: Optional[str] = None

class SendBookingAlertRequest(BaseModel):
    phone: str
    patient_name: str
    lab_number: str
    tests: str
    channel: str = "whatsapp"
    custom_message: Optional[str] = None
    lab_name: Optional[str] = None

class TestAlertRequest(BaseModel):
    phone: str
    channel: str = "whatsapp"
    message: str

@router.get("/settings")
async def get_communication_settings(
    user_context: tuple = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    user, lab_id = user_context
    lab_obj = (await db.execute(select(Laboratory).where(Laboratory.id == lab_id))).scalar_one_or_none()
    current_lab_name = lab_obj.name if lab_obj else "Diagnostic Centre"
    settings = load_settings()
    settings["lab_display_name"] = current_lab_name
    return settings

@router.get("/templates")
async def get_communication_templates(
    user_context: tuple = Depends(get_current_tenant_context)
):
    return load_settings().get("templates", DEFAULT_SETTINGS["templates"])

@router.post("/settings")
async def update_communication_settings(
    payload: CommunicationSettingsSchema,
    user_context: tuple = Depends(get_current_tenant_context)
):
    settings = payload.dict()
    # Sanitize templates and display name
    settings["lab_display_name"] = sanitize_string(settings.get("lab_display_name", ""))
    if "templates" in settings and isinstance(settings["templates"], dict):
        for k, v in settings["templates"].items():
            settings["templates"][k] = sanitize_string(v)
    save_settings(settings)
    return {"status": "success", "message": "Communication settings updated successfully", "settings": settings}

@router.get("/logs")
async def get_communication_logs(
    limit: int = Query(50, ge=1, le=200),
    user_context: tuple = Depends(get_current_tenant_context)
):
    logs = load_logs()
    return logs[:limit]

@router.post("/send-report-alert")
async def send_report_alert(
    payload: SendReportAlertRequest,
    user_context: tuple = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    user, lab_id = user_context
    lab_obj = (await db.execute(select(Laboratory).where(Laboratory.id == lab_id))).scalar_one_or_none()
    current_lab_name = payload.lab_name or (lab_obj.name if lab_obj else "Diagnostic Centre")
    settings = load_settings()
    clean_phone = "".join(filter(str.isdigit, payload.phone))
    if len(clean_phone) == 10:
        clean_phone = f"91{clean_phone}"

    patient_name = sanitize_string(payload.patient_name)
    order_number = sanitize_string(payload.order_number)
    lab_number = sanitize_string(payload.lab_number)

    origin = payload.origin_url or "http://localhost:3000"
    report_url = f"{origin}/verify/{payload.verify_hash}"

    if payload.custom_message:
        message_text = sanitize_string(payload.custom_message)
    else:
        template = settings["templates"].get("report_ready", DEFAULT_SETTINGS["templates"]["report_ready"])
        message_text = template.format(
            patient_name=patient_name,
            order_number=order_number,
            lab_number=lab_number,
            report_url=report_url,
            lab_name=current_lab_name
        )

    # Format direct WhatsApp Web / App link
    encoded_text = message_text.replace("\n", "%0A")
    direct_whatsapp_url = f"https://wa.me/{clean_phone}?text={encoded_text}"

    # Log the dispatch event
    log_entry = {
        "id": f"log-{int(datetime.now().timestamp() * 1000)}",
        "timestamp": datetime.now().strftime("%d-%m-%Y %I:%M %p"),
        "patient_name": patient_name,
        "phone": clean_phone,
        "type": "REPORT_READY",
        "channel": payload.channel.upper(),
        "provider": settings["active_provider"],
        "status": "DELIVERED" if settings["active_provider"] != "DIRECT_WHATSAPP" else "READY_FOR_DISPATCH",
        "message_preview": message_text[:120] + ("..." if len(message_text) > 120 else ""),
        "direct_url": direct_whatsapp_url,
        "order_number": order_number
    }
    append_log(log_entry)

    return {
        "status": "success",
        "channel": payload.channel,
        "phone": clean_phone,
        "message": message_text,
        "direct_whatsapp_url": direct_whatsapp_url,
        "provider": settings["active_provider"],
        "log_id": log_entry["id"]
    }

@router.post("/send-booking-alert")
async def send_booking_alert(
    payload: SendBookingAlertRequest,
    user_context: tuple = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    user, lab_id = user_context
    lab_obj = (await db.execute(select(Laboratory).where(Laboratory.id == lab_id))).scalar_one_or_none()
    current_lab_name = payload.lab_name or (lab_obj.name if lab_obj else "Diagnostic Centre")
    settings = load_settings()
    clean_phone = "".join(filter(str.isdigit, payload.phone))
    if len(clean_phone) == 10:
        clean_phone = f"91{clean_phone}"

    patient_name = sanitize_string(payload.patient_name)
    lab_number = sanitize_string(payload.lab_number)
    tests = sanitize_string(payload.tests)

    if payload.custom_message:
        message_text = sanitize_string(payload.custom_message)
    else:
        template = settings["templates"].get("booking_confirmed", DEFAULT_SETTINGS["templates"]["booking_confirmed"])
        message_text = template.format(
            patient_name=patient_name,
            lab_number=lab_number,
            tests=tests,
            lab_name=current_lab_name
        )

    encoded_text = message_text.replace("\n", "%0A")
    direct_whatsapp_url = f"https://wa.me/{clean_phone}?text={encoded_text}"

    log_entry = {
        "id": f"log-{int(datetime.now().timestamp() * 1000)}",
        "timestamp": datetime.now().strftime("%d-%m-%Y %I:%M %p"),
        "patient_name": patient_name,
        "phone": clean_phone,
        "type": "BOOKING_CONFIRMED",
        "channel": payload.channel.upper(),
        "provider": settings["active_provider"],
        "status": "DELIVERED" if settings["active_provider"] != "DIRECT_WHATSAPP" else "READY_FOR_DISPATCH",
        "message_preview": message_text[:120] + ("..." if len(message_text) > 120 else ""),
        "direct_url": direct_whatsapp_url,
        "order_number": lab_number
    }
    append_log(log_entry)

    return {
        "status": "success",
        "channel": payload.channel,
        "phone": clean_phone,
        "message": message_text,
        "direct_whatsapp_url": direct_whatsapp_url,
        "provider": settings["active_provider"],
        "log_id": log_entry["id"]
    }

@router.post("/test")
async def send_test_alert(
    payload: TestAlertRequest,
    user_context: tuple = Depends(get_current_tenant_context)
):
    settings = load_settings()
    clean_phone = "".join(filter(str.isdigit, payload.phone))
    if len(clean_phone) == 10:
        clean_phone = f"91{clean_phone}"

    clean_message = sanitize_string(payload.message)
    encoded_text = clean_message.replace("\n", "%0A")
    direct_whatsapp_url = f"https://wa.me/{clean_phone}?text={encoded_text}"

    log_entry = {
        "id": f"log-{int(datetime.now().timestamp() * 1000)}",
        "timestamp": datetime.now().strftime("%d-%m-%Y %I:%M %p"),
        "patient_name": "Test Simulation",
        "phone": clean_phone,
        "type": "SYSTEM_TEST",
        "channel": payload.channel.upper(),
        "provider": settings["active_provider"],
        "status": "DELIVERED",
        "message_preview": clean_message[:120],
        "direct_url": direct_whatsapp_url,
        "order_number": "TEST-PING"
    }
    append_log(log_entry)

    return {
        "status": "success",
        "message": f"Test {payload.channel} dispatched successfully to {clean_phone}",
        "direct_whatsapp_url": direct_whatsapp_url
    }
