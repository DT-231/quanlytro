"""Payment schemas cho API requests/responses."""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class PaymentMethodEnum(str, Enum):
    """Payment method types."""
    BANKING = "banking"
    COD = "cod"
    OTHER = "other"


class PaymentStatusEnum(str, Enum):
    """Payment status types."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# ============= Request Schemas =============

class PaymentCreatePayOSRequest(BaseModel):
    """Request để tạo thanh toán qua PayOS (banking)."""
    invoice_id: UUID = Field(..., description="ID của hóa đơn cần thanh toán")
    
    class Config:
        json_schema_extra = {
            "example": {
                "invoice_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }


class PaymentConfirmCODRequest(BaseModel):
    """Request để xác nhận thanh toán COD (chủ nhà nhấn)."""
    payment_id: UUID = Field(..., description="ID của payment cần xác nhận")
    note: Optional[str] = Field(None, description="Ghi chú khi xác nhận")
    
    class Config:
        json_schema_extra = {
            "example": {
                "payment_id": "123e4567-e89b-12d3-a456-426614174000",
                "note": "Đã nhận tiền mặt từ khách"
            }
        }


class PaymentCODRequest(BaseModel):
    """Request để tạo payment COD (người thuê chọn COD)."""
    invoice_id: UUID = Field(..., description="ID của hóa đơn cần thanh toán")
    cod_receiver_name: str = Field(..., min_length=1, max_length=200, description="Tên người nhận tiền")
    cod_receiver_phone: str = Field(..., min_length=10, max_length=20, description="SĐT người nhận")
    note: Optional[str] = Field(None, description="Ghi chú")
    
    @field_validator('cod_receiver_phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate phone number."""
        # Remove spaces and dashes
        phone = v.replace(' ', '').replace('-', '')
        if not phone.isdigit():
            raise ValueError('Phone number must contain only digits')
        if len(phone) < 10:
            raise ValueError('Phone number must be at least 10 digits')
        return phone
    
    class Config:
        json_schema_extra = {
            "example": {
                "invoice_id": "123e4567-e89b-12d3-a456-426614174000",
                "cod_receiver_name": "Nguyễn Văn A",
                "cod_receiver_phone": "0912345678",
                "note": "Giao tiền buổi chiều"
            }
        }


# ============= Response Schemas =============

class PaymentResponse(BaseModel):
    """Response schema cho payment."""
    id: UUID
    payment_id: UUID
    invoice_id: UUID
    payer_id: Optional[UUID]
    amount: Decimal
    method: PaymentMethodEnum
    status: PaymentStatusEnum
    
    # Banking fields
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    banking_transaction_id: Optional[str] = None
    
    # COD fields
    cod_receiver_name: Optional[str] = None
    cod_receiver_phone: Optional[str] = None
    
    # Common fields
    paid_at: Optional[datetime] = None
    proof_url: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "payment_id": "123e4567-e89b-12d3-a456-426614174001",
                "invoice_id": "123e4567-e89b-12d3-a456-426614174002",
                "payer_id": "123e4567-e89b-12d3-a456-426614174003",
                "amount": "1500000.00",
                "method": "banking",
                "status": "completed",
                "bank_name": "Vietcombank",
                "banking_transaction_id": "FT123456789",
                "paid_at": "2024-01-15T10:30:00Z",
                "created_at": "2024-01-15T10:00:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            }
        }


class PayOSPaymentLinkResponse(BaseModel):
    """Response khi tạo payment link PayOS thành công."""
    payment_id: UUID = Field(..., description="ID của payment record")
    payos_order_id: int = Field(..., description="Order ID từ PayOS")
    checkout_url: str = Field(..., description="URL để checkout (QR code)")
    qr_code: str = Field(..., description="QR code data URL")
    amount: Decimal = Field(..., description="Số tiền thanh toán")
    description: str = Field(..., description="Mô tả giao dịch")
    
    class Config:
        json_schema_extra = {
            "example": {
                "payment_id": "123e4567-e89b-12d3-a456-426614174000",
                "payos_order_id": 123456,
                "checkout_url": "https://payos.vn/checkout/...",
                "qr_code": "https://img.vietqr.io/...",
                "amount": "1500000.00",
                "description": "Thanh toan hoa don P101-202401"
            }
        }


class PaymentListResponse(BaseModel):
    """Response cho danh sách payments."""
    payments: list[PaymentResponse]
    total: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "payments": [],
                "total": 0
            }
        }


# ============= Webhook Schemas =============

class PayOSWebhookData(BaseModel):
    """PayOS webhook data structure."""
    orderCode: int
    amount: int
    description: str
    accountNumber: Optional[str] = None
    reference: Optional[str] = None
    transactionDateTime: str
    currency: str = "VND"
    paymentLinkId: str
    code: str  # "00" = success
    desc: str
    counterAccountBankId: Optional[str] = None
    counterAccountBankName: Optional[str] = None
    counterAccountName: Optional[str] = None
    counterAccountNumber: Optional[str] = None
    virtualAccountName: Optional[str] = None
    virtualAccountNumber: Optional[str] = None


class PayOSWebhookRequest(BaseModel):
    """PayOS webhook request structure."""
    data: PayOSWebhookData
    signature: str
