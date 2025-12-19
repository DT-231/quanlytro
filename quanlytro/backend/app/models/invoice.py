"""Invoice model cho hệ thống quản lý phòng trọ.

Model này định nghĩa cấu trúc hóa đơn thuê phòng theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, Date, DECIMAL, Float, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel
from app.core.Enum.invoiceEnum import InvoiceStatus


class Invoice(BaseModel):
    """Model cho bảng invoices.
    
    Lưu trữ thông tin hóa đơn thanh toán hàng tháng của người thuê.
    """
    __tablename__ = "invoices"
    
    # invoice_id là unique identifier riêng, không phải PK (PK là 'id' từ BaseModel)
    invoice_id = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    contract_id = Column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False, index=True)
    billing_month = Column(Date, nullable=False, index=True)  # YYYY-MM-01 format
    room_price = Column(DECIMAL(10, 2), nullable=False)
    electricity_old_index = Column(Float, nullable=True)      # Chỉ số điện cũ
    electricity_new_index = Column(Float, nullable=True)      # Chỉ số điện mới
    electricity_unit_price = Column(DECIMAL(10, 2), nullable=False)  # Giá điện/kWh tại thời điểm lập HĐ
    number_of_people = Column(Integer, nullable=False, default=1)  # Số người trong tháng
    water_unit_price = Column(DECIMAL(10, 2), nullable=False)  # Giá nước/người tại thời điểm lập HĐ
    service_fee = Column(DECIMAL(10, 2), nullable=False, default=0)    # Phí dịch vụ
    internet_fee = Column(DECIMAL(10, 2), nullable=False, default=0)   # Phí internet
    parking_fee = Column(DECIMAL(10, 2), nullable=False, default=0)    # Phí gửi xe
    other_fees = Column(DECIMAL(10, 2), nullable=False, default=0)
    other_fees_description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False, default=InvoiceStatus.PENDING.value, index=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    contract = relationship("Contract", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice")
    invoice_proofs = relationship("InvoiceProof", back_populates="invoice")
