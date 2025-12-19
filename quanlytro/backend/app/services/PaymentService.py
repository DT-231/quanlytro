"""Payment Service - Business logic for payments."""

import uuid
from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.payment import Payment
from app.models.invoice import Invoice
from app.repositories.payment_repository import PaymentRepository
from app.services.PayOSService import payos_service
from app.schemas.payment_schema import (
    PaymentCreatePayOSRequest,
    PaymentCODRequest,
    PaymentConfirmCODRequest,
    PayOSPaymentLinkResponse,
    PaymentResponse,
    PayOSWebhookData
)
import logging

logger = logging.getLogger(__name__)


class PaymentService:
    """Service xử lý business logic cho payments."""
    
    def __init__(self, db: Session):
        """Initialize service."""
        self.db = db
        self.repo = PaymentRepository(db)
    
    def _get_invoice_or_404(self, invoice_id: uuid.UUID) -> Invoice:
        """Lấy invoice hoặc raise 404."""
        invoice = self.db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Invoice {invoice_id} not found"
            )
        return invoice
    
    def _calculate_invoice_total(self, invoice: Invoice) -> Decimal:
        """Tính tổng tiền của invoice."""
        electricity_amount = Decimal(0)
        if invoice.electricity_new_index and invoice.electricity_old_index:
            electricity_consumed = invoice.electricity_new_index - invoice.electricity_old_index
            electricity_amount = Decimal(str(electricity_consumed)) * invoice.electricity_unit_price
        
        water_amount = Decimal(str(invoice.number_of_people)) * invoice.water_unit_price
        
        total = (
            invoice.room_price +
            electricity_amount +
            water_amount +
            invoice.service_fee +
            invoice.internet_fee +
            invoice.parking_fee +
            invoice.other_fees
        )
        
        return total
    
    async def create_payos_payment(
        self,
        request: PaymentCreatePayOSRequest,
        payer_id: uuid.UUID
    ) -> PayOSPaymentLinkResponse:
        """
        Tạo payment qua PayOS (banking).
        
        Flow:
        1. Kiểm tra invoice tồn tại
        2. Tính tổng tiền invoice
        3. Tạo payment record với status=pending
        4. Gọi PayOS để tạo QR code
        5. Lưu thông tin PayOS vào payment
        6. Return checkout URL và QR code
        """
        # 1. Get invoice
        invoice = self._get_invoice_or_404(request.invoice_id)
        
        # Check if invoice already paid
        existing_payments = self.repo.get_completed_payments(invoice.invoice_id)
        if existing_payments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice already paid"
            )
        
        # 2. Calculate total amount
        total_amount = self._calculate_invoice_total(invoice)
        
        # 3. Create payment record
        payment_id = uuid.uuid4()
        
        # Get room code from contract
        room_code = invoice.contract.room.room_number if invoice.contract and invoice.contract.room else "UNKNOWN"
        
        # Generate PayOS order code
        order_code = payos_service.generate_order_code(invoice.invoice_number, room_code)
        
        payment = Payment(
            payment_id=payment_id,
            invoice_id=invoice.invoice_id,
            payer_id=payer_id,
            amount=total_amount,
            method=Payment.PaymentMethod.BANKING,
            status=Payment.PaymentStatus.PENDING,
            banking_transaction_id=str(order_code),  # Store order_code temporarily
            note=f"PayOS payment for invoice {invoice.invoice_number}"
        )
        
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        
        # 4. Create PayOS payment link
        try:
            description = f"{room_code}-{invoice.invoice_number}"
            
            payos_response = payos_service.create_payment_link(
                order_code=order_code,
                amount=int(total_amount),  # PayOS requires int (VND)
                description=description,
                buyer_name=None,  # Can get from payer info if needed
                buyer_email=None,
                buyer_phone=None
            )
            
            # 5. Update payment with PayOS info
            payment.banking_transaction_id = str(order_code)
            payment.bank_name = "PayOS"
            self.db.commit()
            
            # 6. Return response
            return PayOSPaymentLinkResponse(
                payment_id=payment.payment_id,
                payos_order_id=order_code,
                checkout_url=payos_response["checkout_url"],
                qr_code=payos_response["qr_code"],
                amount=total_amount,
                description=description
            )
            
        except Exception as e:
            # Rollback payment if PayOS fails
            payment.status = Payment.PaymentStatus.FAILED
            payment.note = f"PayOS error: {str(e)}"
            self.db.commit()
            
            logger.error(f"PayOS payment creation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create PayOS payment: {str(e)}"
            )
    
    def create_cod_payment(
        self,
        request: PaymentCODRequest,
        payer_id: uuid.UUID
    ) -> PaymentResponse:
        """
        Tạo payment COD.
        
        Flow:
        1. Kiểm tra invoice tồn tại
        2. Tính tổng tiền
        3. Tạo payment với status=pending
        4. Return payment info
        """
        # 1. Get invoice
        invoice = self._get_invoice_or_404(request.invoice_id)
        
        # Check if invoice already paid
        existing_payments = self.repo.get_completed_payments(invoice.invoice_id)
        if existing_payments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice already paid"
            )
        
        # 2. Calculate total amount
        total_amount = self._calculate_invoice_total(invoice)
        
        # 3. Create payment record
        payment_id = uuid.uuid4()
        
        payment = Payment(
            payment_id=payment_id,
            invoice_id=invoice.invoice_id,
            payer_id=payer_id,
            amount=total_amount,
            method=Payment.PaymentMethod.COD,
            status=Payment.PaymentStatus.PENDING,
            cod_receiver_name=request.cod_receiver_name,
            cod_receiver_phone=request.cod_receiver_phone,
            note=request.note
        )
        
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        
        return PaymentResponse.model_validate(payment)
    
    def confirm_cod_payment(
        self,
        request: PaymentConfirmCODRequest,
        landlord_id: uuid.UUID
    ) -> PaymentResponse:
        """
        Xác nhận payment COD (chủ nhà nhấn).
        
        Flow:
        1. Kiểm tra payment tồn tại
        2. Kiểm tra method = COD và status = PENDING
        3. Kiểm tra quyền (landlord owns the property)
        4. Update status = COMPLETED, paid_at = now
        """
        # 1. Get payment
        payment = self.repo.get_by_payment_id(request.payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment {request.payment_id} not found"
            )
        
        # 2. Check method and status
        if payment.method != Payment.PaymentMethod.COD:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only COD payments can be confirmed manually"
            )
        
        if payment.status != Payment.PaymentStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment status is {payment.status}, cannot confirm"
            )
        
        # 3. Check landlord ownership (TODO: implement authorization check)
        # For now, skip this check - can add later with proper auth
        
        # 4. Update payment
        payment.status = Payment.PaymentStatus.COMPLETED
        payment.paid_at = datetime.now()
        if request.note:
            payment.note = f"{payment.note or ''}\n[Landlord confirmed] {request.note}".strip()
        
        self.db.commit()
        self.db.refresh(payment)
        
        return PaymentResponse.model_validate(payment)
    
    async def handle_payos_webhook(
        self,
        webhook_data: PayOSWebhookData,
        signature: str
    ) -> Dict[str, Any]:
        """
        Xử lý webhook từ PayOS khi thanh toán thành công.
        
        Flow:
        1. Verify signature
        2. Tìm payment theo orderCode
        3. Kiểm tra code = "00" (success)
        4. Update payment status = COMPLETED
        5. Update invoice status = PAID (nếu cần)
        """
        # 1. Verify signature
        if not payos_service.verify_webhook_signature(webhook_data.dict(), signature):
            logger.warning(f"Invalid PayOS webhook signature")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature"
            )
        
        # 2. Find payment by order code
        payment = self.repo.get_by_banking_transaction_id(str(webhook_data.orderCode))
        if not payment:
            logger.warning(f"Payment not found for order code {webhook_data.orderCode}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment not found for order {webhook_data.orderCode}"
            )
        
        # 3. Check if already processed
        if payment.status == Payment.PaymentStatus.COMPLETED:
            logger.info(f"Payment {payment.payment_id} already completed")
            return {"status": "ok", "message": "Already processed"}
        
        # 4. Check payment success
        if webhook_data.code != "00":
            payment.status = Payment.PaymentStatus.FAILED
            payment.note = f"PayOS webhook: {webhook_data.desc}"
            self.db.commit()
            
            return {"status": "failed", "message": webhook_data.desc}
        
        # 5. Update payment
        payment.status = Payment.PaymentStatus.COMPLETED
        payment.paid_at = datetime.now()
        payment.bank_name = webhook_data.counterAccountBankName or "PayOS"
        payment.bank_account_number = webhook_data.counterAccountNumber
        payment.note = f"PayOS payment successful: {webhook_data.desc}"
        
        self.db.commit()
        
        logger.info(f"Payment {payment.payment_id} completed via PayOS webhook")
        
        return {
            "status": "success",
            "payment_id": str(payment.payment_id),
            "amount": float(payment.amount)
        }
    
    def get_payment_by_id(self, payment_id: uuid.UUID) -> PaymentResponse:
        """Lấy payment theo ID."""
        payment = self.repo.get_by_payment_id(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment {payment_id} not found"
            )
        return PaymentResponse.model_validate(payment)
    
    def get_payments_by_invoice(self, invoice_id: uuid.UUID) -> list[PaymentResponse]:
        """Lấy tất cả payments của một invoice."""
        payments = self.repo.get_by_invoice_id(invoice_id)
        return [PaymentResponse.model_validate(p) for p in payments]
