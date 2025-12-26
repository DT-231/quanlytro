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
from app.services.EmailService import email_service


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
        updated_appointment = self.appointment_repo.update(
            appointment_id, update_dict, handled_by=admin_id
        )

        # Gửi email thông báo nếu có email và trạng thái thay đổi
        if updated_appointment and update_data.status and appointment.email:
            try:
                # Lấy thông tin phòng và địa chỉ
                room_number = "N/A"
                building_name = "N/A"
                building_address = None
                ward_name = None
                city_name = None
                
                if appointment.room:
                    room_number = appointment.room.room_number
                    if appointment.room.building:
                        building_name = appointment.room.building.building_name
                        if appointment.room.building.address:
                            building_address = appointment.room.building.address.address_line
                            ward_name = appointment.room.building.address.ward
                            city_name = appointment.room.building.address.city

                # Format thời gian
                apt_time = appointment.appointment_datetime.strftime("%d/%m/%Y lúc %H:%M")

                # Gửi email
                email_service.send_appointment_status_notification(
                    to_email=appointment.email,
                    customer_name=appointment.full_name,
                    room_number=room_number,
                    building_name=building_name,
                    appointment_datetime=apt_time,
                    status=update_data.status,
                    admin_notes=update_data.admin_notes,
                    building_address=building_address,
                    ward_name=ward_name,
                    city_name=city_name,
                )
            except Exception as email_error:
                # Log error but don't fail the update
                print(f"[AppointmentService] Lỗi gửi email thông báo: {email_error}")

        return updated_appointment

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

    def get_appointments_by_contact(
        self, email: Optional[str] = None, phone: Optional[str] = None
    ) -> List[Appointment]:
        """Lấy danh sách appointments theo email hoặc phone.
        
        Cho phép user tra cứu lịch hẹn đã đặt mà không cần đăng nhập.
        
        Args:
            email: Email người đặt lịch
            phone: Số điện thoại người đặt lịch
            
        Returns:
            List appointments khớp với thông tin liên hệ
        """
        return self.appointment_repo.get_by_contact(email=email, phone=phone)
