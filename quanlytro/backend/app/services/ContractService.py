"""Contract Service - Business logic layer cho Contract entity.

Chịu trách nhiệm:
- Xử lý luồng nghiệp vụ cho hợp đồng (create/update/delete/list)
- Validate business rules (phòng có hợp đồng active không, ngày hợp lệ...)
- Gọi Repository để thao tác database
- Trả về Pydantic schemas
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.repositories.contract_repository import ContractRepository
from app.repositories.room_repository import RoomRepository
from app.repositories.user_repository import UserRepository
from app.schemas.contract_schema import (
    ContractCreate,
    ContractUpdate,
    ContractOut,
    ContractListItem
)
from app.core.Enum.contractEnum import ContractStatus
from app.core.Enum.roomEnum import RoomStatus


class ContractService:
    """Service xử lý nghiệp vụ cho Contract.
    
    Business rules:
    - Một phòng chỉ có thể có 1 hợp đồng ACTIVE tại một thời điểm
    - Khi tạo hợp đồng ACTIVE, phòng phải ở trạng thái AVAILABLE
    - Khi tạo hợp đồng ACTIVE, tự động chuyển phòng sang OCCUPIED
    - Khi hủy/kết thúc hợp đồng, phòng trở về AVAILABLE
    - Không thể xóa hợp đồng đã có invoice
    
    Args:
        db: SQLAlchemy session được tiêm qua FastAPI Depends.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.contract_repo = ContractRepository(db)
        self.room_repo = RoomRepository(db)
        self.user_repo = UserRepository(db)
    
    def create_contract(self, data: ContractCreate, created_by: UUID) -> ContractOut:
        """Tạo hợp đồng mới.
        
        Luồng:
        1. Validate room_id và tenant_id tồn tại
        2. Validate phòng không có hợp đồng ACTIVE (nếu tạo hợp đồng ACTIVE)
        3. Validate ngày hợp lệ (end_date > start_date)
        4. Tạo hợp đồng
        5. Nếu hợp đồng ACTIVE, chuyển phòng sang OCCUPIED
        
        Args:
            data: ContractCreate schema
            created_by: UUID của user tạo hợp đồng
            
        Returns:
            ContractOut schema
            
        Raises:
            ValueError: Nếu vi phạm business rules
        """
        # 1. Validate room tồn tại
        room = self.room_repo.get_by_id(data.room_id)
        if not room:
            raise ValueError(f"Không tìm thấy phòng với ID: {data.room_id}")
        
        # 2. Validate tenant tồn tại
        tenant = self.user_repo.get_by_id(data.tenant_id)
        if not tenant:
            raise ValueError(f"Không tìm thấy khách hàng với ID: {data.tenant_id}")
        
        # 3. Validate phòng ở ghép: Kiểm tra còn chỗ trống
        contract_status = data.status if hasattr(data, 'status') and data.status else ContractStatus.ACTIVE.value
        
        if contract_status == ContractStatus.ACTIVE.value:
            # Đếm tổng số người đang ở trong phòng từ các hợp đồng ACTIVE
            current_tenants = self.contract_repo.get_total_tenants_in_room(data.room_id)
            new_tenants = data.number_of_tenants
            total_after_add = current_tenants + new_tenants
            
            # Kiểm tra không vượt quá sức chứa
            if total_after_add > room.capacity:
                raise ValueError(
                    f"Phòng {room.room_number} chỉ còn {room.capacity - current_tenants}/{room.capacity} chỗ trống. "
                    f"Hiện có {current_tenants} người, không thể thêm {new_tenants} người nữa."
                )
            
            # 4. Validate phòng phải AVAILABLE, RESERVED hoặc OCCUPIED (ở ghép) để tạo hợp đồng ACTIVE
            if room.status not in [RoomStatus.AVAILABLE.value, RoomStatus.RESERVED.value, RoomStatus.OCCUPIED.value]:
                raise ValueError(
                    f"Phòng {room.room_number} không ở trạng thái sẵn sàng (hiện tại: {room.status})"
                )
        else:
            # Nếu tạo hợp đồng PENDING, phòng chỉ cần AVAILABLE hoặc OCCUPIED (có thể đặt trước cho phòng ở ghép)
            if room.status not in [RoomStatus.AVAILABLE.value, RoomStatus.OCCUPIED.value]:
                raise ValueError(
                    f"Phòng {room.room_number} không ở trạng thái sẵn sàng (hiện tại: {room.status})"
                )
        
        # 5. Tạo hợp đồng
        try:
            contract_orm = self.contract_repo.create(data, created_by)
        except IntegrityError as e:
            # Xử lý lỗi duplicate contract_number
            if "contract_number" in str(e.orig):
                raise ValueError(f"Mã hợp đồng '{data.contract_number}' đã tồn tại. Vui lòng sử dụng mã khác.")
            # Các lỗi IntegrityError khác
            raise ValueError(f"Lỗi tạo hợp đồng: {str(e.orig)}")
        
        # 6. Cập nhật trạng thái phòng dựa theo status hợp đồng
        from app.schemas.room_schema import RoomUpdate
        
        if contract_status == ContractStatus.ACTIVE.value:
            # Hợp đồng ACTIVE → phòng chuyển sang OCCUPIED
            # (Nếu đã OCCUPIED rồi thì giữ nguyên - trường hợp ở ghép)
            if room.status != RoomStatus.OCCUPIED.value:
                room_update = RoomUpdate(status=RoomStatus.OCCUPIED.value)
                self.room_repo.update(room, room_update)
        elif contract_status == ContractStatus.PENDING.value:
            # Hợp đồng PENDING → phòng chuyển sang RESERVED (đã đặt cọc, chờ vào ở)
            # Nếu phòng đã OCCUPIED (có người ở rồi), giữ nguyên
            if room.status == RoomStatus.AVAILABLE.value:
                room_update = RoomUpdate(status=RoomStatus.RESERVED.value)
                self.room_repo.update(room, room_update)
        
        # 7. Upgrade tenant từ CUSTOMER → TENANT (nếu là CUSTOMER)
        from app.services.AuthService import AuthService
        auth_service = AuthService(self.db)
        ok, msg, upgraded_tenant = auth_service.upgrade_customer_to_tenant(data.tenant_id)
        if ok:
            print(f"✅ Upgraded user {data.tenant_id} to TENANT: {msg}")
        else:
            print(f"ℹ️ User {data.tenant_id} not upgraded: {msg}")
        
        # 8. Convert ORM sang Pydantic schema
        return ContractOut.model_validate(contract_orm)
    
    def get_contract(self, contract_id: UUID) -> ContractOut:
        """Lấy chi tiết hợp đồng theo ID.
        
        Args:
            contract_id: UUID của hợp đồng
            
        Returns:
            ContractOut schema
            
        Raises:
            ValueError: Nếu không tìm thấy hợp đồng
        """
        contract_orm = self.contract_repo.get_by_id_with_relations(contract_id)
        if not contract_orm:
            raise ValueError(f"Không tìm thấy hợp đồng với ID: {contract_id}")
        
        return ContractOut.model_validate(contract_orm)
    
    def list_contracts(
        self,
        page: int = 1,
        size: int = 20,
        status: Optional[str] = None,
        building: Optional[str] = None,
        search: Optional[str] = None
    ) -> dict:
        """Lấy danh sách hợp đồng với pagination và filters.
        
        Args:
            page: Số trang (bắt đầu từ 1)
            size: Số lượng items mỗi trang
            status: Lọc theo trạng thái (ACTIVE, EXPIRED, TERMINATED, PENDING)
            building: Lọc theo tên tòa nhà
            search: Tìm kiếm theo mã hợp đồng, tên khách, sđt
            
        Returns:
            Dict chứa:
            - items: List[ContractListItem]
            - total: Tổng số hợp đồng
            - page: Trang hiện tại
            - size: Kích thước trang
            - pages: Tổng số trang
        """
        offset = (page - 1) * size
        
        # Lấy dữ liệu từ repository
        items_dict = self.contract_repo.list_with_details(
            offset=offset,
            limit=size,
            status_filter=status,
            building_filter=building,
            search_query=search
        )
        
        # Convert sang ContractListItem schemas
        items = [ContractListItem.model_validate(item) for item in items_dict]
        
        # Đếm tổng số
        total = self.contract_repo.count_contracts(
            status_filter=status,
            building_filter=building,
            search_query=search
        )
        
        pages = (total + size - 1) // size  # ceiling division
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": pages
        }
    
    def update_contract(self, contract_id: UUID, data: ContractUpdate) -> ContractOut:
        """Cập nhật hợp đồng.
        
        Luồng:
        1. Get hợp đồng (không load relations để tránh tracking issues)
        2. Validate business rules nếu cập nhật status
        3. Update hợp đồng
        4. Nếu chuyển sang TERMINATED/EXPIRED, chuyển phòng về AVAILABLE
        5. Get lại hợp đồng với relations và trả về
        
        Args:
            contract_id: UUID của hợp đồng
            data: ContractUpdate schema
            
        Returns:
            ContractOut schema
            
        Raises:
            ValueError: Nếu không tìm thấy hoặc vi phạm business rules
        """
        # 1. Get hợp đồng (không load relations)
        contract_orm = self.contract_repo.get_by_id(contract_id)
        if not contract_orm:
            raise ValueError(f"Không tìm thấy hợp đồng với ID: {contract_id}")
        
        # 2. Lưu trạng thái cũ để kiểm tra
        old_status = contract_orm.status
        old_number_of_tenants = contract_orm.number_of_tenants
        
        # 2.1. Nếu thay đổi số người, kiểm tra sức chứa
        if data.number_of_tenants is not None and data.number_of_tenants != old_number_of_tenants:
            room = self.room_repo.get_by_id(contract_orm.room_id)
            if room:
                # Tính tổng số người sau khi thay đổi (loại trừ hợp đồng hiện tại)
                current_tenants = self.contract_repo.get_total_tenants_in_room(
                    contract_orm.room_id, 
                    exclude_contract_id=contract_id
                )
                total_after_change = current_tenants + data.number_of_tenants
                
                if total_after_change > room.capacity:
                    raise ValueError(
                        f"Phòng {room.room_number} chỉ còn {room.capacity - current_tenants}/{room.capacity} chỗ trống. "
                        f"Không thể tăng lên {data.number_of_tenants} người."
                    )
        
        # 3. Update hợp đồng
        contract_orm = self.contract_repo.update(contract_orm, data)
        
        # 4. Xử lý thay đổi trạng thái phòng
        new_status = contract_orm.status
        if old_status != new_status:
            room = self.room_repo.get_by_id(contract_orm.room_id)
            if room:
                from app.schemas.room_schema import RoomUpdate
                
                # Nếu hợp đồng kết thúc, kiểm tra còn người ở không
                if new_status in [ContractStatus.TERMINATED.value, ContractStatus.EXPIRED.value]:
                    # Kiểm tra còn hợp đồng ACTIVE nào khác không (loại trừ hợp đồng hiện tại)
                    remaining_tenants = self.contract_repo.get_total_tenants_in_room(
                        contract_orm.room_id,
                        exclude_contract_id=contract_id
                    )
                    
                    # Chỉ chuyển về AVAILABLE nếu không còn ai ở
                    if remaining_tenants == 0:
                        if room.status in [RoomStatus.OCCUPIED.value, RoomStatus.RESERVED.value]:
                            room_update = RoomUpdate(status=RoomStatus.AVAILABLE.value)
                            self.room_repo.update(room, room_update)
                
                # Nếu hợp đồng chuyển sang ACTIVE (từ PENDING), chuyển phòng sang OCCUPIED
                elif new_status == ContractStatus.ACTIVE.value and old_status == ContractStatus.PENDING.value:
                    if room.status in [RoomStatus.AVAILABLE.value, RoomStatus.RESERVED.value]:
                        room_update = RoomUpdate(status=RoomStatus.OCCUPIED.value)
                        self.room_repo.update(room, room_update)
                
                # Nếu hợp đồng chuyển sang PENDING (từ ACTIVE - trường hợp hiếm)
                elif new_status == ContractStatus.PENDING.value and old_status == ContractStatus.ACTIVE.value:
                    # Kiểm tra còn người ở không
                    remaining_tenants = self.contract_repo.get_total_tenants_in_room(
                        contract_orm.room_id,
                        exclude_contract_id=contract_id
                    )
                    
                    # Nếu không còn ai, chuyển về RESERVED
                    if remaining_tenants == 0 and room.status == RoomStatus.OCCUPIED.value:
                        room_update = RoomUpdate(status=RoomStatus.RESERVED.value)
                        self.room_repo.update(room, room_update)
        
        # 5. Get lại với relations
        contract_orm = self.contract_repo.get_by_id_with_relations(contract_id)
        return ContractOut.model_validate(contract_orm)
    
    def delete_contract(self, contract_id: UUID) -> None:
        """Xóa hợp đồng.
        
        Luồng:
        1. Get hợp đồng
        2. Validate không có invoice liên quan (TODO)
        3. Nếu hợp đồng ACTIVE, chuyển phòng về AVAILABLE
        4. Xóa hợp đồng
        
        Args:
            contract_id: UUID của hợp đồng
            
        Raises:
            ValueError: Nếu không tìm thấy hoặc có invoice liên quan
        """
        contract_orm = self.contract_repo.get_by_id(contract_id)
        if not contract_orm:
            raise ValueError(f"Không tìm thấy hợp đồng với ID: {contract_id}")
        
        # TODO: Kiểm tra không có invoice liên quan
        # if contract_orm.invoices:
        #     raise ValueError("Không thể xóa hợp đồng đã có hóa đơn")
        
        # Nếu hợp đồng ACTIVE hoặc RESERVED, kiểm tra còn người ở không
        if contract_orm.status in [ContractStatus.ACTIVE.value, ContractStatus.PENDING.value]:
            room = self.room_repo.get_by_id(contract_orm.room_id)
            if room:
                # Kiểm tra còn hợp đồng ACTIVE nào khác không (loại trừ hợp đồng sắp xóa)
                remaining_tenants = self.contract_repo.get_total_tenants_in_room(
                    contract_orm.room_id,
                    exclude_contract_id=contract_id
                )
                
                # Chỉ chuyển về AVAILABLE nếu không còn ai ở
                if remaining_tenants == 0 and room.status in [RoomStatus.OCCUPIED.value, RoomStatus.RESERVED.value]:
                    from app.schemas.room_schema import RoomUpdate
                    room_update = RoomUpdate(status=RoomStatus.AVAILABLE.value)
                    self.room_repo.update(room, room_update)
        
        # Xóa hợp đồng
        self.contract_repo.delete(contract_orm)
    
    def get_contract_stats(self) -> dict:
        """Lấy thống kê hợp đồng cho dashboard.
        
        Returns:
            Dict chứa:
            - total_contracts: Tổng hợp đồng (582)
            - active_contracts: Đang hoạt động (188)
            - expiring_soon: Sắp hết hạn (199)
            - expired_contracts: Đã hết hạn (10)
        """
        return self.contract_repo.get_contract_stats()
    
    def get_room_tenants_info(self, room_id: UUID) -> dict:
        """Lấy thông tin tất cả người thuê trong phòng (hỗ trợ phòng ở ghép).
        
        Args:
            room_id: UUID của phòng
            
        Returns:
            Dict chứa:
            - total_tenants: Tổng số người đang ở
            - contracts: List các hợp đồng ACTIVE
            - primary_tenant: Thông tin người đại diện (hợp đồng đầu tiên)
            - other_tenants: List người ở ghép khác
            
        Example:
            {
                "total_tenants": 3,
                "contracts": [
                    {"id": "...", "tenant_name": "Người A", "number_of_tenants": 2, "is_primary": True},
                    {"id": "...", "tenant_name": "Người B", "number_of_tenants": 1, "is_primary": False}
                ],
                "primary_tenant": {
                    "name": "Người A",
                    "phone": "0123456789",
                    "contract_number": "HD001",
                    "created_at": "2025-01-01"
                }
            }
        """
        # Lấy tất cả hợp đồng ACTIVE của phòng (đã sắp xếp theo created_at)
        contracts = self.contract_repo.get_active_contracts_by_room(room_id)
        
        if not contracts:
            return {
                "total_tenants": 0,
                "contracts": [],
                "primary_tenant": None,
                "other_tenants": []
            }
        
        # Tổng số người
        total_tenants = sum(c.number_of_tenants for c in contracts)
        
        # Người đại diện (hợp đồng đầu tiên)
        primary_contract = contracts[0]
        primary_tenant = {
            "contract_id": str(primary_contract.id),
            "contract_number": primary_contract.contract_number,
            "name": primary_contract.tenant.full_name,
            "phone": primary_contract.tenant.phone_number,
            "email": primary_contract.tenant.email,
            "number_of_tenants": primary_contract.number_of_tenants,
            "created_at": primary_contract.created_at.isoformat() if primary_contract.created_at else None
        }
        
        # Danh sách tất cả hợp đồng
        contracts_list = []
        other_tenants = []
        
        for idx, contract in enumerate(contracts):
            is_primary = (idx == 0)
            contract_info = {
                "id": str(contract.id),
                "contract_number": contract.contract_number,
                "tenant_name": contract.tenant.full_name,
                "tenant_phone": contract.tenant.phone_number,
                "number_of_tenants": contract.number_of_tenants,
                "rental_price": float(contract.rental_price),
                "is_primary": is_primary,
                "created_at": contract.created_at.isoformat() if contract.created_at else None
            }
            contracts_list.append(contract_info)
            
            if not is_primary:
                other_tenants.append({
                    "name": contract.tenant.full_name,
                    "phone": contract.tenant.phone_number,
                    "number_of_tenants": contract.number_of_tenants
                })
        
        return {
            "total_tenants": total_tenants,
            "num_contracts": len(contracts),
            "contracts": contracts_list,
            "primary_tenant": primary_tenant,
            "other_tenants": other_tenants
        }
