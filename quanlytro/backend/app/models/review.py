"""Review model cho hệ thống quản lý phòng trọ.

Model này định nghĩa cấu trúc đánh giá phòng của người thuê theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel


class Review(BaseModel):
    """Model cho bảng reviews.
    
    Lưu trữ đánh giá của người thuê về phòng sau khi kết thúc hợp đồng.
    """
    __tablename__ = "reviews"
    
    # review_id là unique identifier riêng, không phải PK (PK là 'id' từ BaseModel)
    review_id = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    contract_id = Column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=True, index=True)
    rating = Column(Integer, nullable=False, index=True)  # 1-5 stars
    comment = Column(Text, nullable=True)
    
    # Relationships
    room = relationship("Room", back_populates="reviews")
    tenant = relationship("User", back_populates="reviews")
    contract = relationship("Contract", back_populates="reviews")
