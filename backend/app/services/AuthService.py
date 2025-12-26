"""Auth Service - Business logic layer cho Authentication.

Service xử lý các use case liên quan đến xác thực và phân quyền:
- Đăng ký tài khoản
- Đăng nhập
- Làm mới token
- Tạo tài khoản tenant
"""

from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.repositories import role_repository, user_repository
from app.schemas.user_schema import UserCreate, UserRegister


class AuthService:
    """Service xử lý business logic cho Authentication.
    
    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = user_repository.UserRepository(db)
        self.role_repo = role_repository.RoleRepository(db)

    def register_user(self, user_data: UserRegister):
        """
        Đăng ký tài khoản CUSTOMER (public registration).
        Role mặc định: CUSTOMER
        """

        if self.user_repo.get_by_email(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email đã tồn tại",
            )

        # Get CUSTOMER role
        from app.models.role import Role
        from app.core.Enum.userEnum import UserRole

        customer_role = self.role_repo.get_by_code(UserRole.CUSTOMER.value)

        if not customer_role:
            return False, "Role CUSTOMER không tồn tại trong hệ thống", None

        # create user
        from app.core.security import get_password_hash

        hashed = get_password_hash(user_data.password)
        user = {
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "email": user_data.email,
            "role_id": customer_role.id,
            "password": hashed,
        }

        user_obj = self.user_repo.create_user(user_in=user)

        return True, "Created", {}

    def login(self, email: str, password: str):
        """Verify credentials and return user if valid, otherwise None."""
        from app.core.security import (
            verify_password,
            create_access_token,
            create_refresh_token,
        )
        from app.models.user_document import UserDocument

        user = self.user_repo.get_by_email(email)
        if not user:
            return None

        if not verify_password(password, user.password):
            return None

        access = create_access_token(str(user.id))
        refresh = create_refresh_token(str(user.id))
        
        # Lấy avatar của user (nếu có)
        avatar_url = None
        avatar_doc = (
            self.db.query(UserDocument)
            .filter(
                UserDocument.user_id == user.id,
                UserDocument.document_type == "AVATAR"
            )
            .first()
        )
        if avatar_doc:
            avatar_url = avatar_doc.url

        return {
            "user": {
                "id":user.id,
                "email":user.email,
                "role" :user.role.role_code,
                "last_name":user.last_name,
                "first_name":user.first_name,
                "avatar": avatar_url,
            },
            "token": {"access_token": access, "refresh_token": refresh},
        }

    def create_tenant_by_landlord(self, tenant_data: UserCreate, created_by: UUID = None):
        """Chủ nhà tạo tài khoản cho người thuê (ban đầu là CUSTOMER).

        Flow:
        1. Check email đã tồn tại chưa
        2. Nếu tồn tại và role=CUSTOMER → giữ nguyên, trả về success
        3. Nếu chưa tồn tại → tạo mới với role=CUSTOMER
        4. Role sẽ tự động nâng lên TENANT khi ký hợp đồng ACTIVE

        Args:
            tenant_data: Thông tin người thuê
            created_by: UUID của admin/landlord tạo tài khoản (optional)
            
        Returns:
            Tuple (success, message, user_obj)
        """
        from app.core.security import get_password_hash
        from app.models.role import Role
        from app.core.Enum.userEnum import UserRole

        # Check if user exists
        existing_user = self.user_repo.get_by_email(tenant_data.email)

        # Get CUSTOMER role
        customer_role = (
            self.db.query(Role).filter(Role.role_code == UserRole.CUSTOMER.value).first()
        )

        if not customer_role:
            return False, "Role CUSTOMER không tồn tại trong hệ thống", None

        if existing_user:
            # Check if user is CUSTOMER
            if existing_user.role_id == customer_role.id:
                # User đã tồn tại với role CUSTOMER, giữ nguyên
                return (
                    True,
                    "Tài khoản đã tồn tại với role CUSTOMER",
                    existing_user,
                )
            else:
                # Already TENANT or ADMIN
                return (
                    False,
                    f"Email đã tồn tại với role khác ",
                    None,
                )

        # Create new user with CUSTOMER role
        hashed = get_password_hash(tenant_data.password)
        data = tenant_data.model_dump(exclude={'avatar', 'cccd_front', 'cccd_back'})
        data["password"] = hashed
        data["role_id"] = customer_role.id  # Force CUSTOMER role

        try:
            user_obj = self.user_repo.create_user(user_in=data)
            
            # Upload CCCD images if provided
            from app.services.UserService import UserService
            user_service = UserService(self.db)
            
            if tenant_data.avatar or tenant_data.cccd_front or tenant_data.cccd_back:
                try:
                    user_service.upload_user_documents_base64(
                        user_id=user_obj.id,
                        avatar_base64=tenant_data.avatar,
                        cccd_front_base64=tenant_data.cccd_front,
                        cccd_back_base64=tenant_data.cccd_back,
                        uploaded_by=created_by or user_obj.id,
                    )
                except Exception as e:
                    # Log error but don't fail user creation
                    print(f"Warning: Failed to upload documents: {str(e)}")
            
            return True, "Đã tạo tài khoản CUSTOMER mới thành công (sẽ tự động nâng lên TENANT khi có hợp đồng)", user_obj
        except IntegrityError as e:
            self.db.rollback()
            # Xử lý lỗi duplicate key
            error_msg = str(e.orig)
            if "ix_users_cccd" in error_msg or "cccd" in error_msg.lower():
                return False, f"CCCD '{tenant_data.cccd}' đã tồn tại trong hệ thống", None
            elif "ix_users_phone" in error_msg or "phone" in error_msg.lower():
                return False, f"Số điện thoại '{tenant_data.phone}' đã tồn tại trong hệ thống", None
            elif "ix_users_email" in error_msg or "email" in error_msg.lower():
                return False, f"Email '{tenant_data.email}' đã tồn tại trong hệ thống", None
            else:
                return False, f"Lỗi tạo tài khoản: Thông tin đã tồn tại", None

    def upgrade_customer_to_tenant(self, user_id):
        """
        Nâng cấp CUSTOMER thành TENANT khi ký hợp đồng thành công.

        Args:
            user_id: UUID của user cần upgrade

        Returns:
            Tuple (success, message, user_obj)
        """
        from app.models.role import Role
        from app.core.Enum.userEnum import UserRole

        user = self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User không tồn tại", None

        # Get roles
        customer_role = (
            self.db.query(Role)
            .filter(Role.role_code == UserRole.CUSTOMER.value)
            .first()
        )
        tenant_role = (
            self.db.query(Role).filter(Role.role_code == UserRole.TENANT.value).first()
        )

        if not tenant_role:
            return False, "Role TENANT không tồn tại", None

        # Check if user is CUSTOMER
        if user.role_id != customer_role.id:
            return False, f"User không phải CUSTOMER, không thể nâng cấp", None

        # Upgrade to TENANT
        user.role_id = tenant_role.id
        self.db.commit()
        self.db.refresh(user)

        return True, "Đã nâng cấp lên TENANT", user

    def downgrade_tenant_to_customer(self, user_id):
        """
        Hạ cấp TENANT về CUSTOMER khi không còn hợp đồng hoạt động.

        Args:
            user_id: UUID của user cần downgrade

        Returns:
            Tuple (success, message, user_obj)
        """
        from app.models.role import Role
        from app.core.Enum.userEnum import UserRole
        from app.models.contract import Contract
        from app.core.Enum.contractEnum import ContractStatus

        user = self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User không tồn tại", None

        # Get roles
        customer_role = (
            self.db.query(Role)
            .filter(Role.role_code == UserRole.CUSTOMER.value)
            .first()
        )
        tenant_role = (
            self.db.query(Role).filter(Role.role_code == UserRole.TENANT.value).first()
        )

        if not customer_role or not tenant_role:
            return False, "Role không tồn tại trong hệ thống", None

        # Check if user is TENANT
        if user.role_id != tenant_role.id:
            return False, f"User không phải TENANT, không thể hạ cấp", None

        # Check if user has any ACTIVE contracts
        active_contracts = (
            self.db.query(Contract)
            .filter(
                Contract.tenant_id == user_id,
                Contract.status == ContractStatus.ACTIVE.value
            )
            .count()
        )

        if active_contracts > 0:
            return False, f"User còn {active_contracts} hợp đồng đang hoạt động, không thể hạ về CUSTOMER", None

        # Downgrade to CUSTOMER
        user.role_id = customer_role.id
        self.db.commit()
        self.db.refresh(user)

        return True, "Đã hạ cấp về CUSTOMER", user

    def refresh_access_token(self, refresh_token: str):
        """Validate refresh token and issue a new access token."""
        from app.core.security import decode_token, create_access_token

        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        sub = payload.get("sub")
        if not sub:
            raise ValueError("Invalid token payload")

        user = self.user_repo.get_by_id(sub)
        if not user:
            raise ValueError("User not found")

        access = create_access_token(str(user.id))
        return {"access_token": access}
