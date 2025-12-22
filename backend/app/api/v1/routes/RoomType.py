"""RoomType Router - RESTful API endpoints cho quản lý loại phòng.

Các endpoint:
- GET /room-types/simple - Lấy danh sách đơn giản (cho dropdown) với tìm kiếm
- POST /room-types - Tạo loại phòng mới
- PUT /room-types/{room_type_id} - Cập nhật loại phòng
- DELETE /room-types/{room_type_id} - Xóa loại phòng
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.infrastructure.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.core.exceptions import (
    BadRequestException,
    NotFoundException,
    ConflictException,
)
from app.schemas.room_type_schema import (
    RoomTypeCreate,
    RoomTypeUpdate,
    RoomTypeOut,
    RoomTypeSimple,
)
from app.services.RoomTypeService import RoomTypeService
from app.core import response
from app.schemas.response_schema import Response

router = APIRouter(prefix="/room-types", tags=["Room Type Management"])


@router.get(
    "/simple",
    response_model=Response[list],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách loại phòng đơn giản (cho dropdown)",
    description="""
    API để lấy danh sách loại phòng dạng đơn giản (id, name) dùng cho dropdown.
    
    **Không yêu cầu authentication.**
    
    Query params:
    - is_active: Chỉ lấy loại phòng đang active (default: true)
    - search: Tìm kiếm theo tên loại phòng (optional)
    
    Returns:
    - List các loại phòng với id và name.
    """,
)
def list_room_types_simple(
    is_active: bool = Query(True, description="Chỉ lấy loại phòng đang active"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tên loại phòng"),
    db: Session = Depends(get_db),
):
    """
    Lấy danh sách loại phòng đơn giản (id, name) cho dropdown với tìm kiếm.
    """
    try:
        service = RoomTypeService(db)
        room_types = service.list_room_types_simple(is_active=is_active, search=search)
        
        return response.success(
            data=room_types,
            message="Lấy danh sách loại phòng thành công"
        )
    except Exception as e:
        raise BadRequestException(message=str(e))


@router.post(
    "",
    response_model=Response[RoomTypeOut],
    status_code=status.HTTP_201_CREATED,
    summary="Tạo loại phòng mới",
    description="""
    API để tạo loại phòng mới.
    
    **Yêu cầu authentication (Admin).**
    
    Business rules:
    - Tên loại phòng phải unique
    - Tên không được để trống
    """,
)
def create_room_type(
    room_type_data: RoomTypeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Tạo loại phòng mới.
    """
    try:
        service = RoomTypeService(db)
        room_type = service.create_room_type(room_type_data)
        
        return response.success_response(
            data=room_type,
            message=f"Tạo loại phòng '{room_type.name}' thành công",
            status_code=status.HTTP_201_CREATED
        )
    except ValueError as e:
        raise BadRequestException(detail=str(e))
    except Exception as e:
        raise BadRequestException(detail=f"Lỗi khi tạo loại phòng: {str(e)}")


@router.put(
    "/{room_type_id}",
    response_model=Response[RoomTypeOut],
    status_code=status.HTTP_200_OK,
    summary="Cập nhật loại phòng",
    description="""
    API để cập nhật thông tin loại phòng.
    
    **Yêu cầu authentication (Admin).**
    
    Business rules:
    - Nếu đổi tên, tên mới phải unique
    """,
)
def update_room_type(
    room_type_id: UUID,
    update_data: RoomTypeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cập nhật loại phòng.
    """
    try:
        service = RoomTypeService(db)
        room_type = service.update_room_type(room_type_id, update_data)
        
        return response.success_response(
            data=room_type,
            message=f"Cập nhật loại phòng '{room_type.name}' thành công"
        )
    except ValueError as e:
        raise BadRequestException(detail=str(e))
    except Exception as e:
        raise BadRequestException(detail=f"Lỗi khi cập nhật loại phòng: {str(e)}")


@router.delete(
    "/{room_type_id}",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    summary="Xóa loại phòng",
    description="""
    API để xóa loại phòng.
    
    **Yêu cầu authentication (Admin).**
    
    Query params:
    - soft: True = soft delete (set is_active=False), False = hard delete (default True)
    
    Note: Hard delete chỉ nên dùng khi chắc chắn không có phòng nào sử dụng loại này.
    """,
)
def delete_room_type(
    room_type_id: UUID,
    soft: bool = Query(True, description="True = soft delete, False = hard delete"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Xóa loại phòng (soft hoặc hard delete).
    """
    try:
        service = RoomTypeService(db)
        result = service.delete_room_type(room_type_id, soft=soft)
        
        return response.success_response(
            data=result,
            message=result["message"]
        )
    except ValueError as e:
        raise BadRequestException(detail=str(e))
    except Exception as e:
        raise BadRequestException(detail=f"Lỗi khi xóa loại phòng: {str(e)}")
