"""Enums cho Room entity trong hệ thống quản lý phòng trọ.

Các enum định nghĩa trạng thái của phòng theo database schema.
"""

from __future__ import annotations

from .base_enum import BaseEnum


class RoomStatus(BaseEnum):
    """Trạng thái phòng trong hệ thống.
    
    Theo room_status enum trong database:
    - AVAILABLE: Phòng trống, sẵn sàng cho thuê
    - OCCUPIED: Phòng đã được thuê
    - MAINTENANCE: Phòng đang bảo trì
    - RESERVED: Phòng đã được đặt trước
    """
    
    AVAILABLE = "AVAILABLE"      # Phòng trống, sẵn sàng cho thuê
    OCCUPIED = "OCCUPIED"        # Phòng đã được thuê  
    MAINTENANCE = "MAINTENANCE"  # Phòng đang bảo trì
    RESERVED = "RESERVED"        # Phòng đã được đặt trước
