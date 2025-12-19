"""Enums cho Payment entity trong hệ thống quản lý phòng trọ.

Các enum định nghĩa phương thức thanh toán theo database schema.
"""

from __future__ import annotations

from .base_enum import BaseEnum


class PaymentMethod(BaseEnum):
    """Phương thức thanh toán trong hệ thống.
    
    Các phương thức thanh toán được hỗ trợ:
    - CASH: Thanh toán bằng tiền mặt
    - BANK_TRANSFER: Chuyển khoản ngân hàng
    - MOMO: Thanh toán qua MoMo
    - ZALO_PAY: Thanh toán qua ZaloPay
    - VIETTEL_PAY: Thanh toán qua ViettelPay
    - CREDIT_CARD: Thanh toán qua thẻ tín dụng
    - DEBIT_CARD: Thanh toán qua thẻ ghi nợ
    """
    
    CASH = "CASH"                     # Tiền mặt
    BANK_TRANSFER = "BANK_TRANSFER"   # Chuyển khoản ngân hàng
    # MOMO = "MOMO"                     # MoMo e-wallet
    # ZALO_PAY = "ZALO_PAY"            # ZaloPay
    # VIETTEL_PAY = "VIETTEL_PAY"      # ViettelPay
    # CREDIT_CARD = "CREDIT_CARD"       # Thẻ tín dụng
    # DEBIT_CARD = "DEBIT_CARD"        # Thẻ ghi nợ
