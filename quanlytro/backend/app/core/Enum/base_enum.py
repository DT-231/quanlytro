"""Base enum classes cho hệ thống quản lý phòng trọ.

Module này cung cấp các lớp enum cơ sở với các phương thức tiện ích
chung cho tất cả enum trong hệ thống.
"""

from __future__ import annotations

import enum
from typing import Any


class BaseEnum(enum.Enum):
    """Base enum class với các phương thức tiện ích chung.
    
    Cung cấp các phương thức để convert và validate enum values,
    cũng như các tiện ích cho serialization/deserialization.
    """
    
    @classmethod
    def from_value(cls, value: Any) -> BaseEnum | None:
        """Tạo enum instance từ value, trả về None nếu không tìm thấy.
        
        Args:
            value: Giá trị cần convert thành enum
            
        Returns:
            Enum instance hoặc None nếu không valid
        """
        try:
            return cls(value)
        except ValueError:
            return None
    
    @classmethod
    def values(cls) -> list[str]:
        """Lấy danh sách tất cả các giá trị của enum.
        
        Returns:
            List các giá trị string của enum
        """
        return [item.value for item in cls]
    
    @classmethod
    def names(cls) -> list[str]:
        """Lấy danh sách tất cả các tên của enum.
        
        Returns:
            List các tên của enum
        """
        return [item.name for item in cls]
    
    def __str__(self) -> str:
        """String representation trả về value của enum."""
        return self.value


class StatusEnum(BaseEnum):
    """Base enum cho các loại status trong hệ thống.
    
    Cung cấp các status cơ bản: ACTIVE, INACTIVE, SUSPENDED
    mà nhiều entity trong hệ thống sẽ sử dụng.
    """
    
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
