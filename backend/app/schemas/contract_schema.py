"""Contract schemas cho API validation và serialization.

Định nghĩa Pydantic schemas cho Contract entity theo clean architecture:
- ContractBase: Các trường chung
- ContractCreate: Input cho tạo mới hợp đồng
- ContractUpdate: Input cho cập nhật hợp đồng (partial)
- ContractOut: Output chi tiết hợp đồng
- ContractListItem: Output cho danh sách hợp đồng (với thông tin tòa nhà, phòng, khách hàng)
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator
from app.core.Enum.contractEnum import ContractStatus


class ServiceFeeItem(BaseModel):
    """Schema cho một khoản phí dịch vụ."""
    name: str = Field(..., description="Tên dịch vụ (Internet, Parking, Vệ sinh, ...)")
    amount: Decimal = Field(..., ge=0, description="Giá dịch vụ (VNĐ/tháng)")
    description: Optional[str] = Field(None, description="Mô tả thêm (nếu có)")


class ContractBase(BaseModel):
    """Schema base chung cho Contract."""
    
    room_id: UUID = Field(..., description="ID của phòng thuê")
    tenant_id: UUID = Field(..., description="ID của khách hàng thuê")
    start_date: date = Field(..., description="Ngày bắt đầu hợp đồng")
    end_date: date = Field(..., description="Ngày kết thúc hợp đồng")
    rental_price: Decimal = Field(..., gt=0, description="Giá thuê (VNĐ/Tháng)")
    deposit_amount: Decimal = Field(..., ge=0, description="Tiền đặt cọc (VNĐ)")
    payment_day: Optional[int] = Field(default=15, ge=1, le=31, description="Ngày thanh toán hàng tháng (1-31)")
    number_of_tenants: int = Field(default=1, ge=1, description="Số người ở")
    
    # Thông tin điều khoản và ghi chú
    terms_and_conditions: Optional[str] = Field(default=None, description="Điều khoản hợp đồng")
    notes: Optional[str] = Field(default=None, description="Ghi chú")
    
    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, v: date, info) -> date:
        """Validate end_date phải sau start_date."""
        start = info.data.get("start_date")
        if start and v <= start:
            raise ValueError("Ngày kết thúc phải sau ngày bắt đầu")
        return v


class ContractCreate(ContractBase):
    """Schema cho tạo mới hợp đồng.
    
    Gửi từ form "Thêm hợp đồng" với các trường:
    - Tên khách hàng (tenant_id)
    - Mã hợp đồng (sẽ tự sinh hoặc nhập)
    - Phòng (room_id)
    - Tòa nhà (tự động lấy từ room)
    - Ngày bắt đầu, ngày kết thúc
    - Giá thuê, tiền cọc
    - Chu kỳ thanh toán (3 tháng, 6 tháng, 1 năm)
    - Ngày thanh toán (15)
    - Giá điện, giá nước
    - Điều khoản
    - Phí dịch vụ (array)
    """
    
    contract_number: Optional[str] = Field(default=None, description="Mã hợp đồng (tự sinh nếu không nhập)")
    status: Optional[str] = Field(default="ACTIVE", description="Trạng thái hợp đồng: ACTIVE (mặc định), PENDING (chờ kích hoạt)")
    
    # Thông tin thanh toán chi tiết
    payment_cycle_months: Optional[int] = Field(default=1, ge=1, le=12, description="Chu kỳ thanh toán (tháng)")
    electricity_price: Optional[Decimal] = Field(default=0, ge=0, description="Giá điện (VNĐ/kWh)")
    water_price: Optional[Decimal] = Field(default=0, ge=0, description="Giá nước (VNĐ/m³)")
    
    # Phí dịch vứ (Internet, Parking, Vệ sinh, Thang máy, ...)
    service_fees: Optional[list[ServiceFeeItem]] = Field(
        default_factory=list, 
        description="Danh sách phí dịch vụ: [{'name': 'Internet', 'amount': 100000}, {'name': 'Parking', 'amount': 50000}]"
    )


class ContractUpdate(BaseModel):
    """Schema cho cập nhật hợp đồng (partial update).
    
    Tất cả các trường đều optional để hỗ trợ partial update.
    """
    
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    rental_price: Optional[Decimal] = Field(default=None, gt=0)
    deposit_amount: Optional[Decimal] = Field(default=None, ge=0)
    payment_day: Optional[int] = Field(default=None, ge=1, le=31)
    number_of_tenants: Optional[int] = Field(default=None, ge=1)
    status: Optional[str] = Field(default=None, description="Trạng thái hợp đồng")
    terms_and_conditions: Optional[str] = None
    notes: Optional[str] = None
    
    payment_cycle_months: Optional[int] = Field(default=None, ge=1, le=12)
    electricity_price: Optional[Decimal] = Field(default=None, ge=0)
    water_price: Optional[Decimal] = Field(default=None, ge=0)
    
    @model_validator(mode="after")
    def validate_dates(self):
        """Validate end_date phải sau start_date khi cả hai đều có."""
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValueError("Ngày kết thúc phải sau ngày bắt đầu")
        return self


class ContractOut(BaseModel):
    """Schema output chi tiết cho một hợp đồng.
    
    Trả về đầy đủ thông tin hợp đồng khi get detail hoặc sau khi create/update.
    """
    
    id: UUID  # Primary key (UUIDv7) từ BaseModel
    contract_number: str
    
    # Thông tin phòng và khách hàng
    room_id: UUID
    tenant_id: UUID
    
    # Thông tin thời gian
    start_date: date
    end_date: date
    
    # Thông tin tài chính
    rental_price: Decimal
    deposit_amount: Decimal
    payment_day: Optional[int]
    number_of_tenants: int
    
    # Trạng thái và ghi chú
    status: str
    terms_and_conditions: Optional[str]
    notes: Optional[str]
    
    # Thông tin thanh toán chi tiết
    payment_cycle_months: Optional[int] = None
    electricity_price: Optional[Decimal] = None
    water_price: Optional[Decimal] = None
    service_fees: Optional[list[ServiceFeeItem]] = Field(default_factory=list)
    
    # Metadata
    created_by: Optional[UUID]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    
    @field_validator("service_fees", mode="before")
    @classmethod
    def parse_service_fees(cls, v):
        """Convert JSON từ database thành list[ServiceFeeItem]."""
        if v is None:
            return []
        if isinstance(v, str):
            import json
            v = json.loads(v)
        if isinstance(v, list):
            return [ServiceFeeItem(**item) if isinstance(item, dict) else item for item in v]
        return v
    
    model_config = {
        "from_attributes": True  # Cho phép convert từ ORM model
    }


class ContractListItem(BaseModel):
    """Schema output cho danh sách hợp đồng.
    
    Hiển thị trong bảng với các cột:
    - Mã hợp đồng
    - Phòng
    - Tên khách hàng
    - Tòa nhà
    - Thời hạn (Từ - Đến)
    - Giá thuê
    - Trạng thái
    - Thao tác
    """
    
    # Thông tin cơ bản
    id: UUID
    contract_number: str  # Mã hợp đồng: HD01, HD02...
    room_number: str  # Phòng: A101, B202, 111, 118...
    tenant_name: str  # Tên khách hàng: Phan Mạnh Quỳnh, Lâm Minh Phú...
    building_name: str  # Tòa nhà: Chung cư Hoàng Anh Gia Lai, VinHome quận 7...
    
    # Thời hạn
    start_date: date  # Từ: 15/02/2025
    end_date: date  # Đến: 14/12/2025
    
    # Giá thuê
    rental_price: Decimal  # 2.000.000đ
    
    # Trạng thái
    status: str  # Đã hết hạn (red), Đang hoạt động (green), Sắp hết hạn (yellow)
    
    # Metadata để filter/sort
    created_at: Optional[datetime]
    
    model_config = {
        "from_attributes": True
    }
