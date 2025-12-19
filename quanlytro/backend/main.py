"""FastAPI application entry point.

Khởi tạo và cấu hình FastAPI application cho hệ thống quản lý phòng trọ.
"""

from __future__ import annotations

import logging
import sys

# Cấu hình logging để hiển thị timing logs
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:\t%(name)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.api import api_router
from app.core import response
from app.core.settings import settings
from app.core.exceptions import AppException
from app.core.exception_handlers import (
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)

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

# Đăng ký các exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


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
