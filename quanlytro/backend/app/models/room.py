"""Room model cho hệ thống quản lý phòng trọ.

Model này định nghĩa cấu trúc phòng theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel
from app.core.Enum.roomEnum import RoomStatus


class Room(BaseModel):
    """Model cho bảng rooms.
    
    Lưu trữ thông tin chi tiết về từng phòng trong tòa nhà.
    """
    __tablename__ = "rooms"
    
    building_id = Column(UUID(as_uuid=True), ForeignKey("buildings.id"), nullable=False, index=True)
    room_number = Column(String(20), nullable=False)  # Ví dụ: 101, A202
    room_name = Column(String(100), nullable=True)    # Ví dụ: Căn hộ 1PN
    area = Column(Float, nullable=True)               # m²
    capacity = Column(Integer, nullable=False, default=1)  # Số người tối đa
    base_price = Column(DECIMAL(10, 2), nullable=False)    # Giá thuê cơ bản/tháng
    electricity_price = Column(DECIMAL(10, 2), nullable=True)  # Giá điện/kWh
    water_price_per_person = Column(DECIMAL(10, 2), nullable=True)  # Giá nước/người/tháng
    deposit_amount = Column(DECIMAL(10, 2), nullable=True)  # Tiền cọc
    status = Column(String(20), nullable=False, default=RoomStatus.AVAILABLE.value, index=True)
    description = Column(Text, nullable=True)
    
    # Relationships
    building = relationship("Building", back_populates="rooms")
    contracts = relationship("Contract", back_populates="room")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="room")
    reviews = relationship("Review", back_populates="room")
    utilities = relationship("RoomUtility", back_populates="room")
    room_photos = relationship("RoomPhoto", back_populates="room")
