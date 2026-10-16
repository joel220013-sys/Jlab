# pyrefly: ignore-errors
# type: ignore
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    laboratory_id = Column(String(36), ForeignKey("laboratories.id"), nullable=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    user_name = Column(String(150), nullable=True)
    action = Column(String(100), nullable=False) # 'RESULT_ENTERED', 'REPORT_APPROVED', 'DISPATCHED'
    entity_name = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=False)
    ip_address = Column(String(50), nullable=True)
    changes_json = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
