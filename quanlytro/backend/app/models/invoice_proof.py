"""Invoice Proof model cho hệ thống quản lý phòng trọ.

Model này lưu trữ chứng từ thanh toán hóa đơn theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel


class InvoiceProof(BaseModel):
    """Model cho bảng invoice_proofs.
    
    Lưu trữ chứng từ thanh toán hóa đơn.
    """
    __tablename__ = "invoice_proofs"
    
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.invoice_id"), nullable=False, index=True)
    url = Column(String(500), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="invoice_proofs")
    uploader = relationship("User", back_populates="uploaded_invoice_proofs")