"""Maintenance Service - business logic layer cho MaintenanceRequest.

Service xử lý các use case và business rules liên quan đến maintenance requests.
Phân quyền rõ ràng giữa TENANT và ADMIN.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy.orm import Session

from app.repositories.maintenance_repository import MaintenanceRepository
from app.repositories.room_repository import RoomRepository
from app.schemas.maintenance_schema import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceOut,
    MaintenanceListItem,
    MaintenanceStats,
    MaintenancePhotoOut,
)
from app.core.Enum.maintenanceEnum import MaintenanceStatus, MaintenancePriority, MaintenanceRequestType


class MaintenanceService:
    """Service xử lý business logic cho Maintenance Request.

    - Validate các quy tắc nghiệp vụ.
    - Phân quyền TENANT vs ADMIN.
    - Điều phối CRUD operations qua Repository.

    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """

    def __init__(self, db: Session):
        self.db = db
        self.maintenance_repo = MaintenanceRepository(db)
        self.room_repo = RoomRepository(db)

    def create_maintenance(
        self, 
        tenant_id: UUID, 
        maintenance_data: MaintenanceCreate
    ) -> MaintenanceOut:
        """Tạo maintenance request mới (người thuê).

        Business rules:
        - room_id phải tồn tại.
        - Tenant chỉ tạo request cho phòng mình đang thuê (TODO: validate với contract).
        - request_type và priority phải hợp lệ.
        - Photos tối đa 5 ảnh.

        Args:
            tenant_id: UUID của người thuê đang tạo request.
            maintenance_data: Dữ liệu maintenance request.

        Returns:
            MaintenanceOut schema.

        Raises:
            ValueError: Nếu vi phạm business rules.
        """
        # Validate room tồn tại
        room = self.room_repo.get_by_id(maintenance_data.room_id)
        if not room:
            raise ValueError(f"Không tìm thấy phòng với ID: {maintenance_data.room_id}")

        # Validate request_type
        valid_types = [t.value for t in MaintenanceRequestType]
        if maintenance_data.request_type not in valid_types:
            raise ValueError(
                f"Loại yêu cầu không hợp lệ. Phải là một trong: {valid_types}"
            )

        # Validate priority
        valid_priorities = [p.value for p in MaintenancePriority]
        if maintenance_data.priority not in valid_priorities:
            raise ValueError(
                f"Mức độ ưu tiên không hợp lệ. Phải là một trong: {valid_priorities}"
            )

        # Validate photos (max 5)
        if maintenance_data.photos and len(maintenance_data.photos) > 5:
            raise ValueError("Số lượng ảnh tối đa là 5")

        # TODO: Validate tenant đang thuê phòng này
        # Cần check với Contract: tenant_id có hợp đồng ACTIVE với room_id này không

        # Tạo maintenance request
        request_id = uuid4()
        data = maintenance_data.model_dump(exclude={"photos"})
        data["tenant_id"] = tenant_id
        data["request_id"] = request_id
        data["status"] = MaintenanceStatus.PENDING.value

        maintenance = self.maintenance_repo.create(data)

        # Thêm photos nếu có
        if maintenance_data.photos:
            self.maintenance_repo.add_photos(
                request_id=request_id,
                photo_urls=maintenance_data.photos,
                uploaded_by=tenant_id,
            )

        # Reload để lấy đầy đủ thông tin
        maintenance = self.maintenance_repo.get_by_id(maintenance.id)

        return self._to_maintenance_out(maintenance)

    def get_maintenance(
        self, 
        maintenance_id: UUID,
        user_id: UUID,
        is_admin: bool = False,
    ) -> MaintenanceOut:
        """Lấy chi tiết maintenance request.

        Business rules:
        - Admin: Xem được tất cả requests.
        - Tenant: Chỉ xem được requests của mình.

        Args:
            maintenance_id: UUID của maintenance request.
            user_id: UUID của user hiện tại.
            is_admin: True nếu user là admin.

        Returns:
            MaintenanceOut schema.

        Raises:
            ValueError: Nếu không tìm thấy hoặc không có quyền.
        """
        maintenance = self.maintenance_repo.get_by_id(maintenance_id)
        if not maintenance:
            raise ValueError(f"Không tìm thấy yêu cầu với ID: {maintenance_id}")

        # Check quyền truy cập
        if not is_admin and maintenance.tenant_id != user_id:
            raise ValueError("Bạn không có quyền xem yêu cầu này")

        return self._to_maintenance_out(maintenance)

    def list_maintenances(
        self,
        user_id: UUID,
        is_admin: bool = False,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        request_type: Optional[str] = None,
        building_id: Optional[UUID] = None,
        room_id: Optional[UUID] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> dict:
        """Lấy danh sách maintenance requests với phân quyền.

        Business rules:
        - Admin: Xem tất cả requests, có thể filter theo building.
        - Tenant: Chỉ xem requests của mình.

        Args:
            user_id: UUID của user hiện tại.
            is_admin: True nếu user là admin.
            Các tham số filter khác...

        Returns:
            Dict chứa items, total, offset, limit.
        """
        # Validate limit
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 20

        # Validate status nếu có
        if status:
            valid_statuses = [s.value for s in MaintenanceStatus]
            if status not in valid_statuses:
                raise ValueError(
                    f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}"
                )

        # Validate priority nếu có
        if priority:
            valid_priorities = [p.value for p in MaintenancePriority]
            if priority not in valid_priorities:
                raise ValueError(
                    f"Mức độ ưu tiên không hợp lệ. Phải là một trong: {valid_priorities}"
                )

        # Nếu là tenant, chỉ xem requests của mình
        tenant_id = None if is_admin else user_id

        # Lấy danh sách
        items_data = self.maintenance_repo.list_with_filters(
            search=search,
            status=status,
            priority=priority,
            request_type=request_type,
            building_id=building_id,
            room_id=room_id,
            tenant_id=tenant_id,
            offset=offset,
            limit=limit,
        )

        # Lấy tổng số
        total = self.maintenance_repo.count(
            search=search,
            status=status,
            priority=priority,
            request_type=request_type,
            building_id=building_id,
            room_id=room_id,
            tenant_id=tenant_id,
        )

        # Convert sang schema
        items_out = [MaintenanceListItem(**item) for item in items_data]

        return {
            "items": items_out,
            "total": total,
            "offset": offset,
            "limit": limit,
        }

    def get_stats(
        self,
        user_id: UUID,
        is_admin: bool = False,
        building_id: Optional[UUID] = None,
    ) -> MaintenanceStats:
        """Lấy thống kê maintenance requests.

        Args:
            user_id: UUID của user hiện tại.
            is_admin: True nếu user là admin.
            building_id: Lọc theo tòa nhà (admin only).

        Returns:
            MaintenanceStats schema.
        """
        tenant_id = None if is_admin else user_id
        
        stats_data = self.maintenance_repo.get_stats(
            tenant_id=tenant_id,
            building_id=building_id,
        )
        
        return MaintenanceStats(**stats_data)

    def update_maintenance(
        self,
        maintenance_id: UUID,
        maintenance_data: MaintenanceUpdate,
        user_id: UUID,
        is_admin: bool = False,
    ) -> MaintenanceOut:
        """Cập nhật maintenance request.

        Business rules:
        - Tenant: Chỉ update được title, description, priority nếu status=PENDING.
        - Admin: Update được tất cả field bao gồm status, cost.

        Args:
            maintenance_id: UUID của maintenance request.
            maintenance_data: Dữ liệu update.
            user_id: UUID của user hiện tại.
            is_admin: True nếu user là admin.

        Returns:
            MaintenanceOut schema đã update.

        Raises:
            ValueError: Nếu vi phạm rules.
        """
        maintenance = self.maintenance_repo.get_by_id(maintenance_id)
        if not maintenance:
            raise ValueError(f"Không tìm thấy yêu cầu với ID: {maintenance_id}")

        # Check quyền
        if not is_admin and maintenance.tenant_id != user_id:
            raise ValueError("Bạn không có quyền cập nhật yêu cầu này")

        update_data = maintenance_data.model_dump(exclude_unset=True)

        # Nếu là tenant
        if not is_admin:
            # Chỉ cho phép update nếu status=PENDING
            if maintenance.status != MaintenanceStatus.PENDING.value:
                raise ValueError(
                    "Chỉ có thể cập nhật yêu cầu khi trạng thái là 'Chưa xử lý'"
                )

            # Tenant không được update status, cost
            forbidden_fields = ["status", "estimated_cost", "actual_cost"]
            for field in forbidden_fields:
                if field in update_data:
                    raise ValueError(f"Bạn không có quyền cập nhật trường {field}")

        # Validate status nếu admin update
        if "status" in update_data:
            valid_statuses = [s.value for s in MaintenanceStatus]
            if update_data["status"] not in valid_statuses:
                raise ValueError(
                    f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}"
                )

        # Validate priority nếu có
        if "priority" in update_data:
            valid_priorities = [p.value for p in MaintenancePriority]
            if update_data["priority"] not in valid_priorities:
                raise ValueError(
                    f"Mức độ ưu tiên không hợp lệ. Phải là một trong: {valid_priorities}"
                )

        # Update
        updated = self.maintenance_repo.update(maintenance, update_data)

        return self._to_maintenance_out(updated)

    def delete_maintenance(
        self,
        maintenance_id: UUID,
        user_id: UUID,
        is_admin: bool = False,
    ) -> None:
        """Xóa maintenance request.

        Business rules:
        - Tenant: Chỉ xóa được request của mình nếu status=PENDING.
        - Admin: Xóa được tất cả (nhưng nên hạn chế, nên CANCEL thay vì DELETE).

        Args:
            maintenance_id: UUID của maintenance request.
            user_id: UUID của user hiện tại.
            is_admin: True nếu user là admin.

        Raises:
            ValueError: Nếu vi phạm rules.
        """
        maintenance = self.maintenance_repo.get_by_id(maintenance_id)
        if not maintenance:
            raise ValueError(f"Không tìm thấy yêu cầu với ID: {maintenance_id}")

        # Check quyền
        if not is_admin and maintenance.tenant_id != user_id:
            raise ValueError("Bạn không có quyền xóa yêu cầu này")

        # Nếu là tenant, chỉ xóa được khi PENDING
        if not is_admin and maintenance.status != MaintenanceStatus.PENDING.value:
            raise ValueError("Chỉ có thể xóa yêu cầu khi trạng thái là 'Chưa xử lý'")

        self.maintenance_repo.delete(maintenance)

    def _to_maintenance_out(self, maintenance) -> MaintenanceOut:
        """Convert ORM model sang MaintenanceOut schema.
        
        Helper method để serialize maintenance với relationship data.
        """
        return MaintenanceOut(
            id=maintenance.id,
            request_id=maintenance.request_id,
            room_id=maintenance.room_id,
            room_code=maintenance.room.room_code if maintenance.room else None,
            tenant_id=maintenance.tenant_id,
            tenant_name=(
                f"{maintenance.tenant.first_name} {maintenance.tenant.last_name}"
                if maintenance.tenant
                else None
            ),
            request_type=maintenance.request_type,
            title=maintenance.title,
            description=maintenance.description,
            priority=maintenance.priority,
            status=maintenance.status,
            estimated_cost=maintenance.estimated_cost,
            actual_cost=maintenance.actual_cost,
            completed_at=maintenance.completed_at,
            created_at=maintenance.created_at,
            updated_at=maintenance.updated_at,
            photos=[
                MaintenancePhotoOut.model_validate(photo)
                for photo in maintenance.maintenance_photos
            ] if maintenance.maintenance_photos else [],
        )
