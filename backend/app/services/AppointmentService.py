"""Service layer cho Appointment."""

from typing import List, Optional
from uuid import UUID
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.room_repository import RoomRepository
from app.repositories.user_repository import UserRepository
from app.schemas.appointment_schema import AppointmentCreate, AppointmentUpdate
from app.models.appointment import Appointment
from app.core.Enum.appointmentEnum import AppointmentStatus
from app.core.Enum.roomEnum import RoomStatus
from app.services.NotificationService import NotificationService


class AppointmentService:
    """Service xử lý logic cho Appointment."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.appointment_repo = AppointmentRepository(session)
        self.room_repo = RoomRepository(session)
        self.user_repo = UserRepository(session)
        self.notification_service = NotificationService(session)

    def create_appointment(self, appointment_data: AppointmentCreate) -> Appointment:
        """
        Tạo appointment mới (dành cho người dùng).

        Args:
            appointment_data: Dữ liệu appointment

        Returns:
            Appointment đã tạo

        Raises:
            ValueError: Nếu phòng không tồn tại hoặc không available
        """
        # Kiểm tra room tồn tại và available
        room = self.room_repo.get_by_id(appointment_data.room_id)
        if not room:
            raise ValueError("Phòng không tồn tại")

        if room.status not in [RoomStatus.AVAILABLE.value, RoomStatus.OCCUPIED.value]:
            raise ValueError(
                f"Phòng hiện không khả dụng để xem. Trạng thái: {room.status}"
            )

        # Tạo appointment
        appointment_dict = appointment_data.model_dump()
        appointment_dict["status"] = AppointmentStatus.PENDING.value

        appointment = self.appointment_repo.create(appointment_dict)

        # Gửi thông báo cho admin
        try:
            # Lấy danh sách admin
            admins = self.user_repo.get_admins()
            admin_ids = [admin.id for admin in admins]

            if admin_ids:
                # Format appointment time
                apt_time = appointment.appointment_datetime.strftime("%d/%m/%Y %H:%M")

                self.notification_service.create_appointment_notification_for_admin(
                    admin_ids=admin_ids,
                    appointment_id=appointment.id,
                    customer_name=appointment.full_name,
                    room_number=room.room_number,
                    appointment_time=apt_time,
                )
        except Exception as notify_error:
            # Log error but don't fail the appointment creation
            print(f"Warning: Failed to send notification to admins: {notify_error}")

        return appointment

    def get_appointment(self, appointment_id: UUID) -> Optional[Appointment]:
        """Lấy thông tin appointment theo ID."""
        return self.appointment_repo.get_by_id(appointment_id)

    def get_appointments(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        room_id: Optional[UUID] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
    ) -> List[Appointment]:
        """Lấy danh sách appointments với filter."""
        return self.appointment_repo.get_all(
            skip=skip,
            limit=limit,
            status=status,
            room_id=room_id,
            from_date=from_date,
            to_date=to_date,
        )

    def get_pending_appointments(self) -> List[Appointment]:
        """Lấy danh sách appointments chờ xử lý (dành cho admin)."""
        return self.appointment_repo.get_pending_appointments()

    def update_appointment_status(
        self, appointment_id: UUID, update_data: AppointmentUpdate, admin_id: UUID
    ) -> Optional[Appointment]:
        """
        Cập nhật trạng thái appointment (dành cho admin).

        Args:
            appointment_id: ID của appointment
            update_data: Dữ liệu cập nhật
            admin_id: ID của admin xử lý

        Returns:
            Appointment đã cập nhật

        Raises:
            ValueError: Nếu appointment không tồn tại
        """
        appointment = self.appointment_repo.get_by_id(appointment_id)
        if not appointment:
            raise ValueError("Appointment không tồn tại")

        # Validate status
        if update_data.status:
            valid_statuses = [status.value for status in AppointmentStatus]
            if update_data.status not in valid_statuses:
                raise ValueError(
                    f"Trạng thái không hợp lệ. Phải là một trong: {', '.join(valid_statuses)}"
                )

        update_dict = update_data.model_dump(exclude_unset=True)
        return self.appointment_repo.update(
            appointment_id, update_dict, handled_by=admin_id
        )

    def cancel_appointment(self, appointment_id: UUID) -> Optional[Appointment]:
        """
        Hủy appointment (có thể do user hoặc admin).

        Args:
            appointment_id: ID của appointment

        Returns:
            Appointment đã hủy
        """
        appointment = self.appointment_repo.get_by_id(appointment_id)
        if not appointment:
            raise ValueError("Appointment không tồn tại")

        if appointment.status in [
            AppointmentStatus.COMPLETED.value,
            AppointmentStatus.CANCELLED.value,
        ]:
            raise ValueError(
                f"Không thể hủy appointment với trạng thái: {appointment.status}"
            )

        update_dict = {"status": AppointmentStatus.CANCELLED.value}
        return self.appointment_repo.update(appointment_id, update_dict)

    def delete_appointment(self, appointment_id: UUID) -> bool:
        """Xóa appointment (chỉ admin)."""
        return self.appointment_repo.delete(appointment_id)

    def count_appointments(
        self, status: Optional[str] = None, room_id: Optional[UUID] = None
    ) -> int:
        """Đếm số lượng appointments."""
        return self.appointment_repo.count(status=status, room_id=room_id)
