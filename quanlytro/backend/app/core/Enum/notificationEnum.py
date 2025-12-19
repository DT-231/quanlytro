"""Enums cho Notification entity trong hệ thống quản lý phòng trọ.

Các enum định nghĩa loại thông báo và loại thực thể liên quan 
theo database schema.
"""

from __future__ import annotations

from .base_enum import BaseEnum


class NotificationType(BaseEnum):
    """Loại thông báo trong hệ thống.
    
    Các loại thông báo được hỗ trợ:
    - INVOICE: Thông báo về hóa đơn
    - CONTRACT: Thông báo về hợp đồng
    - MAINTENANCE: Thông báo về bảo trì
    - SYSTEM: Thông báo hệ thống
    - PAYMENT: Thông báo thanh toán
    - REMINDER: Thông báo nhắc nhở
    """
    
    INVOICE = "INVOICE"           # Thông báo về hóa đơn
    CONTRACT = "CONTRACT"         # Thông báo về hợp đồng
    MAINTENANCE = "MAINTENANCE"   # Thông báo về bảo trì
    SYSTEM = "SYSTEM"             # Thông báo hệ thống
    PAYMENT = "PAYMENT"           # Thông báo thanh toán
    REMINDER = "REMINDER"         # Thông báo nhắc nhở


class RelatedType(BaseEnum):
    """Loại thực thể liên quan đến thông báo.
    
    Định nghĩa các loại entity có thể liên kết với thông báo:
    - INVOICE: Hóa đơn
    - CONTRACT: Hợp đồng
    - MAINTENANCE: Yêu cầu bảo trì
    - PAYMENT: Thanh toán
    - USER: Người dùng
    - ROOM: Phòng
    """
    
    INVOICE = "INVOICE"           # Hóa đơn
    CONTRACT = "CONTRACT"         # Hợp đồng 
    MAINTENANCE = "MAINTENANCE"   # Yêu cầu bảo trì
    PAYMENT = "PAYMENT"           # Thanh toán
    USER = "USER"                 # Người dùng
    ROOM = "ROOM"                 # Phòng
