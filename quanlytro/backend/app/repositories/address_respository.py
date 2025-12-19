"""Address Repository - data access layer cho Address entity.

Chỉ xử lý truy vấn database, không chứa business logic.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.address import Address
from app.schemas.address_schema import AddressCreate, AddressUpdate


class AddressRepository:
    """Repository để thao tác với Address entity trong database.
    
    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """
    
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, address_id: UUID) -> Optional[Address]:
        """Lấy Address theo ID.
        
        Args:
            address_id: UUID của địa chỉ cần tìm.
            
        Returns:
            Address instance hoặc None nếu không tìm thấy.
        """
        return self.db.query(Address).filter(Address.id == address_id).first()

    def get_by_full_address(self , full_address:str):
        """Lấy Address theo address.
        
        Args:
            full_address:  địa chỉ cần tìm.
            
        Returns:
            Address instance hoặc None nếu không tìm thấy.
        """
        return self.db.query(Address).filter(Address.full_address == full_address).first()

    def list(
        self,
        city: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> list[Address]:
        """Lấy danh sách địa chỉ với filter và pagination.
        
        Args:
            city: Lọc theo thành phố (optional).
            offset: Vị trí bắt đầu lấy dữ liệu.
            limit: Số lượng tối đa trả về.
            
        Returns:
            Danh sách Address instances.
        """
        query = self.db.query(Address)
        
        if city:
            query = query.filter(Address.city.ilike(f"%{city}%"))
            
        return query.offset(offset).limit(limit).all()

    def count(self, city: Optional[str] = None) -> int:
        """Đếm tổng số địa chỉ theo filter.
        
        Args:
            city: Lọc theo thành phố (optional).
            
        Returns:
            Tổng số địa chỉ.
        """
        query = self.db.query(Address)
        
        if city:
            query = query.filter(Address.city.ilike(f"%{city}%"))
            
        return query.count()

    def create(self, data: AddressCreate) -> Address:
        """Tạo địa chỉ mới trong database.
        
        Args:
            data: AddressCreate schema chứa dữ liệu địa chỉ.
            
        Returns:
            Address instance vừa được tạo.
        """
        # Auto-generate full_address nếu không có
        address_data = data.model_dump()
        if not address_data.get("full_address"):
            address_data["full_address"] = f"{data.address_line}, {data.ward}, {data.city}, {data.country}"
        
        address = Address(**address_data)
        self.db.add(address)
        self.db.commit()
        self.db.refresh(address)
        return address

    def update(self, address: Address, data: AddressUpdate) -> Address:
        """Cập nhật thông tin địa chỉ.
        
        Args:
            address: Address instance cần update.
            data: AddressUpdate schema chứa dữ liệu mới.
            
        Returns:
            Address instance đã được cập nhật.
        """
        # Chỉ update các field được set trong request
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(address, field, value)
        
        # Auto-regenerate full_address nếu các field liên quan thay đổi
        if any(f in update_data for f in ["address_line", "ward", "city", "country"]):
            if "full_address" not in update_data:
                address.full_address = f"{address.address_line}, {address.ward}, {address.city}, {address.country}"
            
        self.db.commit()
        self.db.refresh(address)
        return address

    def delete(self, address: Address) -> None:
        """Xóa địa chỉ khỏi database.
        
        Args:
            address: Address instance cần xóa.
        """
        self.db.delete(address)
        self.db.commit()
