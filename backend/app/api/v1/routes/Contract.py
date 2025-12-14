"""Contract API Router - HTTP endpoints cho Contract management.

Endpoints:
- GET    /api/v1/contracts              - List contracts với pagination & filters
- GET    /api/v1/contracts/stats        - Thống kê hợp đồng cho dashboard
- POST   /api/v1/contracts              - Tạo hợp đồng mới
- GET    /api/v1/contracts/{id}         - Chi tiết hợp đồng
- PUT    /api/v1/contracts/{id}         - Cập nhật hợp đồng
- DELETE /api/v1/contracts/{id}         - Xóa hợp đồng
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.infrastructure.db.session import get_db
from app.services.ContractService import ContractService
from app.schemas.contract_schema import (
    ContractCreate,
    ContractUpdate,
    ContractOut,
    ContractListItem,
)
from app.core import response
from app.schemas.response_schema import Response
from app.core.exceptions import (
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    UnauthorizedException,
    ConflictException,
    InternalServerException,
)


router = APIRouter(prefix="/api/v1/contracts", tags=["Contracts"])


@router.get(
    "/stats",
    response_model=Response[dict],
    responses={
        200: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "success",
                        "data": {
                            "total_contracts": 582,
                            "active_contracts": 188,
                            "expiring_soon": 199,
                            "expired_contracts": 10
                        }
                    }
                }
            }
        }
    }
)
async def get_contract_stats(session: Session = Depends(get_db)):
    """Lấy thống kê hợp đồng cho dashboard.

    **Hiển thị trên UI:**
    - Tổng hợp đồng: 582
    - Đang hoạt động: 188
    - Sắp hết hạn: 199 (hết hạn trong vòng 30 ngày)
    - Đã hết hạn: 10
    """
    try:
        service = ContractService(session)
        stats = service.get_contract_stats()
        return response.success(data=stats, message="success")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.get(
    "/",
    response_model=Response[dict],
    responses={
        200: {
            "description": "Successful Response",
            "content": {
                "application/json": {
                    "example": {
                        "code": 200,
                        "message": "success",
                        "data": {
                            "items": [
                                {
                                    "id": "123e4567-e89b-12d3-a456-426614174000",
                                    "contract_number": "HD01",
                                    "room_number": "111",
                                    "tenant_name": "Phan Mạnh Quỳnh",
                                    "building_name": "Chung cư Hoàng Anh Gia Lai",
                                    "start_date": "2025-02-15",
                                    "end_date": "2025-12-14",
                                    "rental_price": 2000000.0,
                                    "status": "ACTIVE",
                                    "created_at": "2025-01-01T00:00:00"
                                }
                            ],
                            "total": 582,
                            "page": 1,
                            "size": 20,
                            "pages": 30
                        }
                    }
                }
            }
        }
    }
)
async def list_contracts(
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
    size: int = Query(20, ge=1, le=100, description="Số items mỗi trang"),
    status: Optional[str] = Query(
        None, description="Lọc theo trạng thái: ACTIVE, EXPIRED, TERMINATED, PENDING"
    ),
    building: Optional[str] = Query(None, description="Lọc theo tên tòa nhà"),
    search: Optional[str] = Query(
        None, description="Tìm kiếm theo mã hợp đồng, tên khách hàng, số điện thoại"
    ),
    session: Session = Depends(get_db),
):
    """Lấy danh sách hợp đồng với pagination và filters.

    **Query Parameters:**
    - `page`: Số trang (mặc định 1)
    - `size`: Số items mỗi trang (mặc định 20, max 100)
    - `status`: Lọc theo trạng thái (ACTIVE, EXPIRED, TERMINATED, PENDING)
    - `building`: Lọc theo tên tòa nhà (tìm kiếm gần đúng)
    - `search`: Tìm kiếm theo mã hợp đồng / tên khách hàng / số điện thoại

    """
    try:
        service = ContractService(session)
        result = service.list_contracts(
            page=page, size=size, status=status, building=building, search=search
        )
        return response.success(data=result, message="success")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.post(
    "/", response_model=Response[ContractOut], status_code=status.HTTP_201_CREATED
)
async def create_contract(payload: ContractCreate, session: Session = Depends(get_db)):
    """Tạo hợp đồng mới.

    **Request Body (ContractCreate):**
    ```json
    {
        "room_id": "uuid",
        "tenant_id": "uuid",
        "start_date": "2025-02-15",
        "end_date": "2025-12-14",
        "rental_price": 2000000.00,
        "deposit_amount": 2000000.00,
        "payment_day": 15,
        "number_of_tenants": 1,
        "terms_and_conditions": "Điều khoản hợp đồng...",
        "notes": "Ghi chú...",
        "contract_number": "HD01",
        "payment_cycle_months": 3,
        "electricity_price": 3500.00,
        "water_price": 15000.00,
        "service_fees": ["Phí rác", "Phí giữ xe"]
    }
    ```

    **Business Rules:**
    - Phòng phải ở trạng thái AVAILABLE
    - Phòng chưa có hợp đồng ACTIVE
    - end_date phải sau start_date
    - Sau khi tạo, phòng chuyển sang OCCUPIED
    - Mã hợp đồng tự động: HD001, HD002, ...
    """
    service = ContractService(session)
    try:
        # TODO: Lấy user_id từ JWT token khi có authentication
        created_by = None  # Placeholder

        contract = service.create_contract(payload, created_by)
        return response.success(data=contract, message="success")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.get("/{contract_id}", response_model=Response[ContractOut])
async def get_contract(contract_id: UUID, session: Session = Depends(get_db)):
    """Lấy chi tiết hợp đồng theo ID.

    **Path Parameters:**
    - `contract_id`: UUID của hợp đồng

    """
    service = ContractService(session)
    try:
        contract = service.get_contract(contract_id)
        return response.success(data=contract, message="success")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.put("/{contract_id}", response_model=Response[ContractOut])
async def update_contract(
    contract_id: UUID, payload: ContractUpdate, session: Session = Depends(get_db)
):
    """Cập nhật hợp đồng (partial update).

    **Path Parameters:**
    - `contract_id`: UUID của hợp đồng

    **Request Body (ContractUpdate - tất cả fields optional):**
    ```json
    {
        "start_date": "2025-02-15",
        "end_date": "2025-12-14",
        "rental_price": 2500000.00,
        "deposit_amount": 2500000.00,
        "payment_day": 20,
        "number_of_tenants": 2,
        "status": "TERMINATED",
        "terms_and_conditions": "...",
        "notes": "...",
        "payment_cycle_months": 6,
        "electricity_price": 4000.00,
        "water_price": 18000.00
    }
    ```

    **Business Rules:**
    - Nếu chuyển status sang TERMINATED/EXPIRED, phòng về AVAILABLE
    - Nếu chuyển status sang ACTIVE, phòng sang OCCUPIED
    """
    service = ContractService(session)
    try:
        contract = service.update_contract(contract_id, payload)
        return response.success(data=contract, message="success")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contract(contract_id: UUID, session: Session = Depends(get_db)):
    """Xóa hợp đồng.

    **Path Parameters:**
    - `contract_id`: UUID của hợp đồng

    **Business Rules:**
    - Không thể xóa hợp đồng đã có invoice (TODO)
    - Nếu hợp đồng ACTIVE, phòng sẽ về AVAILABLE
    """
    service = ContractService(session)
    try:
        service.delete_contract(contract_id)
        return response.success(message="success")
    except ValueError as e:
        raise BadRequestException(message=str(e))
    except Exception as e:
        raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")
