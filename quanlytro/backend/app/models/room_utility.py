"""RoomUtility model cho hệ thống quản lý phòng trọ.

Model này định nghĩa các tiện ích/nội thất của phòng theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel


class RoomUtility(BaseModel):
    """Model cho bảng room_utilities.
    
    Lưu trữ thông tin về các tiện ích/nội thất của phòng
    như tủ lạnh, điều hòa, giường, tủ...
    """
    __tablename__ = "room_utilities"
    
    # utility_id là unique identifier riêng, không phải PK (PK là 'id' từ BaseModel)
    utility_id = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False, index=True)
    utility_name = Column(String(100), nullable=False)  # Tủ lạnh, điều hòa, giường, tủ...
    description = Column(Text, nullable=True)
    
    # Relationships
    room = relationship("Room", back_populates="utilities")
