"""Payment Repository - Database operations for payments."""

from typing import Optional, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.payment import Payment


class PaymentRepository:
    """Repository cho Payment model."""
    
    def __init__(self, db: Session):
        """Initialize repository."""
        self.db = db
    
    def get_by_payment_id(self, payment_id: UUID) -> Optional[Payment]:
        """Lấy payment theo payment_id."""
        return self.db.query(Payment).filter(Payment.payment_id == payment_id).first()
    
    def get_by_invoice_id(self, invoice_id: UUID) -> List[Payment]:
        """Lấy tất cả payments của một invoice."""
        return self.db.query(Payment).filter(Payment.invoice_id == invoice_id).all()
    
    def get_by_payer_id(self, payer_id: UUID) -> List[Payment]:
        """Lấy tất cả payments của một người dùng."""
        return self.db.query(Payment).filter(Payment.payer_id == payer_id).all()
    
    def get_by_status(self, status: str) -> List[Payment]:
        """Lấy payments theo status."""
        return self.db.query(Payment).filter(Payment.status == status).all()
    
    def get_by_method(self, method: str) -> List[Payment]:
        """Lấy payments theo method."""
        return self.db.query(Payment).filter(Payment.method == method).all()
    
    def get_by_banking_transaction_id(self, transaction_id: str) -> Optional[Payment]:
        """Lấy payment theo banking transaction ID (để check duplicate)."""
        return self.db.query(Payment).filter(
            Payment.banking_transaction_id == transaction_id
        ).first()
    
    def get_pending_payments(self, invoice_id: Optional[UUID] = None) -> List[Payment]:
        """Lấy các payment đang pending."""
        query = self.db.query(Payment).filter(Payment.status == "pending")
        if invoice_id:
            query = query.filter(Payment.invoice_id == invoice_id)
        return query.all()
    
    def get_completed_payments(self, invoice_id: Optional[UUID] = None) -> List[Payment]:
        """Lấy các payment đã completed."""
        query = self.db.query(Payment).filter(Payment.status == "completed")
        if invoice_id:
            query = query.filter(Payment.invoice_id == invoice_id)
        return query.all()
    
    def update_status(
        self,
        payment_id: UUID,
        status: str,
        paid_at: Optional[datetime] = None,
        note: Optional[str] = None
    ) -> Optional[Payment]:
        """Cập nhật status của payment."""
        payment = self.get_by_payment_id(payment_id)
        if not payment:
            return None
        
        payment.status = status
        if paid_at:
            payment.paid_at = paid_at
        if note:
            payment.note = note
        
        self.db.commit()
        self.db.refresh(payment)
        return payment
    
    def update_banking_info(
        self,
        payment_id: UUID,
        transaction_id: str,
        bank_name: Optional[str] = None,
        account_number: Optional[str] = None
    ) -> Optional[Payment]:
        """Cập nhật thông tin banking."""
        payment = self.get_by_payment_id(payment_id)
        if not payment:
            return None
        
        payment.banking_transaction_id = transaction_id
        if bank_name:
            payment.bank_name = bank_name
        if account_number:
            payment.bank_account_number = account_number
        
        self.db.commit()
        self.db.refresh(payment)
        return payment
