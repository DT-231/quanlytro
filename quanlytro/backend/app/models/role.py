"""Role model cho hệ thống quản lý phòng trọ.

Model này định nghĩa các vai trò trong hệ thống theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from .base import BaseModel


class Role(BaseModel):
    """Model cho bảng roles.
    
    Lưu trữ các vai trò trong hệ thống như ADMIN, TENANT, CUSTOMER.
    """
    __tablename__ = "roles"
    
    role_code = Column(String(20), unique=True, nullable=False, index=True)  # ADMIN, TENANT, CUSTOMER
    role_name = Column(String(50), nullable=False)  # Administrator, Tenant, Customer (English)
    display_name = Column(String(50), nullable=True)  # Chủ trọ, Người thuê, Khách (Vietnamese)
    description = Column(String, nullable=True)
    
    # Relationships
    users = relationship("User", back_populates="role")