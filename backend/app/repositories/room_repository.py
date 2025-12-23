"""Room Repository - data access layer cho Room entity.

Chỉ xử lý truy vấn database, không chứa business logic.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, case

from app.models.room import Room
from app.models.building import Building
from app.models.contract import Contract
from app.models.user import User
from app.models.address import Address
from app.models.room_type import RoomType
from app.core.Enum.contractEnum import ContractStatus


class RoomRepository:
    """Repository để thao tác với Room entity trong database.

    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, room_id: UUID) -> Optional[Room]:
        """Lấy Room theo ID (không load relationships).

        Args:
            room_id: UUID của phòng cần tìm.

        Returns:
            Room instance hoặc None nếu không tìm thấy.
        """
        return self.db.query(Room).filter(Room.id == room_id).first()

    def get_by_id_with_relations(self, room_id: UUID) -> Optional[Room]:
        """Lấy Room theo ID với eager loading utilities, photos và room_type.

        Args:
            room_id: UUID của phòng cần tìm.

        Returns:
            Room instance với utilities, room_photos và room_type, hoặc None.
        """
        return (
            self.db.query(Room)
            .options(
                joinedload(Room.utilities),
                joinedload(Room.room_photos),
                joinedload(Room.room_type),
            )
            .filter(Room.id == room_id)
            .first()
        )

    def get_by_building_and_number(
        self, building_id: UUID, room_number: str
    ) -> Optional[Room]:
        """Kiểm tra phòng có số phòng trong tòa nhà đã tồn tại chưa.

        Args:
            building_id: UUID của tòa nhà.
            room_number: Số phòng cần kiểm tra.

        Returns:
            Room instance hoặc None.
        """
        return (
            self.db.query(Room)
            .filter(Room.building_id == building_id, Room.room_number == room_number)
            .first()
        )

    def list(
        self,
        building_id: Optional[UUID] = None,
        status: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> list[Room]:
        """Lấy danh sách phòng với filter và pagination.

        Args:
            building_id: Lọc theo tòa nhà (optional).
            status: Lọc theo trạng thái phòng (optional).
            offset: Vị trí bắt đầu lấy dữ liệu.
            limit: Số lượng tối đa trả về.

        Returns:
            Danh sách Room instances.
        """
        query = self.db.query(Room)

        if building_id:
            query = query.filter(Room.building_id == building_id)
        if status:
            query = query.filter(Room.status == status)

        return query.offset(offset).limit(limit).all()

    def count(
        self,
        building_id: Optional[UUID] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        city: Optional[str] = None,
        ward: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        max_capacity: Optional[int] = None,
    ) -> int:
        """Đếm tổng số phòng theo filter.

        Args:
            building_id: Lọc theo tòa nhà (optional).
            status: Lọc theo trạng thái (optional).
            search: Tìm kiếm theo tên phòng, số phòng hoặc tên tòa nhà (optional).
            city: Lọc theo thành phố (optional).
            ward: Lọc theo phường/quận (optional).
            min_price: Giá thuê tối thiểu (optional).
            max_price: Giá thuê tối đa (optional).
            max_capacity: Số người tối đa (optional).

        Returns:
            Tổng số phòng.
        """
        query = self.db.query(Room)

        # Join với Building nếu cần search theo building_name hoặc filter city/ward
        if search or city or ward:
            query = query.join(Building, Room.building_id == Building.id)
            if city or ward:
                query = query.join(Address, Building.address_id == Address.id)

        if building_id:
            query = query.filter(Room.building_id == building_id)
        if status:
            query = query.filter(Room.status == status)

        # Apply city and ward filters
        if city:
            query = query.filter(Address.city.ilike(f"%{city}%"))
        if ward:
            query = query.filter(Address.ward.ilike(f"%{ward}%"))

        # Apply search filter - tìm kiếm theo tên phòng, số phòng hoặc tên tòa nhà
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Room.room_number.ilike(search_pattern))
                | (Room.room_name.ilike(search_pattern))
                | (Building.building_name.ilike(search_pattern))
            )

        # Apply price filters
        if min_price is not None:
            query = query.filter(Room.base_price >= min_price)
        if max_price is not None:
            query = query.filter(Room.base_price <= max_price)

        # Apply capacity filter
        if max_capacity is not None:
            query = query.filter(Room.capacity <= max_capacity)

        return query.count()

    def create_room_basic(self, room_dict: dict) -> Room:
        """Tạo phòng mới (chỉ basic info, không có utilities/photos).

        Args:
            room_dict: Dict chứa dữ liệu phòng.

        Returns:
            Room instance vừa được tạo.
        """
        room = Room(**room_dict)
        self.db.add(room)
        self.db.flush()  # Flush để có id nhưng chưa commit
        return room

    def update_room_basic(self, room: Room, room_dict: dict) -> Room:
        """Cập nhật phòng (chỉ basic info, không có utilities/photos).

        Args:
            room: Room instance cần update.
            room_dict: Dict chứa dữ liệu mới.

        Returns:
            Room instance đã được cập nhật.
        """
        for field, value in room_dict.items():
            if hasattr(room, field):
                setattr(room, field, value)

        self.db.flush()  # Flush để update nhưng chưa commit
        return room

    def delete(self, room: Room) -> None:
        """Xóa phòng khỏi database.

        Args:
            room: Room instance cần xóa.
        """
        self.db.delete(room)
        self.db.commit()

    def list_with_details(
        self,
        building_id: Optional[UUID] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        city: Optional[str] = None,
        ward: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        max_capacity: Optional[int] = None,
        sort_by: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> list[dict]:
        """Lấy danh sách phòng kèm thông tin building và tenant.

        Args:
            building_id: Lọc theo tòa nhà (optional).
            status: Lọc theo trạng thái phòng (optional).
            search: Tìm kiếm theo tên phòng, số phòng hoặc tên tòa nhà (optional).
            city: Lọc theo thành phố (optional).
            ward: Lọc theo phường/quận (optional).
            min_price: Giá thuê tối thiểu (optional).
            max_price: Giá thuê tối đa (optional).
            max_capacity: Số người tối đa (optional).
            sort_by: Sắp xếp (price_asc, price_desc), mặc định created_at desc.
            offset: Vị trí bắt đầu lấy dữ liệu.
            limit: Số lượng tối đa trả về.

        Returns:
            List of dict chứa thông tin room với building name và tenant info.
        """
        # Subquery để lấy contract ACTIVE mới nhất của mỗi room
        active_contract_count_subq = (
            self.db.query(
                Contract.room_id,
                func.sum(Contract.number_of_tenants).label("current_occupants"),
            )
            .filter(Contract.status == ContractStatus.ACTIVE.value)
            .group_by(Contract.room_id)
            .subquery()
        )

        representative_subq = (
            self.db.query(
                Contract.room_id,
                Contract.tenant_id,
                func.row_number()
                .over(
                    partition_by=Contract.room_id,
                    order_by=Contract.created_at.asc(),  # SỚM NHẤT
                )
                .label("rn"),
            )
            .filter(Contract.status == ContractStatus.ACTIVE.value)
            .subquery()
        )

        # Main query với joins
        query = (
            self.db.query(
                Room.id,
                Room.room_number,
                Room.area,
                Room.capacity,
                Room.status,
                Room.base_price,
                Building.building_name,
                RoomType.name.label("room_type_name"),
                func.coalesce(active_contract_count_subq.c.current_occupants, 0).label(
                    "current_occupants"
                ),
                func.concat(User.last_name, " ", User.first_name).label(
                    "representative"
                ),
            )
            .join(Building, Room.building_id == Building.id)
            .outerjoin(RoomType, Room.room_type_id == RoomType.id)
            # JOIN count occupants
            .outerjoin(
                active_contract_count_subq,
                Room.id == active_contract_count_subq.c.room_id,
            )
            # JOIN representative (chỉ rn = 1)
            .outerjoin(
                representative_subq,
                (Room.id == representative_subq.c.room_id)
                & (representative_subq.c.rn == 1),
            )
            .outerjoin(User, representative_subq.c.tenant_id == User.id)
        )

        # Join with Address if city or ward filters needed
        if city or ward:
            query = query.join(Address, Building.address_id == Address.id)

        # Apply filters
        if building_id:
            query = query.filter(Room.building_id == building_id)
        if status:
            query = query.filter(Room.status == status)

        # Apply city and ward filters
        if city:
            query = query.filter(Address.city.ilike(f"%{city}%"))
        if ward:
            query = query.filter(Address.ward.ilike(f"%{ward}%"))

        # Apply search filter - tìm kiếm theo tên phòng, số phòng hoặc tên tòa nhà
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Room.room_number.ilike(search_pattern))
                | (Room.room_name.ilike(search_pattern))
                | (Building.building_name.ilike(search_pattern))
            )

        # Apply price filters
        if min_price is not None:
            query = query.filter(Room.base_price >= min_price)
        if max_price is not None:
            query = query.filter(Room.base_price <= max_price)

        # Apply capacity filter
        if max_capacity is not None:
            query = query.filter(Room.capacity <= max_capacity)

        # Apply sorting - mặc định theo created_at DESC (mới nhất trước)
        if sort_by == "price_asc":
            query = query.order_by(Room.base_price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Room.base_price.desc())
        else:
            query = query.order_by(Room.created_at.desc())

        # Apply pagination
        results = query.offset(offset).limit(limit).all()

        # Convert to dict
        from app.schemas.room_type_schema import RoomTypeSimple

        return [
            {
                "id": row.id,
                "room_number": row.room_number,
                "building_name": row.building_name,
                # 'room_type': RoomTypeSimple(id=row.room_type_id, name=row.room_type_name) if row.room_type_id else None,
                "room_type": row.room_type_name ,
                "area": row.area,
                "capacity": row.capacity,
                "current_occupants": row.current_occupants,
                "status": row.status,
                "base_price": row.base_price,
                "representative": row.representative if row.representative else None,
            }
            for row in results
        ]
