from __future__ import annotations
import email

from pydantic import BaseModel, Field, EmailStr, model_validator
from typing import Optional
from datetime import date, datetime
import uuid

from app.core.Enum.userEnum import UserStatus


class RoleOut(BaseModel):
    """Schema for Role information in user responses."""
    role_code: str
    role_name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class UserBase(BaseModel):
    """Base schema for User shared properties.

    This schema is used as the foundation for create/update/out schemas.
    It intentionally does not include sensitive fields like `password`.
    """

    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=13)
    cccd: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: str = Field(default="Nam", description="Giới tính: 'Nam' hoặc 'Nữ'")
    hometown: Optional[str] = Field(None, max_length=255, description="Quê quán")
    role_id: Optional[uuid.UUID] = None
    status: str = Field(default=UserStatus.ACTIVE.value)
    is_temporary_residence: Optional[bool] = False
    temporary_residence_date: Optional[date] = None

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    """Schema for user login payload (email + password)."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    model_config = {"from_attributes": True}


class UserRegister(BaseModel):
    """Schema for user registration (minimal public fields).

    This schema is intentionally small and only includes the fields
    required for the public registration endpoint so the OpenAPI
    request body doesn't expose internal or optional properties.
    
    Validation được xử lý thủ công trong endpoint để có control tốt hơn về error response.
    """

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None  # Dùng str thay vì EmailStr để tự validate
    gender: str = Field(default="Nam", description="Giới tính: 'Nam' hoặc 'Nữ'")
    role_id: Optional[uuid.UUID] = None
    password: Optional[str] = None
    confirm_password: Optional[str] = None

    model_config = {"from_attributes": True}


class UserCreate(UserBase):
    """Schema for creating a new user by Admin.

    Dùng khi Admin tạo tài khoản cho người thuê/khách hàng.
    Không cần confirm_password vì Admin tạo trực tiếp.
    """

    password: str = Field(..., min_length=8, max_length=16)
    role_id: uuid.UUID = Field(None)

    @model_validator(mode="after")
    def check_contact(self):
        """Validate ít nhất một trong email hoặc phone phải có."""
        if not (self.email or self.phone):
            raise ValueError("Either email or phone must be provided")
        return self


class UserUpdate(BaseModel):
    """Schema for updating an existing user.

    All fields are optional; the service layer should apply `exclude_unset`
    when applying updates to the ORM model.
    """

    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    email: Optional[EmailStr]
    phone: Optional[str] = Field(None, max_length=13)
    cccd: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    role_id: Optional[uuid.UUID] = None
    status: Optional[str] = None
    is_temporary_residence: Optional[bool] = None
    temporary_residence_date: Optional[date] = None

    model_config = {"from_attributes": True}



class UserOut(BaseModel):
    """Schema returned by the API for User resources.

    This excludes the password field and role_id, but includes role object.
    """

    id: uuid.UUID
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    cccd: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = "Nam"
    hometown: Optional[str] = None
    status: str
    is_temporary_residence: Optional[bool] = False
    temporary_residence_date: Optional[date] = None
    role_name: Optional[str] = None  # Role name thay vì role object
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }
    
    # @classmethod
    # def model_validate(cls, obj, **kwargs):
    #     """Custom validation to extract role_name from role relationship."""
    #     if hasattr(obj, 'role') and obj.role:
    #         data = {
    #             'id': obj.id,
    #             'first_name': obj.first_name,
    #             'last_name': obj.last_name,
    #             'email': obj.email,
    #             'phone': obj.phone,
    #             'cccd': obj.cccd,
    #             'date_of_birth': obj.date_of_birth,
    #             'status': obj.status,
    #             'is_temporary_residence': obj.is_temporary_residence,
    #             'temporary_residence_date': obj.temporary_residence_date,
    #             'role_name': obj.role.role_name,  # Extract role_name from role
    #             'created_at': obj.created_at,
    #             'updated_at': obj.updated_at,
    #         }
    #         return cls(**data)
    #     return super().model_validate(obj, **kwargs)


class UserListItem(BaseModel):
    """Schema cho danh sách người thuê trong dashboard admin.
    
    Hiển thị thông tin cơ bản để quản lý.
    """
    id: uuid.UUID
    code: str  # Mã người thuê (101, 110, 220...)
    full_name: str  # Tên đầy đủ
    phone: Optional[str] = None
    email: EmailStr
    gender: Optional[str] = None  # "Nam" hoặc "Nữ"
    district: Optional[str] = None  # Quê quán
    status: str  # "ACTIVE", "INACTIVE"
    role_name: Optional[str] = None  # Tên role: "TENANT", "CUSTOMER"
    
    model_config = {"from_attributes": True}


class UserStats(BaseModel):
    """Schema thống kê tổng quan người thuê."""
    total_tenants: int = 0  # Tổng người thuê
    active_tenants: int = 0  # Đang thuê
    returned_rooms: int = 0  # Đã trả phòng
    not_rented: int = 0  # Chưa thuê
    
    model_config = {"from_attributes": True}
