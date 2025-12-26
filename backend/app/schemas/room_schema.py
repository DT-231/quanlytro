"""Room schemas cho hệ thống quản lý phòng trọ.

Pydantic schemas cho Room entity - dùng cho validation và serialization.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, validator, model_validator
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal
import uuid

from app.core.Enum.roomEnum import RoomStatus
from app.schemas.room_photo_schema import RoomPhotoInput, RoomPhotoOut
from app.schemas.room_type_schema import RoomTypeSimple


class RoomServiceFeeItem(BaseModel):
    """Schema for room default service fee item.
    
    Dùng để định nghĩa các loại phí dịch vụ mặc định của phòng.
    Hỗ trợ cả format {name, amount} và {name, price} từ frontend.
    """
    name: str = Field(..., description="Tên dịch vụ (Internet, Parking, Vệ sinh, ...)")
    amount: Decimal = Field(default=0, ge=0, description="Giá dịch vụ (VNĐ/tháng)")
    description: Optional[str] = Field(None, description="Mô tả thêm")
    
    @model_validator(mode='before')
    @classmethod
    def normalize_price_to_amount(cls, data: Any) -> Any:
        """Chuyển đổi 'price' thành 'amount' nếu frontend gửi 'price'."""
        if isinstance(data, dict):
            # Nếu có 'price' mà không có 'amount', dùng 'price'
            if 'price' in data and 'amount' not in data:
                data['amount'] = data.pop('price')
        return data
    
    model_config = {"from_attributes": True}


class RoomBase(BaseModel):
    """Base schema for Room shared properties.

    Chứa các trường cơ bản của phòng trọ.
    """

    building_id: uuid.UUID
    room_type_id: Optional[uuid.UUID] = Field(None, description="ID loại phòng")
    room_number: str = Field(..., min_length=1, max_length=20)
    room_name: Optional[str] = Field(None, max_length=100)
    area: Optional[float] = Field(None, gt=0)
    capacity: int = Field(default=1, ge=1)
    base_price: Decimal = Field(..., ge=0, decimal_places=2)
    electricity_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    water_price_per_person: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    deposit_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    
    # Phí dịch vụ mặc định của phòng (hỗ trợ cả tên extra_costs từ frontend)
    default_service_fees: Optional[List[RoomServiceFeeItem]] = Field(
        default_factory=list,
        description="Phí dịch vụ mặc định: [{\"name\": \"Internet\", \"amount\": 100000}]"
    )
    
    status: str = Field(default=RoomStatus.AVAILABLE.value)
    description: Optional[str] = None
    
    @model_validator(mode='before')
    @classmethod
    def normalize_extra_costs(cls, data: Any) -> Any:
        """Chuyển đổi 'extra_costs' thành 'default_service_fees' nếu frontend gửi tên cũ."""
        if isinstance(data, dict):
            # Nếu có 'extra_costs' mà không có 'default_service_fees', dùng 'extra_costs'
            if 'extra_costs' in data and 'default_service_fees' not in data:
                data['default_service_fees'] = data.pop('extra_costs')
        return data

    model_config = {"from_attributes": True}


class RoomCreate(RoomBase):
    """Schema for creating a new room.

    Kế thừa từ RoomBase, yêu cầu các trường bắt buộc.
    Hỗ trợ thêm utilities (tiện ích) và photos (ảnh phòng dạng base64).
    """

    # Danh sách tên tiện ích (Điều hoà, Bếp, Giường, TV, Ban công, Cửa sổ, Tủ lạnh, Tiền rác)
    utilities: Optional[List[str]] = Field(
        default_factory=list, description="Danh sách tiện ích"
    )

    # Danh sách ảnh phòng dạng base64
    photos: Optional[List[RoomPhotoInput]] = Field(
        default_factory=list,
        description="Danh sách ảnh phòng: [{'image_base64': 'data:image/png;base64,...', 'is_primary': true, 'sort_order': 0}]",
    )

    @validator("utilities")
    def validate_utilities(cls, v):
        """Validate danh sách utilities không rỗng và hợp lệ."""
        if v:
            # Trim whitespace
            return [utility.strip() for utility in v if utility.strip()]
        return []

    @validator("photos")
    def validate_photos(cls, v):
        """Validate danh sách photos.

        Xử lý cả dict và RoomPhotoInput Pydantic object.
        """
        if not v:
            return []

        validated = []
        for idx, photo in enumerate(v):
            # Xử lý dict
            if isinstance(photo, dict):
                image_base64 = photo.get("image_base64")
                if image_base64:
                    validated.append(
                        RoomPhotoInput(
                            image_base64=image_base64,
                            is_primary=photo.get("is_primary", idx == 0),
                            sort_order=photo.get("sort_order", idx),
                        )
                    )
            # Xử lý RoomPhotoInput object (đã parse sẵn)
            elif isinstance(photo, RoomPhotoInput):
                validated.append(photo)

        return validated


class RoomUpdate(BaseModel):
    """Schema for updating an existing room.

    Tất cả các trường đều optional để hỗ trợ partial update.
    Hỗ trợ cập nhật utilities và photos.
    """

    building_id: Optional[uuid.UUID] = None
    room_type_id: Optional[uuid.UUID] = None
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

    # Update utilities và service fees
    utilities: Optional[List[str]] = Field(
        None, description="Danh sách tiện ích (replace toàn bộ)"
    )
    default_service_fees: Optional[List[RoomServiceFeeItem]] = Field(
        None, description="Phí dịch vụ mặc định (replace toàn bộ)"
    )
    
    # Photo management - hỗ trợ giữ ảnh cũ + thêm ảnh mới
    photo_urls: Optional[List[str]] = Field(
        None, description="[DEPRECATED] Danh sách URL ảnh (replace toàn bộ)"
    )
    keep_photo_ids: Optional[List[uuid.UUID]] = Field(
        None, description="Danh sách ID ảnh cũ cần giữ lại"
    )
    new_photos: Optional[List[RoomPhotoInput]] = Field(
        None, description="Danh sách ảnh mới dạng base64: [{'image_base64': 'data:image/...', 'is_primary': false}]"
    )
    
    @model_validator(mode='before')
    @classmethod
    def normalize_extra_costs(cls, data: Any) -> Any:
        """Chuyển đổi 'extra_costs' thành 'default_service_fees' nếu frontend gửi tên cũ."""
        if isinstance(data, dict):
            if 'extra_costs' in data and 'default_service_fees' not in data:
                data['default_service_fees'] = data.pop('extra_costs')
        return data

    @validator("utilities")
    def validate_utilities(cls, v):
        """Validate danh sách utilities."""
        if v is not None:
            return [utility.strip() for utility in v if utility.strip()]
        return None

    @validator("photo_urls")
    def validate_photo_urls(cls, v):
        """Validate danh sách photo URLs."""
        if v is not None:
            return [url.strip() for url in v if url.strip()]
        return None
    
    @validator("new_photos")
    def validate_new_photos(cls, v):
        """Validate danh sách ảnh mới."""
        if not v:
            return None
        
        validated = []
        for idx, photo in enumerate(v):
            if isinstance(photo, dict):
                image_base64 = photo.get("image_base64")
                if image_base64:
                    validated.append(
                        RoomPhotoInput(
                            image_base64=image_base64,
                            is_primary=photo.get("is_primary", False),
                            sort_order=photo.get("sort_order", idx),
                        )
                    )
            elif isinstance(photo, RoomPhotoInput):
                validated.append(photo)
        
        return validated if validated else None

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
    room_type_id: Optional[uuid.UUID] = None
    room_type: Optional[RoomTypeSimple] = Field(
        None, description="Thông tin loại phòng"
    )
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
    room_name: Optional[str] = Field(None, description="Tên phòng")
    room_type: Optional[str] = Field(None, description="Tên loại phòng")
    building_name: str  # Tên tòa nhà từ relationship
    area: Optional[float] = None
    capacity: int
    current_occupants: int = 0  # Số người đang ở (từ contract active)
    status: str
    base_price: Decimal
    description: Optional[str] = Field(None, description="Mô tả phòng")
    representative: Optional[str] = None  # Tên người đại diện (từ contract)

    model_config = {"from_attributes": True}


class RoomPublicListItem(BaseModel):
    """Schema for Room list item - Public view (khách thuê/khách vãng lai).

    Hiển thị thông tin cần thiết: ảnh đại diện, giá, địa chỉ, trạng thái trống.
    Sắp xếp theo thời gian tạo (mới nhất trước).
    """

    id: uuid.UUID
    room_number: str
    room_name: Optional[str] = None
    room_type: Optional[RoomTypeSimple] = Field(
        None, description="Thông tin loại phòng"
    )
    building_name: str  # Tên tòa nhà
    full_address: str  # Địa chỉ đầy đủ (address_line, ward, city)
    base_price: Decimal
    area: Optional[float] = None
    capacity: int
    description:Optional[str] = None
    current_occupants: int = Field(0, description="Số người đang ở trong phòng")
    is_available: bool = Field(..., description="Phòng còn trống không (chưa full)")
    primary_photo: Optional[str] = Field(
        None, description="Ảnh đại diện (URL hoặc base64)"
    )
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
    full_address: str  # Địa chỉ đầy đủ
    room_number: str
    room_name: Optional[str] = None
    room_type: Optional[RoomTypeSimple] = Field(
        None, description="Thông tin loại phòng"
    )
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
    photos: List[RoomPhotoOut] = Field(
        default_factory=list, description="Tất cả ảnh của phòng"
    )
    
    # Phí dịch vụ mặc định
    default_service_fees: List[RoomServiceFeeItem] = Field(
        default_factory=list, description="Phí dịch vụ mặc định của phòng"
    )

    model_config = {"from_attributes": True, "json_encoders": {Decimal: str}}


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
    full_address: str  # Địa chỉ đầy đủ
    room_number: str
    room_name: Optional[str] = None
    room_type: Optional[RoomTypeSimple] = Field(
        None, description="Thông tin loại phòng"
    )
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
    photos: List[RoomPhotoOut] = Field(
        default_factory=list, description="Tất cả ảnh của phòng"
    )
    
    # Phí dịch vụ mặc định (admin mới thấy)
    default_service_fees: List[RoomServiceFeeItem] = Field(
        default_factory=list, description="Phí dịch vụ mặc định của phòng"
    )

    # Thông tin người thuê (chỉ admin)
    tenants: List[TenantInfo] = Field(
        default_factory=list, description="Danh sách người thuê hiện tại trong phòng"
    )

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True, "json_encoders": {Decimal: str}}


class RoomSearchParams(BaseModel):
    """Schema for room search parameters."""

    building_id: Optional[uuid.UUID] = None
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    min_area: Optional[float] = Field(None, gt=0)
    max_area: Optional[float] = Field(None, gt=0)
    capacity: Optional[int] = Field(None, ge=1)
    status: Optional[str] = None
    utilities: Optional[List[str]] = Field(
        None, description="Tìm phòng có các tiện ích này"
    )
