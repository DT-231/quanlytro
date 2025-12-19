"""RoomUtility schemas cho hệ thống quản lý phòng trọ.

Pydantic schemas cho RoomUtility entity - dùng cho validation và serialization.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class RoomUtilityBase(BaseModel):
    """Base schema for RoomUtility shared properties.

    Chứa các trường cơ bản của tiện ích/nội thất phòng.
    """

    room_id: uuid.UUID
    utility_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class RoomUtilityCreate(RoomUtilityBase):
    """Schema for creating a new room utility.

    Kế thừa từ RoomUtilityBase, yêu cầu các trường bắt buộc.
    """

    pass


class RoomUtilityUpdate(BaseModel):
    """Schema for updating an existing room utility.

    Tất cả các trường đều optional để hỗ trợ partial update.
    """

    room_id: Optional[uuid.UUID] = None
    utility_name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class RoomUtilityOut(RoomUtilityBase):
    """Schema returned by the API for RoomUtility resources.

    Bao gồm metadata như utility_id và timestamps.
    Note: RoomUtility sử dụng utility_id thay vì id.
    """

    utility_id: uuid.UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
