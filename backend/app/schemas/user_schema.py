from __future__ import annotations
import email

from pydantic import BaseModel, Field, EmailStr, model_validator
from typing import Optional
from datetime import date, datetime
import uuid

from app.core.Enum.userEnum import UserStatus


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
    """

    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    role_id : uuid.UUID
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @model_validator(mode="after")
    def check_passwords(self):
        if self.password != self.confirm_password:
            raise ValueError("password and confirm_password do not match")
        return self

    model_config = {"from_attributes": True}


class UserCreate(UserBase):
    """Schema for creating a new user.

    Password is required here. Role is also required for new users in this
    project (models mark `role_id` non-nullable), so we keep it required.
    """

    # Simplified create schema: require a name, email or phone, password + confirm, and role
    # Email or phone: at least one must be provided. Confirm password must match.
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
    role_id: uuid.UUID = Field(None)

    from pydantic import model_validator

    @model_validator(mode="after")
    def check_contact_and_passwords(self):
        # 'self' is a model instance in v2; perform cross-field validation
        if not (self.email or self.phone):
            raise ValueError("Either email or phone must be provided")
        if self.password != self.confirm_password:
            raise ValueError("password and confirm_password do not match")
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


class UserOut(UserBase):
    """Schema returned by the API for User resources.

    This excludes the password field but includes metadata like id and
    timestamps so routers can directly return ORM objects.
    """

    id: uuid.UUID
    # created_at: Optional[datetime] = None
    # updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
