"""Invoice Router - RESTful API endpoints cho quản lý hóa đơn.

Các endpoint tuân thủ REST conventions:
- GET /invoices - Lấy danh sách hóa đơn
- POST /invoices - Tạo hóa đơn mới
- GET /invoices/{invoice_id} - Xem chi tiết hóa đơn
- PUT /invoices/{invoice_id} - Cập nhật hóa đơn
- GET /invoices/buildings - Lấy danh sách tòa nhà cho dropdown
- GET /invoices/rooms/{building_id} - Lấy danh sách phòng theo tòa nhà
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.infrastructure.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.core.exceptions import (
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    InternalServerException,
)
from app.schemas.invoice_schema import (
    InvoiceCreate, InvoiceUpdate, InvoiceOut, InvoiceListItem,
    BuildingOption, RoomOption
)
from app.services.InvoiceService import InvoiceService
from app.core import response
from app.schemas.response_schema import Response

router = APIRouter(prefix="/invoices", tags=["Invoice Management"])


@router.get(
    "/buildings",
    response_model=Response[list],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tòa nhà cho dropdown",
    description="API cho chủ nhà chọn tòa nhà khi tạo hóa đơn"
)
def get_buildings_dropdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách tòa nhà (ACTIVE) cho dropdown.
    
    Returns:
        List[BuildingOption]: [{"id": "uuid", "building_name": "Tên tòa"}]
    """
    try:
        invoice_service = InvoiceService(db)
        buildings = invoice_service.get_buildings_for_dropdown()
        return response.success(data=buildings, message="Lấy danh sách tòa nhà thành công")
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.get(
    "/rooms/{building_id}",
    response_model=Response[list],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách phòng theo tòa nhà",
    description="API lấy phòng + tên khách hàng khi chủ chọn tòa nhà"
)
def get_rooms_by_building(
    building_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách phòng có hợp đồng ACTIVE theo tòa nhà.
    
    Args:
        building_id: UUID của tòa nhà
    
    Returns:
        List[RoomOption]: [{"id": "uuid", "room_number": "101", "tenant_name": "Nguyễn Văn A", "contract_id": "uuid"}]
    """
    try:
        invoice_service = InvoiceService(db)
        rooms = invoice_service.get_rooms_by_building(building_id)
        return response.success(data=rooms, message="Lấy danh sách phòng thành công")
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.get(
    "",
    response_model=Response[dict],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách hóa đơn",
    description="Admin: xem tất cả. Tenant: chỉ xem hóa đơn của mình"
)
def list_invoices(
    invoice_status: Optional[str] = Query(None, description="Lọc theo trạng thái", alias="status"),
    building_id: Optional[UUID] = Query(None, description="Lọc theo tòa nhà (chỉ admin)"),
    offset: int = Query(0, ge=0, description="Vị trí bắt đầu"),
    limit: int = Query(20, ge=1, le=100, description="Số lượng tối đa"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách hóa đơn.
    
    - Admin: Xem tất cả hóa đơn, có thể filter theo building
    - Tenant: Chỉ xem hóa đơn của phòng mình
    
    Query params:
    - status: PENDING, PAID, OVERDUE, CANCELLED
    - building_id: UUID (chỉ admin)
    - offset, limit: Pagination
    """
    try:
        user_role = current_user.role.role_code if current_user.role else "CUSTOMER"
        
        invoice_service = InvoiceService(db)
        result = invoice_service.list_invoices(
            user_id=current_user.id,
            user_role=user_role,
            status=invoice_status,
            building_id=building_id,
            offset=offset,
            limit=limit
        )
        return response.success(data=result, message="Lấy danh sách hóa đơn thành công")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.post(
    "",
    response_model=Response[InvoiceOut],
    status_code=status.HTTP_201_CREATED,
    summary="Tạo hóa đơn mới",
    description="Chủ nhà tạo hóa đơn cho phòng"
)
def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo hóa đơn mới.
    
    Chỉ chủ nhà (ADMIN) mới được tạo.
    
    Request body:
    {
        "contract_id": "uuid",  // Từ dropdown phòng
        "billing_month": "2025-01-01",
        "due_date": "2025-01-15",
        "electricity_old_index": 100,
        "electricity_new_index": 150,
        "number_of_people": 2,
        "service_fees": [
            {"name": "Dịch vụ", "amount": 50000},
            {"name": "Internet", "amount": 100000},
            {"name": "Gửi xe", "amount": 50000}
        ],
        "notes": "Ghi chú"
    }
    """
    try:
        user_role = current_user.role.role_code if current_user.role else "CUSTOMER"
        
        if user_role != "ADMIN":
            raise ForbiddenException(message="Chỉ chủ nhà mới có quyền tạo hóa đơn")
        
        invoice_service = InvoiceService(db)
        invoice = invoice_service.create_invoice(invoice_data, current_user.id)
        return response.created(data=invoice, message="Tạo hóa đơn thành công")
    except ValueError as e:
        raise ConflictException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.get(
    "/{invoice_id}",
    response_model=Response[InvoiceOut],
    status_code=status.HTTP_200_OK,
    summary="Xem chi tiết hóa đơn",
    description="Admin: xem tất cả. Tenant: chỉ xem hóa đơn của mình"
)
def get_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xem chi tiết hóa đơn.
    
    - Admin: Xem được tất cả hóa đơn
    - Tenant: Chỉ xem được hóa đơn của phòng mình
    
    Returns:
        InvoiceOut với đầy đủ thông tin chi phí, tổng tiền
    """
    try:
        user_role = current_user.role.role_code if current_user.role else "CUSTOMER"
        
        invoice_service = InvoiceService(db)
        invoice = invoice_service.get_invoice(invoice_id, current_user.id, user_role)
        return response.success(data=invoice, message="Lấy thông tin hóa đơn thành công")
    except ValueError as e:
        raise NotFoundException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.put(
    "/{invoice_id}",
    response_model=Response[InvoiceOut],
    status_code=status.HTTP_200_OK,
    summary="Cập nhật hóa đơn",
    description="Chỉ sửa được nếu chưa thanh toán (PENDING)"
)
def update_invoice(
    invoice_id: UUID,
    invoice_data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cập nhật hóa đơn.
    
    Business rules:
    - Chỉ admin mới được sửa
    - Chỉ sửa được nếu chưa thanh toán (status = PENDING)
    
    Request body (partial update):
    {
        "electricity_new_index": 160,
        "service_fees": [
            {"name": "Dịch vụ", "amount": 60000}
        ]
    }
    """
    try:
        user_role = current_user.role.role_code if current_user.role else "CUSTOMER"
        
        invoice_service = InvoiceService(db)
        invoice = invoice_service.update_invoice(
            invoice_id, invoice_data, current_user.id, user_role
        )
        return response.success(data=invoice, message="Cập nhật hóa đơn thành công")
    except ValueError as e:
        error_msg = str(e).lower()
        if "không tìm thấy" in error_msg:
            raise NotFoundException(message=str(e))
        elif "không có quyền" in error_msg or "chỉ chủ nhà" in error_msg:
            raise ForbiddenException(message=str(e))
        else:
            raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")
