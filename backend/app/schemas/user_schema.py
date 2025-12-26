from __future__ import annotations
import email

from pydantic import BaseModel, Field, EmailStr, model_validator, field_validator
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
    Hỗ trợ upload ảnh CCCD qua base64 khi tạo.
    """

    password: str = Field(..., min_length=8, max_length=16)
    role_id: uuid.UUID = Field(None)
    
    # Upload ảnh CCCD qua base64 (optional khi tạo)
    avatar: Optional[str] = Field(None, description="Ảnh đại diện (base64 string)")
    cccd_front: Optional[str] = Field(None, description="Ảnh CCCD mặt trước (base64 string)")
    cccd_back: Optional[str] = Field(None, description="Ảnh CCCD mặt sau (base64 string)")

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
    
    Bao gồm cả upload ảnh qua base64:
    - avatar: Ảnh đại diện
    - cccd_front: Ảnh CCCD mặt trước
    - cccd_back: Ảnh CCCD mặt sau
    """

    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=13)
    cccd: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    role_id: Optional[uuid.UUID] = None
    status: Optional[str] = None
    is_temporary_residence: Optional[bool] = None
    temporary_residence_date: Optional[date] = None
    
    # Upload ảnh qua base64
    avatar: Optional[str] = Field(None, description="Ảnh đại diện (base64 string)")
    cccd_front: Optional[str] = Field(None, description="Ảnh CCCD mặt trước (base64 string)")
    cccd_back: Optional[str] = Field(None, description="Ảnh CCCD mặt sau (base64 string)")

    model_config = {"from_attributes": True}



class UserOut(BaseModel):
    """Schema returned by the API for User resources.

    This excludes the password field and role_id, but includes role object.
    Bao gồm cả documents (avatar, CCCD) của user.
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
    documents: Optional[list[dict]] = []  # Danh sách tài liệu (avatar, CCCD)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def extract_role_info(cls, data):
        """Extract role_name from role relationship."""
        if isinstance(data, dict):
            # Already a dict, check for role
            if 'role' in data and data['role']:
                role = data['role']
                if hasattr(role, 'role_name'):
                    data['role_name'] = role.role_name
                elif isinstance(role, dict) and 'role_name' in role:
                    data['role_name'] = role['role_name']
        else:
            # ORM object
            if hasattr(data, 'role') and data.role:
                if not hasattr(data, 'role_name') or data.role_name is None:
                    # Set role_name from relationship
                    if hasattr(data.role, 'role_name'):
                        # Create a dict to modify
                        data_dict = {
                            'id': data.id,
                            'first_name': data.first_name,
                            'last_name': data.last_name,
                            'email': data.email,
                            'phone': data.phone,
                            'cccd': data.cccd,
                            'date_of_birth': data.date_of_birth,
                            'gender': data.gender,
                            'hometown': data.hometown,
                            'status': data.status,
                            'is_temporary_residence': data.is_temporary_residence,
                            'temporary_residence_date': data.temporary_residence_date,
                            'role_name': data.role.role_name,
                            'documents': [],
                            'created_at': data.created_at,
                            'updated_at': data.updated_at,
                        }
                        return data_dict
        return data

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }
    
    


class UserListItem(BaseModel):
    """Schema cho danh sách người thuê trong dashboard admin.
    
    Hiển thị thông tin cơ bản để quản lý.
    """
    id: uuid.UUID
    code: str  # Mã người thuê (101, 110, 220...)
    full_name: str  # Tên đầy đủ
    phone: Optional[str] = None
    email: EmailStr
    cccd: Optional[str] = None  # Số CCCD/CMND
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


class UserDocumentUpload(BaseModel):
    """Schema upload tài liệu qua base64.
    
    Frontend gửi ảnh dạng base64 string.
    """
    avatar: Optional[str] = Field(None, description="Ảnh đại diện (base64)")
    cccd_front: Optional[str] = Field(None, description="Ảnh CCCD mặt trước (base64)")
    cccd_back: Optional[str] = Field(None, description="Ảnh CCCD mặt sau (base64)")

