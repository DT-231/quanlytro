"""Role Repository - data access layer cho Role entity.

Chỉ xử lý truy vấn database cho Role, không chứa business logic.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.role import Role


class RoleRepository:
    """Repository để thao tác với Role entity trong database.
    
    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """
    
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, role_id: UUID) -> Optional[Role]:
        """Lấy Role theo ID.
        
        Args:
            role_id: UUID của role cần tìm.
            
        Returns:
            Role instance hoặc None nếu không tìm thấy.
        """
        return self.db.query(Role).filter(Role.id == role_id).first()

    def get_by_code(self, role_code: str) -> Optional[Role]:
        """Lấy Role theo role_code.
        
        Args:
            role_code: Mã role (ADMIN, TENANT, CUSTOMER, etc.).
            
        Returns:
            Role instance hoặc None nếu không tìm thấy.
        """
        return self.db.query(Role).filter(Role.role_code == role_code).first()
    
    def get_by_name(self, role_name: str) -> Optional[Role]:
        """Lấy Role theo role_name.
        
        Args:
            role_name: Tên role (Administrator, Tenant, Customer, etc.).
            
        Returns:
            Role instance hoặc None nếu không tìm thấy.
        """
        return self.db.query(Role).filter(Role.role_name == role_name).first()

    def list_all(self) -> list[Role]:
        """Lấy danh sách tất cả các role trong hệ thống.
        
        Returns:
            Danh sách tất cả Role instances.
        """
        return self.db.query(Role).all()
    
    def get_all_public_roles(self) -> list[Role]:
        """Lấy danh sách roles công khai (loại trừ ADMIN).
        
        Dùng cho dropdown filter, chỉ trả TENANT và CUSTOMER.
        
        Returns:
            List các Role instances (TENANT, CUSTOMER).
        """
        from app.core.Enum.userEnum import UserRole
        
        return (
            self.db.query(Role)
            .filter(Role.role_code != UserRole.ADMIN.value)
            .order_by(Role.role_code)
            .all()
        )

    def create(self, role_code: str, role_name: str, description: str | None = None) -> Role:
        """Tạo role mới trong database.
        
        Args:
            role_code: Mã role (unique).
            role_name: Tên role.
            description: Mô tả role (optional).
            
        Returns:
            Role instance vừa được tạo.
        """
        role = Role(
            role_code=role_code,
            role_name=role_name,
            description=description
        )
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        return role

    def update(self, role: Role, role_name: str | None = None, description: str | None = None) -> Role:
        """Cập nhật thông tin role.
        
        Note: role_code không được phép update vì là unique identifier.
        
        Args:
            role: Role instance cần update.
            role_name: Tên role mới (optional).
            description: Mô tả mới (optional).
            
        Returns:
            Role instance đã được cập nhật.
        """
        if role_name is not None:
            role.role_name = role_name
        if description is not None:
            role.description = description
            
        self.db.commit()
        self.db.refresh(role)
        return role

    def delete(self, role: Role) -> None:
        """Xóa role khỏi database.
        
        Warning: Không nên xóa role đang có user sử dụng.
        
        Args:
            role: Role instance cần xóa.
        """
        self.db.delete(role)
        self.db.commit()
    
    def count_users_by_role(self, role_id: UUID) -> int:
        """Đếm số lượng user có role này.
        
        Args:
            role_id: UUID của role.
            
        Returns:
            Số lượng user.
        """
        from app.models.user import User
        return self.db.query(User).filter(User.role_id == role_id).count()
