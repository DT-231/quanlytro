import time
from typing import Generic
from annotated_types import T
from fastapi import APIRouter, Depends
from email_validator import validate_email
from app.infrastructure.db.session import get_db
from sqlalchemy.orm import Session
from app.core import response

from app.schemas.auth_schema import TokenRefreshRequest, Token
from app.schemas.user_schema import UserCreate, UserLogin, UserRegister, UserOut
from app.services.AuthService import AuthService
from app.core.security import get_current_user
from app.utils import validate


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
    # Validate thủ công để control error response
    if not user_data.first_name or not user_data.first_name.strip():
        return response.bad_request(message="Tên không được để trống")
    if len(user_data.first_name) > 50:
        return response.bad_request(message="Tên không được quá 50 ký tự")
    
    if not user_data.last_name or not user_data.last_name.strip():
        return response.bad_request(message="Họ không được để trống")
    if len(user_data.last_name) > 50:
        return response.bad_request(message="Họ không được quá 50 ký tự")
    
    if not user_data.email or not user_data.email.strip():
        return response.bad_request(message="Email không được để trống")
    try:
        validate_email(user_data.email)
    except Exception:
        return response.bad_request(message="Email không đúng định dạng")
    if not user_data.password:
        return response.bad_request(message="Mật khẩu không được để trống")
    if not user_data.confirm_password:
        return response.bad_request(message="Xác nhận mật khẩu không được để trống")
    if len(user_data.password) < 8:
        return response.bad_request(message="Mật khẩu phải có ít nhất 8 ký tự")
    if len(user_data.password) > 16:
        return response.bad_request(message="Mật khẩu không được quá 16 ký tự")
    if validate.validate_password(password=user_data.password):
        return response.bad_request(message="Mật khẩu phải có ký tự số , in hoa , thường , ký tự đặc biệt")
    if user_data.password != user_data.confirm_password:
        return response.bad_request(message="Mật khẩu và xác nhận mật khẩu không khớp")
    
    # Validate password strength
    is_invalid, msg = validate.validate_password(user_data.password)
    if is_invalid:
        return response.bad_request(message=msg)

    auth_service = AuthService(db)
    ok, msg, payload = auth_service.register_user(user_data)
    if not ok:
        return response.bad_request(message=msg)
    
    return response.created(message="Đăng ký tài khoản thành công", data={})


@router.post("/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email/password and receive access + refresh tokens.

    - **email**: Địa chỉ email
    - **password**: Mật khẩu (tối thiểu 6 ký tự)

    """
    
    email = credentials.email
    password = credentials.password
    if not email or not password:
        return response.bad_request(message="email và mật khẩu không được để trống")

    if not validate_email(email):
        return response.bad_request(message="email không đúng định dạng")

    # Validate password strength
    is_invalid, msg = validate.validate_password(password)
    if is_invalid:
        return {"code": 400, "message": msg}

    auth_service = AuthService(db)
    auth = auth_service.login(email, password)
    if not auth:
        return response.unauthorized(message="Sai mật khẩu hoặc email")

    return response.success(
        message="Đăng nhập thành công",
        data=auth,
    )


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

    return {"code": 201, "message": msg, "data": {}}


@router.get("/me")
async def get_current_user_info(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Lấy thông tin người dùng hiện tại (từ access token).
    
    Trả về:
    - Thông tin cá nhân (first_name, last_name, email, phone, cccd, ...)
    - Role (role_name)
    - Trạng thái (status)
    - Thời gian tạo/cập nhật
    
    **Yêu cầu**: Bearer token hợp lệ
    """
    try:
        # Convert User ORM sang UserOut schema
        user_out = UserOut.model_validate(current_user)
        return response.success(
            message="Lấy thông tin người dùng thành công",
            data=user_out,
        )
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")
