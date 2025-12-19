"""Building Photo model cho hệ thống quản lý phòng trọ.

Model này lưu trữ ảnh của các tòa nhà theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel


class BuildingPhoto(BaseModel):
    """Model cho bảng building_photos.
    
    Lưu trữ ảnh của các tòa nhà.
    """
    __tablename__ = "building_photos"
    
    building_id = Column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=False, index=True)
    url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, nullable=False, default=False, index=True)
    sort_order = Column(Integer, nullable=False, default=0)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    building = relationship("Building", back_populates="building_photos")
    uploader = relationship("User", back_populates="uploaded_building_photos")