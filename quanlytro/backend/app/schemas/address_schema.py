"""Address schemas cho hệ thống quản lý phòng trọ.

Pydantic schemas cho Address entity - dùng cho validation và serialization.
Frontend sẽ gọi API bên thứ 3 để lấy dropdown city/ward, gửi tên (text) về backend.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class AddressBase(BaseModel):
    """Base schema for Address shared properties.

    Chứa các trường cơ bản của địa chỉ dạng text.
    Frontend gửi tên city/ward từ API bên thứ 3.
    """
    
    address_line: str = Field(..., min_length=1, max_length=255, description="Số nhà, tên đường")
    ward: str = Field(..., min_length=1, max_length=100, description="Tên phường/xã")
    city: str = Field(..., min_length=1, max_length=100, description="Tên tỉnh/thành phố")
    country: str = Field(default="Vietnam", max_length=100)
    full_address: Optional[str] = Field(None, max_length=500)

    model_config = {"from_attributes": True}


class AddressCreate(AddressBase):
    """Schema for creating a new address.

    Frontend gửi: {address_line, ward, city, country}
    Backend có thể tự động generate full_address nếu cần.
    """
    
    pass


class AddressUpdate(BaseModel):
    """Schema for updating an existing address.

    Tất cả các trường đều optional để hỗ trợ partial update.
    """

    address_line: Optional[str] = Field(None, min_length=1, max_length=255)
    ward: Optional[str] = Field(None, min_length=1, max_length=100)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    full_address: Optional[str] = Field(None, max_length=500)

    model_config = {"from_attributes": True}


class AddressOut(AddressBase):
    """Schema returned by the API for Address resources.

    Bao gồm metadata như id và timestamps.
    """

    id: uuid.UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
