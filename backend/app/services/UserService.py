"""User Service - business logic layer cho User entity.

Service xử lý các use case và business rules liên quan đến User/Tenant management.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import UploadFile
import base64
import os
import re

from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserUpdate, UserOut, UserListItem, UserStats
from app.core.Enum.userEnum import UserStatus
from app.models.user_document import UserDocument


class UserService:
    """Service xử lý business logic cho User/Tenant management.

    - Validate các quy tắc nghiệp vụ.
    - Điều phối CRUD operations qua Repository.

    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def get_user(self, user_id: UUID) -> UserOut:
        """Lấy thông tin chi tiết user bao gồm cả documents (avatar, CCCD).

        Args:
            user_id: UUID của user cần lấy.

        Returns:
            UserOut schema với documents array.

        Raises:
            ValueError: Nếu không tìm thấy user.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"Không tìm thấy người dùng với ID: {user_id}")

        # Lấy documents của user
        documents = (
            self.db.query(UserDocument)
            .filter(UserDocument.user_id == user_id)
            .all()
        )

        # Convert documents sang list of dict
        documents_list = [
            {
                "id": str(doc.id),
                "type": doc.document_type,
                "url": doc.url,
                "created_at": doc.created_at.isoformat() if doc.created_at else None,
            }
            for doc in documents
        ]

        # Convert ORM sang schema
        user_dict = {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "cccd": user.cccd,
            "date_of_birth": user.date_of_birth,
            "gender": user.gender,
            "hometown": user.hometown,
            "status": user.status,
            "is_temporary_residence": user.is_temporary_residence,
            "temporary_residence_date": user.temporary_residence_date,
            "relative_name": user.relative_name,
            "relative_phone": user.relative_phone,
            "role_name": user.role.role_name if user.role else None,
            "documents": documents_list,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }
        
        return UserOut(**user_dict)

    def list_users(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        gender: Optional[str] = None,
        district: Optional[str] = None,
        role_code: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> dict:
        """Lấy danh sách users với filter, search và pagination.

        Args:
            search: Tìm kiếm theo tên, email, phone, CCCD.
            status: Lọc theo trạng thái.
            gender: Lọc theo giới tính.
            district: Lọc theo quận/huyện.
            role_code: Lọc theo mã role (TENANT, CUSTOMER).
            offset: Vị trí bắt đầu.
            limit: Số lượng tối đa (max 100).

        Returns:
            Dict chứa items, total, offset, limit.
        """
        # Validate limit
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 20

        # Validate status nếu có
        if status:
            valid_statuses = [s.value for s in UserStatus]
            if status not in valid_statuses:
                raise ValueError(
                    f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}"
                )
        
        # Convert role_code sang role_id nếu cần
        role_id = None
        if role_code:
            from app.models.role import Role
            role = self.db.query(Role).filter(Role.role_code == role_code.upper()).first()
            if not role:
                raise ValueError(f"Mã role không hợp lệ: {role_code}. Phải là TENANT hoặc CUSTOMER")
            role_id = role.id

        # Lấy danh sách users
        items_data = self.user_repo.list_with_filters(
            search=search,
            status=status,
            gender=gender,
            district=district,
            role_id=role_id,
            offset=offset,
            limit=limit,
        )

        # Lấy tổng số
        total = self.user_repo.count(
            search=search,
            status=status,
            gender=gender,
            district=district,
            role_id=role_id,
        )

        # Convert sang schema
        items_out = [UserListItem(**item) for item in items_data]

        return {
            "items": items_out,
            "total": total,
            "offset": offset,
            "limit": limit,
        }

    def get_stats(self, role_id: Optional[UUID] = None) -> UserStats:
        """Lấy thống kê tổng quan về users/tenants.

        Args:
            role_id: Lọc theo role (ví dụ chỉ TENANT).

        Returns:
            UserStats schema.
        """
        stats_data = self.user_repo.get_stats(role_id=role_id)
        return UserStats(**stats_data)

    def update_user(self, user_id: UUID, user_data: UserUpdate) -> UserOut:
        """Cập nhật thông tin user.

        Business rules:
        - Email phải unique nếu được update.
        - Phone phải unique nếu được update.
        - CCCD phải unique nếu được update.
        - Status phải hợp lệ nếu được update.

        Args:
            user_id: UUID của user cần update.
            user_data: Dữ liệu cập nhật.

        Returns:
            UserOut schema đã được cập nhật.

        Raises:
            ValueError: Nếu không tìm thấy user hoặc vi phạm rules.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"Không tìm thấy người dùng với ID: {user_id}")

        # Tách các trường ảnh base64 ra khỏi dữ liệu update chính
        update_dict = user_data.model_dump(exclude_unset=True)
        avatar_base64 = update_dict.pop("avatar", None)
        cccd_front_base64 = update_dict.pop("cccd_front", None)
        cccd_back_base64 = update_dict.pop("cccd_back", None)

        # Upload ảnh nếu có
        if avatar_base64 or cccd_front_base64 or cccd_back_base64:
            self.upload_user_documents_base64(
                user_id=user_id,
                avatar_base64=avatar_base64,
                cccd_front_base64=cccd_front_base64,
                cccd_back_base64=cccd_back_base64,
                uploaded_by=user_id,  # User tự upload
            )

        # Dữ liệu còn lại để update vào bảng users
        # update_data bây giờ chính là update_dict sau khi đã pop các trường ảnh

        if "email" in update_dict and update_dict["email"]:
            if update_dict["email"] != user.email:
                existing = self.user_repo.get_by_email(update_dict["email"])
                if existing:
                    raise ValueError(f"Email {update_dict['email']} đã tồn tại")

        if "phone" in update_dict and update_dict["phone"]:
            if update_dict["phone"] != user.phone:
                existing = self.user_repo.get_by_phone(update_dict["phone"])
                if existing:
                    raise ValueError(f"Số điện thoại {update_dict['phone']} đã tồn tại")

        if "cccd" in update_dict and update_dict["cccd"]:
            if update_dict["cccd"] != user.cccd:
                existing = self.user_repo.get_by_cccd(update_dict["cccd"])
                if existing:
                    raise ValueError(f"CCCD {update_dict['cccd']} đã tồn tại")

        if "status" in update_dict:
            valid_statuses = [s.value for s in UserStatus]
            if update_dict["status"] not in valid_statuses:
                raise ValueError(
                    f"Trạng thái không hợp lệ. Phải là một trong: {valid_statuses}"
                )

        # Update user nếu có dữ liệu văn bản cần update
        if update_dict:
            self.user_repo.update(user, update_dict)

        # Lấy lại thông tin user đầy đủ sau khi đã update và upload ảnh
        return self.get_user(user_id)

    def delete_user(self, user_id: UUID) -> None:
        """Xóa user.

        Business rules:
        - Không xóa user đang có hợp đồng active.
        - Không xóa admin user.

        Args:
            user_id: UUID của user cần xóa.

        Raises:
            ValueError: Nếu không tìm thấy user hoặc vi phạm rules.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"Không tìm thấy người dùng với ID: {user_id}")

        # Kiểm tra role admin
        if user.role and user.role.role_code == "ADMIN":
            raise ValueError("Không thể xóa tài khoản quản trị viên")

        # TODO: Kiểm tra user có hợp đồng active không
        # if user.tenant_contracts:
        #     active_contracts = [c for c in user.tenant_contracts if c.status == "ACTIVE"]
        #     if active_contracts:
        #         raise ValueError("Không thể xóa user đang có hợp đồng active")

        self.user_repo.delete(user)

    async def upload_user_documents(
        self,
        user_id: UUID,
        avatar: Optional[UploadFile] = None,
        cccd_front: Optional[UploadFile] = None,
        cccd_back: Optional[UploadFile] = None,
        uploaded_by: UUID = None,
    ) -> dict:
        """Upload tài liệu cá nhân cho user (avatar, CCCD).

        Args:
            user_id: UUID của user.
            avatar: File ảnh đại diện.
            cccd_front: File ảnh CCCD mặt trước.
            cccd_back: File ảnh CCCD mặt sau.
            uploaded_by: UUID của user upload.

        Returns:
            Dict chứa URLs của các tài liệu đã upload.

        Raises:
            ValueError: Nếu không tìm thấy user hoặc file không hợp lệ.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"Không tìm thấy người dùng với ID: {user_id}")

        ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
        MAX_SIZE = 5 * 1024 * 1024  # 5MB

        uploaded_docs = {}

        # Upload avatar
        if avatar:
            await self._validate_and_upload_document(
                file=avatar,
                user_id=user_id,
                document_type="AVATAR",
                uploaded_by=uploaded_by,
                allowed_extensions=ALLOWED_EXTENSIONS,
                max_size=MAX_SIZE,
                result_dict=uploaded_docs,
            )

        # Upload CCCD mặt trước
        if cccd_front:
            await self._validate_and_upload_document(
                file=cccd_front,
                user_id=user_id,
                document_type="CCCD_FRONT",
                uploaded_by=uploaded_by,
                allowed_extensions=ALLOWED_EXTENSIONS,
                max_size=MAX_SIZE,
                result_dict=uploaded_docs,
            )

        # Upload CCCD mặt sau
        if cccd_back:
            await self._validate_and_upload_document(
                file=cccd_back,
                user_id=user_id,
                document_type="CCCD_BACK",
                uploaded_by=uploaded_by,
                allowed_extensions=ALLOWED_EXTENSIONS,
                max_size=MAX_SIZE,
                result_dict=uploaded_docs,
            )

        if not uploaded_docs:
            raise ValueError("Không có file nào được upload")

        return uploaded_docs

    async def _validate_and_upload_document(
        self,
        file: UploadFile,
        user_id: UUID,
        document_type: str,
        uploaded_by: UUID,
        allowed_extensions: set,
        max_size: int,
        result_dict: dict,
    ) -> None:
        """Validate và upload một document.

        Args:
            file: File upload.
            user_id: UUID của user.
            document_type: Loại document (AVATAR, CCCD_FRONT, CCCD_BACK).
            uploaded_by: UUID của user upload.
            allowed_extensions: Set các extension được phép.
            max_size: Kích thước file tối đa (bytes).
            result_dict: Dict để lưu kết quả.

        Raises:
            ValueError: Nếu file không hợp lệ.
        """
        # Validate extension
        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in allowed_extensions:
            raise ValueError(
                f"File {file.filename}: Chỉ chấp nhận {', '.join(allowed_extensions).upper()}"
            )

        # Đọc file content
        content = await file.read()

        # Validate size
        if len(content) > max_size:
            raise ValueError(
                f"File {file.filename}: Kích thước vượt quá {max_size // (1024*1024)}MB"
            )

        # Convert to base64
        base64_data = base64.b64encode(content).decode("utf-8")
        data_url = f"data:image/{file_ext};base64,{base64_data}"

        # Xóa document cũ cùng loại (nếu có)
        old_doc = (
            self.db.query(UserDocument)
            .filter(
                UserDocument.user_id == user_id,
                UserDocument.document_type == document_type,
            )
            .first()
        )
        if old_doc:
            self.db.delete(old_doc)

        # Tạo document mới
        new_doc = UserDocument(
            user_id=user_id,
            document_type=document_type,
            url=data_url,
            uploaded_by=uploaded_by or user_id,
        )
        self.db.add(new_doc)
        self.db.commit()
        self.db.refresh(new_doc)

        result_dict[document_type.lower()] = {
            "id": new_doc.id,
            "type": document_type,
            "url": data_url,
            "filename": file.filename,
        }

    def get_user_documents(self, user_id: UUID) -> list[dict]:
        """Lấy danh sách tài liệu của user.

        Args:
            user_id: UUID của user.

        Returns:
            List dict chứa thông tin documents.

        Raises:
            ValueError: Nếu không tìm thấy user.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"Không tìm thấy người dùng với ID: {user_id}")

        documents = (
            self.db.query(UserDocument)
            .filter(UserDocument.user_id == user_id)
            .all()
        )

        return [
            {
                "id": doc.id,
                "type": doc.document_type,
                "url": doc.url,
                "created_at": doc.created_at,
            }
            for doc in documents
        ]

    def upload_user_documents_base64(
        self,
        user_id: UUID,
        avatar_base64: Optional[str] = None,
        cccd_front_base64: Optional[str] = None,
        cccd_back_base64: Optional[str] = None,
        uploaded_by: UUID = None,
    ) -> dict:
        """Upload tài liệu cá nhân qua base64 string.

        Args:
            user_id: UUID của user.
            avatar_base64: Base64 string của ảnh đại diện.
            cccd_front_base64: Base64 string của ảnh CCCD mặt trước.
            cccd_back_base64: Base64 string của ảnh CCCD mặt sau.
            uploaded_by: UUID của user upload.

        Returns:
            Dict chứa thông tin các tài liệu đã upload.

        Raises:
            ValueError: Nếu không tìm thấy user hoặc base64 không hợp lệ.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"Không tìm thấy người dùng với ID: {user_id}")

        uploaded_docs = {}

        # Upload avatar
        if avatar_base64:
            self._save_base64_document(
                base64_data=avatar_base64,
                user_id=user_id,
                document_type="AVATAR",
                uploaded_by=uploaded_by,
                result_dict=uploaded_docs,
            )

        # Upload CCCD mặt trước
        if cccd_front_base64:
            self._save_base64_document(
                base64_data=cccd_front_base64,
                user_id=user_id,
                document_type="CCCD_FRONT",
                uploaded_by=uploaded_by,
                result_dict=uploaded_docs,
            )

        # Upload CCCD mặt sau
        if cccd_back_base64:
            self._save_base64_document(
                base64_data=cccd_back_base64,
                user_id=user_id,
                document_type="CCCD_BACK",
                uploaded_by=uploaded_by,
                result_dict=uploaded_docs,
            )

        if not uploaded_docs:
            raise ValueError("Không có tài liệu nào được upload")

        return uploaded_docs

    def _save_base64_document(
        self,
        base64_data: str,
        user_id: UUID,
        document_type: str,
        uploaded_by: UUID,
        result_dict: dict,
    ) -> None:
        """Lưu document từ base64 string.

        Args:
            base64_data: Base64 string (có thể có data URI prefix).
            user_id: UUID của user.
            document_type: Loại document (AVATAR, CCCD_FRONT, CCCD_BACK).
            uploaded_by: UUID của user upload.
            result_dict: Dict để lưu kết quả.

        Raises:
            ValueError: Nếu base64 không hợp lệ.
        """
        # Validate base64 string
        if not base64_data or not isinstance(base64_data, str):
            raise ValueError(f"{document_type}: Base64 string không hợp lệ")

        # Chuẩn hóa base64: nếu có data URI prefix thì giữ nguyên, không thì thêm vào
        if base64_data.startswith("data:image/"):
            # Đã có data URI prefix
            data_url = base64_data
            
            # Validate format: data:image/{type};base64,{data}
            match = re.match(r'^data:image/(png|jpg|jpeg);base64,(.+)$', data_url)
            if not match:
                raise ValueError(f"{document_type}: Format base64 không hợp lệ. Cần: data:image/(png|jpg|jpeg);base64,...")
            
            image_type = match.group(1)
            base64_content = match.group(2)
        else:
            # Chưa có prefix, thêm vào (mặc định PNG)
            data_url = f"data:image/png;base64,{base64_data}"
            base64_content = base64_data
            image_type = "png"

        # Validate base64 content
        try:
            decoded = base64.b64decode(base64_content)
            
            # Validate size (max 5MB)
            MAX_SIZE = 5 * 1024 * 1024
            if len(decoded) > MAX_SIZE:
                raise ValueError(f"{document_type}: Kích thước ảnh vượt quá 5MB")
                
        except Exception as e:
            raise ValueError(f"{document_type}: Base64 decode lỗi - {str(e)}")

        # Xóa document cũ cùng loại (nếu có)
        old_doc = (
            self.db.query(UserDocument)
            .filter(
                UserDocument.user_id == user_id,
                UserDocument.document_type == document_type,
            )
            .first()
        )
        if old_doc:
            self.db.delete(old_doc)

        # Tạo document mới
        new_doc = UserDocument(
            user_id=user_id,
            document_type=document_type,
            url=data_url,
            uploaded_by=uploaded_by or user_id,
        )
        self.db.add(new_doc)
        self.db.commit()
        self.db.refresh(new_doc)

        result_dict[document_type.lower()] = {
            "id": new_doc.id,
            "type": document_type,
            "url": data_url,
            "size": len(decoded),
        }
