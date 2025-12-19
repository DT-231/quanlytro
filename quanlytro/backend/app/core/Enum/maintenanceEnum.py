"""Enums cho Maintenance Request entity trong hệ thống quản lý phòng trọ.

Các enum định nghĩa loại yêu cầu, mức độ ưu tiên và trạng thái 
của yêu cầu bảo trì theo database schema.
"""

from __future__ import annotations

from .base_enum import BaseEnum


class MaintenancePriority(BaseEnum):
    """Mức độ ưu tiên của yêu cầu bảo trì.
    
    Theo maintenance_priority enum trong database:
    - LOW: Mức độ ưu tiên thấp
    - MEDIUM: Mức độ ưu tiên trung bình  
    - HIGH: Mức độ ưu tiên cao
    - URGENT: Khẩn cấp, cần xử lý ngay lập tức
    """
    
    LOW = "LOW"         # Mức độ ưu tiên thấp
    MEDIUM = "MEDIUM"   # Mức độ ưu tiên trung bình
    HIGH = "HIGH"       # Mức độ ưu tiên cao
    URGENT = "URGENT"   # Khẩn cấp


class MaintenanceStatus(BaseEnum):
    """Trạng thái yêu cầu bảo trì.
    
    Theo maintenance_status enum trong database:
    - PENDING: Yêu cầu đang chờ xử lý
    - IN_PROGRESS: Yêu cầu đang được thực hiện
    - COMPLETED: Yêu cầu đã hoàn thành
    - CANCELLED: Yêu cầu đã bị hủy
    """
    
    PENDING = "PENDING"         # Yêu cầu đang chờ xử lý
    IN_PROGRESS = "IN_PROGRESS" # Yêu cầu đang được thực hiện
    COMPLETED = "COMPLETED"     # Yêu cầu đã hoàn thành
    CANCELLED = "CANCELLED"     # Yêu cầu đã bị hủy


class MaintenanceRequestType(BaseEnum):
    """Loại yêu cầu bảo trì.
    
    Các loại yêu cầu bảo trì phổ biến:
    - PLUMBING: Sửa chữa hệ thống nước
    - ELECTRICAL: Sửa chữa hệ thống điện
    - AC: Sửa chữa điều hòa
    - FURNITURE: Sửa chữa nội thất
    - CLEANING: Vệ sinh, dọn dẹp
    - INTERNET: Sửa chữa mạng internet
    - SECURITY: Bảo mật, an ninh
    - OTHER: Loại khác
    """
    
    PLUMBING = "PLUMBING"       # Hệ thống nước
    ELECTRICAL = "ELECTRICAL"   # Hệ thống điện
    AC = "AC"                   # Điều hòa
    FURNITURE = "FURNITURE"     # Nội thất
    CLEANING = "CLEANING"       # Vệ sinh
    INTERNET = "INTERNET"       # Mạng internet  
    SECURITY = "SECURITY"       # Bảo mật
    OTHER = "OTHER"             # Loại khác
