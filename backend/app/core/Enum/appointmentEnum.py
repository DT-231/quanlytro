"""Enum definitions for appointment status in the system."""

from enum import Enum


class AppointmentStatus(str, Enum):
    """Trạng thái của lịch hẹn xem phòng."""
    PENDING = "PENDING"           # Chờ xác nhận
    CONFIRMED = "CONFIRMED"       # Đã xác nhận
    CANCELLED = "CANCELLED"       # Đã hủy
    COMPLETED = "COMPLETED"       # Đã hoàn thành
    REJECTED = "REJECTED"         # Bị từ chối
