"""Contract model cho hệ thống quản lý phòng trọ.

Model này định nghĩa cấu trúc hợp đồng thuê phòng theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, Date, DECIMAL, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSON

from .base import BaseModel
from app.core.Enum.contractEnum import ContractStatus


class Contract(BaseModel):
    """Model cho bảng contracts.
    
    Lưu trữ thông tin hợp đồng thuê phòng giữa chủ trọ và người thuê.
    """
    __tablename__ = "contracts"
    
    contract_number = Column(String(50), unique=True, nullable=False, index=True)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    rental_price = Column(DECIMAL(10, 2), nullable=False)  # Giá thuê thỏa thuận
    deposit_amount = Column(DECIMAL(10, 2), nullable=False)  # Tiền đặt cọc
    payment_day = Column(Integer, nullable=True)  # Ngày thanh toán hàng tháng (1-31)
    number_of_tenants = Column(Integer, nullable=False, default=1)  # Số người ở trong phòng
    status = Column(String(20), nullable=False, default=ContractStatus.ACTIVE.value, index=True)
    
    # Thông tin thanh toán chi tiết
    payment_cycle_months = Column(Integer, nullable=True, default=1)  # Chu kỳ thanh toán (tháng)
    electricity_price = Column(DECIMAL(10, 2), nullable=True)  # Giá điện (VNĐ/kWh)
    water_price = Column(DECIMAL(10, 2), nullable=True)  # Giá nước (VNĐ/m³)
    service_fees = Column(JSON, nullable=True)  # Phí dịch vụ dưới dạng JSON array: [{"name": "Internet", "amount": 100000}]
    
    terms_and_conditions = Column(Text, nullable=True)  # Các điều khoản, quy định
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    
    # Relationships
    room = relationship("Room", back_populates="contracts")
    tenant = relationship("User", foreign_keys=[tenant_id], back_populates="tenant_contracts")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_contracts")
    invoices = relationship("Invoice", back_populates="contract")
    reviews = relationship("Review", back_populates="contract")
    contract_documents = relationship("ContractDocument", back_populates="contract")
