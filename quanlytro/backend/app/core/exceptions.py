"""Custom exceptions cho application.

Các exception này sẽ được exception handler bắt và convert thành response chuẩn
với HTTP status code tương ứng.
"""

from __future__ import annotations
from typing import Any, Optional


class AppException(Exception):
    """Base exception cho tất cả custom exceptions."""
    
    def __init__(
        self, 
        message: str, 
        status_code: int = 500,
        data: Optional[Any] = None
    ):
        self.message = message
        self.status_code = status_code
        self.data = data
        super().__init__(self.message)


class BadRequestException(AppException):
    """Exception cho bad request (400)."""
    
    def __init__(self, message: str = "Bad request", data: Optional[Any] = None):
        super().__init__(message=message, status_code=400, data=data)


class UnauthorizedException(AppException):
    """Exception cho unauthorized (401)."""
    
    def __init__(self, message: str = "Unauthorized", data: Optional[Any] = None):
        super().__init__(message=message, status_code=401, data=data)


class ForbiddenException(AppException):
    """Exception cho forbidden (403)."""
    
    def __init__(self, message: str = "Forbidden", data: Optional[Any] = None):
        super().__init__(message=message, status_code=403, data=data)


class NotFoundException(AppException):
    """Exception cho not found (404)."""
    
    def __init__(self, message: str = "Not found", data: Optional[Any] = None):
        super().__init__(message=message, status_code=404, data=data)


class ConflictException(AppException):
    """Exception cho conflict (409) - thường dùng cho duplicate resource."""
    
    def __init__(self, message: str = "Conflict", data: Optional[Any] = None):
        super().__init__(message=message, status_code=409, data=data)


class UnprocessableEntityException(AppException):
    """Exception cho unprocessable entity (422)."""
    
    def __init__(self, message: str = "Unprocessable entity", data: Optional[Any] = None):
        super().__init__(message=message, status_code=422, data=data)


class InternalServerException(AppException):
    """Exception cho internal server error (500)."""
    
    def __init__(self, message: str = "Internal server error", data: Optional[Any] = None):
        super().__init__(message=message, status_code=500, data=data)
