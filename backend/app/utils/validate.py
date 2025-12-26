"""Validation utilities cho hệ thống quản lý phòng trọ.

Module cung cấp các hàm validate dữ liệu đầu vào.
"""

from __future__ import annotations

import re
from typing import Tuple


def validate_password(password: str) -> Tuple[bool, str]:
    """Validate password theo các rules bảo mật.
    
    Rules:
    - Độ dài: 8-16 ký tự
    - Chứa ít nhất 1 chữ thường
    - Chứa ít nhất 1 chữ hoa
    - Chứa ít nhất 1 chữ số
    - Chứa ít nhất 1 ký tự đặc biệt
    
    Args:
        password: Mật khẩu cần validate
        
    Returns:
        Tuple (is_invalid, message):
        - is_invalid: True nếu password KHÔNG hợp lệ
        - message: Thông báo kết quả
    """
    # Check length
    if len(password) < 8 or len(password) > 16:
        return True, "Mật khẩu phải dài hơn 8 và ít hơn 16 ký tự"

    # Regex rule: chữ thường, chữ hoa, chữ số, ký tự đặc biệt
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$"

    if not re.match(pattern, password):
        return True, "Mật khẩu phải chứa chữ thường, chữ hoa, chữ số và ký tự đặc biệt"

    return False, "Mật khẩu hợp lệ"
