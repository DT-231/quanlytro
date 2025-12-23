"""Room Service - business logic layer cho Room entity.

Service xử lý các use case và business rules liên quan đến Room.
"""

from __future__ import annotations

from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from sqlalchemy.orm import Session

from app.repositories.room_repository import RoomRepository
from app.repositories.building_repository import BuildingRepository
from app.repositories.contract_repository import ContractRepository
from app.schemas.room_schema import (
    RoomCreate, RoomUpdate, RoomListItem, RoomDetailOut,
    RoomPublicDetail, RoomAdminDetail, TenantInfo, RoomPublicListItem
)
from app.schemas.room_photo_schema import RoomPhotoOut
from app.models.room import Room
from app.models.building import Building
from app.models.room_utility import RoomUtility
from app.models.room_photo import RoomPhoto
from app.core.Enum.roomEnum import RoomStatus
from app.core.utils.uuid import generate_uuid7


class RoomService:
    """Service xử lý business logic cho Room.
    
    - Validate các quy tắc nghiệp vụ.
    - Điều phối CRUD operations qua Repository.
    
    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.room_repo = RoomRepository(db)
        self.building_repo = BuildingRepository(db)
        self.contract_repo = ContractRepository(db)
        
        # Import RoomTypeRepository để validate room_type_id
        from app.repositories.room_type_repository import RoomTypeRepository
        self.room_type_repo = RoomTypeRepository(db)

    def create_room(self, room_data: RoomCreate, user_id: Optional[UUID] = None) -> RoomDetailOut:
        """Tạo phòng mới với validation, utilities và photos.
        
        Business rules:
        - Số phòng phải unique trong cùng tòa nhà.
        - Base price phải > 0.
        - Status phải hợp lệ theo enum.
        
        Args:
            room_data: Thông tin phòng từ request.
            user_id: UUID của user tạo phòng (để gán cho photos).
            
        Returns:
            RoomDetailOut schema với utilities và photos.
            
        Raises:
            ValueError: Nếu vi phạm business rules.
        """
        # Validate base_price
        if room_data.base_price <= 0:
            raise ValueError("Giá thuê phải lớn hơn 0")
        
        # Validate capacity
        if room_data.capacity < 1:
            raise ValueError("Sức chứa phải ít nhất 1 người")
        
        # Validate building_id tồn tại
        building = self.building_repo.get_by_id(room_data.building_id)
        if not building:
            raise ValueError(f"Không tìm thấy tòa nhà với ID: {room_data.building_id}")
        
        # Validate room_type_id nếu có
        if room_data.room_type_id:
            room_type = self.room_type_repo.get_by_id(room_data.room_type_id)
            if not room_type:
                raise ValueError(f"Không tìm thấy loại phòng với ID: {room_data.room_type_id}")
            if not room_type.is_active:
                raise ValueError(f"Loại phòng '{room_type.name}' đã bị vô hiệu hóa")
        
        # Validate status
        valid_statuses = [s.value for s in RoomStatus]
        if room_data.status not in valid_statuses:
            raise ValueError(f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}")
        
        # Kiểm tra số phòng đã tồn tại trong tòa nhà chưa
        existing = self.room_repo.get_by_building_and_number(
            building_id=room_data.building_id,
            room_number=room_data.room_number
        )
        if existing:
            raise ValueError(f"Số phòng {room_data.room_number} đã tồn tại trong tòa nhà này")
        
        utilities = room_data.utilities or []
        photos = room_data.photos or []
        
        room_dict = room_data.model_dump(exclude={'utilities', 'photos'})
        
        room = self.room_repo.create_room_basic(room_dict)
        
        if utilities:
            for utility_name in utilities:
                utility = RoomUtility(
                    utility_id=generate_uuid7(),
                    room_id=room.id,
                    utility_name=utility_name,
                    description=None
                )
                self.db.add(utility)
        
        if photos:
            for idx, photo_data in enumerate(photos):
                if isinstance(photo_data, dict):
                    image_base64 = photo_data.get('image_base64')
                    is_primary = photo_data.get('is_primary', False)
                    sort_order = photo_data.get('sort_order', 0)
                else:
                    image_base64 = getattr(photo_data, 'image_base64', None)
                    is_primary = getattr(photo_data, 'is_primary', False)
                    sort_order = getattr(photo_data, 'sort_order', 0)
                
                if not image_base64:
                    continue
                
                photo = RoomPhoto(
                    room_id=room.id,
                    image_base64=image_base64,
                    url=None,
                    is_primary=is_primary,
                    sort_order=sort_order,
                    uploaded_by=user_id
                )
                self.db.add(photo)
        
        self.db.commit()
        self.db.refresh(room)
        
        return self._room_to_detail_out(room)

    def list_rooms(
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
        page: int = 1,
        pageSize: int = 20,
    ) -> dict:
        """Lấy danh sách phòng với thông tin đầy đủ, filter và pagination.
        
        Args:
            building_id: Lọc theo tòa nhà (optional).
            status: Lọc theo trạng thái (optional).
            search: Tìm kiếm theo tên phòng, số phòng, hoặc tên tòa nhà (optional).
            city: Lọc theo thành phố (optional).
            ward: Lọc theo phường/quận (optional).
            min_price: Giá thuê tối thiểu (optional).
            max_price: Giá thuê tối đa (optional).
            max_capacity: Số người tối đa (optional).
            sort_by: Sắp xếp (price_asc, price_desc), mặc định created_at desc.
            page: Số trang (bắt đầu từ 1).
            pageSize: Số items mỗi trang (max 100).
            
        Returns:
            Dict chứa items và pagination (totalItems, page, pageSize, totalPages).
        """
        # Validate pageSize
        if pageSize > 100:
            pageSize = 100
        if pageSize < 1:
            pageSize = 20
        
        # Validate page
        if page < 1:
            page = 1
            
        # Validate status nếu có
        if status:
            valid_statuses = [s.value for s in RoomStatus]
            if status not in valid_statuses:
                raise ValueError(f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}")
        
        # Tính offset
        offset = (page - 1) * pageSize
        
        # Lấy danh sách với details
        items_data = self.room_repo.list_with_details(
            building_id=building_id,
            status=status,
            search=search,
            city=city,
            ward=ward,
            min_price=min_price,
            max_price=max_price,
            max_capacity=max_capacity,
            sort_by=sort_by,
            offset=offset,
            limit=pageSize
        )
        
        # Lấy tổng số
        totalItems = self.room_repo.count(
            building_id=building_id,
            status=status,
            search=search,
            city=city,
            ward=ward,
            min_price=min_price,
            max_price=max_price,
            max_capacity=max_capacity
        )
        
        # Tính tổng số trang
        totalPages = (totalItems + pageSize - 1) // pageSize if totalItems > 0 else 1
        
        # Convert dict sang Pydantic schemas
        items_out = [RoomListItem(**item) for item in items_data]
        
        return {
            "items": items_out,
            "pagination": {
                "totalItems": totalItems,
                "page": page,
                "pageSize": pageSize,
                "totalPages": totalPages
            }
        }

    def update_room(self, room_id: UUID, room_data: RoomUpdate, user_id: Optional[UUID] = None) -> RoomDetailOut:
        """Cập nhật thông tin phòng, utilities và photos.
        
        Business rules:
        - Không được update sang số phòng đã tồn tại trong cùng tòa nhà.
        - Giá thuê phải > 0 nếu được update.
        - Status phải hợp lệ nếu được update.
        
        Args:
            room_id: UUID của phòng cần update.
            room_data: Dữ liệu cập nhật.
            user_id: UUID của user update (để gán cho photos mới).
            
        Returns:
            RoomDetailOut schema đã được cập nhật.
            
        Raises:
            ValueError: Nếu không tìm thấy phòng hoặc vi phạm rules.
        """
        # Lấy room ORM instance (KHÔNG load relationships để tránh conflict)
        room_orm = self.room_repo.get_by_id(room_id)
        if not room_orm:
            raise ValueError(f"Không tìm thấy phòng với ID: {room_id}")
        
        # Validate các field được update
        if room_data.base_price is not None and room_data.base_price <= 0:
            raise ValueError("Giá thuê phải lớn hơn 0")
        
        if room_data.capacity is not None and room_data.capacity < 1:
            raise ValueError("Sức chứa phải ít nhất 1 người")
        
        # Validate room_type_id nếu có update
        if room_data.room_type_id is not None:
            room_type = self.room_type_repo.get_by_id(room_data.room_type_id)
            if not room_type:
                raise ValueError(f"Không tìm thấy loại phòng với ID: {room_data.room_type_id}")
            if not room_type.is_active:
                raise ValueError(f"Loại phòng '{room_type.name}' đã bị vô hiệu hóa")
        
        if room_data.status is not None:
            valid_statuses = [s.value for s in RoomStatus]
            if room_data.status not in valid_statuses:
                raise ValueError(f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}")
        
        # Kiểm tra trùng số phòng nếu update room_number hoặc building_id
        if room_data.room_number or room_data.building_id:
            new_building_id = room_data.building_id or room_orm.building_id
            new_room_number = room_data.room_number or room_orm.room_number
            
            # Chỉ check nếu thay đổi
            if new_building_id != room_orm.building_id or new_room_number != room_orm.room_number:
                existing = self.room_repo.get_by_building_and_number(
                    building_id=new_building_id,
                    room_number=new_room_number
                )
                if existing and existing.id != room_id:
                    raise ValueError(f"Số phòng {new_room_number} đã tồn tại trong tòa nhà này")
        
        # Extract utilities và photo_urls nếu có
        utilities = room_data.utilities
        photo_urls = room_data.photo_urls
        
        # UPDATE room basic info TRƯỚC (exclude utilities và photo_urls)
        room_dict = room_data.model_dump(exclude_unset=True, exclude={'utilities', 'photo_urls'})
        if room_dict:  # Chỉ update nếu có data
            updated_room = self.room_repo.update_room_basic(room_orm, room_dict)
        else:
            updated_room = room_orm
        
        # XÓA utilities/photos CŨ SAU (query trực tiếp, không qua relationship)
        if utilities is not None:
            # Xóa utilities cũ bằng query trực tiếp
            self.db.query(RoomUtility).filter(RoomUtility.room_id == room_id).delete(
                synchronize_session=False
            )
            self.db.flush()
        
        if photo_urls is not None and user_id:
            # Xóa photos cũ bằng query trực tiếp
            self.db.query(RoomPhoto).filter(RoomPhoto.room_id == room_id).delete(
                synchronize_session=False
            )
            self.db.flush()
        
        # THÊM utilities/photos MỚI
        if utilities is not None:
            # Thêm utilities mới
            for utility_name in utilities:
                utility = RoomUtility(
                    utility_id=generate_uuid7(),
                    room_id=room_id,
                    utility_name=utility_name,
                    description=None
                )
                self.db.add(utility)
        
        if photo_urls is not None and user_id:
            # Thêm photos mới
            for idx, url in enumerate(photo_urls):
                photo = RoomPhoto(
                    room_id=room_id,
                    url=url,
                    is_primary=(idx == 0),
                    sort_order=idx,
                    uploaded_by=user_id
                )
                self.db.add(photo)
        
        # Commit tất cả thay đổi
        self.db.commit()
        
        # Get lại room với relationships để convert sang RoomDetailOut
        final_room = self.room_repo.get_by_id_with_relations(room_id)
        
        # Convert sang RoomDetailOut
        return self._room_to_detail_out(final_room)

    def delete_room(self, room_id: UUID) -> None:
        """Xóa phòng.
        
        Business rules:
        - Không xóa phòng đang có hợp đồng active (optional, có thể thêm sau).
        
        Args:
            room_id: UUID của phòng cần xóa.
            
        Raises:
            ValueError: Nếu không tìm thấy phòng.
        """
        # Lấy ORM instance để xóa (không dùng get_room vì nó trả RoomDetailOut)
        room_orm = self.room_repo.get_by_id(room_id)
        if not room_orm:
            raise ValueError(f"Không tìm thấy phòng với ID: {room_id}")
        
        # TODO: Kiểm tra phòng có hợp đồng active không
        # if room_orm.contracts với status active:
        #     raise ValueError("Không thể xóa phòng đang có hợp đồng")
        
        # Xóa utilities của phòng trước
        self.db.query(RoomUtility).filter(RoomUtility.room_id == room_id).delete(
            synchronize_session=False
        )
        
        # Xóa photos của phòng trước
        self.db.query(RoomPhoto).filter(RoomPhoto.room_id == room_id).delete(
            synchronize_session=False
        )
        
        # Xóa phòng
        self.room_repo.delete(room_orm)
    
    def _room_to_detail_out(self, room: Room) -> RoomDetailOut:
        """Convert Room ORM instance sang RoomDetailOut schema.
        
        Args:
            room: Room ORM instance.
            
        Returns:
            RoomDetailOut schema với utilities, photos và room_type.
        """
        # Lấy utilities
        utilities = [u.utility_name for u in room.utilities] if room.utilities else []
        
        # Lấy photo URLs hoặc base64, sắp xếp theo sort_order
        # Ưu tiên url nếu có, nếu không có thì dùng image_base64
        photos = sorted(room.room_photos, key=lambda p: p.sort_order) if room.room_photos else []
        photo_urls = [p.url if p.url else p.image_base64 for p in photos if (p.url or p.image_base64)]
        
        # Lấy room_type nếu có
        from app.schemas.room_type_schema import RoomTypeSimple
        room_type_data = None
        if room.room_type:
            room_type_data = RoomTypeSimple(
                id=room.room_type.id,
                name=room.room_type.name
            )
        
        # Build dict data
        room_data = {
            'id': room.id,
            'building_id': room.building_id,
            'room_type_id': room.room_type_id,
            'room_type': room_type_data,
            'room_number': room.room_number,
            'room_name': room.room_name,
            'area': room.area,
            'capacity': room.capacity,
            'base_price': room.base_price,
            'electricity_price': room.electricity_price,
            'water_price_per_person': room.water_price_per_person,
            'deposit_amount': room.deposit_amount,
            'status': room.status,
            'description': room.description,
            'utilities': utilities,
            'photo_urls': photo_urls,
            'created_at': room.created_at,
            'updated_at': room.updated_at,
        }
        
        return RoomDetailOut(**room_data)

    def get_room_detail_by_role(self, room_id: UUID, user_role: str):
        """Lấy thông tin chi tiết phòng theo role.
        
        - Admin (chủ nhà): Thấy đầy đủ thông tin bao gồm người thuê
        - Khác (tenant, customer): Chỉ thấy thông tin cơ bản, không thấy người thuê
        
        Args:
            room_id: UUID của phòng.
            user_role: Role code của user (ADMIN, TENANT, CUSTOMER).
            
        Returns:
            RoomAdminDetail nếu role=ADMIN, RoomPublicDetail nếu role khác.
            
        Raises:
            ValueError: Nếu không tìm thấy phòng.
        """
        # Lấy room với relationships
        room = self.room_repo.get_by_id_with_relations(room_id)
        if not room:
            raise ValueError(f"Không tìm thấy phòng với ID: {room_id}")
        
        # Lấy thông tin building
        building = self.building_repo.get_by_id(room.building_id)
        building_name = building.building_name if building else "N/A"
        
        # Lấy địa chỉ đầy đủ từ building
        full_address = "N/A"
        if building and building.address:
            address_parts = []
            if building.address.address_line:
                address_parts.append(building.address.address_line)
            if building.address.ward:
                address_parts.append(building.address.ward)
            if building.address.city:
                address_parts.append(building.address.city)
            full_address = ", ".join(address_parts) if address_parts else "N/A"
        
        # Lấy utilities
        utilities = [u.utility_name for u in room.utilities] if room.utilities else []
        
        # Lấy photos (sắp xếp theo sort_order) và convert sang RoomPhotoOut
        photos_orm = sorted(room.room_photos, key=lambda p: p.sort_order) if room.room_photos else []
        photos = [RoomPhotoOut.model_validate(p) for p in photos_orm]
        
        # Lấy room_type nếu có
        from app.schemas.room_type_schema import RoomTypeSimple
        room_type_data = None
        if room.room_type:
            room_type_data = RoomTypeSimple(
                id=room.room_type.id,
                name=room.room_type.name
            )
        
        # Lấy thông tin tất cả hợp đồng active và tính toán occupants
        active_contracts = self.contract_repo.get_active_contracts_by_room(room_id)
        current_occupants = self.contract_repo.get_total_tenants_in_room(room_id)
        is_available = room.status == RoomStatus.AVAILABLE.value and not active_contracts
        tenants = []
        
        # Nếu là admin, lấy thông tin của tất cả tenants
        if user_role == "ADMIN" and active_contracts:
            for contract in active_contracts:
                tenant = contract.tenant if hasattr(contract, 'tenant') else None
                if tenant:
                    tenants.append(TenantInfo(
                        tenant_id=tenant.id,
                        tenant_name=f"{tenant.first_name} {tenant.last_name}",
                        tenant_email=tenant.email,
                        tenant_phone=tenant.phone,
                        contract_id=contract.id,
                        contract_start_date=contract.start_date,
                        contract_end_date=contract.end_date
                    ))
        
        # Base data chung cho cả admin và public
        base_data = {
            'id': room.id,
            'building_id': room.building_id,
            'building_name': building_name,
            'full_address': full_address,
            'room_number': room.room_number,
            'room_name': room.room_name,
            'room_type': room_type_data,
            'area': room.area,
            'capacity': room.capacity,
            'base_price': room.base_price,
            'electricity_price': room.electricity_price,
            'water_price_per_person': room.water_price_per_person,
            'deposit_amount': room.deposit_amount,
            'status': room.status,
            'description': room.description,
            'is_available': is_available,
            'current_occupants': current_occupants,
            'utilities': utilities,
            'photos': photos,
        }
        
        # Trả về schema phù hợp với role
        if user_role == "ADMIN":
            return RoomAdminDetail(
                **base_data,
                tenants=tenants,
                created_at=room.created_at,
                updated_at=room.updated_at
            )
        else:
            return RoomPublicDetail(**base_data)

    def search_rooms(
        self,
        building_id: Optional[UUID] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        min_area: Optional[float] = None,
        max_area: Optional[float] = None,
        capacity: Optional[int] = None,
        status: Optional[str] = None,
        utilities: Optional[List[str]] = None,
        page: int = 1,
        pageSize: int = 20,
    ) -> dict:
        """Tìm kiếm phòng với nhiều điều kiện.
        
        Args:
            building_id: Lọc theo tòa nhà.
            min_price: Giá tối thiểu.
            max_price: Giá tối đa.
            min_area: Diện tích tối thiểu.
            max_area: Diện tích tối đa.
            capacity: Sức chứa.
            status: Trạng thái phòng.
            utilities: Danh sách tiện ích cần có.
            page: Số trang (bắt đầu từ 1).
            pageSize: Số items mỗi trang.
            
        Returns:
            Dict chứa items và pagination (totalItems, page, pageSize, totalPages).
        """
        # Validate pageSize
        if pageSize > 100:
            pageSize = 100
        if pageSize < 1:
            pageSize = 20
        
        # Validate page
        if page < 1:
            page = 1
        
        # Validate status nếu có
        if status:
            valid_statuses = [s.value for s in RoomStatus]
            if status not in valid_statuses:
                raise ValueError(f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}")
        
        # Validate price range
        if min_price and max_price and min_price > max_price:
            raise ValueError("Giá tối thiểu không được lớn hơn giá tối đa")
        
        # Validate area range
        if min_area and max_area and min_area > max_area:
            raise ValueError("Diện tích tối thiểu không được lớn hơn diện tích tối đa")
        
        # TODO: Implement search logic trong repository
        # Hiện tại tạm dùng list_with_details và filter trong Python
        # Nên chuyển logic filter xuống repository để tối ưu query
        
        # Lấy danh sách phòng
        from sqlalchemy import and_
        query = self.db.query(Room)
        
        # Apply filters
        if building_id:
            query = query.filter(Room.building_id == building_id)
        if min_price:
            query = query.filter(Room.base_price >= min_price)
        if max_price:
            query = query.filter(Room.base_price <= max_price)
        if min_area:
            query = query.filter(Room.area >= min_area)
        if max_area:
            query = query.filter(Room.area <= max_area)
        if capacity:
            query = query.filter(Room.capacity >= capacity)
        if status:
            query = query.filter(Room.status == status)
        
        # Filter by utilities (cần join với RoomUtility)
        if utilities:
            for utility in utilities:
                query = query.join(RoomUtility).filter(RoomUtility.utility_name == utility)
        
        # Get total count
        totalItems = query.count()
        
        # Tính offset
        offset = (page - 1) * pageSize
        
        # Apply pagination
        rooms = query.offset(offset).limit(pageSize).all()
        
        # Convert to list items (simple version)
        items = []
        for room in rooms:
            building = self.building_repo.get_by_id(room.building_id)
            building_name = building.building_name if building else "N/A"
            
            # Lấy contract active để tính current_occupants
            active_contract = self.contract_repo.get_active_contract_by_room(room.id)
            current_occupants = 1 if active_contract else 0
            representative = None
            if active_contract and hasattr(active_contract, 'tenant'):
                tenant = active_contract.tenant
                representative = f"{tenant.first_name} {tenant.last_name}" if tenant else None
            
            items.append(RoomListItem(
                id=room.id,
                room_number=room.room_number,
                building_name=building_name,
                area=room.area,
                capacity=room.capacity,
                current_occupants=current_occupants,
                status=room.status,
                base_price=room.base_price,
                representative=representative
            ))
        
        # Tính tổng số trang
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

    def list_rooms_public(
        self,
        building_id: Optional[UUID] = None,
        search: Optional[str] = None,
        city: Optional[str] = None,
        ward: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        max_capacity: Optional[int] = None,
        sort_by: Optional[str] = None,
        page: int = 1,
        pageSize: int = 10,
    ) -> dict:
        """Lấy danh sách phòng cho khách thuê/khách vãng lai (không cần đăng nhập).
        
        Hiển thị:
        - Ảnh đại diện
        - Giá phòng
        - Địa chỉ đầy đủ
        - Trạng thái còn trống (chỉ lấy phòng AVAILABLE và không có contract ACTIVE)
        - Sắp xếp theo thời gian tạo (mới nhất trước) hoặc theo giá
        - Mỗi lần trả về 10 phòng
        
        Args:
            building_id: Lọc theo tòa nhà (optional).
            search: Tìm kiếm theo tên phòng, số phòng, hoặc tên tòa nhà (optional).
            city: Lọc theo thành phố (optional).
            ward: Lọc theo phường/quận (optional).
            min_price: Giá thuê tối thiểu (optional).
            max_price: Giá thuê tối đa (optional).
            max_capacity: Số người tối đa (optional).
            sort_by: Sắp xếp (price_asc, price_desc), mặc định created_at desc.
            page: Số trang (bắt đầu từ 1).
            pageSize: Số items mỗi trang (default 10, max 20).
            
        Returns:
            Dict chứa items và pagination (totalItems, page, pageSize, totalPages).
        """
        from app.models.address import Address
        
        # Validate pageSize
        if pageSize > 20:
            pageSize = 20
        if pageSize < 1:
            pageSize = 10
        
        # Validate page
        if page < 1:
            page = 1
        
        # Query rooms với joinedload để tránh N+1
        from sqlalchemy.orm import joinedload
        from sqlalchemy import and_, not_, exists
        from app.models.contract import Contract
        from app.models.address import Address
        from app.core.Enum.contractEnum import ContractStatus
        
        query = self.db.query(Room).options(
            joinedload(Room.building).joinedload(Building.address),
            joinedload(Room.room_photos)
        )
        
        # PUBLIC: Chỉ lấy phòng AVAILABLE và KHÔNG có contract ACTIVE
        query = query.filter(Room.status == RoomStatus.AVAILABLE.value)
        
        # Filter out rooms với active contracts
        active_contract_exists = exists().where(
            and_(
                Contract.room_id == Room.id,
                Contract.status == ContractStatus.ACTIVE.value
            )
        )
        query = query.filter(not_(active_contract_exists))
        
        # Join với Building và Address nếu cần filter theo city/ward
        needs_join = search or city or ward
        if needs_join:
            query = query.join(Building, Room.building_id == Building.id)
            if city or ward:
                query = query.join(Address, Building.address_id == Address.id)
        
        # Filter by building_id nếu có
        if building_id:
            query = query.filter(Room.building_id == building_id)
        
        # Apply city and ward filters
        if city:
            query = query.filter(Address.city.ilike(f"%{city}%"))
        if ward:
            query = query.filter(Address.ward.ilike(f"%{ward}%"))
        
        # Apply search filter
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Room.room_number.ilike(search_pattern)) |
                (Room.room_name.ilike(search_pattern)) |
                (Building.building_name.ilike(search_pattern))
            )
        
        # Apply price filters
        if min_price is not None:
            query = query.filter(Room.base_price >= min_price)
        if max_price is not None:
            query = query.filter(Room.base_price <= max_price)
        
        # Apply capacity filter
        if max_capacity is not None:
            query = query.filter(Room.capacity <= max_capacity)
        
        # Sắp xếp - mặc định theo created_at DESC (mới nhất trước)
        if sort_by == "price_asc":
            query = query.order_by(Room.base_price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Room.base_price.desc())
        else:
            query = query.order_by(Room.created_at.desc())
        
        # Count total
        totalItems = query.count()
        
        # Tính offset
        offset = (page - 1) * pageSize
        
        # Pagination
        rooms = query.offset(offset).limit(pageSize).all()
        
        # Convert to RoomPublicListItem
        items = []
        for room in rooms:
            # Lấy building info
            building = room.building
            building_name = building.building_name if building else "N/A"
            
            # Lấy địa chỉ đầy đủ
            full_address = "N/A"
            if building and building.address:
                addr = building.address
                full_address = f"{addr.address_line}, {addr.ward}, {addr.city}"
            
            # Kiểm tra phòng còn trống không
            active_contract = self.contract_repo.get_active_contract_by_room(room.id)
            is_available = (room.status == RoomStatus.AVAILABLE.value) and (active_contract is None)
            
            # Lấy ảnh đại diện (ảnh có is_primary=True hoặc ảnh đầu tiên)
            primary_photo = None
            if room.room_photos:
                # Tìm ảnh primary
                primary = next((p for p in room.room_photos if p.is_primary), None)
                if primary:
                    primary_photo = primary.image_base64 if primary.image_base64 else primary.url
                else:
                    # Lấy ảnh đầu tiên
                    first_photo = sorted(room.room_photos, key=lambda p: p.sort_order)[0]
                    primary_photo = first_photo.image_base64 if first_photo.image_base64 else first_photo.url
            
            items.append(RoomPublicListItem(
                id=room.id,
                room_number=room.room_number,
                room_name=room.room_name,
                building_name=building_name,
                full_address=full_address,
                base_price=room.base_price,
                area=room.area,
                capacity=room.capacity,
                is_available=is_available,
                primary_photo=primary_photo,
                created_at=room.created_at
            ))
        
        # Tính tổng số trang
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