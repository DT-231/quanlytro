"""Room Photo schemas cho hệ thống quản lý phòng trọ.

Pydantic schemas cho RoomPhoto entity - dùng cho validation và serialization.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class RoomPhotoBase(BaseModel):
    """Base schema for RoomPhoto shared properties."""

    is_primary: bool = Field(default=False, description="Ảnh chính của phòng")
    sort_order: int = Field(default=0, description="Thứ tự hiển thị")

    model_config = {"from_attributes": True}


class RoomPhotoInput(RoomPhotoBase):
    """Schema for photo input when creating room (without room_id).
    
    Dùng khi tạo phòng mới - chưa có room_id.
    Frontend gửi ảnh dạng base64 string.
    """

    image_base64: str = Field(..., description="Ảnh dạng base64 string (data:image/png;base64,...)")

    model_config = {"from_attributes": True}


class RoomPhotoCreate(RoomPhotoBase):
    """Schema for creating a new room photo.
    
    Frontend gửi ảnh dạng base64 string.
    Backend sẽ lưu vào database hoặc upload lên cloud storage.
    """

    image_base64: str = Field(..., description="Ảnh dạng base64 string (data:image/png;base64,...)")
    room_id: uuid.UUID = Field(..., description="UUID của phòng")

    model_config = {"from_attributes": True}


class RoomPhotoUpdate(BaseModel):
    """Schema for updating an existing room photo.
    
    Tất cả các trường đều optional để hỗ trợ partial update.
    """

    image_base64: Optional[str] = Field(None, description="Ảnh mới dạng base64")
    url: Optional[str] = Field(None, description="URL ảnh trên cloud")
    is_primary: Optional[bool] = None
    sort_order: Optional[int] = None

    model_config = {"from_attributes": True}


class RoomPhotoOut(RoomPhotoBase):
    """Schema returned by the API for RoomPhoto resources.
    
    Trả về cả base64 và url (nếu có) để frontend linh hoạt sử dụng.
    """

    id: uuid.UUID
    room_id: uuid.UUID
    url: Optional[str] = None
    image_base64: Optional[str] = None  # Có thể null nếu chỉ lưu URL
    uploaded_by: uuid.UUID
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
