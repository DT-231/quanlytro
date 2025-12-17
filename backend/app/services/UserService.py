"""User Service - business logic layer cho User entity.

Service xử lý các use case và business rules liên quan đến User/Tenant management.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserUpdate, UserOut, UserListItem, UserStats
from app.core.Enum.userEnum import UserStatus


class UserService:
    """Service xử lý business logic cho User/Tenant management.

    - Validate các quy tắc nghiệp vụ.
    - Điều phối CRUD operations qua Repository.

    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def get_user(self, user_id: UUID) -> UserOut:
        """Lấy thông tin chi tiết user.

        Args:
            user_id: UUID của user cần lấy.

        Returns:
            UserOut schema.

        Raises:
            ValueError: Nếu không tìm thấy user.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"Không tìm thấy người dùng với ID: {user_id}")

        # Convert ORM sang schema
        user_dict = {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "cccd": user.cccd,
            "date_of_birth": user.date_of_birth,
            "status": user.status,
            "is_temporary_residence": user.is_temporary_residence,
            "temporary_residence_date": user.temporary_residence_date,
            "role_name": user.role.role_name if user.role else None,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }
        
        return UserOut(**user_dict)

    def list_users(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        gender: Optional[str] = None,
        district: Optional[str] = None,
        role_code: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> dict:
        """Lấy danh sách users với filter, search và pagination.

        Args:
            search: Tìm kiếm theo tên, email, phone, CCCD.
            status: Lọc theo trạng thái.
            gender: Lọc theo giới tính.
            district: Lọc theo quận/huyện.
            role_code: Lọc theo mã role (TENANT, CUSTOMER).
            offset: Vị trí bắt đầu.
            limit: Số lượng tối đa (max 100).

        Returns:
            Dict chứa items, total, offset, limit.
        """
        # Validate limit
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 20

        # Validate status nếu có
        if status:
            valid_statuses = [s.value for s in UserStatus]
            if status not in valid_statuses:
                raise ValueError(
                    f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}"
                )
        
        # Convert role_code sang role_id nếu cần
        role_id = None
        if role_code:
            from app.models.role import Role
            role = self.db.query(Role).filter(Role.role_code == role_code.upper()).first()
            if not role:
                raise ValueError(f"Mã role không hợp lệ: {role_code}. Phải là TENANT hoặc CUSTOMER")
            role_id = role.id

        # Lấy danh sách users
        items_data = self.user_repo.list_with_filters(
            search=search,
            status=status,
            gender=gender,
            district=district,
            role_id=role_id,
            offset=offset,
            limit=limit,
        )

        # Lấy tổng số
        total = self.user_repo.count(
            search=search,
            status=status,
            gender=gender,
            district=district,
            role_id=role_id,
        )

        # Convert sang schema
        items_out = [UserListItem(**item) for item in items_data]

        return {
            "items": items_out,
            "total": total,
            "offset": offset,
            "limit": limit,
        }

    def get_stats(self, role_id: Optional[UUID] = None) -> UserStats:
        """Lấy thống kê tổng quan về users/tenants.

        Args:
            role_id: Lọc theo role (ví dụ chỉ TENANT).

        Returns:
            UserStats schema.
        """
        stats_data = self.user_repo.get_stats(role_id=role_id)
        return UserStats(**stats_data)

    def update_user(self, user_id: UUID, user_data: UserUpdate) -> UserOut:
        """Cập nhật thông tin user.

        Business rules:
        - Email phải unique nếu được update.
        - Phone phải unique nếu được update.
        - CCCD phải unique nếu được update.
        - Status phải hợp lệ nếu được update.

        Args:
            user_id: UUID của user cần update.
            user_data: Dữ liệu cập nhật.

        Returns:
            UserOut schema đã được cập nhật.

        Raises:
            ValueError: Nếu không tìm thấy user hoặc vi phạm rules.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"Không tìm thấy người dùng với ID: {user_id}")

        # Validate các field được update
        update_data = user_data.model_dump(exclude_unset=True)

        if "email" in update_data and update_data["email"]:
            if update_data["email"] != user.email:
                existing = self.user_repo.get_by_email(update_data["email"])
                if existing:
                    raise ValueError(f"Email {update_data['email']} đã tồn tại")

        if "phone" in update_data and update_data["phone"]:
            if update_data["phone"] != user.phone:
                existing = self.user_repo.get_by_phone(update_data["phone"])
                if existing:
                    raise ValueError(f"Số điện thoại {update_data['phone']} đã tồn tại")

        if "cccd" in update_data and update_data["cccd"]:
            if update_data["cccd"] != user.cccd:
                existing = self.user_repo.get_by_cccd(update_data["cccd"])
                if existing:
                    raise ValueError(f"CCCD {update_data['cccd']} đã tồn tại")

        if "status" in update_data:
            valid_statuses = [s.value for s in UserStatus]
            if update_data["status"] not in valid_statuses:
                raise ValueError(
                    f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}"
                )

        # Update user
        updated_user = self.user_repo.update(user, update_data)

        # Convert sang schema
        user_dict = {
            "id": updated_user.id,
            "first_name": updated_user.first_name,
            "last_name": updated_user.last_name,
            "email": updated_user.email,
            "phone": updated_user.phone,
            "cccd": updated_user.cccd,
            "date_of_birth": updated_user.date_of_birth,
            "status": updated_user.status,
            "is_temporary_residence": updated_user.is_temporary_residence,
            "temporary_residence_date": updated_user.temporary_residence_date,
            "role_name": updated_user.role.role_name if updated_user.role else None,
            "created_at": updated_user.created_at,
            "updated_at": updated_user.updated_at,
        }
        
        return UserOut(**user_dict)

    def delete_user(self, user_id: UUID) -> None:
        """Xóa user.

        Business rules:
        - Không xóa user đang có hợp đồng active.
        - Không xóa admin user.

        Args:
            user_id: UUID của user cần xóa.

        Raises:
            ValueError: Nếu không tìm thấy user hoặc vi phạm rules.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"Không tìm thấy người dùng với ID: {user_id}")

        # Kiểm tra role admin
        if user.role and user.role.role_code == "ADMIN":
            raise ValueError("Không thể xóa tài khoản quản trị viên")

        # TODO: Kiểm tra user có hợp đồng active không
        # if user.tenant_contracts:
        #     active_contracts = [c for c in user.tenant_contracts if c.status == "ACTIVE"]
        #     if active_contracts:
        #         raise ValueError("Không thể xóa người dùng đang có hợp đồng hoạt động")

        self.user_repo.delete(user)
