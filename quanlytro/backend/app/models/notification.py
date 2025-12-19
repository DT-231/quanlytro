"""Notification model cho hệ thống quản lý phòng trọ.

Model này định nghĩa cấu trúc thông báo cho người dùng theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel


class Notification(BaseModel):
    """Model cho bảng notifications.
    
    Lưu trữ thông báo gửi tới người dùng về các sự kiện trong hệ thống.
    """
    __tablename__ = "notifications"
    
    # notification_id là unique identifier riêng, không phải PK (PK là 'id' từ BaseModel)
    notification_id = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String(50), nullable=False, index=True)  # INVOICE, CONTRACT, MAINTENANCE, SYSTEM
    related_id = Column(UUID(as_uuid=True), nullable=True)   # ID của invoice, contract, etc.
    related_type = Column(String(50), nullable=True)        # INVOICE, CONTRACT, MAINTENANCE, etc.
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
