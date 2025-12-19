"""Room schemas cho hệ thống quản lý phòng trọ.

Pydantic schemas cho Room entity - dùng cho validation và serialization.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import uuid

from app.core.Enum.roomEnum import RoomStatus
from app.schemas.room_photo_schema import RoomPhotoInput, RoomPhotoOut


class RoomBase(BaseModel):
    """Base schema for Room shared properties.

    Chứa các trường cơ bản của phòng trọ.
    """

    building_id: uuid.UUID
    room_number: str = Field(..., min_length=1, max_length=20)
    room_name: Optional[str] = Field(None, max_length=100)
    area: Optional[float] = Field(None, gt=0)
    capacity: int = Field(default=1, ge=1)
    base_price: Decimal = Field(..., ge=0, decimal_places=2)
    electricity_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    water_price_per_person: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    deposit_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    status: str = Field(default=RoomStatus.AVAILABLE.value)
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class RoomCreate(RoomBase):
    """Schema for creating a new room.

    Kế thừa từ RoomBase, yêu cầu các trường bắt buộc.
    Hỗ trợ thêm utilities (tiện ích) và photos (ảnh phòng dạng base64).
    """
    
    # Danh sách tên tiện ích (Điều hoà, Bếp, Giường, TV, Ban công, Cửa sổ, Tủ lạnh, Tiền rác)
    utilities: Optional[List[str]] = Field(default_factory=list, description="Danh sách tiện ích")
    
    # Danh sách ảnh phòng dạng base64
    photos: Optional[List[RoomPhotoInput]] = Field(
        default_factory=list, 
        description="Danh sách ảnh phòng: [{'image_base64': 'data:image/png;base64,...', 'is_primary': true, 'sort_order': 0}]"
    )
    
    @validator('utilities')
    def validate_utilities(cls, v):
        """Validate danh sách utilities không rỗng và hợp lệ."""
        if v:
            # Trim whitespace
            return [utility.strip() for utility in v if utility.strip()]
        return []
    
    @validator('photos')
    def validate_photos(cls, v):
        """Validate danh sách photos."""
        if v:
            validated = []
            for idx, photo in enumerate(v):
                if isinstance(photo, dict) and 'image_base64' in photo:
                    validated.append({
                        'image_base64': photo['image_base64'],
                        'is_primary': photo.get('is_primary', idx == 0),  # First photo is primary by default
                        'sort_order': photo.get('sort_order', idx)
                    })
            return validated
        return []


class RoomUpdate(BaseModel):
    """Schema for updating an existing room.

    Tất cả các trường đều optional để hỗ trợ partial update.
    Hỗ trợ cập nhật utilities và photos.
    """

    building_id: Optional[uuid.UUID] = None
    room_number: Optional[str] = Field(None, min_length=1, max_length=20)
    room_name: Optional[str] = Field(None, max_length=100)
    area: Optional[float] = Field(None, gt=0)
    capacity: Optional[int] = Field(None, ge=1)
    base_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    electricity_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    water_price_per_person: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    deposit_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    status: Optional[str] = None
    description: Optional[str] = None
    
    # Update utilities và photos
    utilities: Optional[List[str]] = Field(None, description="Danh sách tiện ích (replace toàn bộ)")
    photo_urls: Optional[List[str]] = Field(None, description="Danh sách URL ảnh (replace toàn bộ)")
    
    @validator('utilities')
    def validate_utilities(cls, v):
        """Validate danh sách utilities."""
        if v is not None:
            return [utility.strip() for utility in v if utility.strip()]
        return None
    
    @validator('photo_urls')
    def validate_photo_urls(cls, v):
        """Validate danh sách photo URLs."""
        if v is not None:
            return [url.strip() for url in v if url.strip()]
        return None

    model_config = {"from_attributes": True}


class RoomOut(RoomBase):
    """Schema returned by the API for Room resources.

    Bao gồm metadata như id và timestamps.
    """

    id: uuid.UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class RoomDetailOut(BaseModel):
    """Schema for Room detail with utilities and photos.
    
    Dùng cho API get room detail, bao gồm utilities và photos.
    """
    
    id: uuid.UUID
    building_id: uuid.UUID
    room_number: str
    room_name: Optional[str] = None
    area: Optional[float] = None
    capacity: int
    base_price: Decimal
    electricity_price: Optional[Decimal] = None
    water_price_per_person: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    status: str
    description: Optional[str] = None
    
    # Utilities và photos
    utilities: List[str] = Field(default_factory=list, description="Danh sách tiện ích")
    photo_urls: List[str] = Field(default_factory=list, description="Danh sách URL ảnh")
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class RoomListItem(BaseModel):
    """Schema for Room list item - Admin view (chủ nhà).
    
    Dùng cho API list rooms của admin, bao gồm thông tin đầy đủ.
    """
    
    id: uuid.UUID
    room_number: str
    building_name: str  # Tên tòa nhà từ relationship
    area: Optional[float] = None
    capacity: int
    current_occupants: int = 0  # Số người đang ở (từ contract active)
    status: str
    base_price: Decimal
    representative: Optional[str] = None  # Tên người đại diện (từ contract)
    
    model_config = {"from_attributes": True}


class RoomPublicListItem(BaseModel):
    """Schema for Room list item - Public view (khách thuê/khách vãng lai).
    
    Chỉ hiển thị thông tin cần thiết: ảnh đại diện, giá, địa chỉ, trạng thái trống.
    Sắp xếp theo thời gian tạo (mới nhất trước).
    """
    
    id: uuid.UUID
    room_number: str
    room_name: Optional[str] = None
    building_name: str  # Tên tòa nhà
    full_address: str  # Địa chỉ đầy đủ (address_line, ward, city)
    base_price: Decimal
    area: Optional[float] = None
    capacity: int
    is_available: bool = Field(..., description="Phòng còn trống không")
    primary_photo: Optional[str] = Field(None, description="Ảnh đại diện (URL hoặc base64)")
    created_at: datetime = Field(..., description="Thời gian tạo phòng")
    
    model_config = {"from_attributes": True}


class RoomPublicDetail(BaseModel):
    """Schema for Room detail - Public view (cho khách hàng/người thuê).
    
    Chỉ hiển thị thông tin cơ bản, không hiển thị thông tin người thuê.
    Trả về tất cả ảnh của phòng.
    """
    
    id: uuid.UUID
    building_id: uuid.UUID
    building_name: str  # Tên tòa nhà
    room_number: str
    room_name: Optional[str] = None
    area: Optional[float] = None
    capacity: int
    base_price: Decimal
    electricity_price: Optional[Decimal] = None
    water_price_per_person: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    status: str
    description: Optional[str] = None
    
    # Thông tin trạng thái
    is_available: bool = Field(..., description="Phòng còn trống không")
    current_occupants: int = Field(..., description="Số người đang ở")
    
    # Utilities và photos
    utilities: List[str] = Field(default_factory=list, description="Danh sách tiện ích")
    photos: List[RoomPhotoOut] = Field(default_factory=list, description="Tất cả ảnh của phòng")
    
    model_config = {"from_attributes": True}


class TenantInfo(BaseModel):
    """Thông tin người thuê - chỉ admin mới thấy."""
    
    tenant_id: uuid.UUID
    tenant_name: str
    tenant_email: str
    tenant_phone: Optional[str] = None
    contract_id: uuid.UUID
    contract_start_date: datetime
    contract_end_date: datetime
    
    model_config = {"from_attributes": True}


class RoomAdminDetail(BaseModel):
    """Schema for Room detail - Admin view (cho chủ nhà).
    
    Hiển thị đầy đủ thông tin bao gồm thông tin người thuê.
    Trả về tất cả ảnh của phòng.
    """
    
    id: uuid.UUID
    building_id: uuid.UUID
    building_name: str  # Tên tòa nhà
    room_number: str
    room_name: Optional[str] = None
    area: Optional[float] = None
    capacity: int
    base_price: Decimal
    electricity_price: Optional[Decimal] = None
    water_price_per_person: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    status: str
    description: Optional[str] = None
    
    # Thông tin trạng thái
    is_available: bool = Field(..., description="Phòng còn trống không")
    current_occupants: int = Field(..., description="Số người đang ở")
    
    # Utilities và photos
    utilities: List[str] = Field(default_factory=list, description="Danh sách tiện ích")
    photos: List[RoomPhotoOut] = Field(default_factory=list, description="Tất cả ảnh của phòng")
    
    # Thông tin người thuê (chỉ admin)
    tenant_info: Optional[TenantInfo] = Field(None, description="Thông tin người thuê hiện tại")
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class RoomSearchParams(BaseModel):
    """Schema for room search parameters."""
    
    building_id: Optional[uuid.UUID] = None
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    min_area: Optional[float] = Field(None, gt=0)
    max_area: Optional[float] = Field(None, gt=0)
    capacity: Optional[int] = Field(None, ge=1)
    status: Optional[str] = None
    utilities: Optional[List[str]] = Field(None, description="Tìm phòng có các tiện ích này")

