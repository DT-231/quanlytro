"""
Enum modules for the application.

This package contains all enum definitions organized by domain:
- userEnum: User-related enums (UserRole, UserStatus)
- roomEnum: Room-related enums (RoomStatus)
- contractEnum: Contract-related enums (ContractStatus)
- invoiceEnum: Invoice-related enums (InvoiceStatus)
- paymentEnum: Payment-related enums (PaymentMethod)
- maintenanceEnum: Maintenance-related enums (RequestType, Priority, RequestStatus)
- notificationEnum: Notification-related enums (NotificationType, RelatedType)
- mediaEnum: Media-related enums (MediaType, MediaPurpose, EntityType)
"""

# User enums
from .userEnum import UserRole, UserStatus

# Room enums
from .roomEnum import RoomStatus

# Contract enums
from .contractEnum import ContractStatus

# Invoice enums
from .invoiceEnum import InvoiceStatus

# Payment enums
from .paymentEnum import PaymentMethod

# Maintenance enums (map internal class names to public API names)
from .maintenanceEnum import (
    MaintenanceRequestType as RequestType,
    MaintenancePriority as Priority,
    MaintenanceStatus as RequestStatus,
)

# Notification enums
from .notificationEnum import NotificationType, RelatedType

# Media enums
from .mediaEnum import DocumentType, ContractDocumentType

__all__ = [
    # User
    "UserRole",
    "UserStatus",
    # Room
    "RoomStatus", 
    # Contract
    "ContractStatus",
    # Invoice
    "InvoiceStatus",
    # Payment
    "PaymentMethod",
    # Maintenance
    "RequestType",
    "Priority", 
    "RequestStatus",
    # Notification
    "NotificationType",
    "RelatedType",
    # Media
    "DocumentType",
    "ContractDocumentType",
]
