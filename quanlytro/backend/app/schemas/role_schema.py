"""Role schemas - Pydantic models cho Role validation và serialization.

Schemas phục vụ cho API trả về danh sách roles để làm bộ lọc.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from uuid import UUID


class RoleOut(BaseModel):
    """Schema cho response trả về role.
    
    Attributes:
        id: UUID của role
        role_code: Mã role (ADMIN, TENANT, CUSTOMER)
        role_name: Tên role tiếng Anh (Administrator, Tenant, Customer)
        display_name: Tên hiển thị tiếng Việt (Chủ trọ, Người thuê, Khách)
    """
    id: UUID
    role_code: str = Field(..., description="Mã role để filter")
    role_name: str = Field(..., description="Tên role tiếng Anh")
    display_name: str | None = Field(None, description="Tên hiển thị tiếng Việt")
    
    model_config = {
        "from_attributes": True  # Cho phép convert từ ORM model
    }
