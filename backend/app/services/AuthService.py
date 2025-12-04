from sqlalchemy.orm import Session

from app.repositories import user_repository
from app.schemas.user_schema import UserCreate, UserRegister



class AuthService:
    def __init__(self, db: Session):
        self.db = db
        # user_repository in this package is a module; instantiate the class
        self.user_repo = user_repository.UserRepository(db)
        # self.permission_repo = permission_repository(db)

    def register_user(self, user_data: UserRegister):
        """
        Đăng ký tài khoản CUSTOMER (public registration).
        Role mặc định: CUSTOMER
        """
        try:
            if self.user_repo.get_by_email(user_data.email):
                return False, "Email đã tồn tại", None
        except Exception as e:
            print(e)
            return False, "Lỗi kiểm tra tồn tại user", None

        # Get CUSTOMER role
        from app.models.role import Role
        from app.core.Enum.userEnum import UserRole
        
        customer_role = self.db.query(Role).filter(
            Role.role_code == UserRole.CUSTOMER.value
        ).first()
        
        if not customer_role:
            return False, "Role CUSTOMER không tồn tại trong hệ thống", None

        # create user
        from app.core.security import get_password_hash, create_access_token, create_refresh_token

        hashed = get_password_hash(user_data.password)
        data = user_data.model_dump()
        data["password"] = hashed
        data.pop("confirm_password", None)
        data["role_id"] = customer_role.id  # Set role_id = CUSTOMER
        
        user_obj = self.user_repo.create_user(user_in=data)

        # create tokens
        access = create_access_token(str(user_obj.id))
        refresh = create_refresh_token(str(user_obj.id))

        return True, "Created", {"user": user_obj, "access_token": access, "refresh_token": refresh}

    def authenticate_user(self, email: str, password: str):
        """Verify credentials and return user if valid, otherwise None."""
        from app.core.security import verify_password, create_access_token, create_refresh_token

        user = self.user_repo.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None

        access = create_access_token(str(user.id))
        refresh = create_refresh_token(str(user.id))
        return {"user": user, "access_token": access, "refresh_token": refresh}
    
    def create_tenant_by_landlord(self, tenant_data: UserCreate, landlord_id):
        """
        Chủ nhà tạo tài khoản cho người thuê.
        
        Flow:
        1. Check email đã tồn tại chưa
        2. Nếu tồn tại và role=CUSTOMER → upgrade thành TENANT
        3. Nếu chưa tồn tại → tạo mới với role=TENANT
        
        Args:
            tenant_data: Thông tin người thuê
            landlord_id: ID của chủ nhà (để check permission)
            
        Returns:
            Tuple (success, message, user_obj)
        """
        from app.core.security import get_password_hash
        from app.models.role import Role
        from app.core.Enum.userEnum import UserRole
        
        # Check if user exists
        existing_user = self.user_repo.get_by_email(tenant_data.email)
        
        # Get TENANT role
        tenant_role = self.db.query(Role).filter(
            Role.role_code == UserRole.TENANT.value
        ).first()
        
        if not tenant_role:
            return False, "Role TENANT không tồn tại trong hệ thống", None
        
        if existing_user:
            # Check if user is CUSTOMER
            customer_role = self.db.query(Role).filter(
                Role.role_code == UserRole.CUSTOMER.value
            ).first()
            
            if existing_user.role_id == customer_role.id:
                # Upgrade CUSTOMER to TENANT
                existing_user.role_id = tenant_role.id
                self.db.commit()
                self.db.refresh(existing_user)
                return True, "Đã nâng cấp tài khoản từ CUSTOMER lên TENANT", existing_user
            else:
                # Already TENANT or ADMIN
                return False, f"Email đã tồn tại với role khác (không phải CUSTOMER)", None
        
        # Create new user with TENANT role
        hashed = get_password_hash(tenant_data.password)
        data = tenant_data.model_dump()
        data["password"] = hashed
        data.pop("confirm_password", None)
        data["role_id"] = tenant_role.id  # Force TENANT role
        
        user_obj = self.user_repo.create_user(user_in=data)
        
        return True, "Đã tạo tài khoản TENANT mới", user_obj
    
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
        customer_role = self.db.query(Role).filter(
            Role.role_code == UserRole.CUSTOMER.value
        ).first()
        tenant_role = self.db.query(Role).filter(
            Role.role_code == UserRole.TENANT.value
        ).first()
        
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
    

