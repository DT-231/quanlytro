"""Payment API Routes.

Endpoints:
- POST /api/v1/payments/create-payos - Tạo payment qua PayOS (banking)
- POST /api/v1/payments/create-cod - Tạo payment COD
- POST /api/v1/payments/confirm-cod - Xác nhận COD payment (landlord)
- POST /api/v1/payments/webhook/payos - PayOS webhook
- GET /api/v1/payments/{payment_id} - Lấy thông tin payment
- GET /api/v1/payments/invoice/{invoice_id} - Lấy payments của invoice
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.infrastructure.db.session import get_db
from app.services.PaymentService import PaymentService
from app.schemas.payment_schema import (
    PaymentCreatePayOSRequest,
    PaymentCODRequest,
    PaymentConfirmCODRequest,
    PayOSPaymentLinkResponse,
    PaymentResponse,
    PaymentListResponse,
    PayOSWebhookRequest
)
from app.core.security import get_current_user
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])


def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    """Dependency để lấy PaymentService."""
    return PaymentService(db)


@router.post(
    "/create-payos",
    response_model=PayOSPaymentLinkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo thanh toán qua PayOS (Banking)",
    description="""
    Tạo payment link PayOS để thanh toán hóa đơn qua banking.
    
    Flow:
    1. Người thuê chọn phương thức Banking
    2. System tạo QR code từ PayOS
    3. Người thuê quét QR để thanh toán
    4. PayOS gửi webhook khi thanh toán thành công
    5. System cập nhật payment status = completed
    """
)
async def create_payos_payment(
    request: PaymentCreatePayOSRequest,
    current_user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service)
):
    """Tạo payment qua PayOS."""
    try:
        return await service.create_payos_payment(request, current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating PayOS payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post(
    "/create-cod",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo thanh toán COD (Cash on Delivery)",
    description="""
    Tạo payment COD - thanh toán tiền mặt.
    
    Flow:
    1. Người thuê chọn phương thức COD
    2. System tạo payment với status = pending
    3. Người thuê đưa tiền cho chủ nhà
    4. Chủ nhà nhấn xác nhận
    5. System cập nhật payment status = completed
    """
)
def create_cod_payment(
    request: PaymentCODRequest,
    current_user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service)
):
    """Tạo payment COD."""
    try:
        return service.create_cod_payment(request, current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating COD payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post(
    "/confirm-cod",
    response_model=PaymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Xác nhận thanh toán COD (Chủ nhà)",
    description="""
    Chủ nhà xác nhận đã nhận tiền COD.
    
    Chỉ chủ nhà mới có thể xác nhận.
    Payment phải có method = COD và status = pending.
    """
)
def confirm_cod_payment(
    request: PaymentConfirmCODRequest,
    current_user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service)
):
    """Xác nhận payment COD."""
    try:
        # TODO: Check if current_user is landlord
        return service.confirm_cod_payment(request, current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming COD payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post(
    "/webhook/payos",
    status_code=status.HTTP_200_OK,
    summary="PayOS Webhook",
    description="""
    Webhook endpoint để nhận thông báo từ PayOS khi thanh toán thành công.
    
    Endpoint này được gọi tự động bởi PayOS, không cần authentication.
    """
)
async def payos_webhook(
    request: Request,
    service: PaymentService = Depends(get_payment_service)
):
    """Handle PayOS webhook."""
    try:
        # Get raw body for signature verification
        body = await request.json()
        
        # Parse webhook data
        webhook_data = PayOSWebhookRequest(**body)
        
        # Process webhook
        result = await service.handle_payos_webhook(
            webhook_data.data,
            webhook_data.signature
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing PayOS webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin payment",
    description="Lấy chi tiết một payment theo ID."
)
def get_payment(
    payment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service)
):
    """Lấy thông tin payment."""
    try:
        return service.get_payment_by_id(payment_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/invoice/{invoice_id}",
    response_model=PaymentListResponse,
    status_code=status.HTTP_200_OK,
    summary="Lấy payments của invoice",
    description="Lấy tất cả payments của một hóa đơn."
)
def get_payments_by_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service)
):
    """Lấy payments của invoice."""
    try:
        payments = service.get_payments_by_invoice(invoice_id)
        return PaymentListResponse(
            payments=payments,
            total=len(payments)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payments by invoice: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
