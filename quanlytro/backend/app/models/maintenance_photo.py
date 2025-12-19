"""Maintenance Photo model cho hệ thống quản lý phòng trọ.

Model này lưu trữ ảnh bảo trì theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel


class MaintenancePhoto(BaseModel):
    """Model cho bảng maintenance_photos.
    
    Lưu trữ ảnh trước và sau khi bảo trì.
    """
    __tablename__ = "maintenance_photos"
    
    request_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_requests.request_id"), nullable=False, index=True)
    url = Column(String(500), nullable=False)
    is_before = Column(Boolean, nullable=False, default=True, index=True)  # true=ảnh trước sửa, false=ảnh sau sửa
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    request = relationship("MaintenanceRequest", back_populates="maintenance_photos")
    uploader = relationship("User", back_populates="uploaded_maintenance_photos")