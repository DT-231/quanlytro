"""RoomType schemas cho hệ thống quản lý phòng trọ.

Pydantic schemas cho RoomType entity - dùng cho validation và serialization.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class RoomTypeBase(BaseModel):
    """Base schema for RoomType shared properties."""
    
    name: str = Field(..., min_length=1, max_length=100, description="Tên loại phòng (Studio, 1 Phòng Ngủ, Duplex, v.v.)")
    description: Optional[str] = Field(None, description="Mô tả chi tiết về loại phòng")
    is_active: bool = Field(default=True, description="Trạng thái hoạt động")
    
    model_config = {"from_attributes": True}


class RoomTypeCreate(RoomTypeBase):
    """Schema for creating a new room type."""
    pass


class RoomTypeUpdate(BaseModel):
    """Schema for updating an existing room type.
    
    Tất cả các trường đều optional để hỗ trợ partial update.
    """
    
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    
    model_config = {"from_attributes": True}


class RoomTypeOut(RoomTypeBase):
    """Schema returned by the API for RoomType resources."""
    
    id: uuid.UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class RoomTypeSimple(BaseModel):
    """Schema for simple RoomType info (dùng trong dropdown)."""
    
    id: uuid.UUID
    name: str
    
    model_config = {"from_attributes": True}
