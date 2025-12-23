"""Appointment model cho hệ thống đặt lịch xem phòng.

Model này định nghĩa cấu trúc đặt lịch xem phòng của khách hàng.
"""

from __future__ import annotations

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel


class Appointment(BaseModel):
    """Model cho bảng appointments.
    
    Lưu trữ thông tin đặt lịch xem phòng của khách hàng.
    """
    __tablename__ = "appointments"
    
    # Thông tin người đặt lịch
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    
    # Thông tin đặt lịch
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False, index=True)
    appointment_datetime = Column(DateTime(timezone=True), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    
    # Trạng thái: PENDING, CONFIRMED, CANCELLED, COMPLETED
    status = Column(String(20), nullable=False, default="PENDING", index=True)
    
    # Admin xử lý (nếu có)
    handled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    handled_at = Column(DateTime(timezone=True), nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Relationships
    room = relationship("Room", back_populates="appointments")
    handler = relationship("User", foreign_keys=[handled_by], back_populates="handled_appointments")
