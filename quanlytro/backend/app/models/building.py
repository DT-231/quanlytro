"""Building model cho hệ thống quản lý phòng trọ.

Model này định nghĩa thông tin tòa nhà theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel
from app.core.Enum.base_enum import StatusEnum


class Building(BaseModel):
    """Model cho bảng buildings.
    
    Lưu trữ thông tin về các tòa nhà/khu trọ.
    """
    __tablename__ = "buildings"
    
    building_code = Column(String(20), unique=True, nullable=False, index=True)
    building_name = Column(String(100), nullable=False)
    address_id = Column(UUID(as_uuid=True), ForeignKey("addresses.id"), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default=StatusEnum.ACTIVE.value, index=True)
    
    # Relationships
    address = relationship("Address", back_populates="buildings")
    rooms = relationship("Room", back_populates="building")
    building_photos = relationship("BuildingPhoto", back_populates="building")