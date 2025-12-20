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
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
    pageSize: int = Query(20, ge=1, le=100, description="Số items mỗi trang"),
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
    - page: Số trang (mặc định 1)
    - pageSize: Số items mỗi trang (1-100, mặc định 20)
    
    **Response format**:
    ```json
    {
        "success": true,
        "data": {
            "items": [
                {
                    "id": "uuid",
                    "full_name": "Phan Mạnh Quỳnh",
                    "phone": "0256662848",
                    "email": "nguyenthanhbinh789@gmail.com",
                    "gender": "Nam",
                    "district": "Lâm Đồng",
                    "status": "Đang thuê"
                }
            ],
            "pagination": {
                "totalItems": 108,
                "page": 1,
                "pageSize": 20,
                "totalPages": 6
            }
        }
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
            page=page,
            pageSize=pageSize,
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
    """Lấy thông tin chi tiết người dùng bao gồm cả documents.
    
    **Yêu cầu**: Admin hoặc chính user đó
    
    Args:
        user_id: UUID của người dùng
        
    Returns:
        Thông tin chi tiết người dùng bao gồm:
        - Thông tin cá nhân đầy đủ
        - Role
        - Trạng thái
        - Documents (avatar, CCCD_FRONT, CCCD_BACK) với base64 URL
        - Ngày tạo, cập nhật
        
    **Documents format**:
    ```json
    "documents": [
        {
            "id": "uuid",
            "type": "AVATAR",
            "url": "data:image/png;base64,...",
            "created_at": "2024-01-01T00:00:00"
        },
        {
            "id": "uuid",
            "type": "CCCD_FRONT",
            "url": "data:image/jpeg;base64,...",
            "created_at": "2024-01-01T00:00:00"
        }
    ]
    ```
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
    """Cập nhật thông tin người dùng (bao gồm upload ảnh).
    
    **Yêu cầu**: Admin hoặc chính user đó
    
    **Business rules**:
    - Email phải unique nếu được update
    - Phone phải unique nếu được update
    - CCCD phải unique nếu được update
    - Status phải hợp lệ (ACTIVE, INACTIVE)
    
    **Upload ảnh qua base64**:
    - avatar: Ảnh đại diện (format: data:image/png;base64,...)
    - cccd_front: Ảnh CCCD mặt trước
    - cccd_back: Ảnh CCCD mặt sau
    
    Args:
        user_id: UUID của người dùng cần update
        user_data: Dữ liệu cập nhật (các field optional, bao gồm ảnh base64)
        
    Returns:
        Thông tin người dùng đã được cập nhật
        
    **Example request body**:
    ```json
    {
      "first_name": "Nguyễn",
      "last_name": "Văn A",
      "phone": "0901234567",
      "avatar": "data:image/png;base64,iVBORw0KG...",
      "cccd_front": "data:image/jpeg;base64,/9j/4AAQ..."
    }
    ```
    """
    try:
        service = UserService(db)
        
        # Kiểm tra quyền: Admin hoặc chính user đó
        from app.core.Enum.userEnum import UserRole
        is_admin = current_user.role and current_user.role.role_code == UserRole.ADMIN.value
        if not is_admin and current_user.id != user_id:
            raise ForbiddenException(message="Bạn không có quyền cập nhật thông tin user này")
        
        # Tách các trường ảnh ra khỏi user_data
        avatar_base64 = user_data.avatar
        cccd_front_base64 = user_data.cccd_front
        cccd_back_base64 = user_data.cccd_back
        
        # Xóa các trường ảnh khỏi user_data để không lưu vào DB
        user_data_dict = user_data.model_dump(exclude_unset=True)
        user_data_dict.pop('avatar', None)
        user_data_dict.pop('cccd_front', None)
        user_data_dict.pop('cccd_back', None)
        
        # Update thông tin user (không bao gồm ảnh)
        from app.schemas.user_schema import UserUpdate as UserUpdateSchema
        cleaned_user_data = UserUpdateSchema(**user_data_dict)
        result = service.update_user(user_id, cleaned_user_data)
        
        # Upload ảnh nếu có
        if avatar_base64 or cccd_front_base64 or cccd_back_base64:
            service.upload_user_documents_base64(
                user_id=user_id,
                avatar_base64=avatar_base64,
                cccd_front_base64=cccd_front_base64,
                cccd_back_base64=cccd_back_base64,
                uploaded_by=current_user.id
            )
        
        return response.success(data=result, message="Cập nhật người dùng thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except ForbiddenException:
        raise
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
