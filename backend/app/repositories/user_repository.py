from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, case, or_

from app.models.user import User
from app.models.contract import Contract
from app.core.Enum.userEnum import UserStatus

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Lấy user theo ID với eager loading role.
        
        Args:
            user_id: UUID của user
            
        Returns:
            User object nếu tìm thấy, None nếu không tìm thấy
        """
        return (
            self.db.query(User)
            .options(joinedload(User.role))
            .filter(User.id == user_id)
            .first()
        )

    def get_by_email(self, email: str) -> Optional[User]:
        """Lấy user theo email với eager loading role relationship.
        
        Args:
            email: Địa chỉ email
            
        Returns:
            User object nếu tìm thấy, None nếu không tìm thấy
        """
        return (
            self.db.query(User)
            .options(joinedload(User.role))
            .filter(User.email == email)
            .one_or_none()
        ) 

    def get_by_phone(self, phone: str) -> Optional[User]:
        """Lấy user theo số điện thoại.
        
        Args:
            phone: Số điện thoại
            
        Returns:
            User object nếu tìm thấy, None nếu không tìm thấy
        """
        return self.db.query(User).filter(User.phone == phone).first()

    def get_by_cccd(self, cccd: str) -> Optional[User]:
        """Lấy user theo CCCD.
        
        Args:
            cccd: Số CCCD
            
        Returns:
            User object nếu tìm thấy, None nếu không tìm thấy
        """
        return self.db.query(User).filter(User.cccd == cccd).first()

    def create_user(self, *, user_in: dict) -> User:
        """Tạo một user mới và commit vào database.

        Args:
            user_in: dict chứa các trường mô tả user (đã hash password)

        Returns:
            User: ORM instance mới được persist
        """
        obj = User(**user_in)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, user: User, update_data: dict) -> User:
        """Cập nhật thông tin user.
        
        Args:
            user: User instance cần update
            update_data: Dict chứa dữ liệu cần update
            
        Returns:
            User instance đã được cập nhật
        """
        for key, value in update_data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        """Xóa user khỏi database.
        
        Args:
            user: User instance cần xóa
        """
        self.db.delete(user)
        self.db.commit()

    def list_with_filters(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        gender: Optional[str] = None,
        district: Optional[str] = None,
        role_id: Optional[UUID] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[dict]:
        """Lấy danh sách users với filters và pagination, trả về dict để dễ serialize.
        
        Args:
            search: Tìm kiếm theo tên, email, phone, CCCD
            status: Lọc theo trạng thái
            gender: Lọc theo giới tính
            district: Lọc theo quận/huyện
            role_id: Lọc theo role
            offset: Vị trí bắt đầu
            limit: Số lượng tối đa
            
        Returns:
            List dict chứa thông tin user cơ bản
        """
        query = self.db.query(User).options(joinedload(User.role))
        
        # Apply filters
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.phone.ilike(search_pattern),
                    User.cccd.ilike(search_pattern),
                )
            )
        
        if status:
            query = query.filter(User.status == status)
        
        if role_id:
            query = query.filter(User.role_id == role_id)
        
        # Execute query với pagination
        users = query.offset(offset).limit(limit).all()
        
        # Convert sang dict để dễ thêm thông tin
        result = []
        for idx, user in enumerate(users, start=offset + 1):
            result.append({
                "id": user.id,
                "code": str(100 + idx),  # Mã tạm thời, có thể customize
                "full_name": f"{user.first_name} {user.last_name}",
                "phone": user.phone,
                "email": user.email,
                "gender": gender if gender else None,  # Cần thêm vào model nếu cần
                "district": district if district else None,  # Cần join với address
                "status": user.status,
            })
        
        return result

    def count(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        role_id: Optional[UUID] = None,
    ) -> int:
        """Đếm tổng số users theo filters.
        
        Args:
            search: Tìm kiếm theo tên, email, phone, CCCD
            status: Lọc theo trạng thái
            role_id: Lọc theo role
            
        Returns:
            Tổng số users
        """
        query = self.db.query(func.count(User.id))
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.phone.ilike(search_pattern),
                    User.cccd.ilike(search_pattern),
                )
            )
        
        if status:
            query = query.filter(User.status == status)
        
        if role_id:
            query = query.filter(User.role_id == role_id)
        
        return query.scalar() or 0

    def get_stats(self, role_id: Optional[UUID] = None) -> dict:
        """Lấy thống kê tổng quan về users.
        
        Args:
            role_id: Lọc theo role (ví dụ chỉ TENANT)
            
        Returns:
            Dict chứa thống kê
        """
        query = self.db.query(User)
        
        if role_id:
            query = query.filter(User.role_id == role_id)
        
        total = query.count()
        active = query.filter(User.status == UserStatus.ACTIVE.value).count()
        inactive = query.filter(User.status == UserStatus.INACTIVE.value).count()
        
        return {
            "total_tenants": total,
            "active_tenants": active,
            "returned_rooms": inactive,
            "not_rented": 0,  # Cần logic phức tạp hơn với Contract
        }
    

