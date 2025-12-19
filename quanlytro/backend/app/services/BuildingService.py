"""Building Service - business logic layer cho Building entity.

Service xử lý các use case và business rules liên quan đến Building.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.repositories.building_repository import BuildingRepository
from app.repositories.address_respository import AddressRepository
from app.schemas.address_schema import AddressCreate
from app.schemas.building_schema import (
    BuildingCreate,
    BuildingUpdate,
    BuildingOut,
    BuildingListItem,
)
from app.models.building import Building
from app.core.Enum.base_enum import StatusEnum


class BuildingService:
    """Service xử lý business logic cho Building.

    - Validate các quy tắc nghiệp vụ.
    - Điều phối CRUD operations qua Repository.

    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """

    def __init__(self, db: Session):
        self.db = db
        self.building_repo = BuildingRepository(db)
        self.address_repo = AddressRepository(db)

    def create_building(self, building_data: BuildingCreate) -> BuildingOut:
        """Tạo tòa nhà mới với validation.

        Business rules:
        - building_code phải unique.
        - address_id phải tồn tại trong hệ thống.
        - Status phải hợp lệ theo enum.
        - building_name không được rỗng.

        Args:
            building_data: Thông tin tòa nhà từ request.

        Returns:
            BuildingOut schema vừa được tạo.

        Raises:
            ValueError: Nếu vi phạm business rules.
        """
        # Validate building_code không rỗng
        if not building_data.building_code.strip():
            raise ValueError("Mã tòa nhà không được để trống")

        # Validate building_name không rỗng
        if not building_data.building_name.strip():
            raise ValueError("Tên tòa nhà không được để trống")

        # Kiểm tra building_code đã tồn tại chưa
        existing = self.building_repo.get_by_code(building_data.building_code)
        if existing:
            raise ValueError(f"Mã tòa nhà {building_data.building_code} đã tồn tại")

        # Validate status
        valid_statuses = [s.value for s in StatusEnum]
        if building_data.status not in valid_statuses:
            raise ValueError(
                f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}"
            )

        # Xử lý địa chỉ và tạo building data
        address_id = None
        if building_data.address is not None:
            address_building = building_data.address

            new_address = AddressCreate(
                address_line=address_building.address_line,
                ward=address_building.ward,
                city=address_building.city,
                country=address_building.country,
            )
            address = self.address_repo.create(new_address)
            address_id = address.id

        # Tạo dict từ building_data và thêm address_id
        data = building_data.model_dump(exclude={"address"})
        data["address_id"] = address_id

        # Tạo tòa nhà mới
        building = self.building_repo.create(data)

        # Convert ORM model sang Pydantic schema để serialize
        return BuildingOut.model_validate(building)

    def get_building(self, building_id: UUID) -> BuildingOut:
        """Lấy thông tin chi tiết tòa nhà kèm thống kê phòng.

        Args:
            building_id: UUID của tòa nhà cần lấy.

        Returns:
            BuildingOut schema với room statistics (total_rooms, available_rooms, rented_rooms).

        Raises:
            ValueError: Nếu không tìm thấy tòa nhà.
        """
        building_data = self.building_repo.get_by_id_with_stats(building_id)
        if not building_data:
            raise ValueError(f"Không tìm thấy tòa nhà với ID: {building_id}")

        # Convert dict sang Pydantic schema
        return BuildingOut(**building_data)

    def list_buildings(
        self,
        address_id: Optional[UUID] = None,
        status: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> dict:
        """Lấy danh sách tòa nhà với thống kê phòng, filter và pagination.

        Args:
            address_id: Lọc theo địa chỉ (optional).
            status: Lọc theo trạng thái (optional).
            offset: Vị trí bắt đầu.
            limit: Số lượng tối đa (max 100).

        Returns:
            Dict chứa items (danh sách tòa nhà với stats), total, offset, limit.

            Response format:
            {
                "items": [
                    {
                        "id": "uuid",
                        "building_name": "Tên tòa nhà",
                        "address_line": "Địa chỉ đầy đủ",
                        "total_rooms": 15,
                        "available_rooms": 1,
                        "rented_rooms": 14,
                        "status": "ACTIVE",
                        "created_at": "2025-01-23T..."
                    }
                ],
                "total": 10,
                "offset": 0,
                "limit": 20
            }
        """
        # Validate limit
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 20

        # Validate status nếu có
        if status:
            valid_statuses = [s.value for s in StatusEnum]
            if status not in valid_statuses:
                raise ValueError(
                    f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}"
                )

        # Lấy danh sách với room statistics
        items_data = self.building_repo.list_with_room_stats(
            address_id=address_id, status=status, offset=offset, limit=limit
        )

        # Lấy tổng số
        total = self.building_repo.count(address_id=address_id, status=status)

        # Convert dict sang Pydantic schemas
        items_out = [BuildingListItem(**item) for item in items_data]

        return {
            "items": items_out,
            "total": total,
            "offset": offset,
            "limit": limit,
        }

    def update_building(
        self, building_id: UUID, building_data: BuildingUpdate
    ) -> BuildingOut:
        """Cập nhật thông tin tòa nhà.

        Business rules:
        - Không được update sang building_code đã tồn tại.
        - address_id phải tồn tại nếu được update.
        - Status phải hợp lệ nếu được update.
        - Các trường không được rỗng nếu có giá trị.

        Args:
            building_id: UUID của tòa nhà cần update.
            building_data: Dữ liệu cập nhật.

        Returns:
            BuildingOut schema đã được cập nhật.

        Raises:
            ValueError: Nếu không tìm thấy tòa nhà hoặc vi phạm rules.
        """
        # Lấy building hiện tại (sẽ trả BuildingOut, cần ORM instance)
        building_orm = self.building_repo.get_by_id(building_id)
        if not building_orm:
            raise ValueError(f"Không tìm thấy tòa nhà với ID: {building_id}")

        # Validate các field được update
        if building_data.building_code is not None:
            if not building_data.building_code.strip():
                raise ValueError("Mã tòa nhà không được để trống")

            # Kiểm tra trùng code
            if building_data.building_code != building_orm.building_code:
                existing = self.building_repo.get_by_code(building_data.building_code)
                if existing:
                    raise ValueError(
                        f"Mã tòa nhà {building_data.building_code} đã tồn tại"
                    )

        if (
            building_data.building_name is not None
            and not building_data.building_name.strip()
        ):
            raise ValueError("Tên tòa nhà không được để trống")

        if building_data.status is not None:
            valid_statuses = [s.value for s in StatusEnum]
            if building_data.status not in valid_statuses:
                raise ValueError(
                    f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}"
                )

        # Xử lý cập nhật địa chỉ và chuẩn bị data dict
        update_data = building_data.model_dump(exclude_unset=True, exclude={"address"})
        
        if building_data.address is not None:
            new_addr = building_data.address
            current_address = (
                self.address_repo.get_by_id(building_orm.address_id)
                if building_orm.address_id
                else None
            )
            
            if current_address:
                # Kiểm tra có thay đổi không
                if (
                    current_address.address_line != new_addr.address_line
                    or current_address.ward != new_addr.ward
                    or current_address.city != new_addr.city
                    or current_address.country != new_addr.country
                ):
                    # Update address hiện tại
                    from app.schemas.address_schema import AddressUpdate
                    address_update = AddressUpdate(
                        address_line=new_addr.address_line,
                        ward=new_addr.ward,
                        city=new_addr.city,
                        country=new_addr.country,
                    )
                    self.address_repo.update(current_address, address_update)
            else:
                # Tạo address mới (building chưa có hoặc address cũ không tồn tại)
                created_address = self.address_repo.create(
                    AddressCreate(
                        address_line=new_addr.address_line,
                        ward=new_addr.ward,
                        city=new_addr.city,
                        country=new_addr.country,
                    )
                )
                update_data["address_id"] = created_address.id

        # Update building với dict data (không dùng schema trực tiếp)
        updated = self.building_repo.update_from_dict(building_orm, update_data)

        # Convert ORM model sang Pydantic schema
        return BuildingOut.model_validate(updated)

    def delete_building(self, building_id: UUID) -> None:
        """Xóa tòa nhà.

        Business rules:
        - Không xóa tòa nhà đang có phòng (cần check sau).

        Args:
            building_id: UUID của tòa nhà cần xóa.

        Raises:
            ValueError: Nếu không tìm thấy tòa nhà hoặc đang có phòng.
        """
        # Lấy ORM instance để xóa
        building_orm = self.building_repo.get_by_id(building_id)
        if not building_orm:
            raise ValueError(f"Không tìm thấy tòa nhà với ID: {building_id}")

        # TODO: Kiểm tra tòa nhà có phòng không
        # if building_orm.rooms:
        #     raise ValueError("Không thể xóa tòa nhà đang có phòng")

        self.building_repo.delete(building_orm)
