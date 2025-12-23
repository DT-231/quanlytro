"""User model cho hệ thống quản lý phòng trọ.

Model này định nghĩa cấu trúc người dùng theo database schema.
"""

from __future__ import annotations

from sqlalchemy import Column, String, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel
from app.core.Enum.userEnum import UserStatus


class User(BaseModel):
    """Model cho bảng users.
    
    Lưu trữ thông tin người dùng trong hệ thống bao gồm
    thông tin cá nhân, tài khoản và trạng thái.
    """
    __tablename__ = "users"
    
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    password = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(13), nullable=True, index=True)
    cccd = Column(String(20), unique=True, nullable=True, index=True)  # Căn cước công dân
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(10), nullable=False, default="Nam")  # Giới tính: "Nam" hoặc "Nữ"
    hometown = Column(String(255), nullable=True)  # Quê quán
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default=UserStatus.ACTIVE.value, index=True)
    is_temporary_residence = Column(Boolean, nullable=False, default=False)  # Tạm trú tạm vắng
    temporary_residence_date = Column(Date, nullable=True)
    
    # Relationships
    role = relationship("Role", back_populates="users")
    created_contracts = relationship("Contract", foreign_keys="Contract.created_by", back_populates="creator")
    tenant_contracts = relationship("Contract", foreign_keys="Contract.tenant_id", back_populates="tenant")
    payments = relationship("Payment", back_populates="payer")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="tenant")
    notifications = relationship("Notification", back_populates="user")
    reviews = relationship("Review", back_populates="tenant")
    handled_appointments = relationship("Appointment", foreign_keys="Appointment.handled_by", back_populates="handler")
    
    # Media/Document relationships
    uploaded_building_photos = relationship("BuildingPhoto", back_populates="uploader")
    uploaded_room_photos = relationship("RoomPhoto", back_populates="uploader")
    user_documents = relationship("UserDocument", foreign_keys="UserDocument.user_id", back_populates="user")
    uploaded_user_documents = relationship("UserDocument", foreign_keys="UserDocument.uploaded_by", back_populates="uploader")
    uploaded_maintenance_photos = relationship("MaintenancePhoto", back_populates="uploader")
    uploaded_contract_documents = relationship("ContractDocument", back_populates="uploader")
    uploaded_invoice_proofs = relationship("InvoiceProof", back_populates="uploader")
