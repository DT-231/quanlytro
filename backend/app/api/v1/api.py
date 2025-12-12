"""API v1 router aggregator.

Import và đăng ký tất cả các routers cho API version 1.
"""

from fastapi import APIRouter

from app.api.v1.routes import Room, Auth, Address, Building, Contract, Payment, Invoice

# Tạo main API router cho v1
api_router = APIRouter()

# Đăng ký các routers
api_router.include_router(Auth.router)
api_router.include_router(Address.router)
api_router.include_router(Building.router)
api_router.include_router(Room.router)
api_router.include_router(Contract.router)
api_router.include_router(Payment.router)
api_router.include_router(Invoice.router)
