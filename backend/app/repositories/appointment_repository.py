"""Repository cho Appointment model."""

from typing import List, Optional
from uuid import UUID
from datetime import datetime

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.appointment import Appointment
from app.models.room import Room
from app.models.building import Building
from app.core.Enum.appointmentEnum import AppointmentStatus


class AppointmentRepository:
    """Repository để thao tác với Appointment model."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def create(self, appointment_data: dict) -> Appointment:
        """Tạo appointment mới."""
        appointment = Appointment(**appointment_data)
        self.session.add(appointment)
        self.session.commit()
        self.session.refresh(appointment)
        return appointment

    def get_by_id(self, appointment_id: UUID) -> Optional[Appointment]:
        """Lấy appointment theo ID với thông tin room và building."""
        stmt = (
            select(Appointment)
            .options(selectinload(Appointment.room).selectinload(Room.building))
            .where(Appointment.id == appointment_id)
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        room_id: Optional[UUID] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
    ) -> List[Appointment]:
        """Lấy danh sách appointments với filter."""
        stmt = (
            select(Appointment)
            .options(selectinload(Appointment.room).selectinload(Room.building))
            .order_by(Appointment.appointment_datetime.desc())
        )

        # Apply filters
        filters = []
        if status:
            filters.append(Appointment.status == status)
        if room_id:
            filters.append(Appointment.room_id == room_id)
        if from_date:
            filters.append(Appointment.appointment_datetime >= from_date)
        if to_date:
            filters.append(Appointment.appointment_datetime <= to_date)

        if filters:
            stmt = stmt.where(and_(*filters))

        stmt = stmt.offset(skip).limit(limit)
        result = self.session.execute(stmt)
        return list(result.scalars().all())

    def get_pending_appointments(self) -> List[Appointment]:
        """Lấy danh sách appointments đang chờ xử lý."""
        stmt = (
            select(Appointment)
            .options(selectinload(Appointment.room).selectinload(Room.building))
            .where(Appointment.status == AppointmentStatus.PENDING)
            .order_by(Appointment.appointment_datetime.asc())
        )
        result = self.session.execute(stmt)
        return list(result.scalars().all())

    def update(
        self, appointment_id: UUID, update_data: dict, handled_by: Optional[UUID] = None
    ) -> Optional[Appointment]:
        """Cập nhật appointment."""
        appointment = self.get_by_id(appointment_id)
        if not appointment:
            return None

        for key, value in update_data.items():
            if hasattr(appointment, key) and value is not None:
                setattr(appointment, key, value)

        if handled_by:
            appointment.handled_by = handled_by
            appointment.handled_at = datetime.now()

        self.session.commit()
        self.session.refresh(appointment)
        return appointment

    def delete(self, appointment_id: UUID) -> bool:
        """Xóa appointment."""
        appointment = self.get_by_id(appointment_id)
        if not appointment:
            return False

        self.session.delete(appointment)
        self.session.commit()
        return True

    def count(
        self, status: Optional[str] = None, room_id: Optional[UUID] = None
    ) -> int:
        """Đếm số lượng appointments."""
        stmt = select(Appointment)

        filters = []
        if status:
            filters.append(Appointment.status == status)
        if room_id:
            filters.append(Appointment.room_id == room_id)

        if filters:
            stmt = stmt.where(and_(*filters))

        result = self.session.execute(stmt)
        return len(list(result.scalars().all()))
