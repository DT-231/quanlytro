"""RoomType Repository - data access layer cho RoomType entity.

Chỉ xử lý truy vấn database, không chứa business logic.
"""

from __future__ import annotations

from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.room_type import RoomType
from app.schemas.room_type_schema import RoomTypeCreate, RoomTypeUpdate


class RoomTypeRepository:
    """Repository để thao tác với RoomType entity trong database.
    
    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """
    
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, room_type_id: UUID) -> Optional[RoomType]:
        """Lấy RoomType theo ID.
        
        Args:
            room_type_id: UUID của loại phòng cần tìm.
            
        Returns:
            RoomType instance hoặc None nếu không tìm thấy.
        """
        return self.db.query(RoomType).filter(RoomType.id == room_type_id).first()
    
    def get_by_name(self, name: str) -> Optional[RoomType]:
        """Lấy RoomType theo tên.
        
        Args:
            name: Tên loại phòng.
            
        Returns:
            RoomType instance hoặc None nếu không tìm thấy.
        """
        return self.db.query(RoomType).filter(RoomType.name == name).first()

    def list(
        self,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> List[RoomType]:
        """Lấy danh sách loại phòng với filter, search và pagination.
        
        Args:
            is_active: Lọc theo trạng thái active (optional).
            search: Tìm kiếm theo tên loại phòng (optional).
            offset: Vị trí bắt đầu lấy dữ liệu.
            limit: Số lượng tối đa trả về.
            
        Returns:
            Danh sách RoomType instances.
        """
        query = self.db.query(RoomType)
        
        if is_active is not None:
            query = query.filter(RoomType.is_active == is_active)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(RoomType.name.ilike(search_pattern))
        
        return query.offset(offset).limit(limit).all()
    
    def count(self, is_active: Optional[bool] = None) -> int:
        """Đếm số lượng loại phòng.
        
        Args:
            is_active: Lọc theo trạng thái active (optional).
            
        Returns:
            Số lượng loại phòng.
        """
        query = self.db.query(RoomType)
        
        if is_active is not None:
            query = query.filter(RoomType.is_active == is_active)
        
        return query.count()

    def create(self, room_type_data: RoomTypeCreate) -> RoomType:
        """Tạo RoomType mới trong database.
        
        Args:
            room_type_data: Dữ liệu loại phòng từ schema.
            
        Returns:
            RoomType instance đã được tạo.
        """
        new_room_type = RoomType(**room_type_data.model_dump())
        self.db.add(new_room_type)
        self.db.flush()
        self.db.refresh(new_room_type)
        return new_room_type

    def update(self, room_type: RoomType, update_data: RoomTypeUpdate) -> RoomType:
        """Cập nhật thông tin RoomType.
        
        Args:
            room_type: Instance RoomType cần cập nhật.
            update_data: Dữ liệu cập nhật từ schema.
            
        Returns:
            RoomType instance đã được cập nhật.
        """
        update_dict = update_data.model_dump(exclude_unset=True)
        
        for field, value in update_dict.items():
            setattr(room_type, field, value)
        
        self.db.flush()
        self.db.refresh(room_type)
        return room_type

    def delete(self, room_type: RoomType) -> None:
        """Xóa RoomType khỏi database (hard delete).
        
        Args:
            room_type: Instance RoomType cần xóa.
        """
        self.db.delete(room_type)
        self.db.flush()
    
    def soft_delete(self, room_type: RoomType) -> RoomType:
        """Soft delete RoomType bằng cách set is_active = False.
        
        Args:
            room_type: Instance RoomType cần xóa.
            
        Returns:
            RoomType instance đã được deactivate.
        """
        room_type.is_active = False
        self.db.flush()
        self.db.refresh(room_type)
        return room_type
