"""RoomType Service - business logic layer cho RoomType entity.

Service xử lý các use case và business rules liên quan đến RoomType.
"""

from __future__ import annotations

from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.repositories.room_type_repository import RoomTypeRepository
from app.schemas.room_type_schema import (
    RoomTypeCreate,
    RoomTypeOut,
    RoomTypeUpdate,
    RoomTypeSimple,
)
from app.models.room_type import RoomType


class RoomTypeService:
    """Service xử lý business logic cho RoomType.

    - Validate các quy tắc nghiệp vụ.
    - Điều phối CRUD operations qua Repository.

    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """

    def __init__(self, db: Session):
        self.db = db
        self.room_type_repo = RoomTypeRepository(db)

    def create_room_type(self, room_type_data: RoomTypeCreate) -> RoomTypeOut:
        """Tạo loại phòng mới với validation.

        Business rules:
        - Tên loại phòng phải unique.
        - Tên không được rỗng.

        Args:
            room_type_data: Thông tin loại phòng từ request.

        Returns:
            RoomTypeOut schema.

        Raises:
            ValueError: Nếu vi phạm business rules.
        """
        # Validate tên không rỗng
        if not room_type_data.name or not room_type_data.name.strip():
            raise ValueError("Tên loại phòng không được để trống")

        # Kiểm tra tên đã tồn tại chưa
        existing = self.room_type_repo.get_by_name(room_type_data.name.strip())
        if existing:
            raise ValueError(f"Loại phòng '{room_type_data.name}' đã tồn tại")

        # Tạo loại phòng mới
        room_type = self.room_type_repo.create(room_type_data)
        self.db.commit()

        return RoomTypeOut.model_validate(room_type)

    def list_room_types_simple(
        self, is_active: bool = True, search: Optional[str] = None
    ) -> List[RoomTypeSimple]:
        """Lấy danh sách đơn giản loại phòng (cho dropdown).

        Args:
            is_active: Chỉ lấy các loại phòng đang active (default True).
            search: Tìm kiếm theo tên loại phòng (optional).

        Returns:
            List RoomTypeSimple với id và name.
        """
        room_types = self.room_type_repo.list(
            is_active=is_active,
            search=search,
            offset=0,
            limit=1000,  # Lấy tất cả cho dropdown
        )

        return [RoomTypeSimple.model_validate(rt) for rt in room_types]

    def update_room_type(
        self, room_type_id: UUID, update_data: RoomTypeUpdate
    ) -> RoomTypeOut:
        """Cập nhật thông tin loại phòng.

        Business rules:
        - Nếu đổi tên, tên mới phải unique.

        Args:
            room_type_id: UUID của loại phòng.
            update_data: Dữ liệu cập nhật.

        Returns:
            RoomTypeOut schema đã cập nhật.

        Raises:
            ValueError: Nếu không tìm thấy hoặc vi phạm business rules.
        """
        room_type = self.room_type_repo.get_by_id(room_type_id)
        if not room_type:
            raise ValueError(f"Không tìm thấy loại phòng với ID: {room_type_id}")

        # Nếu có update name, kiểm tra unique
        if update_data.name and update_data.name.strip() != room_type.name:
            existing = self.room_type_repo.get_by_name(update_data.name.strip())
            if existing and existing.id != room_type_id:
                raise ValueError(f"Loại phòng '{update_data.name}' đã tồn tại")

        # Cập nhật
        updated_room_type = self.room_type_repo.update(room_type, update_data)
        self.db.commit()

        return RoomTypeOut.model_validate(updated_room_type)

    def delete_room_type(self, room_type_id: UUID) -> dict:
        """Xóa loại phòng (soft hoặc hard delete).

        Args:
            room_type_id: UUID của loại phòng.
            soft: True = soft delete (set is_active=False), False = hard delete.

        Returns:
            Dict với message thành công.

        Raises:
            ValueError: Nếu không tìm thấy loại phòng.
        """
        room_type = self.room_type_repo.get_by_id(room_type_id)
        if not room_type:
            raise ValueError(f"Không tìm thấy loại phòng với ID: {room_type_id}")

        # TODO: Kiểm tra xem có phòng nào đang sử dụng loại này không
        # Nếu có, không cho xóa hoặc set NULL cho các phòng đó
        self.room_type_repo.delete(room_type)
        message = f"Đã xóa loại phòng '{room_type.name}'"

        self.db.commit()

        return {"message": message}
