"""Enums cho Media/Document entities trong hệ thống quản lý phòng trọ.

Các enum định nghĩa loại tài liệu theo database schema.
Chỉ giữ lại các enum thực sự được sử dụng trong database.
"""

from __future__ import annotations

from .base_enum import BaseEnum


class DocumentType(BaseEnum):
    """Loại tài liệu người dùng.
    
    Các loại tài liệu có thể upload cho user theo database schema:
    - AVATAR: Ảnh đại diện
    - CCCD_FRONT: Mặt trước căn cước công dân
    - CCCD_BACK: Mặt sau căn cước công dân
    """
    
    AVATAR = "AVATAR"         # Ảnh đại diện
    CCCD_FRONT = "CCCD_FRONT" # Mặt trước CCCD
    CCCD_BACK = "CCCD_BACK"   # Mặt sau CCCD


class ContractDocumentType(BaseEnum):
    """Loại tài liệu hợp đồng.
    
    Các loại tài liệu có thể đính kèm với hợp đồng theo database schema:
    - CONTRACT: Hợp đồng chính
    - ADDENDUM: Phụ lục hợp đồng
    - OTHER: Tài liệu khác
    """
    
    CONTRACT = "CONTRACT"   # Hợp đồng chính
    ADDENDUM = "ADDENDUM"   # Phụ lục hợp đồng
    OTHER = "OTHER"         # Tài liệu khác
