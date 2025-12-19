"""Schemas cho Maintenance Request (Yêu cầu bảo trì / Sự cố).

Định nghĩa các Pydantic models cho input/output của maintenance requests.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class MaintenancePhotoBase(BaseModel):
    """Base schema cho ảnh sự cố."""
    url: str = Field(..., max_length=500)
    is_before: bool = Field(True, description="True=ảnh trước sửa, False=ảnh sau sửa")
    
    model_config = {"from_attributes": True}


class MaintenancePhotoOut(MaintenancePhotoBase):
    """Schema output cho ảnh sự cố."""
    id: UUID
    request_id: UUID
    uploaded_by: UUID
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class MaintenanceBase(BaseModel):
    """Base schema cho Maintenance Request."""
    room_id: UUID
    request_type: str = Field(..., max_length=50, description="Loại sự cố: PLUMBING, ELECTRICAL, AC, etc.")
    title: str = Field(..., min_length=1, max_length=200, description="Tiêu đề sự cố")
    description: str = Field(..., min_length=1, description="Mô tả chi tiết sự cố")
    priority: str = Field(default="MEDIUM", description="Mức độ ưu tiên: LOW, MEDIUM, HIGH, URGENT")
    
    model_config = {"from_attributes": True}


class MaintenanceCreate(MaintenanceBase):
    """Schema tạo maintenance request mới (từ người thuê).
    
    Tenant tạo sự cố với thông tin cơ bản.
    """
    photos: Optional[list[str]] = Field(None, description="Danh sách URL ảnh sự cố (tối đa 5 ảnh)")


class MaintenanceUpdate(BaseModel):
    """Schema cập nhật maintenance request.
    
    Người thuê: Chỉ update được title, description, priority nếu status=PENDING.
    Admin: Update được tất cả các field.
    """
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    priority: Optional[str] = None
    status: Optional[str] = None  # Chỉ admin mới update được
    estimated_cost: Optional[Decimal] = None  # Chỉ admin
    actual_cost: Optional[Decimal] = None  # Chỉ admin
    
    model_config = {"from_attributes": True}


class MaintenanceOut(BaseModel):
    """Schema output cho maintenance request (chi tiết).
    
    Trả về đầy đủ thông tin sự cố.
    """
    id: UUID
    request_id: UUID
    room_id: UUID
    room_code: Optional[str] = None  # Mã phòng (để hiển thị)
    tenant_id: UUID
    tenant_name: Optional[str] = None  # Tên người thuê
    request_type: str
    title: str
    description: str
    priority: str
    status: str
    estimated_cost: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    photos: Optional[list[MaintenancePhotoOut]] = []
    
    model_config = {"from_attributes": True}


class MaintenanceListItem(BaseModel):
    """Schema cho danh sách maintenance requests (list view).
    
    Hiển thị thông tin cơ bản trong dashboard.
    """
    id: UUID
    request_code: str  # Mã yêu cầu (101, 110, 220...)
    room_code: str  # Mã phòng (111, 118, 200...)
    tenant_name: str  # Tên người gửi
    request_date: datetime  # Ngày gửi yêu cầu
    content: str  # Nội dung yêu cầu (title)
    building_name: str  # Tên tòa nhà
    status: str  # Trạng thái: Chưa xử lý, Đang xử lý, Đã xử lý
    
    model_config = {"from_attributes": True}


class MaintenanceStats(BaseModel):
    """Schema thống kê sự cố."""
    total_requests: int = 0  # Tổng sự cố
    pending: int = 0  # Đang xử lý
    not_processed: int = 0  # Chưa xử lý
    processed: int = 0  # Đã xử lý (COMPLETED/CANCELLED)
    
    model_config = {"from_attributes": True}
