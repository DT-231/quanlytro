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
from app.core.security import get_current_user, get_current_user_optional
from app.models.user import User
from app.core.exceptions import (
    BadRequestException,
    NotFoundException,
    ConflictException,
    InternalServerException,
)
from app.schemas.room_schema import (
    RoomCreate,
    RoomUpdate,
    RoomListItem,
    RoomDetailOut,
    RoomPublicListItem,
)
from app.services.RoomService import RoomService
from app.core import response
from app.schemas.response_schema import Response
from decimal import Decimal

router = APIRouter(prefix="/rooms", tags=["Room Management"])


@router.get(
    "",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách phòng (tự động phân quyền)",
    description="""
    API thống nhất cho cả Public (khách) và Admin (chủ nhà):
    
    **Khách/Chưa đăng nhập (Public)**:
    - Xem phòng còn trống (is_available)
    - Ảnh đại diện, giá, địa chỉ
    - Limit max 20
    - Sắp xếp mới nhất trước
    
    **Admin (Chủ nhà - có token)**:
    - Xem tất cả phòng (kể cả đã thuê)
    - Thông tin đầy đủ: người thuê, số người ở
    - Filter theo status, building
    - Limit max 100
    """,
    responses={
        200: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "examples": {
                        "public": {
                            "summary": "Public response (chưa login)",
                            "value": {
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
                        },
                        "admin": {
                            "summary": "Admin response (có login)",
                            "value": {
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
                                            "representative": "Phan Mạnh Quỳnh"
                                        }
                                    ],
                                    "total": 50,
                                    "offset": 0,
                                    "limit": 20
                                }
                            }
                        }
                    }
                }
            }
        }
    }
)
def list_rooms(
    search: Optional[str] = Query(
        None, description="Tìm kiếm theo tên phòng, tên tòa nhà, tiện ích"
    ),
    building_id: Optional[UUID] = Query(None, description="Lọc theo tòa nhà"),
    city: Optional[str] = Query(None, description="Lọc theo thành phố"),
    ward: Optional[str] = Query(None, description="Lọc theo phường/quận"),
    room_status: Optional[str] = Query(
        None, description="Lọc theo trạng thái (Admin only)", alias="status"
    ),
    min_price: Optional[int] = Query(None, ge=0, description="Giá thuê tối thiểu"),
    max_price: Optional[int] = Query(None, ge=0, description="Giá thuê tối đa"),
    max_capacity: Optional[int] = Query(None, ge=1, description="Số người tối đa"),
    sort_by: Optional[str] = Query(
        None, 
        description="Sắp xếp theo (price_asc, price_desc). Mặc định: phòng mới nhất trước (created_at desc)",
        regex="^(price_asc|price_desc)$"
    ),
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
    pageSize: int = Query(20, ge=1, le=100, description="Số items mỗi trang (Public max 20, Admin max 100)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),  # Optional - không bắt buộc login
):
    """API thống nhất lấy danh sách phòng - tự động phân quyền.
    
    **Logic phân quyền tự động**:
    - Nếu KHÔNG có token (current_user = None) → Trả public view (chỉ phòng trống)
    - Nếu CÓ token + role = ADMIN → Trả admin view (tất cả phòng + filter)
    - Nếu CÓ token + role ≠ ADMIN → Trả public view
    
    **Query params**:
    - search: Tìm kiếm theo tên phòng/tòa nhà/tiện ích (all)
    - building_id: Lọc theo tòa nhà (all)
    - city: Lọc theo thành phố (all)
    - ward: Lọc theo phường/quận (all)
    - status: Lọc theo trạng thái (admin only)
    - min_price: Giá thuê tối thiểu (all)
    - max_price: Giá thuê tối đa (all)
    - max_capacity: Số người tối đa (all)
    - sort_by: price_asc (giá tăng dần), price_desc (giá giảm dần), mặc định là mới nhất
    - page, pageSize: Pagination
    """
    try:
        room_service = RoomService(db)
        
        # Xác định user role
        is_admin = False
        if current_user and current_user.role:
            is_admin = current_user.role.role_code == "ADMIN"
        
        # Admin: trả full data với filter
        if is_admin:
            result = room_service.list_rooms(
                search=search,
                building_id=building_id,
                city=city,
                ward=ward,
                status=room_status,
                min_price=min_price,
                max_price=max_price,
                max_capacity=max_capacity,
                sort_by=sort_by,
                page=page,
                pageSize=min(pageSize, 100),  # Max 100 cho admin
            )
        else:
            # Public/Customer: chỉ phòng available, pageSize max 20
            result = room_service.list_rooms_public(
                search=search,
                building_id=building_id,
                city=city,
                ward=ward,
                min_price=min_price,
                max_price=max_price,
                max_capacity=max_capacity,
                sort_by=sort_by,
                page=page,
                pageSize=min(pageSize, 20),  # Max 20 cho public
            )
        
        return response.success(data=result, message="Lấy danh sách phòng thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


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
        # Tạo phòng và nhận kết quả trả về (bao gồm utilities và photos)
        room_created = room_service.create_room(room_data, user_id=current_user.id)
        return response.created(data=room_created, message="Tạo phòng thành công")
    except ValueError as e:
        # Business rule violations
        raise response.bad_request(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


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
    current_user: User = Depends(get_current_user_optional),
):
    """Xem chi tiết phòng theo role (Công khai - không bắt buộc đăng nhập).

    - Admin (ADMIN) có token: Thấy đầy đủ thông tin + thông tin người thuê
    - User có token (Tenant/Customer): Thấy thông tin cơ bản
    - Khách không đăng nhập: Thấy thông tin cơ bản (public view)

    Args:
        room_id: UUID của phòng cần xem
        current_user: User hiện tại (optional, từ token nếu có)

    Returns:
        RoomAdminDetail (nếu admin) hoặc RoomPublicDetail (nếu không)
    """
    try:
        room_service = RoomService(db)
        # Lấy role code từ user (nếu có), mặc định là CUSTOMER nếu không đăng nhập
        user_role = "CUSTOMER"
        if current_user and current_user.role:
            user_role = current_user.role.role_code
        
        room = room_service.get_room_detail_by_role(room_id, user_role)
        # Convert Pydantic model sang dict để serialize đúng
        room_data = room.model_dump(mode='json')
        return response.success(data=room_data, message="Lấy thông tin phòng thành công")
    except ValueError as e:
        raise NotFoundException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


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
            raise NotFoundException(message=str(e))
        else:
            raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


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
        raise NotFoundException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


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
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")

