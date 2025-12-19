"""Contract Repository - Data access layer cho Contract entity.

Chịu trách nhiệm:
- Các truy vấn database liên quan đến Contract
- Trả về ORM models
- Không chứa business logic
"""

from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID
from decimal import Decimal

from sqlalchemy import select, func, and_, case, or_
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from app.models.contract import Contract
from app.models.room import Room
from app.models.building import Building
from app.models.user import User
from app.schemas.contract_schema import ContractCreate, ContractUpdate
from app.core.Enum.contractEnum import ContractStatus


class ContractRepository:
    """Repository cho Contract entity.
    
    Args:
        db: SQLAlchemy session được tiêm qua FastAPI Depends.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, contract_id: UUID) -> Optional[Contract]:
        """Lấy hợp đồng theo ID (không load relationships).
        
        Args:
            contract_id: UUID của hợp đồng
            
        Returns:
            Contract ORM instance hoặc None nếu không tìm thấy
        """
        return self.db.query(Contract).filter(Contract.id == contract_id).first()
    
    def get_by_id_with_relations(self, contract_id: UUID) -> Optional[Contract]:
        """Lấy hợp đồng theo ID kèm relationships (room, tenant, creator).
        
        Args:
            contract_id: UUID của hợp đồng
            
        Returns:
            Contract ORM instance với eager-loaded relationships hoặc None
        """
        return (
            self.db.query(Contract)
            .options(
                joinedload(Contract.room),
                joinedload(Contract.tenant),
                joinedload(Contract.creator)
            )
            .filter(Contract.id == contract_id)
            .first()
        )
    
    def get_by_contract_number(self, contract_number: str) -> Optional[Contract]:
        """Lấy hợp đồng theo mã hợp đồng.
        
        Args:
            contract_number: Mã hợp đồng (ví dụ: HD01, HD02)
            
        Returns:
            Contract ORM instance hoặc None
        """
        return self.db.query(Contract).filter(Contract.contract_number == contract_number).first()
    
    def list_with_details(
        self, 
        offset: int = 0, 
        limit: int = 20,
        status_filter: Optional[str] = None,
        building_filter: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> list[dict]:
        """Lấy danh sách hợp đồng với thông tin chi tiết cho UI table.
        
        Trả về:
        - contract_number: Mã hợp đồng
        - room_number: Số phòng
        - tenant_name: Tên khách hàng (họ tên đầy đủ)
        - building_name: Tên tòa nhà
        - start_date, end_date: Thời hạn hợp đồng
        - rental_price: Giá thuê
        - status: Trạng thái
        - created_at: Thời gian tạo
        
        Args:
            offset: Vị trí bắt đầu (pagination)
            limit: Số lượng records tối đa
            status_filter: Lọc theo trạng thái (ACTIVE, EXPIRED, TERMINATED, PENDING)
            building_filter: Lọc theo tên tòa nhà
            search_query: Tìm kiếm theo mã hợp đồng, tên khách hàng, số điện thoại
            
        Returns:
            List[dict] chứa thông tin hợp đồng đã join
        """
        
        # Ghép tên đầy đủ của tenant
        # Build tenant full name as "last_name first_name" (middle_name removed)
        tenant_full_name = func.concat(
            User.last_name, ' ', User.first_name
        )
        
        query = (
            self.db.query(
                Contract.id,
                Contract.contract_number,
                Room.room_number,
                tenant_full_name.label("tenant_name"),
                Building.building_name,
                Contract.start_date,
                Contract.end_date,
                Contract.rental_price,
                Contract.status,
                Contract.created_at
            )
            .join(Room, Contract.room_id == Room.id)
            .join(Building, Room.building_id == Building.id)
            .join(User, Contract.tenant_id == User.id)
        )
        
        # Áp dụng filters
        if status_filter:
            query = query.filter(Contract.status == status_filter)
        
        if building_filter:
            query = query.filter(Building.building_name.ilike(f"%{building_filter}%"))
        
        if search_query:
            query = query.filter(
                or_(
                    Contract.contract_number.ilike(f"%{search_query}%"),
                    tenant_full_name.ilike(f"%{search_query}%"),
                    User.phone.ilike(f"%{search_query}%")
                )
            )
        
        # Order by created_at desc (mới nhất trước)
        query = query.order_by(Contract.created_at.desc())
        
        # Pagination
        query = query.offset(offset).limit(limit)
        
        # Convert to dict list
        results = query.all()
        return [
            {
                "id": row.id,
                "contract_number": row.contract_number,
                "room_number": row.room_number,
                "tenant_name": row.tenant_name,
                "building_name": row.building_name,
                "start_date": row.start_date,
                "end_date": row.end_date,
                "rental_price": row.rental_price,
                "status": row.status,
                "created_at": row.created_at
            }
            for row in results
        ]
    
    def count_contracts(
        self,
        status_filter: Optional[str] = None,
        building_filter: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> int:
        """Đếm tổng số hợp đồng (để hỗ trợ pagination).
        
        Args:
            status_filter: Lọc theo trạng thái
            building_filter: Lọc theo tên tòa nhà
            search_query: Tìm kiếm theo mã/tên/sđt
            
        Returns:
            Số lượng hợp đồng thỏa mãn điều kiện
        """
        tenant_full_name = func.concat(
            User.last_name, ' ', User.first_name
        )
        
        query = (
            self.db.query(func.count(Contract.id))
            .join(Room, Contract.room_id == Room.id)
            .join(Building, Room.building_id == Building.id)
            .join(User, Contract.tenant_id == User.id)
        )
        
        if status_filter:
            query = query.filter(Contract.status == status_filter)
        
        if building_filter:
            query = query.filter(Building.building_name.ilike(f"%{building_filter}%"))
        
        if search_query:
            query = query.filter(
                or_(
                    Contract.contract_number.ilike(f"%{search_query}%"),
                    tenant_full_name.ilike(f"%{search_query}%"),
                    User.phone.ilike(f"%{search_query}%")
                )
            )
        
        return query.scalar()
    
    def get_contract_stats(self) -> dict:
        """Lấy thống kê hợp đồng cho dashboard.
        
        Returns:
            Dict chứa:
            - total_contracts: Tổng hợp đồng
            - active_contracts: Đang hoạt động
            - expiring_soon: Sắp hết hạn (< 30 ngày)
            - expired_contracts: Đã hết hạn
        """
        from datetime import timedelta
        today = date.today()
        expiring_date = today + timedelta(days=30)
        
        total = self.db.query(func.count(Contract.id)).scalar()
        active = self.db.query(func.count(Contract.id)).filter(
            Contract.status == ContractStatus.ACTIVE.value
        ).scalar()
        
        expiring = self.db.query(func.count(Contract.id)).filter(
            and_(
                Contract.status == ContractStatus.ACTIVE.value,
                Contract.end_date <= expiring_date,
                Contract.end_date >= today
            )
        ).scalar()
        
        expired = self.db.query(func.count(Contract.id)).filter(
            Contract.status == ContractStatus.EXPIRED.value
        ).scalar()
        
        return {
            "total_contracts": total or 0,
            "active_contracts": active or 0,
            "expiring_soon": expiring or 0,
            "expired_contracts": expired or 0
        }
    
    def create(self, data: ContractCreate, created_by: UUID) -> Contract:
        """Tạo hợp đồng mới.
        
        Args:
            data: ContractCreate schema
            created_by: UUID của user tạo hợp đồng
            
        Returns:
            Contract ORM instance vừa tạo
            
        Raises:
            IntegrityError: Nếu contract_number đã tồn tại
        """
        contract_dict = data.model_dump(exclude={"contract_number", "service_fees"})
        
        # Convert service_fees từ Pydantic models sang dict để lưu JSON
        # Phải convert Decimal sang float để JSON serialize được
        if data.service_fees:
            service_fees_json = []
            for fee in data.service_fees:
                fee_dict = fee.model_dump()
                # Convert Decimal to float
                if isinstance(fee_dict.get('amount'), Decimal):
                    fee_dict['amount'] = float(fee_dict['amount'])
                service_fees_json.append(fee_dict)
            contract_dict["service_fees"] = service_fees_json
        
        # Tạo contract_number nếu chưa có
        contract_number = data.contract_number
        if not contract_number:
            # Tự động sinh mã: HD + số thứ tự
            max_number = self.db.query(func.max(Contract.contract_number)).scalar()
            if max_number:
                # Extract số từ HD001 -> 1, increment
                try:
                    num = int(max_number.replace("HD", ""))
                    contract_number = f"HD{num + 1:03d}"
                except:
                    contract_number = "HD001"
            else:
                contract_number = "HD001"
        
        # ID (UUIDv7) sẽ được tự động tạo bởi BaseModel.id default=generate_uuid7
        obj = Contract(
            contract_number=contract_number,
            created_by=created_by,
            **contract_dict
        )
        
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def update(self, obj: Contract, data: ContractUpdate) -> Contract:
        """Cập nhật hợp đồng.
        
        Args:
            obj: Contract ORM instance cần update
            data: ContractUpdate schema với các trường cần update
            
        Returns:
            Contract ORM instance đã update
        """
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def delete(self, obj: Contract) -> None:
        """Xóa hợp đồng.
        
        Args:
            obj: Contract ORM instance cần xóa
        """
        self.db.delete(obj)
        self.db.commit()
    
    def check_room_has_active_contract(self, room_id: UUID) -> bool:
        """Kiểm tra phòng có hợp đồng đang hoạt động không.
        
        Args:
            room_id: UUID của phòng
            
        Returns:
            True nếu phòng có hợp đồng ACTIVE, False nếu không
        """
        count = (
            self.db.query(func.count(Contract.id))
            .filter(
                and_(
                    Contract.room_id == room_id,
                    Contract.status == ContractStatus.ACTIVE.value
                )
            )
            .scalar()
        )
        return count > 0
    
    def get_total_tenants_in_room(self, room_id: UUID, exclude_contract_id: Optional[UUID] = None) -> int:
        """Đếm tổng số người đang ở trong phòng từ tất cả hợp đồng ACTIVE.
        
        Hỗ trợ phòng ở ghép: Tính tổng number_of_tenants từ tất cả hợp đồng ACTIVE.
        
        Args:
            room_id: UUID của phòng
            exclude_contract_id: UUID của hợp đồng cần loại trừ (dùng khi update)
            
        Returns:
            Tổng số người đang ở trong phòng
            
        Example:
            - Hợp đồng 1: 2 người (ACTIVE)
            - Hợp đồng 2: 1 người (ACTIVE)
            - Tổng: 3 người
        """
        query = (
            self.db.query(func.sum(Contract.number_of_tenants))
            .filter(
                and_(
                    Contract.room_id == room_id,
                    Contract.status == ContractStatus.ACTIVE.value
                )
            )
        )
        
        # Loại trừ hợp đồng hiện tại nếu đang update
        if exclude_contract_id:
            query = query.filter(Contract.id != exclude_contract_id)
        
        total = query.scalar()
        return total if total else 0

    def get_active_contracts_by_room(self, room_id: UUID) -> list[Contract]:
        """Lấy tất cả hợp đồng đang hoạt động của phòng (hỗ trợ phòng ở ghép).
        
        Args:
            room_id: UUID của phòng
            
        Returns:
            List các Contract ORM instances với tenant relationship
        """
        return (
            self.db.query(Contract)
            .options(joinedload(Contract.tenant))
            .filter(
                and_(
                    Contract.room_id == room_id,
                    Contract.status == ContractStatus.ACTIVE.value
                )
            )
            .order_by(Contract.created_at.asc())  # Sắp xếp theo thời gian tạo
            .all()
        )
    
    def get_primary_tenant_contract(self, room_id: UUID) -> Optional[Contract]:
        """Lấy hợp đồng của người đại diện (hợp đồng được tạo đầu tiên).
        
        Trong phòng ở ghép, người ký hợp đồng đầu tiên được coi là người đại diện.
        Người này chịu trách nhiệm liên lạc chính với chủ trọ.
        
        Args:
            room_id: UUID của phòng
            
        Returns:
            Contract ORM instance của người đại diện, hoặc None nếu không có
            
        Example:
            - Hợp đồng A: created_at = 2025-01-01 (người đại diện ✓)
            - Hợp đồng B: created_at = 2025-03-01
            - Hợp đồng C: created_at = 2025-06-01
        """
        return (
            self.db.query(Contract)
            .options(joinedload(Contract.tenant))
            .filter(
                and_(
                    Contract.room_id == room_id,
                    Contract.status == ContractStatus.ACTIVE.value
                )
            )
            .order_by(Contract.created_at.asc())  # Lấy hợp đồng cũ nhất
            .first()
        )
    
    def get_active_contract_by_room(self, room_id: UUID) -> Optional[Contract]:
        """Lấy hợp đồng đang hoạt động của phòng (nếu có).
        
        Deprecated: Sử dụng get_active_contracts_by_room() cho phòng ở ghép.
        Method này chỉ trả về 1 hợp đồng đầu tiên.
        
        Args:
            room_id: UUID của phòng
            
        Returns:
            Contract ORM instance với tenant relationship hoặc None
        """
        return (
            self.db.query(Contract)
            .options(joinedload(Contract.tenant))
            .filter(
                and_(
                    Contract.room_id == room_id,
                    Contract.status == ContractStatus.ACTIVE.value
                )
            )
            .first()
        )
