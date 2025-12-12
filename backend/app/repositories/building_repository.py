"""Building Repository - data access layer cho Building entity.

Chỉ xử lý truy vấn database, không chứa business logic.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, case

from app.models.building import Building
from app.models.room import Room
from app.models.address import Address
from app.schemas.building_schema import BuildingCreate, BuildingUpdate
from app.core.Enum.base_enum import StatusEnum
from app.core.Enum.roomEnum import RoomStatus


class BuildingRepository:
    """Repository để thao tác với Building entity trong database.
    
    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """
    
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, building_id: UUID) -> Optional[Building]:
        """Lấy Building theo ID với eager loading address.
        
        Args:
            building_id: UUID của tòa nhà cần tìm.
            
        Returns:
            Building instance hoặc None nếu không tìm thấy.
        """
        return (
            self.db.query(Building)
            .options(joinedload(Building.address))  # Eager load relationship 'address'
            .filter(Building.id == building_id)
            .first()
        )
    
    def get_by_id_with_stats(self, building_id: UUID) -> Optional[dict]:
        """Lấy Building theo ID kèm thống kê phòng.
        
        Args:
            building_id: UUID của tòa nhà cần tìm.
            
        Returns:
            Dict chứa thông tin building và room statistics, hoặc None nếu không tìm thấy.
        """
        # Subquery đếm tổng số phòng
        total_rooms_subq = (
            self.db.query(
                Room.building_id,
                func.count(Room.id).label('total_rooms')
            )
            .group_by(Room.building_id)
            .subquery()
        )
        
        # Subquery đếm phòng trống (AVAILABLE)
        available_rooms_subq = (
            self.db.query(
                Room.building_id,
                func.count(Room.id).label('available_rooms')
            )
            .filter(Room.status == RoomStatus.AVAILABLE.value)
            .group_by(Room.building_id)
            .subquery()
        )
        
        # Subquery đếm phòng đang thuê (OCCUPIED)
        rented_rooms_subq = (
            self.db.query(
                Room.building_id,
                func.count(Room.id).label('rented_rooms')
            )
            .filter(Room.status == RoomStatus.OCCUPIED.value)
            .group_by(Room.building_id)
            .subquery()
        )
        
        # Main query
        result = (
            self.db.query(
                Building.id,
                Building.building_code,
                Building.building_name,
                Building.description,
                Building.status,
                Building.created_at,
                Building.updated_at,
                Address.full_address.label('address_line'),
                func.coalesce(total_rooms_subq.c.total_rooms, 0).label('total_rooms'),
                func.coalesce(available_rooms_subq.c.available_rooms, 0).label('available_rooms'),
                func.coalesce(rented_rooms_subq.c.rented_rooms, 0).label('rented_rooms'),
            )
            .join(Address, Building.address_id == Address.id)
            .outerjoin(total_rooms_subq, Building.id == total_rooms_subq.c.building_id)
            .outerjoin(available_rooms_subq, Building.id == available_rooms_subq.c.building_id)
            .outerjoin(rented_rooms_subq, Building.id == rented_rooms_subq.c.building_id)
            .filter(Building.id == building_id)
            .first()
        )
        
        if not result:
            return None
        
        return {
            'id': result.id,
            'building_code': result.building_code,
            'building_name': result.building_name,
            'description': result.description,
            'status': result.status,
            'created_at': result.created_at,
            'updated_at': result.updated_at,
            'address_line': result.address_line or '',
            'total_rooms': result.total_rooms,
            'available_rooms': result.available_rooms,
            'rented_rooms': result.rented_rooms,
        }

    def get_by_code(self, building_code: str) -> Optional[Building]:
        """Lấy Building theo code.
        
        Args:
            building_code: Mã tòa nhà cần tìm.
            
        Returns:
            Building instance hoặc None nếu không tìm thấy.
        """
        return self.db.query(Building).filter(Building.building_code == building_code).first()

    def list(
        self,
        address_id: Optional[UUID] = None,
        status: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> list[Building]:
        """Lấy danh sách tòa nhà với filter và pagination.
        
        Args:
            address_id: Lọc theo địa chỉ (optional).
            status: Lọc theo trạng thái (optional).
            offset: Vị trí bắt đầu lấy dữ liệu.
            limit: Số lượng tối đa trả về.
            
        Returns:
            Danh sách Building instances với eager loading.
        """
        query = self.db.query(Building).options(
            joinedload(Building.address),
            joinedload(Building.rooms)
        )
        
        if address_id:
            query = query.filter(Building.address_id == address_id)
        if status:
            query = query.filter(Building.status == status)
            
        return query.offset(offset).limit(limit).all()
    
    def list_with_room_stats(
        self,
        address_id: Optional[UUID] = None,
        status: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> list[dict]:
        """Lấy danh sách tòa nhà kèm thống kê số phòng.
        
        Args:
            address_id: Lọc theo địa chỉ (optional).
            status: Lọc theo trạng thái (optional).
            offset: Vị trí bắt đầu lấy dữ liệu.
            limit: Số lượng tối đa trả về.
            
        Returns:
            List of dict chứa thông tin building và room statistics.
        """
        # Subquery đếm tổng số phòng
        total_rooms_subq = (
            self.db.query(
                Room.building_id,
                func.count(Room.id).label('total_rooms')
            )
            .group_by(Room.building_id)
            .subquery()
        )
        
        # Subquery đếm phòng trống (AVAILABLE)
        available_rooms_subq = (
            self.db.query(
                Room.building_id,
                func.count(Room.id).label('available_rooms')
            )
            .filter(Room.status == RoomStatus.AVAILABLE.value)
            .group_by(Room.building_id)
            .subquery()
        )
        
        # Subquery đếm phòng đang thuê (OCCUPIED)
        rented_rooms_subq = (
            self.db.query(
                Room.building_id,
                func.count(Room.id).label('rented_rooms')
            )
            .filter(Room.status == RoomStatus.OCCUPIED.value)
            .group_by(Room.building_id)
            .subquery()
        )
        
        # Main query với joins
        query = (
            self.db.query(
                Building.id,
                Building.building_code,
                Building.building_name,
                Building.status,
                Building.description,
                Building.created_at,
                Address.full_address.label('address_line'),
                func.coalesce(total_rooms_subq.c.total_rooms, 0).label('total_rooms'),
                func.coalesce(available_rooms_subq.c.available_rooms, 0).label('available_rooms'),
                func.coalesce(rented_rooms_subq.c.rented_rooms, 0).label('rented_rooms'),
            )
            .join(Address, Building.address_id == Address.id)
            .outerjoin(total_rooms_subq, Building.id == total_rooms_subq.c.building_id)
            .outerjoin(available_rooms_subq, Building.id == available_rooms_subq.c.building_id)
            .outerjoin(rented_rooms_subq, Building.id == rented_rooms_subq.c.building_id)
        )
        
        # Apply filters
        if address_id:
            query = query.filter(Building.address_id == address_id)
        if status:
            query = query.filter(Building.status == status)
        
        # Apply pagination
        results = query.offset(offset).limit(limit).all()
        
        # Convert to dict
        return [
            {
                'id': row.id,
                'building_code': row.building_code,
                'building_name': row.building_name,
                'address_line': row.address_line or '',
                'total_rooms': row.total_rooms,
                'available_rooms': row.available_rooms,
                'rented_rooms': row.rented_rooms,
                'status': row.status,
                'description': row.description,
                'created_at': row.created_at,
            }
            for row in results
        ]

    def count(
        self,
        address_id: Optional[UUID] = None,
        status: Optional[str] = None,
    ) -> int:
        """Đếm tổng số tòa nhà theo filter.
        
        Args:
            address_id: Lọc theo địa chỉ (optional).
            status: Lọc theo trạng thái (optional).
            
        Returns:
            Tổng số tòa nhà.
        """
        query = self.db.query(Building)
        
        if address_id:
            query = query.filter(Building.address_id == address_id)
        if status:
            query = query.filter(Building.status == status)
            
        return query.count()

    def create(self, data: BuildingCreate) -> Building:
        """Tạo tòa nhà mới trong database.
        
        Args:
            data: BuildingCreate schema chứa dữ liệu tòa nhà.
            
        Returns:
            Building instance vừa được tạo.
        """
        building = Building(**data)
        self.db.add(building)
        self.db.commit()
        self.db.refresh(building)
        return building

    def update(self, building: Building, data: BuildingUpdate) -> Building:
        """Cập nhật thông tin tòa nhà.
        
        Args:
            building: Building instance cần update.
            data: BuildingUpdate schema chứa dữ liệu mới.
            
        Returns:
            Building instance đã được cập nhật.
        """
        # Chỉ update các field được set trong request, loại bỏ field 'address'
        update_data = data.model_dump(exclude_unset=True, exclude={"address"})
        for field, value in update_data.items():
            setattr(building, field, value)
            
        self.db.commit()
        self.db.refresh(building)
        return building

    def update_from_dict(self, building: Building, data: dict) -> Building:
        """Cập nhật thông tin tòa nhà từ dict.
        
        Args:
            building: Building instance cần update.
            data: Dict chứa dữ liệu mới (đã xử lý address_id).
            
        Returns:
            Building instance đã được cập nhật.
        """
        for field, value in data.items():
            if hasattr(building, field):
                setattr(building, field, value)
            
        self.db.commit()
        self.db.refresh(building)
        return building

    def delete(self, building: Building) -> None:
        """Xóa tòa nhà khỏi database.
        
        Args:
            building: Building instance cần xóa.
        """
        self.db.delete(building)
        self.db.commit()
