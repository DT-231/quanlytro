"""Enums cho Invoice entity trong hệ thống quản lý phòng trọ.

Các enum định nghĩa trạng thái của hóa đơn theo database schema.
"""

from __future__ import annotations

from .base_enum import BaseEnum


class InvoiceStatus(BaseEnum):
    """Trạng thái hóa đơn trong hệ thống.
    
    Theo invoice_status enum trong database:
    - PENDING: Hóa đơn đang chờ thanh toán
    - PAID: Hóa đơn đã được thanh toán
    - OVERDUE: Hóa đơn đã quá hạn thanh toán
    - CANCELLED: Hóa đơn đã bị hủy
    """
    
    PENDING = "PENDING"       # Hóa đơn đang chờ thanh toán
    PAID = "PAID"             # Hóa đơn đã được thanh toán
    OVERDUE = "OVERDUE"       # Hóa đơn đã quá hạn thanh toán
    CANCELLED = "CANCELLED"   # Hóa đơn đã bị hủy
