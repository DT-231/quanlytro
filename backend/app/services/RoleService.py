"""Role Service - business logic layer cho Role entity.

Service xử lý logic lấy danh sách roles cho filter.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.role_repository import RoleRepository
from app.schemas.role_schema import RoleOut


class RoleService:
    """Service xử lý business logic cho Role.
    
    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.role_repo = RoleRepository(db)
    
    def get_public_roles(self) -> list[RoleOut]:
        """Lấy danh sách roles công khai để làm bộ lọc.
        
        Loại trừ ADMIN, chỉ trả về TENANT và CUSTOMER.
        
        Returns:
            List RoleOut schemas.
        """
        roles = self.role_repo.get_all_public_roles()
        
        return [
            RoleOut(
                id=role.id,
                role_code=role.role_code,
                role_name=role.role_name,
                display_name=role.display_name or role.role_name,
            )
            for role in roles
        ]
