"""PayOS Integration Service.

Service này xử lý tích hợp với PayOS payment gateway.
"""

import hmac
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any
from payos import PayOS
from payos.types import CreatePaymentLinkRequest, ItemData
from app.core.settings import settings
import logging

logger = logging.getLogger(__name__)


class PayOSService:
    """Service để xử lý PayOS payment gateway."""
    
    def __init__(self):
        """Initialize PayOS client."""
        self._client = None
    
    @property
    def client(self) -> PayOS:
        """Lazy initialization of PayOS client."""
        if self._client is None:
            try:
                self._client = PayOS(
                    client_id=settings.PAYOS_CLIENT_ID,
                    api_key=settings.PAYOS_API_KEY,
                    checksum_key=settings.PAYOS_CHECKSUM_KEY
                )
                logger.info("PayOS client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize PayOS client: {e}")
                raise Exception(f"PayOS configuration error: {str(e)}")
        return self._client
    
    def create_payment_link(
        self,
        order_code: int,
        amount: int,
        description: str,
        buyer_name: Optional[str] = None,
        buyer_email: Optional[str] = None,
        buyer_phone: Optional[str] = None,
        return_url: Optional[str] = None,
        cancel_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Tạo payment link từ PayOS.
        
        Args:
            order_code: Mã đơn hàng (unique, int)
            amount: Số tiền (VND)
            description: Mô tả giao dịch
            buyer_name: Tên người mua
            buyer_email: Email người mua
            buyer_phone: SĐT người mua
            return_url: URL redirect khi thanh toán thành công
            cancel_url: URL redirect khi hủy
            
        Returns:
            Dict chứa checkout_url, qr_code, và thông tin khác
        """
        try:
            # Prepare payment data
            items = [
                ItemData(
                    name=description,
                    quantity=1,
                    price=amount
                )
            ]
            
            payment_data = CreatePaymentLinkRequest(
                orderCode=order_code,
                amount=amount,
                description=description,
                items=items,
                returnUrl=return_url or settings.PAYOS_RETURN_URL,
                cancelUrl=cancel_url or settings.PAYOS_CANCEL_URL,
                buyerName=buyer_name,
                buyerEmail=buyer_email,
                buyerPhone=buyer_phone
            )
            
            # Create payment link
            response = self.client.create_payment_link(payment_data)
            
            logger.info(f"Created PayOS payment link for order {order_code}")
            
            return {
                "checkout_url": response.checkout_url,
                "qr_code": response.qr_code,
                "payment_link_id": response.payment_link_id,
                "order_code": order_code,
                "amount": amount,
                "description": description
            }
            
        except Exception as e:
            logger.error(f"Failed to create PayOS payment link: {e}")
            raise Exception(f"PayOS Error: {str(e)}")
    
    def get_payment_info(self, order_code: int) -> Dict[str, Any]:
        """
        Lấy thông tin payment từ PayOS.
        
        Args:
            order_code: Mã đơn hàng
            
        Returns:
            Dict chứa thông tin payment
        """
        try:
            response = self.client.get_payment_link_information(order_code)
            return {
                "id": response.id,
                "order_code": response.order_code,
                "amount": response.amount,
                "amount_paid": response.amount_paid,
                "amount_remaining": response.amount_remaining,
                "status": response.status,
                "created_at": response.created_at,
                "transactions": response.transactions,
                "cancellation_reason": response.cancellation_reason,
                "canceled_at": response.canceled_at
            }
        except Exception as e:
            logger.error(f"Failed to get PayOS payment info: {e}")
            raise Exception(f"PayOS Error: {str(e)}")
    
    def cancel_payment_link(self, order_code: int, reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Hủy payment link.
        
        Args:
            order_code: Mã đơn hàng
            reason: Lý do hủy
            
        Returns:
            Dict chứa thông tin hủy
        """
        try:
            response = self.client.cancel_payment_link(order_code, reason)
            logger.info(f"Cancelled PayOS payment link {order_code}")
            return {
                "id": response.id,
                "order_code": response.order_code,
                "status": response.status,
                "canceled_at": response.canceled_at,
                "cancellation_reason": response.cancellation_reason
            }
        except Exception as e:
            logger.error(f"Failed to cancel PayOS payment link: {e}")
            raise Exception(f"PayOS Error: {str(e)}")
    
    def verify_webhook_signature(self, webhook_data: Dict[str, Any], signature: str) -> bool:
        """
        Xác thực webhook signature từ PayOS.
        
        Args:
            webhook_data: Data từ webhook
            signature: Signature từ PayOS
            
        Returns:
            True nếu signature hợp lệ
        """
        try:
            # PayOS sử dụng HMAC SHA256
            # Sort keys và tạo string để verify
            sorted_keys = sorted(webhook_data.keys())
            data_str = "&".join([f"{k}={webhook_data[k]}" for k in sorted_keys])
            
            computed_signature = hmac.new(
                settings.PAYOS_CHECKSUM_KEY.encode(),
                data_str.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(computed_signature, signature)
            
        except Exception as e:
            logger.error(f"Failed to verify webhook signature: {e}")
            return False
    
    def generate_order_code(self, invoice_number: str, room_code: str) -> int:
        """
        Tạo order code từ invoice_number và room_code.
        
        PayOS yêu cầu order_code là số nguyên duy nhất.
        
        Args:
            invoice_number: Số hóa đơn (VD: INV-202401-001)
            room_code: Mã phòng (VD: P101)
            
        Returns:
            int order code
        """
        # Tạo unique code từ invoice_number + timestamp
        # VD: INV-202401-001 -> 202401001 + timestamp
        try:
            # Extract số từ invoice_number
            number_part = ''.join(filter(str.isdigit, invoice_number))
            timestamp = int(datetime.now().timestamp() * 1000) % 1000000  # Lấy 6 số cuối
            
            # Combine: số invoice + timestamp
            order_code = int(f"{number_part}{timestamp}")
            
            return order_code
            
        except Exception as e:
            logger.error(f"Failed to generate order code: {e}")
            # Fallback: use timestamp only
            return int(datetime.now().timestamp() * 1000)


# Singleton instance
payos_service = PayOSService()
