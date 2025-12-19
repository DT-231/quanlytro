"""Payment model cho hệ thống quản lý phòng trọ.

Model này định nghĩa cấu trúc thanh toán theo database schema.
"""

from __future__ import annotations

import enum

from sqlalchemy import Column, String, DateTime, DECIMAL, Text, ForeignKey, func, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel


class Payment(BaseModel):
    """Model cho bảng payments.
    
    Lưu trữ thông tin thanh toán của người thuê cho hóa đơn.
    """
    __tablename__ = "payments"
    
    # payment_id là unique identifier riêng, không phải PK (PK là 'id' từ BaseModel)
    payment_id = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.invoice_id"), nullable=False, index=True)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    amount = Column(DECIMAL(10, 2), nullable=False)

    # Payment method and status
    class PaymentMethod(enum.Enum):
        BANKING = "banking"
        COD = "cod"
        OTHER = "other"

    class PaymentStatus(enum.Enum):
        PENDING = "pending"
        COMPLETED = "completed"
        FAILED = "failed"
        CANCELLED = "cancelled"

    method = Column(SAEnum(PaymentMethod, name="payment_method"), nullable=False, index=True)
    status = Column(SAEnum(PaymentStatus, name="payment_status"), nullable=False, server_default="pending", index=True)

    # Banking-specific fields
    bank_name = Column(String(100), nullable=True)
    bank_account_number = Column(String(50), nullable=True)
    banking_transaction_id = Column(String(100), nullable=True, index=True)  # Mã giao dịch ngân hàng / reference

    # COD-specific fields
    cod_receiver_name = Column(String(200), nullable=True)
    cod_receiver_phone = Column(String(20), nullable=True)

    # Timestamps and auxiliary
    paid_at = Column(DateTime(timezone=True), nullable=True, index=True)
    proof_url = Column(Text, nullable=True)              # URL ảnh chứng từ
    note = Column(Text, nullable=True)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
    payer = relationship("User", back_populates="payments")
