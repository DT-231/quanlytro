"""Invoice schemas cho hệ thống quản lý phòng trọ.

Pydantic schemas cho Invoice entity - dùng cho validation và serialization.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import uuid

from app.core.Enum.invoiceEnum import InvoiceStatus


class ServiceFeeItem(BaseModel):
    """Schema for service fee item."""
    
    name: str = Field(..., description="Tên dịch vụ (Dịch vụ, Internet, Gửi xe, Khác)")
    amount: Decimal = Field(..., ge=0, description="Số tiền")
    description: Optional[str] = Field(None, description="Mô tả")
    
    model_config = {"from_attributes": True}


class InvoiceCreate(BaseModel):
    """Schema for creating invoice - Chủ nhà tạo hóa đơn."""
    
    contract_id: uuid.UUID = Field(..., description="ID hợp đồng")
    billing_month: date = Field(..., description="Tháng lập hóa đơn (YYYY-MM-01)")
    due_date: date = Field(..., description="Hạn thanh toán")
    
    # Chỉ số điện nước
    electricity_old_index: Optional[float] = Field(None, ge=0, description="Chỉ số điện cũ (kWh)")
    electricity_new_index: Optional[float] = Field(None, ge=0, description="Chỉ số điện mới (kWh)")
    number_of_people: int = Field(1, ge=1, description="Số người ở trong tháng")
    
    # Các khoản phí dịch vụ
    service_fees: Optional[List[ServiceFeeItem]] = Field(
        default_factory=list, 
        description="Danh sách phí dịch vụ: [{'name': 'Dịch vụ', 'amount': 50000}, ...]"
    )
    
    notes: Optional[str] = Field(None, description="Ghi chú")
    
    @validator('electricity_new_index')
    def validate_electricity_index(cls, v, values):
        """Chỉ số điện mới phải >= chỉ số điện cũ."""
        if v is not None and 'electricity_old_index' in values:
            old_index = values.get('electricity_old_index')
            if old_index is not None and v < old_index:
                raise ValueError("Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số điện cũ")
        return v
    
    @validator('due_date')
    def validate_due_date(cls, v, values):
        """Hạn thanh toán phải sau ngày lập hóa đơn."""
        if 'billing_month' in values:
            billing_month = values.get('billing_month')
            if billing_month and v < billing_month:
                raise ValueError("Hạn thanh toán phải sau ngày lập hóa đơn")
        return v


class InvoiceUpdate(BaseModel):
    """Schema for updating invoice - Chỉ update nếu chưa thanh toán."""
    
    billing_month: Optional[date] = None
    due_date: Optional[date] = None
    electricity_old_index: Optional[float] = Field(None, ge=0)
    electricity_new_index: Optional[float] = Field(None, ge=0)
    number_of_people: Optional[int] = Field(None, ge=1)
    service_fees: Optional[List[ServiceFeeItem]] = None
    notes: Optional[str] = None


class InvoiceOut(BaseModel):
    """Schema for invoice output - Chi tiết hóa đơn."""
    
    id: uuid.UUID
    invoice_number: str
    contract_id: uuid.UUID
    billing_month: date
    due_date: date
    status: str
    
    # Thông tin phòng và khách hàng
    room_number: str
    building_name: str
    tenant_name: str
    
    # Chi phí
    room_price: Decimal
    electricity_old_index: Optional[float] = None
    electricity_new_index: Optional[float] = None
    electricity_usage: Optional[float] = Field(None, description="Số điện tiêu thụ (kWh)")
    electricity_unit_price: Decimal
    electricity_cost: Decimal = Field(..., description="Tiền điện")
    
    number_of_people: int
    water_unit_price: Decimal
    water_cost: Decimal = Field(..., description="Tiền nước")
    
    service_fee: Decimal = Field(default=0)
    internet_fee: Decimal = Field(default=0)
    parking_fee: Decimal = Field(default=0)
    other_fees: Decimal = Field(default=0)
    other_fees_description: Optional[str] = None
    
    total_amount: Decimal = Field(..., description="Tổng tiền")
    
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class InvoiceListItem(BaseModel):
    """Schema for invoice list item - Danh sách hóa đơn."""
    
    id: uuid.UUID
    invoice_number: str
    tenant_name: str
    billing_month: date
    total_amount: Decimal
    building_name: str
    room_number: str
    due_date: date
    status: str
    created_at: datetime
    
    model_config = {"from_attributes": True}


class BuildingOption(BaseModel):
    """Schema for building dropdown options."""
    
    id: uuid.UUID
    building_name: str
    
    model_config = {"from_attributes": True}


class RoomOption(BaseModel):
    """Schema for room dropdown options."""
    
    id: uuid.UUID
    room_number: str
    tenant_name: Optional[str] = Field(None, description="Tên người thuê")
    tenant_id: Optional[uuid.UUID] = Field(None, description="ID người thuê")
    contract_id: Optional[uuid.UUID] = Field(None, description="ID hợp đồng active")
    
    model_config = {"from_attributes": True}
