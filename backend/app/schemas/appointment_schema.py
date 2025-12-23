"""Schemas cho Appointment (Đặt lịch xem phòng)."""

from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, validator
VN_TZ = timezone(timedelta(hours=7))

class AppointmentCreate(BaseModel):
    """Schema để tạo lịch hẹn xem phòng mới."""
    full_name: str = Field(..., min_length=2, max_length=100, description="Họ và tên người đặt lịch")
    phone: str = Field(..., min_length=10, max_length=20, description="Số điện thoại liên hệ")
    email: Optional[EmailStr] = Field(None, description="Email (không bắt buộc)")
    room_id: UUID = Field(..., description="ID của phòng muốn xem")
    appointment_datetime: datetime = Field(..., description="Thời gian muốn xem phòng")
    notes: Optional[str] = Field(None, max_length=500, description="Ghi chú thêm")

    @validator('appointment_datetime')
    def validate_future_date(cls, v):
        now_vn = datetime.now(VN_TZ)

        # convert thời gian client về VN
        v_vn = v.astimezone(VN_TZ)

        if v_vn < now_vn:
            raise ValueError("Thời gian đặt lịch phải trong tương lai (giờ Việt Nam)")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "Nguyễn Văn A",
                "phone": "0912345678",
                "email": "nguyenvana@example.com",
                "room_id": "123e4567-e89b-12d3-a456-426614174000",
                "appointment_datetime": "2024-12-25T14:00:00",
                "notes": "Tôi muốn xem phòng vào buổi chiều"
            }
        }


class AppointmentUpdate(BaseModel):
    """Schema để cập nhật lịch hẹn (dành cho admin)."""
    status: Optional[str] = Field(None, description="Trạng thái: PENDING, CONFIRMED, CANCELLED, COMPLETED, REJECTED")
    admin_notes: Optional[str] = Field(None, max_length=500, description="Ghi chú của admin")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "CONFIRMED",
                "admin_notes": "Đã xác nhận lịch hẹn, vui lòng đến đúng giờ"
            }
        }


class AppointmentResponse(BaseModel):
    """Schema response cho appointment."""
    id: UUID
    full_name: str
    phone: str
    email: Optional[str]
    room_id: UUID
    appointment_datetime: datetime
    notes: Optional[str]
    status: str
    handled_by: Optional[UUID]
    handled_at: Optional[datetime]
    admin_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AppointmentListResponse(BaseModel):
    """Schema response cho danh sách appointments."""
    id: UUID
    full_name: str
    phone: str
    email: Optional[str]
    room_id: UUID
    room_number: Optional[str] = None  # Sẽ join từ Room
    building_name: Optional[str] = None  # Sẽ join từ Building
    appointment_datetime: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
