"""User Management Router - API endpoints cho quản lý người dùng/người thuê.

Router cung cấp các endpoints cho admin quản lý users/tenants.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core import response
from app.infrastructure.db.session import get_db
from app.core.security import get_current_user
from app.core.exceptions import (
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    UnauthorizedException,
    ConflictException,
    InternalServerException,
)
from app.models.user import User
from app.schemas.user_schema import UserUpdate, UserOut, UserListItem, UserStats
from app.schemas.role_schema import RoleOut
from app.services.UserService import UserService
from app.services.RoleService import RoleService

router = APIRouter(prefix="/users", tags=["Users Management"])


@router.get("/roles", response_model=list[RoleOut], status_code=status.HTTP_200_OK)
def get_roles_for_filter(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy danh sách roles để làm bộ lọc.
    
    **Yêu cầu**: User đã đăng nhập
    
    **Response**: Danh sách roles (TENANT, CUSTOMER) - loại trừ ADMIN
    
    **Example response**:
    ```json
    [
        {
            "id": "uuid-tenant",
            "role_code": "TENANT",
            "role_name": "Tenant",
            "display_name": "Người thuê"
        },
        {
            "id": "uuid-customer",
            "role_code": "CUSTOMER",
            "role_name": "Customer",
            "display_name": "Khách"
        }
    ]
    ```
    """
    try:
        service = RoleService(db)
        roles = service.get_public_roles()
        return roles  # Trả về list trực tiếp, FastAPI tự serialize theo response_model
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.get("/stats", status_code=status.HTTP_200_OK)
def get_user_stats(
    role_id: Optional[UUID] = Query(None, description="Lọc theo role ID (ví dụ: TENANT)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy thống kê tổng quan về người dùng/người thuê.
    
    **Yêu cầu**: Admin
    
    Returns:
        - total_tenants: Tổng số người thuê
        - active_tenants: Đang thuê (status=ACTIVE)
        - returned_rooms: Đã trả phòng (status=INACTIVE)
        - not_rented: Chưa thuê
    """
    try:
        service = UserService(db)
        result = service.get_stats(role_id=role_id)
        return response.success(data=result, message="Lấy thống kê thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.get("", status_code=status.HTTP_200_OK)
def get_list_users(
    search: Optional[str] = Query(
        None, description="Tìm kiếm theo tên, email, số điện thoại, CCCD, quận/quán..."
    ),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Lọc theo trạng thái: ACTIVE, INACTIVE"
    ),
    gender: Optional[str] = Query(None, description="Lọc theo giới tính: Nam, Nữ"),
    district: Optional[str] = Query(None, description="Lọc theo quận/huyện"),
    role_code: Optional[str] = Query(None, description="Lọc theo mã role: TENANT, CUSTOMER"),
    offset: int = Query(0, ge=0, description="Vị trí bắt đầu (pagination)"),
    limit: int = Query(20, ge=1, le=100, description="Số lượng tối đa mỗi trang"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy danh sách người dùng/người thuê với filter và pagination.
    
    **Yêu cầu**: Admin
    
    **Filters**:
    - search: Tìm kiếm theo tên, email, phone, CCCD
    - status: Lọc theo trạng thái (ACTIVE, INACTIVE)
    - gender: Lọc theo giới tính
    - district: Lọc theo quận/huyện
    - role_code: Lọc theo mã role (TENANT, CUSTOMER)
    
    **Pagination**:
    - offset: Vị trí bắt đầu (mặc định 0)
    - limit: Số lượng mỗi trang (1-100, mặc định 20)
    
    **Response format**:
    ```json
    {
        "items": [
            {
                "id": "uuid",
                "code": "101",
                "full_name": "Phan Mạnh Quỳnh",
                "phone": "0256662848",
                "email": "nguyenthanhbinh789@gmail.com",
                "gender": "Nam",
                "district": "Lâm Đồng",
                "status": "Đang thuê"
            }
        ],
        "total": 108,
        "offset": 0,
        "limit": 20
    }
    ```
    """
    try:
        service = UserService(db)
        result = service.list_users(
            search=search,
            status=status_filter,
            gender=gender,
            district=district,
            role_code=role_code,
            offset=offset,
            limit=limit,
        )
        return response.success(data=result, message="Lấy danh sách người dùng thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.get("/{user_id}", status_code=status.HTTP_200_OK)
def get_user_detail(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy thông tin chi tiết người dùng.
    
    **Yêu cầu**: Admin hoặc chính user đó
    
    Args:
        user_id: UUID của người dùng
        
    Returns:
        Thông tin chi tiết người dùng bao gồm:
        - Thông tin cá nhân đầy đủ
        - Role
        - Trạng thái
        - Ngày tạo, cập nhật
    """
    try:
        service = UserService(db)
        result = service.get_user(user_id)
        return response.success(data=result, message="Lấy thông tin người dùng thành công")
    except ValueError as e:
        raise NotFoundException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.put("/{user_id}", status_code=status.HTTP_200_OK)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cập nhật thông tin người dùng.
    
    **Yêu cầu**: Admin hoặc chính user đó
    
    **Business rules**:
    - Email phải unique nếu được update
    - Phone phải unique nếu được update
    - CCCD phải unique nếu được update
    - Status phải hợp lệ (ACTIVE, INACTIVE)
    
    Args:
        user_id: UUID của người dùng cần update
        user_data: Dữ liệu cập nhật (các field optional)
        
    Returns:
        Thông tin người dùng đã được cập nhật
    """
    try:
        service = UserService(db)
        result = service.update_user(user_id, user_data)
        return response.success(data=result, message="Cập nhật người dùng thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Xóa người dùng.
    
    **Yêu cầu**: Admin
    
    **Business rules**:
    - Không xóa được admin user
    - Không xóa user đang có hợp đồng active
    
    Args:
        user_id: UUID của người dùng cần xóa
        
    Returns:
        204 No Content nếu xóa thành công
    """
    try:
        service = UserService(db)
        service.delete_user(user_id)
        return response.success(message="Xóa người dùng thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")
