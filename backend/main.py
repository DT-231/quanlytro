"""FastAPI application entry point.

Khởi tạo và cấu hình FastAPI application cho hệ thống quản lý phòng trọ.
"""

from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.api import api_router
from app.core import response
from app.core.settings import settings

# Tạo FastAPI application instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API cho hệ thống quản lý phòng trọ",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký API router
app.include_router(api_router, prefix="/api/v1")


# ============ Exception Handlers ============

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handler cho lỗi validation (422 Unprocessable Entity).
    
    Xử lý khi request body/query params/path params không đúng schema Pydantic.
    """
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": 422,
            "message": "Validation error",
            "data": errors[0]["message"]
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handler cho HTTPException (400, 401, 403, 404, etc.).
    
    Xử lý các exception được raise từ endpoint với HTTPException.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.status_code,
            "message": exc.detail,
            "data": {}
        }
    )


@app.exception_handler(StarletteHTTPException)
async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handler cho Starlette HTTPException (fallback cho các lỗi HTTP khác).
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.status_code,
            "message": exc.detail,
            "data": {}
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Handler cho tất cả exception chưa được xử lý (500 Internal Server Error).
    
    Catch-all handler để đảm bảo mọi lỗi đều trả về format chuẩn.
    """
    import traceback
    
    # Log error (trong production nên dùng logging thay vì print)
    print(f"Unhandled exception: {exc}")
    print(traceback.format_exc())
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": 500,
            "message": "Internal server error",
            "data": {}
        }
    )


# ============ Routes ============


@app.get("/", tags=["Root"])
def read_root():
    """Health check endpoint."""
    return {
        "message": "Welcome to Room Management API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
