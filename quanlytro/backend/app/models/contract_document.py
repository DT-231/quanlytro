"""Contract Document model cho hệ thống quản lý phòng trọ.

Model này lưu trữ tài liệu hợp đồng theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel


class ContractDocument(BaseModel):
    """Model cho bảng contract_documents.
    
    Lưu trữ tài liệu hợp đồng.
    """
    __tablename__ = "contract_documents"
    
    contract_id = Column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False, index=True)
    url = Column(String(500), nullable=False)
    document_type = Column(String(20), nullable=False, default="CONTRACT")  # CONTRACT, ADDENDUM, OTHER
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    contract = relationship("Contract", back_populates="contract_documents")
    uploader = relationship("User", back_populates="uploaded_contract_documents")