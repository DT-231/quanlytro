"""RoomType model cho hệ thống quản lý phòng trọ.

Model này định nghĩa các loại phòng (Studio, 1 Phòng Ngủ, Duplex, v.v.).
"""

from __future__ import annotations

from sqlalchemy import Column, String, Text, Boolean
from sqlalchemy.orm import relationship

from .base import BaseModel


class RoomType(BaseModel):
    """Model cho bảng room_types.
    
    Lưu trữ thông tin về các loại phòng như Studio, 1 Phòng Ngủ, Duplex, v.v.
    """
    __tablename__ = "room_types"
    
    name = Column(String(100), nullable=False, unique=True, index=True)  # Tên loại phòng: Studio, 1 Phòng Ngủ, Duplex
    description = Column(Text, nullable=True)  # Mô tả chi tiết về loại phòng
    is_active = Column(Boolean, nullable=False, default=True, index=True)  # Trạng thái active/inactive
    
    # Relationships
    rooms = relationship("Room", back_populates="room_type")
