"""Maintenance Repository - data access layer cho MaintenanceRequest.

Repository xử lý các thao tác database cho maintenance requests.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, case, or_, and_
from datetime import datetime

from app.models.maintenance_request import MaintenanceRequest
from app.models.maintenance_photo import MaintenancePhoto
from app.models.room import Room
from app.models.user import User
from app.models.building import Building
from app.core.Enum.maintenanceEnum import MaintenanceStatus, MaintenancePriority


class MaintenanceRepository:
    """Repository cho MaintenanceRequest entity."""
    
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, maintenance_id: UUID) -> Optional[MaintenanceRequest]:
        """Lấy maintenance request theo ID với eager loading.
        
        Args:
            maintenance_id: UUID của maintenance request
            
        Returns:
            MaintenanceRequest object hoặc None
        """
        return (
            self.db.query(MaintenanceRequest)
            .options(
                joinedload(MaintenanceRequest.room).joinedload(Room.building),
                joinedload(MaintenanceRequest.tenant),
                joinedload(MaintenanceRequest.maintenance_photos)
            )
            .filter(MaintenanceRequest.id == maintenance_id)
            .first()
        )

    def get_by_request_id(self, request_id: UUID) -> Optional[MaintenanceRequest]:
        """Lấy maintenance request theo request_id."""
        return (
            self.db.query(MaintenanceRequest)
            .filter(MaintenanceRequest.request_id == request_id)
            .first()
        )

    def create(self, data: dict) -> MaintenanceRequest:
        """Tạo maintenance request mới.
        
        Args:
            data: Dict chứa dữ liệu maintenance request
            
        Returns:
            MaintenanceRequest instance mới
        """
        # Generate request_id nếu chưa có
        if "request_id" not in data:
            data["request_id"] = uuid4()
        
        obj = MaintenanceRequest(**data)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, obj: MaintenanceRequest, update_data: dict) -> MaintenanceRequest:
        """Cập nhật maintenance request.
        
        Args:
            obj: MaintenanceRequest instance cần update
            update_data: Dict chứa dữ liệu update
            
        Returns:
            MaintenanceRequest instance đã update
        """
        for key, value in update_data.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
        
        # Nếu status chuyển sang COMPLETED, set completed_at
        if "status" in update_data and update_data["status"] == MaintenanceStatus.COMPLETED.value:
            obj.completed_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: MaintenanceRequest) -> None:
        """Xóa maintenance request.
        
        Args:
            obj: MaintenanceRequest instance cần xóa
        """
        # Xóa các photos liên quan trước
        self.db.query(MaintenancePhoto).filter(
            MaintenancePhoto.request_id == obj.request_id
        ).delete()
        
        self.db.delete(obj)
        self.db.commit()

    def list_with_filters(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        request_type: Optional[str] = None,
        building_id: Optional[UUID] = None,
        room_id: Optional[UUID] = None,
        tenant_id: Optional[UUID] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[dict]:
        """Lấy danh sách maintenance requests với filters.
        
        Trả về dict để dễ customize output cho dashboard.
        """
        query = (
            self.db.query(MaintenanceRequest)
            .join(Room, MaintenanceRequest.room_id == Room.id)
            .join(Building, Room.building_id == Building.id)
            .join(User, MaintenanceRequest.tenant_id == User.id)
            .options(
                joinedload(MaintenanceRequest.room),
                joinedload(MaintenanceRequest.tenant)
            )
        )
        
        # Apply filters
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    MaintenanceRequest.title.ilike(search_pattern),
                    MaintenanceRequest.description.ilike(search_pattern),
                    Room.room_code.ilike(search_pattern),
                )
            )
        
        if status:
            query = query.filter(MaintenanceRequest.status == status)
        
        if priority:
            query = query.filter(MaintenanceRequest.priority == priority)
        
        if request_type:
            query = query.filter(MaintenanceRequest.request_type == request_type)
        
        if building_id:
            query = query.filter(Room.building_id == building_id)
        
        if room_id:
            query = query.filter(MaintenanceRequest.room_id == room_id)
        
        if tenant_id:
            query = query.filter(MaintenanceRequest.tenant_id == tenant_id)
        
        # Order by created_at desc (mới nhất trước)
        query = query.order_by(MaintenanceRequest.created_at.desc())
        
        # Pagination
        requests = query.offset(offset).limit(limit).all()
        
        # Convert sang dict
        result = []
        for idx, req in enumerate(requests, start=offset + 1):
            result.append({
                "id": req.id,
                "request_code": str(100 + idx),  # Mã tạm
                "room_code": req.room.room_code if req.room else "N/A",
                "tenant_name": f"{req.tenant.first_name} {req.tenant.last_name}" if req.tenant else "N/A",
                "request_date": req.created_at,
                "content": req.title,
                "building_name": req.room.building.building_name if req.room and req.room.building else "N/A",
                "status": req.status,
            })
        
        return result

    def count(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        request_type: Optional[str] = None,
        building_id: Optional[UUID] = None,
        room_id: Optional[UUID] = None,
        tenant_id: Optional[UUID] = None,
    ) -> int:
        """Đếm tổng số maintenance requests theo filters."""
        query = (
            self.db.query(func.count(MaintenanceRequest.id))
            .join(Room, MaintenanceRequest.room_id == Room.id)
        )
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    MaintenanceRequest.title.ilike(search_pattern),
                    MaintenanceRequest.description.ilike(search_pattern),
                    Room.room_code.ilike(search_pattern),
                )
            )
        
        if status:
            query = query.filter(MaintenanceRequest.status == status)
        
        if priority:
            query = query.filter(MaintenanceRequest.priority == priority)
        
        if request_type:
            query = query.filter(MaintenanceRequest.request_type == request_type)
        
        if building_id:
            query = query.filter(Room.building_id == building_id)
        
        if room_id:
            query = query.filter(MaintenanceRequest.room_id == room_id)
        
        if tenant_id:
            query = query.filter(MaintenanceRequest.tenant_id == tenant_id)
        
        return query.scalar() or 0

    def get_stats(
        self,
        tenant_id: Optional[UUID] = None,
        building_id: Optional[UUID] = None,
    ) -> dict:
        """Lấy thống kê maintenance requests.
        
        Args:
            tenant_id: Lọc theo tenant (cho người thuê)
            building_id: Lọc theo tòa nhà (cho admin)
        """
        query = self.db.query(MaintenanceRequest)
        
        if tenant_id:
            query = query.filter(MaintenanceRequest.tenant_id == tenant_id)
        
        if building_id:
            query = query.join(Room).filter(Room.building_id == building_id)
        
        total = query.count()
        pending = query.filter(MaintenanceRequest.status == MaintenanceStatus.PENDING.value).count()
        in_progress = query.filter(MaintenanceRequest.status == MaintenanceStatus.IN_PROGRESS.value).count()
        completed = query.filter(MaintenanceRequest.status == MaintenanceStatus.COMPLETED.value).count()
        cancelled = query.filter(MaintenanceRequest.status == MaintenanceStatus.CANCELLED.value).count()
        
        return {
            "total_requests": total,
            "pending": in_progress,  # "Đang xử lý" = IN_PROGRESS
            "not_processed": pending,  # "Chưa xử lý" = PENDING
            "processed": completed + cancelled,  # "Đã xử lý" = COMPLETED + CANCELLED
        }

    def add_photos(self, request_id: UUID, photo_urls: list[str], uploaded_by: UUID) -> list[MaintenancePhoto]:
        """Thêm ảnh cho maintenance request.
        
        Args:
            request_id: request_id của maintenance request
            photo_urls: Danh sách URL ảnh
            uploaded_by: UUID của người upload
            
        Returns:
            List MaintenancePhoto instances
        """
        photos = []
        for url in photo_urls:
            photo = MaintenancePhoto(
                request_id=request_id,
                url=url,
                is_before=True,  # Ảnh khi tạo request = ảnh trước sửa
                uploaded_by=uploaded_by,
            )
            self.db.add(photo)
            photos.append(photo)
        
        self.db.commit()
        for photo in photos:
            self.db.refresh(photo)
        
        return photos
