"""Room Photo model cho hệ thống quản lý phòng trọ.

Model này lưu trữ ảnh của các phòng theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel


class RoomPhoto(BaseModel):
    """Model cho bảng room_photos.
    
    Lưu trữ ảnh của các phòng.
    """
    __tablename__ = "room_photos"
    
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False, index=True)
    url = Column(String(500), nullable=True)  # URL ảnh (optional, dùng khi upload lên cloud)
    image_base64 = Column(Text, nullable=True)  # Ảnh dạng base64 string
    is_primary = Column(Boolean, nullable=False, default=False, index=True)
    sort_order = Column(Integer, nullable=False, default=0)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    room = relationship("Room", back_populates="room_photos")
    uploader = relationship("User", back_populates="uploaded_room_photos")