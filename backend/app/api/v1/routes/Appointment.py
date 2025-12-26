"""Appointment Router - API endpoints cho đặt lịch xem phòng."""

from typing import Optional, List
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.session import get_db
from app.core.security import get_current_user
from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.models.user import User
from app.schemas.appointment_schema import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
    AppointmentListResponse,
    AppointmentDetailResponse,
)
from app.services.AppointmentService import AppointmentService
from app.core import response
from app.schemas.response_schema import Response


router = APIRouter(prefix="/appointments", tags=["Appointment Management"])


@router.post(
    "",
    response_model=Response[AppointmentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Tạo lịch hẹn xem phòng (Public)",
    description="""
    API cho phép người dùng (chưa đăng nhập) đặt lịch xem phòng.
    
    **Thông tin cần thiết:**
    - Họ tên, số điện thoại
    - Email (không bắt buộc)
    - ID phòng muốn xem
    - Thời gian muốn xem phòng
    - Ghi chú (nếu có)
    
    **Lưu ý:** Thời gian đặt lịch phải trong tương lai.
    """,
)
def create_appointment(
    appointment_data: AppointmentCreate, session: AsyncSession = Depends(get_db)
):
    """Tạo appointment mới (không cần đăng nhập)."""
    try:

        service = AppointmentService(session)
        appointment = service.create_appointment(appointment_data)

        return response.success(
            data=AppointmentResponse.model_validate(appointment),
            message="Đặt lịch xem phòng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.",
        )
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise BadRequestException(
            message=f"Lỗi khi tạo lịch hẹn: {str(e)}",
        )


@router.get(
    "",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách appointments (Admin only)",
    description="""
    API lấy danh sách tất cả appointments.
    Chỉ admin mới có quyền truy cập.
    
    **Filters:**
    - status: Lọc theo trạng thái (PENDING, CONFIRMED, CANCELLED, COMPLETED, REJECTED)
    - room_id: Lọc theo phòng
    - from_date: Lọc từ ngày
    - to_date: Lọc đến ngày
    """,
)
def get_appointments(
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
    pageSize: int = Query(20, ge=1, le=100, description="Số bản ghi mỗi trang"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái"),
    room_id: Optional[UUID] = Query(None, description="Lọc theo phòng"),
    from_date: Optional[datetime] = Query(None, description="Từ ngày"),
    to_date: Optional[datetime] = Query(None, description="Đến ngày"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Lấy danh sách appointments (admin only)."""
    try:
        # Check admin role
        if current_user.role.role_code not in ["ADMIN", "MANAGER"]:
            raise BadRequestException(
                message="Chỉ admin mới có quyền xem danh sách appointments",
            )

        # Convert page/pageSize to offset/limit
        offset = (page - 1) * pageSize

        service = AppointmentService(session)
        appointments = service.get_appointments(
            skip=offset,
            limit=pageSize,
            status=status,
            room_id=room_id,
            from_date=from_date,
            to_date=to_date,
        )

        totalItems = service.count_appointments(status=status, room_id=room_id)
        totalPages = (totalItems + pageSize - 1) // pageSize if totalItems > 0 else 1

        # Convert to list response with room info
        appointment_list = []
        for apt in appointments:
            apt_dict = AppointmentListResponse.model_validate(apt).model_dump()
            if apt.room:
                apt_dict["room_number"] = apt.room.room_number
                if apt.room.building:
                    apt_dict["building_name"] = apt.room.building.building_name
                    # Thêm thông tin địa chỉ từ address
                    if apt.room.building.address:
                        apt_dict["building_address"] = apt.room.building.address.address_line
                        apt_dict["ward_name"] = apt.room.building.address.ward
                        apt_dict["district_name"] = None  # Address model không có district
                        apt_dict["city_name"] = apt.room.building.address.city
            appointment_list.append(apt_dict)

        return response.success(
            data={
                "items": appointment_list,
                "pagination": {
                    "totalItems": totalItems,
                    "page": page,
                    "pageSize": pageSize,
                    "totalPages": totalPages,
                }
            },
            message="Lấy danh sách appointments thành công",
        )
    except BadRequestException:
        raise
    except Exception as e:
        raise BadRequestException(
            message=f"Lỗi khi lấy danh sách appointments: {str(e)}",
        )


@router.get(
    "/pending",
    response_model=Response[List[dict]],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách appointments chờ xử lý (Admin only)",
    description="API lấy danh sách appointments đang ở trạng thái PENDING",
)
def get_pending_appointments(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Lấy appointments chờ xử lý."""
    try:
        # Check admin role
        if current_user.role.role_code not in ["ADMIN", "MANAGER"]:
            raise ForbiddenException(
                message="Chỉ admin mới có quyền xem",
            )

        service = AppointmentService(session)
        appointments = service.get_pending_appointments()

        # Convert to response
        appointment_list = []
        for apt in appointments:
            apt_dict = AppointmentListResponse.model_validate(apt).model_dump()
            if apt.room:
                apt_dict["room_number"] = apt.room.room_number
                if apt.room.building:
                    apt_dict["building_name"] = apt.room.building.building_name
                    # Thêm thông tin địa chỉ từ address
                    if apt.room.building.address:
                        apt_dict["building_address"] = apt.room.building.address.address_line
                        apt_dict["ward_name"] = apt.room.building.address.ward
                        apt_dict["district_name"] = None  # Address model không có district
                        apt_dict["city_name"] = apt.room.building.address.city
            appointment_list.append(apt_dict)

        return response.success(
            data=appointment_list,
            message=f"Có {len(appointment_list)} lịch hẹn đang chờ xử lý",
        )
    except BadRequestException:
        raise
    except Exception as e:
        raise BadRequestException(message=f"Lỗi: {str(e)}")


@router.get(
    "/my-appointments",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    summary="Tra cứu lịch hẹn của tôi (Public)",
    description="""
    API cho phép người dùng tra cứu lịch hẹn đã đặt bằng email hoặc số điện thoại.
    
    **Thông tin cần thiết (ít nhất 1 trong 2):**
    - email: Email đã dùng khi đặt lịch
    - phone: Số điện thoại đã dùng khi đặt lịch
    """,
)
def get_my_appointments(
    email: Optional[str] = Query(None, description="Email đã đặt lịch"),
    phone: Optional[str] = Query(None, description="Số điện thoại đã đặt lịch"),
    session: AsyncSession = Depends(get_db),
):
    """Tra cứu lịch hẹn theo email hoặc phone."""
    try:
        if not email and not phone:
            raise BadRequestException(
                message="Vui lòng nhập email hoặc số điện thoại để tra cứu",
            )

        service = AppointmentService(session)
        appointments = service.get_appointments_by_contact(email=email, phone=phone)

        # Convert to response with room info
        appointment_list = []
        for apt in appointments:
            apt_dict = AppointmentListResponse.model_validate(apt).model_dump()
            apt_dict["admin_notes"] = apt.admin_notes  # Include admin notes for user
            if apt.room:
                apt_dict["room_number"] = apt.room.room_number
                if apt.room.building:
                    apt_dict["building_name"] = apt.room.building.building_name
                    # Thêm thông tin địa chỉ từ address
                    if apt.room.building.address:
                        apt_dict["building_address"] = apt.room.building.address.address_line
                        apt_dict["ward_name"] = apt.room.building.address.ward
                        apt_dict["district_name"] = None  # Address model không có district
                        apt_dict["city_name"] = apt.room.building.address.city
            appointment_list.append(apt_dict)

        return response.success(
            data={
                "items": appointment_list,
                "total": len(appointment_list),
            },
            message=f"Tìm thấy {len(appointment_list)} lịch hẹn",
        )
    except BadRequestException:
        raise
    except Exception as e:
        raise BadRequestException(message=f"Lỗi: {str(e)}")


@router.get(
    "/{appointment_id}",
    response_model=Response[AppointmentDetailResponse],
    status_code=status.HTTP_200_OK,
    summary="Xem chi tiết appointment (Admin only)",
    description="API lấy thông tin chi tiết của một appointment",
)
def get_appointment(
    appointment_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Lấy chi tiết appointment."""
    try:
        # Check admin role
        if current_user.role.role_code not in ["ADMIN", "MANAGER"]:
            raise ForbiddenException(
                message="Chỉ admin mới có quyền xem",
            )

        service = AppointmentService(session)
        appointment = service.get_appointment(appointment_id)

        if not appointment:
            raise NotFoundException(
                status_code=status.HTTP_404_NOT_FOUND,
                message="Không tìm thấy appointment",
            )

        # Chuyển sang dict và thêm thông tin room/building
        apt_dict = AppointmentDetailResponse.model_validate(appointment).model_dump()
        if appointment.room:
            apt_dict["room_number"] = appointment.room.room_number
            if appointment.room.building:
                apt_dict["building_name"] = appointment.room.building.building_name
                if appointment.room.building.address:
                    apt_dict["building_address"] = appointment.room.building.address.address_line
                    apt_dict["ward_name"] = appointment.room.building.address.ward
                    apt_dict["district_name"] = None
                    apt_dict["city_name"] = appointment.room.building.address.city

        return response.success(
            data=apt_dict,
            message="Lấy thông tin appointment thành công",
        )
    except BadRequestException:
        raise
    except Exception as e:
        raise BadRequestException(message=f"Lỗi: {str(e)}")


@router.patch(
    "/{appointment_id}",
    response_model=Response[AppointmentResponse],
    status_code=status.HTTP_200_OK,
    summary="Cập nhật trạng thái appointment (Admin only)",
    description="""
    API cho phép admin cập nhật trạng thái và ghi chú của appointment.
    
    **Trạng thái có thể cập nhật:**
    - CONFIRMED: Xác nhận lịch hẹn
    - REJECTED: Từ chối lịch hẹn
    - COMPLETED: Đã hoàn thành
    - CANCELLED: Đã hủy
    """,
)
def update_appointment(
    appointment_id: UUID,
    update_data: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Cập nhật appointment (admin only)."""
    try:
        # Check admin role
        if current_user.role.role_code not in ["ADMIN", "MANAGER"]:
            raise BadRequestException(
                message="Chỉ admin mới có quyền cập nhật",
            )

        service = AppointmentService(session)
        appointment = service.update_appointment_status(
            appointment_id, update_data, current_user.id
        )

        if not appointment:
            raise NotFoundException(
                message="Không tìm thấy appointment",
            )

        return response.success(
            data=AppointmentResponse.model_validate(appointment),
            message="Cập nhật appointment thành công",
        )
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except BadRequestException:
        raise
    except Exception as e:
        raise BadRequestException(message=f"Lỗi: {str(e)}")


@router.delete(
    "/{appointment_id}",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    summary="Xóa appointment (Admin only)",
    description="API xóa appointment khỏi hệ thống",
)
def delete_appointment(
    appointment_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Xóa appointment (admin only)."""
    try:
        # Check admin role
        if current_user.role.role_code not in ["ADMIN", "MANAGER"]:
            raise ForbiddenException(
                message="Chỉ admin mới có quyền xóa",
            )

        service = AppointmentService(session)
        success = service.delete_appointment(appointment_id)

        if not success:
            raise NotFoundException(
                message="Không tìm thấy appointment",
            )

        return response.success(
            data={"deleted": True}, message="Xóa appointment thành công"
        )
    except BadRequestException:
        raise
    except Exception as e:
        raise BadRequestException(message=f"Lỗi: {str(e)}")
