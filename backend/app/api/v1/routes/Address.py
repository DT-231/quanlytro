"""Address Router - RESTful API endpoints cho quản lý địa chỉ.

Các endpoint tuân thủ REST conventions:
- GET /addresses - Lấy danh sách địa chỉ
- POST /addresses - Tạo địa chỉ mới
- GET /addresses/{address_id} - Xem chi tiết địa chỉ
- PUT /addresses/{address_id} - Cập nhật địa chỉ
- DELETE /addresses/{address_id} - Xóa địa chỉ
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.infrastructure.db.session import get_db
from app.schemas.address_schema import AddressCreate, AddressUpdate
from app.services.AddressService import AddressService
from app.core import response
from app.schemas.response_schema import Response
from app.core.exceptions import (
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    UnauthorizedException,
    ConflictException,
    InternalServerException,
)

router = APIRouter(prefix="/addresses", tags=["Address Management"])


@router.get(
    "",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách địa chỉ",
    description="Lấy danh sách địa chỉ với filter và pagination",
)
def list_addresses(
    city: Optional[str] = Query("", description="Lọc theo thành phố"),
    page: int = Query(0, ge=0, description="Vị trí bắt đầu"),
    per_page: int = Query(20, ge=1, le=100, description="Số lượng tối đa (max 100)"),
    db: Session = Depends(get_db),
):
    """Lấy danh sách địa chỉ với các filter options.

    Query params:
    - city: Tên thành phố (optional, hỗ trợ tìm kiếm gần đúng)
    - offset: Vị trí bắt đầu (default 0)
    - limit: Số lượng tối đa (default 20, max 100)

    Returns:
    - items: Danh sách địa chỉ
    - total: Tổng số địa chỉ
    - offset: Vị trí bắt đầu
    - limit: Số lượng tối đa
    """
    try:
        address_service = AddressService(db)
        result = address_service.list_addresses(
            city=city,
            offset=page,
            limit=per_page,
        )
        return response.success(data=result, message="Lấy danh sách địa chỉ thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.post(
    "",
    response_model=Response[dict],
    status_code=status.HTTP_201_CREATED,
    summary="Tạo địa chỉ mới",
    description="Tạo địa chỉ mới trong hệ thống",
)
def create_address(
    address_data: AddressCreate,
    db: Session = Depends(get_db),
):
    """Tạo địa chỉ mới.

    Business rules:
    - address_line, ward, city không được để trống
    - full_address sẽ được tự động tạo nếu không cung cấp

    Args:
        address_data: Thông tin địa chỉ cần tạo

    Returns:
        Address instance vừa được tạo
    """
    try:
        address_service = AddressService(db)
        address = address_service.create_address(address_data)
        return response.created(data=address, message="Tạo địa chỉ thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.get(
    "/{address_id}",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    summary="Xem chi tiết địa chỉ",
    description="Lấy thông tin chi tiết của một địa chỉ",
)
def get_address(
    address_id: UUID,
    db: Session = Depends(get_db),
):
    """Xem chi tiết địa chỉ theo ID.

    Args:
        address_id: UUID của địa chỉ cần xem

    Returns:
        Address instance với đầy đủ thông tin
    """
    try:
        print("address_id : ", address_id)
        address_service = AddressService(db)
        address = address_service.get_address(address_id)
        return response.success(
            data=address, message="Lấy thông tin địa chỉ thành công"
        )
    except ValueError as e:
        raise NotFoundException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.put(
    "/{address_id}",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    summary="Cập nhật địa chỉ",
    description="Cập nhật thông tin địa chỉ (partial update)",
)
def update_address(
    address_id: UUID,
    address_data: AddressUpdate,
    db: Session = Depends(get_db),
):
    """Cập nhật thông tin địa chỉ.

    Hỗ trợ partial update - chỉ cần gửi các field muốn thay đổi.

    Business rules:
    - Các trường được update không được để trống
    - full_address sẽ được tự động tạo lại nếu có thay đổi

    Args:
        address_id: UUID của địa chỉ cần update
        address_data: Dữ liệu cập nhật (các field optional)

    Returns:
        Address instance đã được cập nhật
    """
    try:
        address_service = AddressService(db)
        address = address_service.update_address(address_id, address_data)
        return response.success(data=address, message="Cập nhật địa chỉ thành công")
    except ValueError as e:
        error_msg = str(e).lower()
        if "không tìm thấy" in error_msg or "not found" in error_msg:
            raise NotFoundException(message=str(e))
        else:
            raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.delete(
    "/{address_id}",
    response_model=Response,
    status_code=status.HTTP_200_OK,
    summary="Xóa địa chỉ",
    description="Xóa địa chỉ khỏi hệ thống",
)
def delete_address(
    address_id: UUID,
    db: Session = Depends(get_db),
):
    """Xóa địa chỉ.

    Business rules:
    - Không xóa được địa chỉ đang được sử dụng bởi tòa nhà

    Args:
        address_id: UUID của địa chỉ cần xóa

    Returns:
        Success message
    """
    try:
        address_service = AddressService(db)
        address_service.delete_address(address_id)
        return response.success(message="Xóa địa chỉ thành công")
    except ValueError as e:
        error_msg = str(e).lower()
        if "không tìm thấy" in error_msg or "not found" in error_msg:
            raise NotFoundException(message=str(e))
        else:
            raise ConflictException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")
