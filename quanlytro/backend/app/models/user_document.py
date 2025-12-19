"""User Document model cho hệ thống quản lý phòng trọ.

Model này lưu trữ tài liệu cá nhân của người dùng theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel


class UserDocument(BaseModel):
    """Model cho bảng user_documents.
    
    Lưu trữ tài liệu cá nhân của người dùng như CCCD, avatar.
    """
    __tablename__ = "user_documents"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    document_type = Column(String(20), nullable=False)  # AVATAR, CCCD_FRONT, CCCD_BACK
    url = Column(String(500), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="user_documents")
    uploader = relationship("User", foreign_keys=[uploaded_by], back_populates="uploaded_user_documents")