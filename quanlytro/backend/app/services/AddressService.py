"""Address Service - business logic layer cho Address entity.

Service xử lý các use case và business rules liên quan đến Address.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.repositories.address_respository import AddressRepository
from app.schemas.address_schema import AddressCreate, AddressOut, AddressUpdate
from app.models.address import Address


class AddressService:
    """Service xử lý business logic cho Address.

    - Validate các quy tắc nghiệp vụ.
    - Điều phối CRUD operations qua Repository.

    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """

    def __init__(self, db: Session):
        self.db = db
        self.address_repo = AddressRepository(db)

    def create_address(self, address_data: AddressCreate) -> Address:
        """Tạo địa chỉ mới với validation.

        Business rules:
        - Các trường bắt buộc phải có giá trị.
        - City, ward, address_line không được rỗng.

        Args:
            address_data: Thông tin địa chỉ từ request.

        Returns:
            Address instance vừa được tạo.

        Raises:
            ValueError: Nếu vi phạm business rules.
        """
        # Validate required fields
        if not address_data.address_line.strip():
            raise ValueError("Địa chỉ không được để trống")

        if not address_data.ward.strip():
            raise ValueError("Phường/Xã không được để trống")

        if not address_data.city.strip():
            raise ValueError("Thành phố không được để trống")

        # Tạo địa chỉ mới
        return self.address_repo.create(address_data)

    def get_address(self, address_id: UUID) -> Address:
        """Lấy thông tin chi tiết địa chỉ.

        Args:
            address_id: UUID của địa chỉ cần lấy.

        Returns:
            Address instance.

        Raises:
            ValueError: Nếu không tìm thấy địa chỉ.
        """
        address = self.address_repo.get_by_id(address_id)
        if not address:
            raise ValueError(f"Không tìm thấy địa chỉ ")
        return address

    def list_addresses(
        self,
        city: Optional[str] = "",
        offset: int = 0,
        limit: int = 100,
    ) -> dict:
        """Lấy danh sách địa chỉ với filter và pagination.

        Args:
            city: Lọc theo thành phố (optional).
            offset: Vị trí bắt đầu.
            limit: Số lượng tối đa (max 100).

        Returns:
            Dict chứa items (danh sách địa chỉ) và total (tổng số).
        """
        # Validate limit
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 20

        # Lấy danh sách và tổng số
        items = self.address_repo.list(city=city, offset=offset, limit=limit)
        total = self.address_repo.count(city=city)
        total_pape = 0 if len(items) == 0 else total / len(items)
        items_out = [AddressOut.model_validate(item) for item in items]
        return {
            "items": items_out,
            "pagination": {
                "page": offset+1,
                "page_size": limit,
                "total_items": total,
                "total_pages": total_pape,
                "has_next": offset+1 < total_pape,
                "has_prev": offset >= 1,
            },
        }

    def update_address(self, address_id: UUID, address_data: AddressUpdate) -> Address:
        """Cập nhật thông tin địa chỉ.

        Business rules:
        - Các trường được update không được rỗng nếu có giá trị.

        Args:
            address_id: UUID của địa chỉ cần update.
            address_data: Dữ liệu cập nhật.

        Returns:
            Address instance đã được cập nhật.

        Raises:
            ValueError: Nếu không tìm thấy địa chỉ hoặc vi phạm rules.
        """
        # Lấy address hiện tại
        address = self.get_address(address_id)

        # Validate các field được update
        if (
            address_data.address_line is not None
            and not address_data.address_line.strip()
        ):
            raise ValueError("Địa chỉ không được để trống")

        if address_data.ward is not None and not address_data.ward.strip():
            raise ValueError("Phường/Xã không được để trống")

        if address_data.city is not None and not address_data.city.strip():
            raise ValueError("Thành phố không được để trống")

        # Update address
        return self.address_repo.update(address, address_data)

    def delete_address(self, address_id: UUID) -> None:
        """Xóa địa chỉ.

        Business rules:
        - Không xóa địa chỉ đang được sử dụng bởi tòa nhà (cần check sau).

        Args:
            address_id: UUID của địa chỉ cần xóa.

        Raises:
            ValueError: Nếu không tìm thấy địa chỉ hoặc đang được sử dụng.
        """
        address = self.get_address(address_id)

        # TODO: Kiểm tra địa chỉ có đang được sử dụng không
        # if address.buildings:
        #     raise ValueError("Không thể xóa địa chỉ đang được sử dụng bởi tòa nhà")

        self.address_repo.delete(address)
