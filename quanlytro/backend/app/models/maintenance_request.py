"""MaintenanceRequest model cho hệ thống quản lý phòng trọ.

Model này định nghĩa cấu trúc yêu cầu bảo trì theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, Text, DateTime, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel
from app.core.Enum.maintenanceEnum import MaintenancePriority, MaintenanceStatus


class MaintenanceRequest(BaseModel):
    """Model cho bảng maintenance_requests.
    
    Lưu trữ thông tin yêu cầu bảo trì từ người thuê.
    """
    __tablename__ = "maintenance_requests"
    
    # request_id là unique identifier riêng, không phải PK (PK là 'id' từ BaseModel)
    request_id = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    request_type = Column(String(50), nullable=False)  # Plumbing, Electrical, AC, etc.
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False, default=MaintenancePriority.MEDIUM.value, index=True)
    status = Column(String(20), nullable=False, default=MaintenanceStatus.PENDING.value, index=True)
    estimated_cost = Column(DECIMAL(10, 2), nullable=True)
    actual_cost = Column(DECIMAL(10, 2), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    room = relationship("Room", back_populates="maintenance_requests")
    tenant = relationship("User", back_populates="maintenance_requests")
    maintenance_photos = relationship("MaintenancePhoto", back_populates="request")
