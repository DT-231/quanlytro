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
from app.models.user import User
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
        
        # 7. Upgrade tenant từ CUSTOMER → TENANT chỉ khi hợp đồng ACTIVE
        if contract_status == ContractStatus.ACTIVE.value:
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
        pageSize: int = 20,
        status: Optional[str] = None,
        building: Optional[str] = None,
        search: Optional[str] = None,
        current_user: User = None,
    ) -> dict:
        """Lấy danh sách hợp đồng với pagination và filters.
        
        Args:
            page: Số trang (bắt đầu từ 1)
            pageSize: Số items mỗi trang
            status: Lọc theo trạng thái (ACTIVE, EXPIRED, TERMINATED, PENDING)
            building: Lọc theo tên tòa nhà
            search: Tìm kiếm theo mã hợp đồng, tên khách, sđt
            current_user: User hiện tại
            
        Returns:
            Dict chứa items và pagination (totalItems, page, pageSize, totalPages).
        """
        # Validate page và pageSize
        if page < 1:
            page = 1
        if pageSize < 1:
            pageSize = 20
        if pageSize > 100:
            pageSize = 100
            
        offset = (page - 1) * pageSize
        
        tenant_id = None
        if current_user and current_user.role.role_code == "TENANT":
            tenant_id = current_user.id
        
        # Lấy dữ liệu từ repository
        items_dict = self.contract_repo.list_with_details(
            offset=offset,
            limit=pageSize,
            status_filter=status,
            building_filter=building,
            search_query=search,
            tenant_id=tenant_id
        )
        
        # Convert sang ContractListItem schemas
        items = [ContractListItem.model_validate(item) for item in items_dict]
        
        # Đếm tổng số
        totalItems = self.contract_repo.count_contracts(
            status_filter=status,
            building_filter=building,
            search_query=search,
            tenant_id=tenant_id
        )
        
        totalPages = (totalItems + pageSize - 1) // pageSize if totalItems > 0 else 1
        
        return {
            "items": items,
            "pagination": {
                "totalItems": totalItems,
                "page": page,
                "pageSize": pageSize,
                "totalPages": totalPages
            }
        }
    
    def update_contract(self, contract_id: UUID, data: ContractUpdate) -> ContractOut:
        """Cập nhật hợp đồng.
        
        Luồng:
        1. Get hợp đồng (không load relations để tránh tracking issues)
        2. Kiểm tra trạng thái - CHỈ cho phép sửa nếu hợp đồng ở trạng thái PENDING
        3. Validate business rules nếu cập nhật status
        4. Update hợp đồng
        5. Nếu chuyển sang TERMINATED/EXPIRED, chuyển phòng về AVAILABLE
        6. Get lại hợp đồng với relations và trả về
        
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
        
        # 2. Kiểm tra trạng thái - CHỈ cho phép sửa nếu hợp đồng ở trạng thái PENDING (chờ ký)
        # Các trạng thái khác (ACTIVE, EXPIRED, TERMINATED, ...) không được phép sửa
        non_editable_statuses = [
            ContractStatus.ACTIVE.value, 
            ContractStatus.EXPIRED.value, 
            ContractStatus.TERMINATED.value
        ]
        if contract_orm.status in non_editable_statuses:
            status_labels = {
                ContractStatus.ACTIVE.value: "đang hoạt động",
                ContractStatus.EXPIRED.value: "đã hết hạn",
                ContractStatus.TERMINATED.value: "đã chấm dứt"
            }
            status_label = status_labels.get(contract_orm.status, contract_orm.status)
            raise ValueError(
                f"Không thể chỉnh sửa hợp đồng {contract_orm.contract_number} vì hợp đồng {status_label}. "
                f"Chỉ có thể sửa hợp đồng ở trạng thái 'Chờ ký' (PENDING)."
            )
        
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
                    
                    # Downgrade tenant về CUSTOMER nếu không còn hợp đồng ACTIVE nào
                    from app.services.AuthService import AuthService
                    auth_service = AuthService(self.db)
                    ok, msg, downgraded_tenant = auth_service.downgrade_tenant_to_customer(contract_orm.tenant_id)
                    if ok:
                        print(f"✅ Downgraded user {contract_orm.tenant_id} to CUSTOMER: {msg}")
                    else:
                        print(f"ℹ️ User {contract_orm.tenant_id} not downgraded: {msg}")
                
                # Nếu hợp đồng chuyển sang ACTIVE (từ PENDING), chuyển phòng sang OCCUPIED
                elif new_status == ContractStatus.ACTIVE.value and old_status == ContractStatus.PENDING.value:
                    if room.status in [RoomStatus.AVAILABLE.value, RoomStatus.RESERVED.value]:
                        room_update = RoomUpdate(status=RoomStatus.OCCUPIED.value)
                        self.room_repo.update(room, room_update)
                    
                    # Upgrade tenant từ CUSTOMER → TENANT khi chuyển sang ACTIVE
                    from app.services.AuthService import AuthService
                    auth_service = AuthService(self.db)
                    ok, msg, upgraded_tenant = auth_service.upgrade_customer_to_tenant(contract_orm.tenant_id)
                    if ok:
                        print(f"✅ Upgraded user {contract_orm.tenant_id} to TENANT: {msg}")
                    else:
                        print(f"ℹ️ User {contract_orm.tenant_id} not upgraded: {msg}")
                
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
                    
                    # Downgrade tenant về CUSTOMER nếu không còn hợp đồng ACTIVE nào
                    from app.services.AuthService import AuthService
                    auth_service = AuthService(self.db)
                    ok, msg, downgraded_tenant = auth_service.downgrade_tenant_to_customer(contract_orm.tenant_id)
                    if ok:
                        print(f"✅ Downgraded user {contract_orm.tenant_id} to CUSTOMER: {msg}")
                    else:
                        print(f"ℹ️ User {contract_orm.tenant_id} not downgraded: {msg}")
        
        # 5. Get lại với relations
        contract_orm = self.contract_repo.get_by_id_with_relations(contract_id)
        return ContractOut.model_validate(contract_orm)
    
    def delete_contract(self, contract_id: UUID) -> None:
        """Xóa hợp đồng.
        
        Luồng:
        1. Get hợp đồng
        2. Validate không phải hợp đồng ACTIVE (không cho xóa)
        3. Kiểm tra invoice liên quan và xử lý (set contract_id = null)
        4. Nếu hợp đồng PENDING, chuyển phòng về AVAILABLE
        5. Xóa hợp đồng
        
        Args:
            contract_id: UUID của hợp đồng
            
        Raises:
            ValueError: Nếu không tìm thấy hoặc hợp đồng đang ACTIVE
        """
        contract_orm = self.contract_repo.get_by_id(contract_id)
        if not contract_orm:
            raise ValueError(f"Không tìm thấy hợp đồng với ID: {contract_id}")
        
        # KHÔNG CHO XÓA hợp đồng đang ACTIVE hoặc đang có yêu cầu chấm dứt
        non_deletable_statuses = [
            ContractStatus.ACTIVE.value,
            ContractStatus.PENDING_UPDATE.value,
            ContractStatus.TERMINATION_REQUESTED_BY_TENANT.value,
            ContractStatus.TERMINATION_REQUESTED_BY_LANDLORD.value,
        ]
        if contract_orm.status in non_deletable_statuses:
            raise ValueError(
                f"Không thể xóa hợp đồng đang ở trạng thái '{contract_orm.status}'. "
                "Chỉ có thể xóa hợp đồng PENDING (chờ xác nhận), EXPIRED (hết hạn) hoặc TERMINATED (đã kết thúc)."
            )
        
        # Xử lý invoice liên quan: set contract_id = null để không bị lỗi FK
        if contract_orm.invoices:
            from app.models.invoice import Invoice
            for invoice in contract_orm.invoices:
                # Giữ invoice nhưng bỏ liên kết với contract đã xóa
                invoice.contract_id = None
                self.db.add(invoice)
            self.db.commit()
        
        # Nếu hợp đồng PENDING, kiểm tra còn người ở không
        if contract_orm.status == ContractStatus.PENDING.value:
            room = self.room_repo.get_by_id(contract_orm.room_id)
            if room:
                remaining_tenants = self.contract_repo.get_total_tenants_in_room(
                    contract_orm.room_id,
                    exclude_contract_id=contract_id
                )
                if remaining_tenants == 0 and room.status in [RoomStatus.OCCUPIED.value, RoomStatus.RESERVED.value]:
                    from app.schemas.room_schema import RoomUpdate
                    room_update = RoomUpdate(status=RoomStatus.AVAILABLE.value)
                    self.room_repo.update(room, room_update)
        
        # Lưu tenant_id trước khi xóa hợp đồng
        tenant_id = contract_orm.tenant_id
        
        # Xóa hợp đồng
        self.contract_repo.delete(contract_orm)
        
        # Downgrade tenant về CUSTOMER nếu không còn hợp đồng ACTIVE nào
        # (Phải làm sau khi xóa hợp đồng để đếm chính xác số hợp đồng còn lại)
        from app.services.AuthService import AuthService
        auth_service = AuthService(self.db)
        ok, msg, downgraded_tenant = auth_service.downgrade_tenant_to_customer(tenant_id)
        if ok:
            print(f"✅ Downgraded user {tenant_id} to CUSTOMER: {msg}")
        else:
            print(f"ℹ️ User {tenant_id} not downgraded: {msg}")
    
    def confirm_contract(self, contract_id: UUID, tenant_id: UUID) -> ContractOut:
        """Tenant xác nhận hợp đồng PENDING → chuyển sang ACTIVE.
        
        Khi landlord tạo hợp đồng mới, nó ở trạng thái PENDING.
        Tenant cần xác nhận để kích hoạt hợp đồng.
        
        Args:
            contract_id: UUID của hợp đồng
            tenant_id: UUID của tenant đang xác nhận
            
        Returns:
            ContractOut schema
            
        Raises:
            ValueError: Nếu không tìm thấy, không phải tenant, hoặc không phải PENDING
        """
        contract_orm = self.contract_repo.get_by_id_with_relations(contract_id)
        if not contract_orm:
            raise ValueError(f"Không tìm thấy hợp đồng với ID: {contract_id}")
        
        # Kiểm tra đây là tenant của hợp đồng
        if contract_orm.tenant_id != tenant_id:
            raise ValueError("Bạn không phải là khách thuê của hợp đồng này")
        
        # Kiểm tra trạng thái PENDING
        if contract_orm.status != ContractStatus.PENDING.value:
            raise ValueError(f"Hợp đồng không ở trạng thái chờ xác nhận (hiện tại: {contract_orm.status})")
        
        # Chuyển sang ACTIVE
        update_data = ContractUpdate(status=ContractStatus.ACTIVE.value)
        updated_contract = self.update_contract(contract_id, update_data)
        
        # Upgrade tenant từ CUSTOMER → TENANT khi confirm hợp đồng
        from app.services.AuthService import AuthService
        auth_service = AuthService(self.db)
        ok, msg, upgraded_tenant = auth_service.upgrade_customer_to_tenant(contract_orm.tenant_id)
        if ok:
            print(f"✅ Upgraded user {contract_orm.tenant_id} to TENANT: {msg}")
        else:
            print(f"ℹ️ User {contract_orm.tenant_id} not upgraded: {msg}")
        
        return updated_contract
    
    def reject_contract(self, contract_id: UUID, tenant_id: UUID) -> None:
        """Tenant từ chối hợp đồng PENDING → xóa hợp đồng.
        
        Args:
            contract_id: UUID của hợp đồng
            tenant_id: UUID của tenant
            
        Raises:
            ValueError: Nếu không hợp lệ
        """
        contract_orm = self.contract_repo.get_by_id(contract_id)
        if not contract_orm:
            raise ValueError(f"Không tìm thấy hợp đồng với ID: {contract_id}")
        
        if contract_orm.tenant_id != tenant_id:
            raise ValueError("Bạn không phải là khách thuê của hợp đồng này")
        
        if contract_orm.status != ContractStatus.PENDING.value:
            raise ValueError("Chỉ có thể từ chối hợp đồng đang chờ xác nhận")
        
        # Xóa hợp đồng (PENDING cho phép xóa)
        self.delete_contract(contract_id)
    
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
        
    async def request_contract_termination(self, contract_id: UUID, requester_id: UUID, current_user: User) -> tuple[ContractOut, str]:
        """Xử lý yêu cầu chấm dứt hợp đồng.
        
        Args:
            contract_id: ID của hợp đồng
            requester_id: ID của người yêu cầu
            current_user: User object của người yêu cầu
            
        Returns:
            Tuple (ContractOut, requester_role)
            
        Raises:
            ValueError nếu vi phạm business rules
        """
        contract = self.contract_repo.get_by_id_with_relations(contract_id)
        if not contract:
            raise ValueError(f"Không tìm thấy hợp đồng với ID: {contract_id}")

        if contract.status != ContractStatus.ACTIVE.value:
            raise ValueError("Chỉ có thể yêu cầu chấm dứt hợp đồng đang hoạt động (ACTIVE)")

        # Xác định vai trò của người yêu cầu
        requester_role = None
        if requester_id == contract.tenant_id:
            requester_role = "TENANT"
        elif current_user.role.role_code in ["ADMIN", "LANDLORD"]:
            # Giả định admin/landlord có quyền với tất cả hợp đồng
            requester_role = "LANDLORD"
        else:
            raise ValueError("Bạn không có quyền thực hiện hành động này")

        # Cập nhật trạng thái hợp đồng
        if requester_role == "TENANT":
            new_status = ContractStatus.TERMINATION_REQUESTED_BY_TENANT.value
        else: # LANDLORD
            new_status = ContractStatus.TERMINATION_REQUESTED_BY_LANDLORD.value
            
        update_data = ContractUpdate(status=new_status, termination_requester_id=requester_id)
        
        updated_contract_orm = self.contract_repo.update(contract, update_data)
        
        return ContractOut.model_validate(updated_contract_orm), requester_role

    async def approve_contract_termination(self, contract_id: UUID, approver_id: UUID, current_user: User) -> ContractOut:
        """Phê duyệt yêu cầu chấm dứt hợp đồng.
        
        Args:
            contract_id: ID của hợp đồng
            approver_id: ID của người phê duyệt
            current_user: User object của người phê duyệt
            
        Returns:
            ContractOut schema
            
        Raises:
            ValueError nếu vi phạm business rules
        """
        contract = self.contract_repo.get_by_id_with_relations(contract_id)
        if not contract:
            raise ValueError(f"Không tìm thấy hợp đồng với ID: {contract_id}")

        is_approver_tenant = (approver_id == contract.tenant_id)
        is_approver_landlord = current_user and current_user.role.role_code in ["ADMIN", "LANDLORD"]

        # Validate quyền phê duyệt
        if contract.status == ContractStatus.TERMINATION_REQUESTED_BY_LANDLORD.value:
            if not is_approver_tenant:
                raise ValueError("Chỉ người thuê mới có quyền phê duyệt yêu cầu này")
        elif contract.status == ContractStatus.TERMINATION_REQUESTED_BY_TENANT.value:
            if not is_approver_landlord:
                raise ValueError("Chỉ chủ nhà/quản lý mới có quyền phê duyệt yêu cầu này")
        else:
            raise ValueError("Hợp đồng không ở trạng thái chờ chấm dứt")
            
        # Chuyển trạng thái sang TERMINATED
        update_data = ContractUpdate(status=ContractStatus.TERMINATED.value)
        
        # Gọi hàm update đã có sẵn để xử lý logic chuyển phòng
        return self.update_contract(contract_id, update_data)

    # ========== PENDING CHANGES METHODS ==========
    
    def request_contract_update(
        self, 
        contract_id: UUID, 
        data: ContractUpdate, 
        requester_id: UUID,
        reason: Optional[str] = None
    ) -> dict:
        """Admin yêu cầu sửa đổi hợp đồng ACTIVE → Tạo pending change cho tenant xác nhận.
        
        Khi admin sửa hợp đồng đang ACTIVE, thay đổi không áp dụng ngay.
        Thay vào đó, tạo một pending change và gửi thông báo cho tenant.
        Tenant phải xác nhận thì mới áp dụng thay đổi.
        
        Args:
            contract_id: UUID của hợp đồng
            data: ContractUpdate schema với các thay đổi
            requester_id: UUID của admin/landlord
            reason: Lý do thay đổi (hiển thị cho tenant)
            
        Returns:
            Dict với thông tin pending change và contract
            
        Raises:
            ValueError: Nếu không hợp lệ
        """
        from app.models.contract_pending_change import ContractPendingChange
        
        contract_orm = self.contract_repo.get_by_id_with_relations(contract_id)
        if not contract_orm:
            raise ValueError(f"Không tìm thấy hợp đồng với ID: {contract_id}")
        
        # Chỉ áp dụng cho hợp đồng đang ACTIVE
        if contract_orm.status != ContractStatus.ACTIVE.value:
            # Nếu không phải ACTIVE, cho phép update trực tiếp
            return {
                "type": "direct_update",
                "contract": self.update_contract(contract_id, data),
                "pending_change": None
            }
        
        # Chuyển ContractUpdate thành dict (chỉ các field có giá trị)
        changes_dict = data.model_dump(exclude_unset=True, exclude_none=True)
        
        if not changes_dict:
            raise ValueError("Không có thay đổi nào được cung cấp")
        
        # Convert các kiểu không JSON serializable (date, Decimal) sang string/float
        from datetime import date as date_type
        from decimal import Decimal as DecimalType
        
        def make_json_serializable(obj):
            """Chuyển đổi các kiểu dữ liệu không JSON serializable."""
            if isinstance(obj, dict):
                return {k: make_json_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [make_json_serializable(item) for item in obj]
            elif isinstance(obj, date_type):
                return obj.isoformat()  # "2025-12-19"
            elif isinstance(obj, DecimalType):
                return float(obj)
            else:
                return obj
        
        changes_dict = make_json_serializable(changes_dict)
        
        # Xóa pending changes cũ nếu có
        existing_pending = self.db.query(ContractPendingChange).filter(
            ContractPendingChange.contract_id == contract_id,
            ContractPendingChange.status == "PENDING"
        ).all()
        for old_pending in existing_pending:
            self.db.delete(old_pending)
        
        # Tạo pending change mới
        pending_change = ContractPendingChange(
            contract_id=contract_id,
            changes=changes_dict,
            requested_by=requester_id,
            reason=reason,
            status="PENDING"
        )
        self.db.add(pending_change)
        
        # Cập nhật trạng thái contract thành PENDING_UPDATE
        contract_orm.status = ContractStatus.PENDING_UPDATE.value
        self.db.add(contract_orm)
        
        self.db.commit()
        self.db.refresh(pending_change)
        self.db.refresh(contract_orm)
        
        # Get lại với relations
        contract_orm = self.contract_repo.get_by_id_with_relations(contract_id)
        
        from app.schemas.contract_schema import ContractPendingChangeOut
        return {
            "type": "pending_update",
            "contract": ContractOut.model_validate(contract_orm),
            "pending_change": ContractPendingChangeOut.model_validate(pending_change)
        }
    
    def confirm_contract_update(self, contract_id: UUID, tenant_id: UUID) -> ContractOut:
        """Tenant xác nhận thay đổi hợp đồng → Áp dụng pending changes.
        
        Args:
            contract_id: UUID của hợp đồng
            tenant_id: UUID của tenant
            
        Returns:
            ContractOut sau khi áp dụng thay đổi
            
        Raises:
            ValueError: Nếu không hợp lệ
        """
        from app.models.contract_pending_change import ContractPendingChange
        
        contract_orm = self.contract_repo.get_by_id_with_relations(contract_id)
        if not contract_orm:
            raise ValueError(f"Không tìm thấy hợp đồng với ID: {contract_id}")
        
        # Kiểm tra quyền
        if contract_orm.tenant_id != tenant_id:
            raise ValueError("Bạn không phải là khách thuê của hợp đồng này")
        
        # Kiểm tra trạng thái
        if contract_orm.status != ContractStatus.PENDING_UPDATE.value:
            raise ValueError("Hợp đồng không có thay đổi nào đang chờ xác nhận")
        
        # Lấy pending change
        pending_change = self.db.query(ContractPendingChange).filter(
            ContractPendingChange.contract_id == contract_id,
            ContractPendingChange.status == "PENDING"
        ).first()
        
        if not pending_change:
            raise ValueError("Không tìm thấy thay đổi chờ xác nhận")
        
        # Áp dụng các thay đổi
        changes = pending_change.changes
        for key, value in changes.items():
            if hasattr(contract_orm, key):
                setattr(contract_orm, key, value)
        
        # Chuyển trạng thái về ACTIVE
        contract_orm.status = ContractStatus.ACTIVE.value
        
        # Đánh dấu pending change là APPROVED
        pending_change.status = "APPROVED"
        
        self.db.add(contract_orm)
        self.db.add(pending_change)
        self.db.commit()
        self.db.refresh(contract_orm)
        
        # Get lại với relations
        contract_orm = self.contract_repo.get_by_id_with_relations(contract_id)
        return ContractOut.model_validate(contract_orm)
    
    def reject_contract_update(self, contract_id: UUID, tenant_id: UUID) -> ContractOut:
        """Tenant từ chối thay đổi hợp đồng → Giữ nguyên hợp đồng cũ.
        
        Args:
            contract_id: UUID của hợp đồng
            tenant_id: UUID của tenant
            
        Returns:
            ContractOut giữ nguyên
            
        Raises:
            ValueError: Nếu không hợp lệ
        """
        from app.models.contract_pending_change import ContractPendingChange
        
        contract_orm = self.contract_repo.get_by_id_with_relations(contract_id)
        if not contract_orm:
            raise ValueError(f"Không tìm thấy hợp đồng với ID: {contract_id}")
        
        if contract_orm.tenant_id != tenant_id:
            raise ValueError("Bạn không phải là khách thuê của hợp đồng này")
        
        if contract_orm.status != ContractStatus.PENDING_UPDATE.value:
            raise ValueError("Hợp đồng không có thay đổi nào đang chờ xác nhận")
        
        # Lấy và đánh dấu pending change là REJECTED
        pending_change = self.db.query(ContractPendingChange).filter(
            ContractPendingChange.contract_id == contract_id,
            ContractPendingChange.status == "PENDING"
        ).first()
        
        if pending_change:
            pending_change.status = "REJECTED"
            self.db.add(pending_change)
        
        # Chuyển trạng thái về ACTIVE (giữ nguyên hợp đồng cũ)
        contract_orm.status = ContractStatus.ACTIVE.value
        self.db.add(contract_orm)
        self.db.commit()
        self.db.refresh(contract_orm)
        
        contract_orm = self.contract_repo.get_by_id_with_relations(contract_id)
        return ContractOut.model_validate(contract_orm)
    
    def get_pending_changes(self, contract_id: UUID) -> list:
        """Lấy danh sách pending changes của hợp đồng.
        
        Args:
            contract_id: UUID của hợp đồng
            
        Returns:
            List các pending changes
        """
        from app.models.contract_pending_change import ContractPendingChange
        from app.schemas.contract_schema import ContractPendingChangeOut
        
        pending_changes = self.db.query(ContractPendingChange).filter(
            ContractPendingChange.contract_id == contract_id
        ).order_by(ContractPendingChange.created_at.desc()).all()
        
        return [ContractPendingChangeOut.model_validate(pc) for pc in pending_changes]

    def get_available_rooms_for_contract(self, building_id: UUID) -> list[dict]:
        """Lấy danh sách phòng có thể tạo hợp đồng mới.
        
        Bao gồm:
        - Phòng AVAILABLE (trống hoàn toàn)
        - Phòng OCCUPIED nhưng còn chỗ trống (current_occupants < capacity)
        
        Args:
            building_id: UUID của tòa nhà
            
        Returns:
            List dict chứa thông tin phòng + current_occupants + capacity
        """
        from app.models.room import Room
        from app.models.contract import Contract
        from sqlalchemy import func, and_
        
        # Subquery đếm số hợp đồng ACTIVE hoặc PENDING cho mỗi phòng
        occupancy_subq = (
            self.db.query(
                Contract.room_id,
                func.count(Contract.id).label('current_occupants')
            )
            .filter(Contract.status.in_([
                ContractStatus.ACTIVE.value, 
                ContractStatus.PENDING.value,
                ContractStatus.PENDING_UPDATE.value
            ]))
            .group_by(Contract.room_id)
            .subquery()
        )
        
        # Query phòng thuộc building và còn chỗ trống
        rooms = (
            self.db.query(
                Room.id,
                Room.room_number,
                Room.capacity,
                Room.status,
                func.coalesce(occupancy_subq.c.current_occupants, 0).label('current_occupants')
            )
            .outerjoin(occupancy_subq, Room.id == occupancy_subq.c.room_id)
            .filter(
                Room.building_id == building_id,
                Room.status.in_([RoomStatus.AVAILABLE.value, RoomStatus.OCCUPIED.value])
            )
            .all()
        )
        
        result = []
        for room in rooms:
            current_occupants = room.current_occupants or 0
            # Chỉ thêm phòng nếu còn chỗ trống
            if current_occupants < room.capacity:
                result.append({
                    "id": str(room.id),
                    "room_number": room.room_number,
                    "capacity": room.capacity,
                    "current_occupants": current_occupants,
                    "status": room.status
                })
        
        return result
    
    def get_room_info_for_contract(self, room_id: UUID) -> dict:
        """Lấy thông tin phòng để auto-fill form tạo hợp đồng.
        
        Args:
            room_id: UUID của phòng
            
        Returns:
            Dict chứa thông tin phòng + default_service_fees
            
        Raises:
            ValueError: Nếu không tìm thấy phòng
        """
        from app.models.room import Room
        from app.models.building import Building
        from decimal import Decimal
        
        room = self.room_repo.get_by_id_with_relations(room_id)
        if not room:
            raise ValueError(f"Không tìm thấy phòng với ID: {room_id}")
        
        # Lấy tên tòa nhà
        building_name = None
        if room.building:
            building_name = room.building.building_name
        
        # Parse default_service_fees từ JSON
        service_fees = []
        if room.default_service_fees:
            for fee in room.default_service_fees:
                if isinstance(fee, dict):
                    service_fees.append({
                        "name": fee.get("name", ""),
                        "amount": float(fee.get("amount", 0)),
                        "description": fee.get("description")
                    })
        
        return {
            "id": str(room.id),
            "room_number": room.room_number,
            "room_name": room.room_name,
            "base_price": float(room.base_price) if room.base_price else 0,
            "deposit_amount": float(room.deposit_amount) if room.deposit_amount else 0,
            "electricity_price": float(room.electricity_price) if room.electricity_price else 0,
            "water_price_per_person": float(room.water_price_per_person) if room.water_price_per_person else 0,
            "capacity": room.capacity,
            "default_service_fees": service_fees,
            "building_name": building_name
        }
