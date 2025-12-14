"""Maintenance Router - API endpoints cho quản lý sự cố/bảo trì.

Router cung cấp các endpoints cho cả người thuê và admin quản lý maintenance requests.
Phân quyền rõ ràng dựa trên role.
"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core import response
from app.schemas.response_schema import Response
from app.infrastructure.db.session import get_db
from app.core.exceptions import (
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    UnauthorizedException,
    ConflictException,
    InternalServerException,
)
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.maintenance_schema import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceOut,
    MaintenanceListItem,
    MaintenanceStats,
)
from app.services.MaintenanceService import MaintenanceService

router = APIRouter(prefix="/maintenances", tags=["Maintenance Requests"])


def is_admin(current_user: User) -> bool:
    """Helper function kiểm tra user có phải admin không."""
    return current_user.role and current_user.role.role_code == "ADMIN"


@router.get(
    "/stats",
    response_model=Response[List[MaintenanceListItem]],
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "Lấy thống kê thành công",
                        "data": {
                            "total_requests": 175,
                            "pending": 70,
                            "not_processed": 100,
                            "processed": 5,
                        },
                    }
                }
            },
        },
        400: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 400,
                        "message": "Lấy thống kê thất bại",
                        "data": {},
                    }
                }
            },
        },
        401: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 401,
                        "message": "Bạn chưa đăng nhập hoặc hết phiên đăng nhập",
                        "data": {},
                    }
                }
            },
        },
    },
)
def get_maintenance_stats(
    building_id: Optional[UUID] = Query(
        None, description="Lọc theo tòa nhà (admin only)"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy thống kê tổng quan về sự cố.

    **Quyền**:
    - Admin: Xem thống kê tất cả hoặc theo building_id
    - Tenant: Xem thống kê sự cố của mình

    Returns:
        - total_requests: Tổng số sự cố
        - pending: Đang xử lý (IN_PROGRESS)
        - not_processed: Chưa xử lý (PENDING)
        - processed: Đã xử lý (COMPLETED + CANCELLED)
    """
    try:
        service = MaintenanceService(db)
        result = service.get_stats(
            user_id=current_user.id,
            is_admin=is_admin(current_user),
            building_id=building_id,
        )
        return response.success(data=result, message="Lấy thống kê thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.get(
    "",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "Lấy danh sách yêu cầu thành công",
                        "data": {
                            "items": [
                                {
                                    "id": "550e8400-e29b-41d4-a716-446655440000",
                                    "request_code": "101",
                                    "room_code": "111",
                                    "tenant_name": "Phan Mạnh Quỳnh",
                                    "request_date": "2025-02-15T10:30:00",
                                    "content": "Bóng đèn cháy",
                                    "building_name": "Chung cư hoàng anh gia lai",
                                    "status": "PENDING",
                                },
                                {
                                    "id": "550e8400-e29b-41d4-a716-446655440001",
                                    "request_code": "110",
                                    "room_code": "118",
                                    "tenant_name": "Lâm Minh Phú",
                                    "request_date": "2025-09-14T14:20:00",
                                    "content": "Cúp điện",
                                    "building_name": "Chung cư hoàng anh gia lai",
                                    "status": "IN_PROGRESS",
                                },
                            ],
                            "total": 175,
                            "offset": 0,
                            "limit": 20,
                        },
                    }
                }
            },
        }
    },
)
def get_list_maintenances(
    search: Optional[str] = Query(
        None, description="Tìm kiếm theo tên khách thuê, nội dung, mã phòng..."
    ),
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Lọc theo trạng thái: PENDING, IN_PROGRESS, COMPLETED, CANCELLED",
    ),
    priority: Optional[str] = Query(
        None, description="Lọc theo mức độ ưu tiên: LOW, MEDIUM, HIGH, URGENT"
    ),
    request_type: Optional[str] = Query(
        None, description="Lọc theo loại: PLUMBING, ELECTRICAL, AC, FURNITURE, etc."
    ),
    building_id: Optional[UUID] = Query(
        None, description="Lọc theo tòa nhà (admin only)"
    ),
    room_id: Optional[UUID] = Query(None, description="Lọc theo phòng"),
    offset: int = Query(0, ge=0, description="Vị trí bắt đầu (pagination)"),
    limit: int = Query(20, ge=1, le=100, description="Số lượng tối đa mỗi trang"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy danh sách yêu cầu sự cố với filter và pagination.

    **Quyền**:
    - Admin: Xem tất cả yêu cầu, có thể filter theo building, room
    - Tenant: Chỉ xem yêu cầu của mình

    **Filters**:
    - search: Tìm theo tên, nội dung, mã phòng
    - status: PENDING (Chưa xử lý), IN_PROGRESS (Đang xử lý), COMPLETED, CANCELLED
    - priority: LOW, MEDIUM, HIGH, URGENT
    - request_type: PLUMBING, ELECTRICAL, AC, FURNITURE, CLEANING, INTERNET, SECURITY, OTHER
    - building_id: Filter theo tòa nhà
    - room_id: Filter theo phòng

    **Response format**:
    ```json
    {
        "items": [
            {
                "id": "uuid",
                "request_code": "101",
                "room_code": "111",
                "tenant_name": "Phan Mạnh Quỳnh",
                "request_date": "2025-02-15T...",
                "content": "Bóng đèn cháy",
                "building_name": "Chung cư hoàng anh gia lai",
                "status": "PENDING"
            }
        ],
        "total": 175,
        "offset": 0,
        "limit": 20
    }
    ```
    """
    try:
        service = MaintenanceService(db)
        result = service.list_maintenances(
            user_id=current_user.id,
            is_admin=is_admin(current_user),
            search=search,
            status=status_filter,
            priority=priority,
            request_type=request_type,
            building_id=building_id,
            room_id=room_id,
            offset=offset,
            limit=limit,
        )
        return response.success(data=result, message="Lấy danh sách yêu cầu thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.post(
    "",
    response_model=Response[dict],
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "Created Successfully",
            "content": {
                "application/json": {
                    "example": {
                        "code": 201,
                        "message": "Tạo yêu cầu sự cố thành công",
                        "data": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "request_id": "650e8400-e29b-41d4-a716-446655440000",
                            "room_id": "750e8400-e29b-41d4-a716-446655440000",
                            "room_code": "101",
                            "tenant_id": "850e8400-e29b-41d4-a716-446655440000",
                            "tenant_name": "Nguyễn Văn A",
                            "request_type": "ELECTRICAL",
                            "title": "Bóng đèn cháy",
                            "description": "Bóng đèn phòng khách không sáng, cần thay thế",
                            "priority": "MEDIUM",
                            "status": "PENDING",
                            "estimated_cost": None,
                            "actual_cost": None,
                            "completed_at": None,
                            "created_at": "2025-12-13T10:30:00",
                            "updated_at": "2025-12-13T10:30:00",
                            "photos": [
                                {
                                    "id": "950e8400-e29b-41d4-a716-446655440000",
                                    "request_id": "650e8400-e29b-41d4-a716-446655440000",
                                    "url": "https://example.com/photo1.jpg",
                                    "is_before": True,
                                    "uploaded_by": "850e8400-e29b-41d4-a716-446655440000",
                                    "created_at": "2025-12-13T10:30:00",
                                }
                            ],
                        },
                    }
                }
            },
        }
    },
)
def create_maintenance(
    maintenance_data: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tạo yêu cầu sự cố mới (người thuê).

    **Quyền**: Tenant (người thuê)

    **Business rules**:
    - room_id phải tồn tại
    - Chỉ tạo cho phòng đang thuê
    - request_type: PLUMBING, ELECTRICAL, AC, FURNITURE, CLEANING, INTERNET, SECURITY, OTHER
    - priority: LOW, MEDIUM, HIGH, URGENT (mặc định: MEDIUM)
    - photos: Tối đa 5 ảnh
    - Status tự động = PENDING

    Args:
        maintenance_data: Thông tin yêu cầu sự cố

    Returns:
        Thông tin yêu cầu vừa tạo
    """
    try:
        service = MaintenanceService(db)
        result = service.create_maintenance(
            tenant_id=current_user.id,
            maintenance_data=maintenance_data,
        )
        return response.success(
            data=result,
            message="Tạo yêu cầu sự cố thành công",
            status_code=status.HTTP_201_CREATED,
        )
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.get(
    "/{maintenance_id}",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "Lấy thông tin yêu cầu thành công",
                        "data": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "request_id": "650e8400-e29b-41d4-a716-446655440000",
                            "room_id": "750e8400-e29b-41d4-a716-446655440000",
                            "room_code": "101",
                            "tenant_id": "850e8400-e29b-41d4-a716-446655440000",
                            "tenant_name": "Nguyễn Văn A",
                            "request_type": "ELECTRICAL",
                            "title": "Bóng đèn cháy",
                            "description": "Bóng đèn phòng khách không sáng, cần thay thế ngay",
                            "priority": "HIGH",
                            "status": "IN_PROGRESS",
                            "estimated_cost": 150000,
                            "actual_cost": None,
                            "completed_at": None,
                            "created_at": "2025-12-13T10:30:00",
                            "updated_at": "2025-12-13T11:00:00",
                            "photos": [
                                {
                                    "id": "950e8400-e29b-41d4-a716-446655440000",
                                    "request_id": "650e8400-e29b-41d4-a716-446655440000",
                                    "url": "https://example.com/before1.jpg",
                                    "is_before": True,
                                    "uploaded_by": "850e8400-e29b-41d4-a716-446655440000",
                                    "created_at": "2025-12-13T10:30:00",
                                },
                                {
                                    "id": "950e8400-e29b-41d4-a716-446655440001",
                                    "request_id": "650e8400-e29b-41d4-a716-446655440000",
                                    "url": "https://example.com/before2.jpg",
                                    "is_before": True,
                                    "uploaded_by": "850e8400-e29b-41d4-a716-446655440000",
                                    "created_at": "2025-12-13T10:30:00",
                                },
                            ],
                        },
                    }
                }
            },
        },
        404: {
            "description": "Not Found",
            "content": {
                "application/json": {
                    "example": {
                        "code": 404,
                        "message": "Không tìm thấy yêu cầu với ID: 550e8400-e29b-41d4-a716-446655440000",
                        "data": {},
                    }
                }
            },
        },
    },
)
def get_maintenance_detail(
    maintenance_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy thông tin chi tiết yêu cầu sự cố.

    **Quyền**:
    - Admin: Xem tất cả
    - Tenant: Chỉ xem yêu cầu của mình

    Args:
        maintenance_id: UUID của yêu cầu sự cố

    Returns:
        Thông tin chi tiết bao gồm:
        - Thông tin request đầy đủ
        - Thông tin phòng, người thuê
        - Danh sách ảnh
        - Chi phí ước tính/thực tế
        - Trạng thái, ngày hoàn thành
    """
    try:
        service = MaintenanceService(db)
        result = service.get_maintenance(
            maintenance_id=maintenance_id,
            user_id=current_user.id,
            is_admin=is_admin(current_user),
        )
        return response.success(data=result, message="Lấy thông tin yêu cầu thành công")
    except ValueError as e:
        raise NotFoundException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.put(
    "/{maintenance_id}",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "Cập nhật yêu cầu thành công",
                        "data": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "request_id": "650e8400-e29b-41d4-a716-446655440000",
                            "room_id": "750e8400-e29b-41d4-a716-446655440000",
                            "room_code": "101",
                            "tenant_id": "850e8400-e29b-41d4-a716-446655440000",
                            "tenant_name": "Nguyễn Văn A",
                            "request_type": "ELECTRICAL",
                            "title": "Bóng đèn cháy - Đã sửa",
                            "description": "Bóng đèn đã được thay thế",
                            "priority": "MEDIUM",
                            "status": "COMPLETED",
                            "estimated_cost": 150000,
                            "actual_cost": 120000,
                            "completed_at": "2025-12-13T15:30:00",
                            "created_at": "2025-12-13T10:30:00",
                            "updated_at": "2025-12-13T15:30:00",
                            "photos": [],
                        },
                    }
                }
            },
        },
        400: {
            "description": "Bad Request",
            "content": {
                "application/json": {
                    "example": {
                        "code": 400,
                        "message": "Chỉ có thể cập nhật yêu cầu khi trạng thái là 'Chưa xử lý'",
                        "data": {},
                    }
                }
            },
        },
    },
)
def update_maintenance(
    maintenance_id: UUID,
    maintenance_data: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cập nhật yêu cầu sự cố.

    **Quyền**:
    - Admin: Update tất cả field (title, description, priority, status, cost)
    - Tenant: Chỉ update title, description, priority khi status=PENDING

    **Business rules**:
    - Tenant không thể update status, estimated_cost, actual_cost
    - Tenant chỉ update được khi status=PENDING (Chưa xử lý)
    - Admin có thể update status: PENDING → IN_PROGRESS → COMPLETED/CANCELLED

    Args:
        maintenance_id: UUID của yêu cầu cần update
        maintenance_data: Dữ liệu cập nhật (các field optional)

    Returns:
        Thông tin yêu cầu đã cập nhật
    """
    try:
        service = MaintenanceService(db)
        result = service.update_maintenance(
            maintenance_id=maintenance_id,
            maintenance_data=maintenance_data,
            user_id=current_user.id,
            is_admin=is_admin(current_user),
        )
        return response.success(data=result, message="Cập nhật yêu cầu thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.delete(
    "/{maintenance_id}",
    status_code=status.HTTP_200_OK,
    response_model=Response[dict],
    responses={
        200: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "Xóa yêu cầu thành công",
                        "data": {},
                    }
                }
            },
        },
        400: {
            "description": "Bad Request",
            "content": {
                "application/json": {
                    "example": {
                        "code": 400,
                        "message": "Chỉ có thể xóa yêu cầu khi trạng thái là 'Chưa xử lý'",
                        "data": {},
                    }
                }
            },
        },
        404: {
            "description": "Not Found",
            "content": {
                "application/json": {
                    "example": {
                        "code": 404,
                        "message": "Không tìm thấy yêu cầu với ID: 550e8400-e29b-41d4-a716-446655440000",
                        "data": {},
                    }
                }
            },
        },
    },
)
def delete_maintenance(
    maintenance_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Xóa yêu cầu sự cố.

    **Quyền**:
    - Admin: Xóa tất cả (không khuyến khích, nên CANCEL)
    - Tenant: Chỉ xóa yêu cầu của mình khi status=PENDING

    **Business rules**:
    - Tenant chỉ xóa được khi status=PENDING (Chưa xử lý)
    - Admin nên CANCEL thay vì DELETE để giữ lịch sử

    Args:
        maintenance_id: UUID của yêu cầu cần xóa

    Returns:
        204 No Content nếu xóa thành công
    """
    try:
        service = MaintenanceService(db)
        service.delete_maintenance(
            maintenance_id=maintenance_id,
            user_id=current_user.id,
            is_admin=is_admin(current_user),
        )
        return response.success(message="Xóa yêu cầu thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")
