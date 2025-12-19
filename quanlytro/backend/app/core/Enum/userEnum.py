"""Enums cho User entity trong hệ thống quản lý phòng trọ.

Các enum định nghĩa vai trò và trạng thái của người dùng
theo database schema.
"""

from __future__ import annotations

from .base_enum import BaseEnum, StatusEnum


class UserRole(BaseEnum):
    """Vai trò người dùng trong hệ thống.
    
    Phù hợp với role_code trong bảng roles:
    - ADMIN: Quản trị viên/chủ trọ
    - TENANT: Người thuê phòng  
    - CUSTOMER: Khách hàng tiềm năng
    """
    
    ADMIN = "ADMIN"     # Quản trị viên/chủ trọ
    TENANT = "TENANT"   # Người thuê phòng
    CUSTOMER = "CUSTOMER"  # Khách hàng tiềm năng


# Reuse the shared StatusEnum values for user status. Enum subclasses
# cannot extend other Enum classes, so we alias the type instead of
# subclassing to preserve the same members and behavior.
UserStatus = StatusEnum


class DocumentType(BaseEnum):
    """Loại tài liệu của người dùng.
    
    Định nghĩa các loại tài liệu có thể upload:
    - AVATAR: Ảnh đại diện
    - CCCD_FRONT: Mặt trước căn cước công dân  
    - CCCD_BACK: Mặt sau căn cước công dân
    """
    
    AVATAR = "AVATAR"         # Ảnh đại diện
    CCCD_FRONT = "CCCD_FRONT"  # Mặt trước CCCD
    CCCD_BACK = "CCCD_BACK"   # Mặt sau CCCD 