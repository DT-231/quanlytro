"""Building Router - RESTful API endpoints cho quản lý tòa nhà.

Các endpoint tuân thủ REST conventions:
- GET /buildings - Lấy danh sách tòa nhà
- POST /buildings - Tạo tòa nhà mới
- GET /buildings/{building_id} - Xem chi tiết tòa nhà
- PUT /buildings/{building_id} - Cập nhật tòa nhà
- DELETE /buildings/{building_id} - Xóa tòa nhà
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.infrastructure.db.session import get_db
from app.schemas.building_schema import BuildingCreate, BuildingUpdate, BuildingOut, BuildingListItem
from app.services.BuildingService import BuildingService
from app.core import response
from app.schemas.response_schema import Response

router = APIRouter(prefix="/buildings", tags=["Building Management"])


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tòa nhà với thống kê phòng",
    description="Lấy danh sách tòa nhà kèm thông tin tổng số phòng, phòng trống, phòng đang thuê",
    responses={
        200: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "Lấy danh sách tòa nhà thành công",
                        "data": {
                            "items": [
                                {
                                    "id": "123e4567-e89b-12d3-a456-426614174000",
                                    "building_code": "BLD-001",
                                    "building_name": "Chung cư Hoàng Anh",
                                    "address_line": "72 Hàm Nghi, Đà Nẵng",
                                    "total_rooms": 15,
                                    "available_rooms": 1,
                                    "rented_rooms": 14,
                                    "status": "ACTIVE",
                                    "created_at": "2025-02-10T10:30:00"
                                }
                            ],
                            "total": 10,
                            "offset": 0,
                            "limit": 20
                        }
                    }
                }
            }
        }
    }
)
def list_buildings(
    address_id: Optional[UUID] = Query(None, description="Lọc theo địa chỉ"),
    building_status: Optional[str] = Query(None, description="Lọc theo trạng thái (ACTIVE, INACTIVE, SUSPENDED)", alias="status"),
    offset: int = Query(0, ge=0, description="Vị trí bắt đầu"),
    limit: int = Query(20, ge=1, le=100, description="Số lượng tối đa (max 100)"),
    db: Session = Depends(get_db),
):
    """Lấy danh sách tòa nhà với thống kê phòng.
    
    Query params:
    - address_id: UUID của địa chỉ (optional)
    - status: Trạng thái tòa nhà (ACTIVE, INACTIVE, SUSPENDED)
    - offset: Vị trí bắt đầu (default 0)
    - limit: Số lượng tối đa (default 20, max 100)
    
    Response format:
    {
        "code": 200,
        "message": "success",
        "data": {
            "items": [
                {
                    "id": "uuid",
                    "building_code": "BLD-001",
                    "building_name": "Chung cư hoàng anh",
                    "address_line": "72 Hàm nghi, Đà Nẵng",
                    "total_rooms": 15,
                    "available_rooms": 1,
                    "rented_rooms": 14,
                    "status": "ACTIVE",
                    "created_at": "2025-02-10T..."
                }
            ],
            "total": 10,
            "offset": 0,
            "limit": 20
        }
    }
    """
    try:
        building_service = BuildingService(db)
        result = building_service.list_buildings(
            address_id=address_id,
            status=building_status,
            offset=offset,
            limit=limit,
        )
        return response.success(data=result, message="Lấy danh sách tòa nhà thành công")
    except ValueError as e:
        return response.bad_request(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Tạo tòa nhà mới",
    description="Tạo tòa nhà mới trong hệ thống",
)
def create_building(
    building_data: BuildingCreate,
    db: Session = Depends(get_db),
):
    """Tạo tòa nhà mới.
    
    Business rules:
    - building_code phải unique
    - address_id phải tồn tại trong hệ thống
    - Status phải hợp lệ (ACTIVE, INACTIVE, SUSPENDED)
    - building_name không được rỗng
    
    Args:
        building_data: Thông tin tòa nhà cần tạo
    
    Returns:
        Building instance vừa được tạo
    """
    try:
        building_service = BuildingService(db)
        building = building_service.create_building(building_data)
        return response.created( message="Tạo tòa nhà thành công")
    except ValueError as e:
        # Business rule violations
        return response.conflict(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")


@router.get(
    "/{building_id}",
    status_code=status.HTTP_200_OK,
    summary="Xem chi tiết tòa nhà",
    description="Lấy thông tin chi tiết của một tòa nhà",
)
def get_building(
    building_id: UUID,
    db: Session = Depends(get_db),
):
    """Xem chi tiết tòa nhà theo ID.
    
    Args:
        building_id: UUID của tòa nhà cần xem
    
    Returns:
        Building instance với đầy đủ thông tin
    """
    try:
        building_service = BuildingService(db)
        building = building_service.get_building(building_id)
        return response.success(data=building, message="Lấy thông tin tòa nhà thành công")
    except ValueError as e:
        return response.not_found(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")


@router.put(
    "/{building_id}",
    status_code=status.HTTP_200_OK,
    summary="Cập nhật tòa nhà",
    description="Cập nhật thông tin tòa nhà (partial update)",
)
def update_building(
    building_id: UUID,
    building_data: BuildingUpdate,
    db: Session = Depends(get_db),
):
    """Cập nhật thông tin tòa nhà.
    
    Hỗ trợ partial update - chỉ cần gửi các field muốn thay đổi.
    
    Business rules:
    - Không được update sang building_code đã tồn tại
    - address_id phải tồn tại nếu được update
    - Status phải hợp lệ nếu được update
    
    Args:
        building_id: UUID của tòa nhà cần update
        building_data: Dữ liệu cập nhật (các field optional)
    
    Returns:
        Building instance đã được cập nhật
    """
    try:
        building_service = BuildingService(db)
        building = building_service.update_building(building_id, building_data)
        return response.success(data=building, message="Cập nhật tòa nhà thành công")
    except ValueError as e:
        error_msg = str(e).lower()
        if "không tìm thấy" in error_msg or "not found" in error_msg:
            return response.not_found(message=str(e))
        else:
            return response.bad_request(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")


@router.delete(
    "/{building_id}",
    status_code=status.HTTP_200_OK,
    summary="Xóa tòa nhà",
    description="Xóa tòa nhà khỏi hệ thống",
)
def delete_building(
    building_id: UUID,
    db: Session = Depends(get_db),
):
    """Xóa tòa nhà.
    
    Business rules:
    - Không xóa được tòa nhà đang có phòng
    
    Args:
        building_id: UUID của tòa nhà cần xóa
    
    Returns:
        Success message
    """
    try:
        building_service = BuildingService(db)
        building_service.delete_building(building_id)
        return response.success(message="Xóa tòa nhà thành công")
    except ValueError as e:
        error_msg = str(e).lower()
        if "không tìm thấy" in error_msg or "not found" in error_msg:
            return response.not_found(message=str(e))
        else:
            return response.conflict(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")

