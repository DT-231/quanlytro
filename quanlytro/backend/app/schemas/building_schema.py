"""Building schemas cho hệ thống quản lý phòng trọ.

Pydantic schemas cho Building entity - dùng cho validation và serialization.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

from app.core.Enum.base_enum import StatusEnum
from app.schemas.address_schema import AddressCreate


class BuildingBase(BaseModel):
    """Base schema for Building shared properties.

    Chứa các trường cơ bản của tòa nhà/khu trọ.
    """

    building_code: str = Field(..., min_length=1, max_length=20)
    building_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    status: str = Field(default=StatusEnum.ACTIVE.value)

    model_config = {"from_attributes": True}


class BuildingCreate(BuildingBase):
    """Schema for creating a new building.

    Kế thừa từ BuildingBase, yêu cầu các trường bắt buộc.
    """
    address: Optional[AddressCreate] = None

    model_config = {"from_attributes": True}


class BuildingUpdate(BaseModel):
    """Schema for updating an existing building.

    Tất cả các trường đều optional để hỗ trợ partial update.
    """

    building_code: Optional[str] = Field(None, min_length=1, max_length=20)
    building_name: Optional[str] = Field(None, min_length=1, max_length=100)
    address: Optional[AddressCreate] = Field(None, alias="address_data")  # Hỗ trợ cả "address" và "address_data"
    description: Optional[str] = None
    status: Optional[str] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,  # Cho phép dùng cả tên field và alias
        "json_schema_extra": {
            "example": {
                "building_name": "Chung cư Hoàng Anh - Cập nhật",
                "address_data": {
                    "address_line": "99 Hùng Vương",
                    "ward": "Hải Châu 1",
                    "city": "Đà Nẵng",
                    "country": "Vietnam"
                },
                "status": "ACTIVE"
            }
        }
    }


class BuildingOut(BuildingBase):
    """Schema returned by the API for Building resources.

    Bao gồm metadata như id, timestamps và room statistics.
    """

    id: uuid.UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    address_line: Optional[str] = None  # Địa chỉ đầy đủ
    total_rooms: Optional[int] = 0  # Tổng số phòng
    available_rooms: Optional[int] = 0  # Số phòng trống
    rented_rooms: Optional[int] = 0  # Số phòng đang thuê

    model_config = {"from_attributes": True}


class BuildingListItem(BaseModel):
    """Schema for Building list item with aggregated data.
    
    Dùng cho API list buildings, bao gồm thông tin tổng hợp về phòng.
    """
    
    id: uuid.UUID
    building_code: str
    building_name: str
    address_line: str  # Địa chỉ đầy đủ từ relationship
    total_rooms: int  # Tổng số phòng
    available_rooms: int  # Số phòng trống (AVAILABLE)
    rented_rooms: int  # Số phòng đang thuê (OCCUPIED)
    status: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}
