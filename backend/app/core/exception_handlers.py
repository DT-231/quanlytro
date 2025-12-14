"""Exception handlers cho FastAPI application.

Middleware này bắt tất cả exceptions và convert thành response chuẩn với:
- success: true/false
- code: HTTP status code
- message: mô tả lỗi
- data: chi tiết lỗi (nếu có)
"""

from __future__ import annotations

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import AppException
from app.schemas.response_schema import Response


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handler cho custom AppException.
    
    Convert AppException thành JSONResponse với status code tương ứng.
    """
    success = 200 <= exc.status_code < 300
    resp = Response(
        success=success,
        message=exc.message,
        data=exc.data if exc.data else {}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=resp.model_dump()
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handler cho HTTPException từ FastAPI/Starlette.
    
    Convert HTTPException thành response chuẩn.
    """
    success = 200 <= exc.status_code < 300
    resp = Response(
        success=success,
        message=str(exc.detail) if exc.detail else "HTTP Error",
        data={}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=resp.model_dump()
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handler cho validation errors từ Pydantic.
    
    Convert validation errors thành response chuẩn với status 422.
    """
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    resp = Response(
        success=False,
        message="Validation error",
        data={"errors": errors}
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=resp.model_dump()
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler cho tất cả exceptions chưa được xử lý.
    
    Catch-all handler để đảm bảo mọi lỗi đều trả về format chuẩn.
    """
    resp = Response(
        success=False,
        message=f"Internal server error: {str(exc)}",
        data={}
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=resp.model_dump()
    )
