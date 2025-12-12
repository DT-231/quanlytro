"""Room Router - RESTful API endpoints cho quản lý phòng.

Các endpoint tuân thủ REST conventions:
- GET /rooms - Lấy danh sách phòng
- POST /rooms - Tạo phòng mới
- GET /rooms/{room_id} - Xem chi tiết phòng
- PUT /rooms/{room_id} - Cập nhật phòng
- DELETE /rooms/{room_id} - Xóa phòng
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.infrastructure.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.room_schema import (
    RoomCreate,
    RoomUpdate,
    RoomOut,
    RoomListItem,
    RoomDetailOut,
    RoomPublicDetail,
    RoomAdminDetail,
    RoomPublicListItem,
)
from app.services.RoomService import RoomService
from app.core import response
from app.schemas.response_schema import Response
from decimal import Decimal

router = APIRouter(prefix="/rooms", tags=["Room Management"])


@router.get(
    "/public",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách phòng công khai (không cần đăng nhập)",
    description="Danh sách phòng cho khách thuê/khách vãng lai: ảnh đại diện, giá, địa chỉ, trạng thái. Sắp xếp mới nhất trước.",
    responses={
        200: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "Lấy danh sách phòng thành công",
                        "data": {
                            "items": [
                                {
                                    "id": "uuid",
                                    "room_number": "A101",
                                    "room_name": "Studio Premium",
                                    "building_name": "Chung cư Hoàng Anh",
                                    "full_address": "123 Đường ABC, Phường XYZ, Đà Nẵng",
                                    "base_price": 5000000,
                                    "area": 35.0,
                                    "capacity": 2,
                                    "is_available": True,
                                    "primary_photo": "data:image/png;base64,...",
                                    "created_at": "2025-01-23T10:30:00"
                                }
                            ],
                            "total": 50,
                            "offset": 0,
                            "limit": 10
                        }
                    }
                }
            }
        }
    }
)
def list_rooms_public(
    building_id: Optional[UUID] = Query(None, description="Lọc theo tòa nhà"),
    offset: int = Query(0, ge=0, description="Vị trí bắt đầu"),
    limit: int = Query(10, ge=1, le=20, description="Số lượng (default 10, max 20)"),
    db: Session = Depends(get_db),
    # Không có current_user - API công khai
):
    """Lấy danh sách phòng công khai cho khách thuê/khách vãng lai.
    
    Hiển thị:
    - Ảnh đại diện (primary_photo)
    - Giá phòng (base_price)
    - Địa chỉ đầy đủ (full_address)
    - Trạng thái còn trống (is_available)
    - Sắp xếp theo thời gian tạo (mới nhất trước)
    - Mỗi lần trả về 10 phòng (default)
    
    Query params:
    - building_id: Lọc theo tòa nhà (optional)
    - offset: Vị trí bắt đầu (default 0)
    - limit: Số lượng (default 10, max 20)
    """
    try:
        room_service = RoomService(db)
        result = room_service.list_rooms_public(
            building_id=building_id,
            offset=offset,
            limit=limit,
        )
        return response.success(data=result, message="Lấy danh sách phòng thành công")
    except ValueError as e:
        return response.bad_request(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")


@router.get(
    "",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách phòng đầy đủ (Admin - Chủ nhà)",
    description="Danh sách phòng cho admin với thông tin đầy đủ: người thuê, số người ở, trạng thái",
    responses={
        200: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "Lấy danh sách phòng thành công",
                        "data": {
                            "items": [
                                {
                                    "id": "123e4567-e89b-12d3-a456-426614174000",
                                    "room_number": "101",
                                    "building_name": "Chung cư Hoàng Anh",
                                    "area": 50.0,
                                    "capacity": 4,
                                    "current_occupants": 2,
                                    "status": "OCCUPIED",
                                    "base_price": 7000000,
                                    "representative": "Phan Mạnh Quỳnh",
                                }
                            ],
                            "total": 50,
                            "offset": 0,
                            "limit": 20,
                        },
                    }
                }
            },
        }
    },
)
def list_rooms_admin(
    building_id: Optional[UUID] = Query(None, description="Lọc theo tòa nhà"),
    room_status: Optional[str] = Query(
        None, description="Lọc theo trạng thái phòng", alias="status"
    ),
    offset: int = Query(0, ge=0, description="Vị trí bắt đầu"),
    limit: int = Query(20, ge=1, le=100, description="Số lượng tối đa (max 100)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy danh sách phòng đầy đủ cho Admin (chủ nhà).

    Query params:
    - building_id: UUID của tòa nhà (optional)
    - status: Trạng thái phòng (AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED)
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
                    "room_number": "101",
                    "building_name": "Chung cư hoàng anh",
                    "area": 50.0,
                    "capacity": 4,
                    "current_occupants": 2,
                    "status": "OCCUPIED",
                    "base_price": 7000000,
                    "representative": "Phan Mạnh Quỳnh"
                }
            ],
            "total": 50,
            "offset": 0,
            "limit": 20
        }
    }
    """
    try:
        # Kiểm tra role (chỉ ADMIN mới dùng được endpoint này)
        user_role = current_user.role.role_code if current_user.role else "CUSTOMER"
        if user_role != "ADMIN":
            return response.forbidden(message="Chỉ chủ nhà mới có quyền xem danh sách đầy đủ")
        
        room_service = RoomService(db)
        result = room_service.list_rooms(
            building_id=building_id,
            status=room_status,
            offset=offset,
            limit=limit,
        )
        return response.success(data=result, message="Lấy danh sách phòng thành công")
    except ValueError as e:
        return response.bad_request(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")


@router.post(
    "",
    # response_model=Response[RoomDetailOut],
    status_code=status.HTTP_201_CREATED,
    summary="Tạo phòng mới với utilities và photos",
    description="Tạo phòng mới bao gồm thông tin cơ bản, tiện ích và ảnh phòng",
    responses={
        201: {
            "description": "Room created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "code": 201,
                        "message": "Tạo phòng thành công",
                        "data": {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "room_number": "101",
                            "building_id": "223e4567-e89b-12d3-a456-426614174001",
                            "room_type": "STUDIO",
                            "area": 30.5,
                            "capacity": 2,
                            "description": "Phòng studio hiện đại",
                            "status": "AVAILABLE",
                            "base_price": 5000000,
                            "deposit_amount": 10000000,
                            "electricity_cost": 3500,
                            "water_cost": 20000,
                            "utilities": ["Điều hoà", "Bếp", "Giường"],
                            "photo": [
                                {
                                    "image_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
                                    "is_primary": True, #True là ảnh đại diện cho phòng đó 
                                    "sort_order": 0,
                                },
                                {
                                    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...",
                                    "is_primary": False,
                                    "sort_order": 1,
                                },
                            ],
                        },
                    }
                }
            },
        }
    },
)
def create_room(
    room_data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # TODO: Uncomment khi có auth
):
    """Tạo phòng mới với đầy đủ thông tin.

    **Tab 1 - Thông tin**:
    - Phòng, Trạng thái, Toà, Loại, Diện tích, Tối đa người, Mô tả
    - Tiện ích: ["Điều hoà", "Bếp", "Giường", "TV", "Ban công", "Cửa sổ"]

    **Tab 2 - Ảnh phòng**:
    - Danh sách URL ảnh: ["url1", "url2", ...]

    **Tab 3 - Tiền**:
    - Giá thuê, Giá cọc, Tiền điện, Tiền nước

    Business rules:
    - Số phòng phải unique trong cùng tòa nhà
    - Giá thuê phải > 0
    - Status phải hợp lệ (AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED)

    Returns:
        RoomDetailOut với utilities và photo_urls
    """
    try:
        room_service = RoomService(db)
        # TODO: Thay None bằng current_user.id khi có auth
        room_service.create_room(room_data, user_id=current_user.id)
        return response.created(message="Tạo phòng thành công")
    except ValueError as e:
        # Business rule violations
        return response.conflict(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")


@router.get(
    "/{room_id}",
    status_code=status.HTTP_200_OK,
    summary="Xem chi tiết phòng theo role",
    description="Admin: Xem đầy đủ thông tin + người thuê. Khác: Chỉ xem thông tin cơ bản",
    responses={
        200: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "Lấy thông tin phòng thành công",
                        "data": {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "room_number": "101",
                            "building_name": "Chung cư Hoàng Anh",
                            "area": 30.5,
                            "capacity": 2,
                            "is_available": False,
                            "current_occupants": 1,
                            "base_price": 5000000,
                            "utilities": ["Điều hoà", "Bếp"],
                            "tenant_info": {
                                "tenant_name": "Nguyễn Văn A",
                                "tenant_email": "a@example.com"
                            }
                        },
                    }
                }
            },
        },
        404: {
            "description": "Room not found",
            "content": {
                "application/json": {
                    "example": {
                        "code": 404,
                        "message": "Không tìm thấy phòng",
                        "data": {},
                    }
                }
            },
        },
    },
)
def get_room(
    room_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Xem chi tiết phòng theo role.

    - Admin (ADMIN): Thấy đầy đủ thông tin + thông tin người thuê
    - Tenant/Customer: Chỉ thấy thông tin cơ bản, không thấy người thuê

    Args:
        room_id: UUID của phòng cần xem
        current_user: User hiện tại (từ token)

    Returns:
        RoomAdminDetail (nếu admin) hoặc RoomPublicDetail (nếu không)
    """
    try:
        room_service = RoomService(db)
        # Lấy role code từ user
        user_role = current_user.role.role_code if current_user.role else "CUSTOMER"
        room = room_service.get_room_detail_by_role(room_id, user_role)
        return response.success(data=room, message="Lấy thông tin phòng thành công")
    except ValueError as e:
        return response.not_found(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")


@router.put(
    "/{room_id}",
    response_model=Response[RoomDetailOut],
    status_code=status.HTTP_200_OK,
    summary="Cập nhật phòng với utilities và photos",
    description="Cập nhật thông tin phòng bao gồm tiện ích và ảnh (partial update)",
    responses={
        200: {
            "description": "Room updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "Cập nhật phòng thành công",
                        "data": {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "room_number": "101",
                            "building_id": "223e4567-e89b-12d3-a456-426614174001",
                            "room_type": "STUDIO",
                            "area": 30.5,
                            "capacity": 2,
                            "description": "Phòng studio hiện đại - Đã cập nhật",
                            "status": "AVAILABLE",
                            "base_price": 5500000,
                            "deposit_amount": 11000000,
                            "electricity_cost": 3500,
                            "water_cost": 20000,
                            "utilities": [
                                "Điều hoà",
                                "Bếp",
                                "Giường",
                                "TV",
                                "Ban công",
                            ],
                            "photo_urls": ["https://example.com/new_photo1.jpg"],
                        },
                    }
                }
            },
        },
        404: {
            "description": "Room not found",
            "content": {
                "application/json": {
                    "example": {
                        "code": 404,
                        "message": "Không tìm thấy phòng",
                        "data": {},
                    }
                }
            },
        },
    },
)
def update_room(
    room_id: UUID,
    room_data: RoomUpdate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Uncomment khi có auth
):
    """Cập nhật thông tin phòng với đầy đủ thông tin.

    Hỗ trợ partial update - chỉ cần gửi các field muốn thay đổi.

    **Cập nhật Utilities**:
    - Gửi `utilities: ["Điều hoà", "Bếp"]` → thay thế toàn bộ utilities cũ
    - Không gửi `utilities` → giữ nguyên utilities hiện tại
    - Gửi `utilities: []` → xóa tất cả utilities

    **Cập nhật Photos**:
    - Gửi `photo_urls: ["url1", "url2"]` → thay thế toàn bộ photos cũ
    - Không gửi `photo_urls` → giữ nguyên photos hiện tại
    - Gửi `photo_urls: []` → xóa tất cả photos

    Business rules:
    - Không được update sang số phòng đã tồn tại
    - Giá thuê phải > 0 nếu được update
    - Status phải hợp lệ nếu được update

    Args:
        room_id: UUID của phòng cần update
        room_data: Dữ liệu cập nhật (các field optional)

    Returns:
        RoomDetailOut đã được cập nhật với utilities và photo_urls
    """
    try:
        room_service = RoomService(db)
        # TODO: Thay None bằng current_user.id khi có auth
        room = room_service.update_room(room_id, room_data, user_id=None)
        return response.success(data=room, message="Cập nhật phòng thành công")
    except ValueError as e:
        # Có thể là not found hoặc business rule violation
        error_msg = str(e).lower()
        if "không tìm thấy" in error_msg or "not found" in error_msg:
            return response.not_found(message=str(e))
        else:
            return response.bad_request(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")


@router.delete(
    "/{room_id}",
    response_model=Response,
    status_code=status.HTTP_200_OK,
    summary="Xóa phòng",
    description="Xóa phòng khỏi hệ thống",
    responses={
        200: {
            "description": "Room deleted successfully",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "Xóa phòng thành công",
                        "data": {},
                    }
                }
            },
        },
        404: {
            "description": "Room not found",
            "content": {
                "application/json": {
                    "example": {
                        "code": 404,
                        "message": "Không tìm thấy phòng",
                        "data": {},
                    }
                }
            },
        },
    },
)
def delete_room(
    room_id: UUID,
    db: Session = Depends(get_db),
):
    """Xóa phòng.

    Business rules:
    - Không xóa được phòng đang có hợp đồng active (có thể thêm sau)

    Args:
        room_id: UUID của phòng cần xóa

    Returns:
        Success message
    """
    try:
        room_service = RoomService(db)
        room_service.delete_room(room_id)
        return response.success(message="Xóa phòng thành công")
    except ValueError as e:
        return response.not_found(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")


@router.get(
    "/search/advanced",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    summary="Tìm kiếm phòng nâng cao (Công khai - không cần đăng nhập)",
    description="Tìm kiếm phòng với nhiều điều kiện: giá, diện tích, sức chứa, tiện ích. API công khai cho khách vãng lai.",
    responses={
        200: {
            "description": "Search successful",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "Tìm kiếm phòng thành công",
                        "data": {
                            "items": [
                                {
                                    "id": "uuid",
                                    "room_number": "101",
                                    "building_name": "Chung cư Hoàng Anh",
                                    "area": 35.0,
                                    "capacity": 2,
                                    "current_occupants": 0,
                                    "status": "AVAILABLE",
                                    "base_price": 5000000,
                                    "representative": None
                                }
                            ],
                            "total": 15,
                            "offset": 0,
                            "limit": 20
                        }
                    }
                }
            }
        }
    }
)
def search_rooms(
    building_id: Optional[UUID] = Query(None, description="Lọc theo tòa nhà"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Giá tối thiểu"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Giá tối đa"),
    min_area: Optional[float] = Query(None, gt=0, description="Diện tích tối thiểu (m²)"),
    max_area: Optional[float] = Query(None, gt=0, description="Diện tích tối đa (m²)"),
    capacity: Optional[int] = Query(None, ge=1, description="Sức chứa tối thiểu"),
    room_status: Optional[str] = Query(None, description="Trạng thái phòng", alias="status"),
    utilities: Optional[str] = Query(None, description="Tiện ích (cách nhau bởi dấu phẩy: 'Điều hoà,Bếp,TV')"),
    offset: int = Query(0, ge=0, description="Vị trí bắt đầu"),
    limit: int = Query(20, ge=1, le=100, description="Số lượng tối đa (max 100)"),
    db: Session = Depends(get_db),
    # KHÔNG có current_user = Depends(get_current_user) - API công khai
):
    """Tìm kiếm phòng nâng cao với nhiều điều kiện - API công khai cho khách vãng lai.

    Query params:
    - building_id: UUID của tòa nhà (optional)
    - min_price: Giá thuê tối thiểu (optional)
    - max_price: Giá thuê tối đa (optional)
    - min_area: Diện tích tối thiểu m² (optional)
    - max_area: Diện tích tối đa m² (optional)
    - capacity: Sức chứa tối thiểu (optional)
    - status: Trạng thái phòng (AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED)
    - utilities: Danh sách tiện ích cần có, cách nhau bởi dấu phẩy (ví dụ: "Điều hoà,Bếp,TV")
    - offset: Vị trí bắt đầu (default 0)
    - limit: Số lượng tối đa (default 20, max 100)

    Returns:
        {
            "code": 200,
            "message": "success",
            "data": {
                "items": [...],
                "total": 15,
                "offset": 0,
                "limit": 20
            }
        }
    """
    try:
        # Parse utilities từ string sang list
        utilities_list = None
        if utilities:
            utilities_list = [u.strip() for u in utilities.split(',') if u.strip()]
        
        room_service = RoomService(db)
        result = room_service.search_rooms(
            building_id=building_id,
            min_price=min_price,
            max_price=max_price,
            min_area=min_area,
            max_area=max_area,
            capacity=capacity,
            status=room_status,
            utilities=utilities_list,
            offset=offset,
            limit=limit,
        )
        return response.success(data=result, message="Tìm kiếm phòng thành công")
    except ValueError as e:
        return response.bad_request(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")

