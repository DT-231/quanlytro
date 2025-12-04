from typing import Generic
from annotated_types import T
from fastapi import APIRouter, Depends

from app.infrastructure.db.session import get_db
from sqlalchemy.orm import Session

from app.schemas.auth_schema import TokenRefreshRequest
from app.schemas.user_schema import UserCreate, UserLogin, UserRegister
from app.services.AuthService import AuthService
from app.core.security import get_current_user


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Đăng ký tài khoản CUSTOMER (public registration).

    Role mặc định: CUSTOMER
    Khi ký hợp đồng thuê nhà, role sẽ tự động chuyển thành TENANT.

    - **first_name**: Tên (1-50 ký tự)
    - **last_name**: Họ (1-50 ký tự)
    - **email**: Địa chỉ email (duy nhất)
    - **password**: Mật khẩu (tối thiểu 8 ký tự)
    - **confirm_password**: Xác nhận mật khẩu
    """
    auth_service = AuthService(db)
    ok, msg, payload = auth_service.register_user(user_data)
    if not ok:
        return {"code": 400, "message": msg}
    # return created user and tokens
    user = payload["user"]
    return {
        "code": 201,
        "message": "Đăng ký tài khoản CUSTOMER thành công",
        "data": {},
    }


@router.post("/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email/password and receive access + refresh tokens.

    - **email**: Địa chỉ email
    - **password**: Mật khẩu (tối thiểu 6 ký tự)

    """
    auth_service = AuthService(db)
    email = credentials.email
    password = credentials.password
    if not email or not password:
        return {"code": 400, "message": "email and password required"}

    auth = auth_service.authenticate_user(email, password)
    if not auth:
        return {"code": 401, "message": "Invalid credentials"}

    return {
        "code": 200,
        "message": "ok",
        "data": {
            "user": auth["user"],
            "access_token": auth["access_token"],
            "refresh_token": auth["refresh_token"],
        },
    }


@router.post("/refresh")
async def refresh(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Exchange refresh token for a new access token."""
    token = payload.refresh_token
    if not token:
        return {"code": 400, "message": "refresh_token is required"}

    auth_service = AuthService(db)
    try:
        data = auth_service.refresh_access_token(token)
    except Exception as e:
        return {"code": 401, "message": str(e)}

    return {"code": 200, "message": "ok", "data": data}


@router.post("/create-tenant")
async def create_tenant(
    tenant_data: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Chủ nhà tạo tài khoản cho người thuê (TENANT).

    **Chỉ ADMIN/Landlord mới được dùng API này.**

    Flow:
    - Nếu email đã tồn tại với role CUSTOMER → nâng cấp lên TENANT
    - Nếu email chưa tồn tại → tạo mới với role TENANT
    - Nếu đã là TENANT hoặc ADMIN → báo lỗi

    Body:
    - **first_name**: Tên
    - **last_name**: Họ
    - **email**: Email
    - **phone**: Số điện thoại
    - **password**: Mật khẩu
    - **confirm_password**: Xác nhận mật khẩu
    - Các field khác (cccd, date_of_birth...)
    """
    from app.core.Enum.userEnum import UserRole
    from app.models.role import Role

    # Check if current user is ADMIN/Landlord
    landlord_role = (
        db.query(Role).filter(Role.role_code == UserRole.ADMIN.value).first()
    )
    if current_user.role_id != landlord_role.id:
        return {
            "code": 403,
            "message": "Chỉ chủ nhà (ADMIN) mới có quyền tạo tài khoản người thuê",
        }

    auth_service = AuthService(db)
    ok, msg, user_obj = auth_service.create_tenant_by_landlord(
        tenant_data, current_user.id
    )

    if not ok:
        return {"code": 400, "message": msg}

    return {"code": 201, "message": msg, "data": {"user": user_obj}}
