"""Models package cho hệ thống quản lý phòng trọ.

Import tất cả các SQLAlchemy models từ các file riêng biệt.
Mỗi bảng database được định nghĩa trong một file model riêng.
"""

# Base model
from .base import BaseModel

# User-related models
from .user import User
from .role import Role

# Address and Building models
from .address import Address
from .building import Building

# Room-related models
from .room import Room
from .room_type import RoomType
from .room_utility import RoomUtility

# Media/Document models
from .building_photo import BuildingPhoto
from .room_photo import RoomPhoto
from .maintenance_photo import MaintenancePhoto
from .user_document import UserDocument
from .contract_document import ContractDocument
from .invoice_proof import InvoiceProof

# Business logic models
from .contract import Contract
from .invoice import Invoice
from .payment import Payment
from .maintenance_request import MaintenanceRequest
from .notification import Notification
from .review import Review
from .appointment import Appointment


__all__ = [
    # Base
    "BaseModel",
    
    # User and Role
    "User",
    "Role",
    
    # Address and Building
    "Address",
    "Building",
    
    # Room and Utilities
    "Room",
    "RoomType",
    "RoomUtility",
    
    # Business models
    "Contract",
    "Invoice",
    "Payment",
    "MaintenanceRequest",
    "Notification",
    "Review",
    "Appointment",
    
    # Media/Document models
    "BuildingPhoto",
    "RoomPhoto",
    "UserDocument",
    "MaintenancePhoto",
    "ContractDocument",
    "InvoiceProof",
]