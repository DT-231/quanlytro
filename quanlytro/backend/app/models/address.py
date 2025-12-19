"""Address model cho hệ thống quản lý phòng trọ.

Model này định nghĩa thông tin địa chỉ theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from .base import BaseModel


class Address(BaseModel):
    """Model cho bảng addresses.
    
    Lưu trữ thông tin địa chỉ của các tòa nhà.
    """
    __tablename__ = "addresses"
    
    address_line = Column(String(255), nullable=False)  # Số nhà, tên đường
    ward = Column(String(100), nullable=False)          # Phường/Xã
    city = Column(String(100), nullable=False, index=True)  # Thành phố/Tỉnh
    country = Column(String(100), nullable=False, default="Vietnam")
    full_address = Column(String(500), nullable=True)   # Auto-generated
    
    # Relationships
    buildings = relationship("Building", back_populates="address")