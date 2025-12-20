from __future__ import annotations

from typing import Generic, Optional, TypeVar, Any, List
from pydantic import BaseModel, Field, ConfigDict
from pydantic.generics import GenericModel

T = TypeVar("T")


class Response(GenericModel, Generic[T]):
    """Standard API response wrapper.

    Fields:
    - success: boolean indicating success or failure
    - message: short message describing the result
    - data: payload which can be an object or an array
    """

    success: bool = Field(..., description="Success flag", examples=[True])
    message: str = Field(..., description="Response message", examples=["success"])
    data: Optional[T] = Field(default=None, description="Response payload")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "success": True,
                    "message": "success",
                    "data": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "name": "Sample Name",
                        "status": "ACTIVE"
                    }
                }
            ]
        }
    )


class PaginationMeta(BaseModel):
    """Metadata cho pagination response.
    
    Chứa thông tin về phân trang: tổng số items, trang hiện tại, kích thước trang, tổng số trang.
    """
    totalItems: int = Field(..., description="Tổng số items", examples=[100])
    page: int = Field(..., description="Trang hiện tại (bắt đầu từ 1)", examples=[1])
    pageSize: int = Field(..., description="Số items mỗi trang", examples=[20])
    totalPages: int = Field(..., description="Tổng số trang", examples=[5])

    model_config = ConfigDict(from_attributes=True)


class PaginatedData(BaseModel, Generic[T]):
    """Paginated response data wrapper.
    
    Dùng cho list endpoints có pagination với cấu trúc chuẩn:
    - items: Danh sách items
    - pagination: Metadata về phân trang
    """
    items: List[T] = Field(..., description="Danh sách items")
    pagination: PaginationMeta = Field(..., description="Thông tin phân trang")

    model_config = ConfigDict(from_attributes=True)


class PaginatedDataLegacy(BaseModel, Generic[T]):
    """Legacy paginated response (dùng offset/limit).
    
    Deprecated: Sử dụng PaginatedData thay thế.
    """
    items: List[T] = Field(..., description="List of items")
    total: int = Field(..., description="Total number of items", examples=[100])
    offset: int = Field(..., description="Current offset", examples=[0])
    limit: int = Field(..., description="Items per page", examples=[20])

    model_config = ConfigDict(from_attributes=True)
