"""Service cho Notification - Quản lý thông báo trong hệ thống."""

from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.notification import Notification
from app.core.Enum.notificationEnum import NotificationType


class NotificationService:
    """Service xử lý logic thông báo."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_notification(
        self,
        user_id: UUID,
        title: str,
        content: str,
        notification_type: str,
        related_id: Optional[UUID] = None,
        related_type: Optional[str] = None
    ) -> Notification:
        """
        Tạo thông báo mới cho người dùng.
        
        Args:
            user_id: ID người dùng nhận thông báo
            title: Tiêu đề thông báo
            content: Nội dung thông báo
            notification_type: Loại thông báo (INVOICE, CONTRACT, APPOINTMENT, etc.)
            related_id: ID của đối tượng liên quan (invoice_id, contract_id, etc.)
            related_type: Loại đối tượng liên quan
            
        Returns:
            Notification đã tạo
        """
        notification = Notification(
            notification_id=uuid4(),
            user_id=user_id,
            title=title,
            content=content,
            type=notification_type,
            related_id=related_id,
            related_type=related_type,
            is_read=False
        )
        
        self.session.add(notification)
        await self.session.commit()
        await self.session.refresh(notification)
        return notification

    async def create_contract_notification(
        self,
        user_id: UUID,
        contract_id: UUID,
        contract_number: str
    ) -> Notification:
        """
        Tạo thông báo khi có hợp đồng mới.
        
        Args:
            user_id: ID người thuê
            contract_id: ID hợp đồng
            contract_number: Số hợp đồng
            
        Returns:
            Notification đã tạo
        """
        return await self.create_notification(
            user_id=user_id,
            title="Hợp đồng thuê phòng mới",
            content=f"Bạn có hợp đồng thuê phòng mới số {contract_number}. Vui lòng xem và ký xác nhận.",
            notification_type=NotificationType.CONTRACT.value,
            related_id=contract_id,
            related_type="CONTRACT"
        )

    async def create_invoice_notification(
        self,
        user_id: UUID,
        invoice_id: UUID,
        invoice_number: str,
        amount: float,
        due_date: str
    ) -> Notification:
        """
        Tạo thông báo khi có hóa đơn mới.
        
        Args:
            user_id: ID người thuê
            invoice_id: ID hóa đơn
            invoice_number: Số hóa đơn
            amount: Số tiền cần thanh toán
            due_date: Hạn thanh toán
            
        Returns:
            Notification đã tạo
        """
        return await self.create_notification(
            user_id=user_id,
            title="Hóa đơn mới cần thanh toán",
            content=f"Bạn có hóa đơn số {invoice_number} với số tiền {amount:,.0f}đ. Hạn thanh toán: {due_date}. Vui lòng thanh toán đúng hạn.",
            notification_type=NotificationType.INVOICE.value,
            related_id=invoice_id,
            related_type="INVOICE"
        )

    async def create_appointment_notification_for_admin(
        self,
        admin_ids: List[UUID],
        appointment_id: UUID,
        customer_name: str,
        room_number: str,
        appointment_time: str
    ) -> List[Notification]:
        """
        Tạo thông báo cho admin khi có lịch hẹn mới.
        
        Args:
            admin_ids: Danh sách ID của admin
            appointment_id: ID lịch hẹn
            customer_name: Tên khách hàng
            room_number: Số phòng
            appointment_time: Thời gian hẹn
            
        Returns:
            Danh sách Notification đã tạo
        """
        notifications = []
        for admin_id in admin_ids:
            notification = await self.create_notification(
                user_id=admin_id,
                title="Lịch hẹn xem phòng mới",
                content=f"Khách hàng {customer_name} đã đặt lịch xem phòng {room_number} vào {appointment_time}. Vui lòng xử lý.",
                notification_type=NotificationType.APPOINTMENT.value,
                related_id=appointment_id,
                related_type="APPOINTMENT"
            )
            notifications.append(notification)
        return notifications

    async def get_user_notifications(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50,
        is_read: Optional[bool] = None
    ) -> List[Notification]:
        """
        Lấy danh sách thông báo của người dùng.
        
        Args:
            user_id: ID người dùng
            skip: Số bản ghi bỏ qua
            limit: Số bản ghi tối đa
            is_read: Lọc theo trạng thái đọc (None = tất cả)
            
        Returns:
            Danh sách notifications
        """
        stmt = select(Notification).where(Notification.user_id == user_id)
        
        if is_read is not None:
            stmt = stmt.where(Notification.is_read == is_read)
        
        stmt = stmt.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_unread_count(self, user_id: UUID) -> int:
        """
        Đếm số lượng thông báo chưa đọc.
        
        Args:
            user_id: ID người dùng
            
        Returns:
            Số lượng thông báo chưa đọc
        """
        stmt = select(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        )
        result = await self.session.execute(stmt)
        return len(list(result.scalars().all()))

    async def mark_as_read(self, notification_id: UUID) -> Optional[Notification]:
        """
        Đánh dấu thông báo đã đọc.
        
        Args:
            notification_id: ID thông báo
            
        Returns:
            Notification đã cập nhật
        """
        stmt = select(Notification).where(Notification.id == notification_id)
        result = await self.session.execute(stmt)
        notification = result.scalar_one_or_none()
        
        if notification:
            notification.is_read = True
            notification.read_at = datetime.now()
            await self.session.commit()
            await self.session.refresh(notification)
        
        return notification

    async def mark_all_as_read(self, user_id: UUID) -> int:
        """
        Đánh dấu tất cả thông báo của user là đã đọc.
        
        Args:
            user_id: ID người dùng
            
        Returns:
            Số lượng thông báo đã đánh dấu
        """
        stmt = select(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        )
        result = await self.session.execute(stmt)
        notifications = list(result.scalars().all())
        
        count = 0
        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.now()
            count += 1
        
        if count > 0:
            await self.session.commit()
        
        return count

    async def delete_notification(self, notification_id: UUID) -> bool:
        """
        Xóa thông báo.
        
        Args:
            notification_id: ID thông báo
            
        Returns:
            True nếu xóa thành công, False nếu không tìm thấy
        """
        stmt = select(Notification).where(Notification.id == notification_id)
        result = await self.session.execute(stmt)
        notification = result.scalar_one_or_none()
        
        if notification:
            await self.session.delete(notification)
            await self.session.commit()
            return True
        
        return False

    async def create_termination_request_notification(self, contract, requester_role: str):
        """
        Tạo thông báo khi có yêu cầu chấm dứt hợp đồng.
        """
        if requester_role == "TENANT":
            # Gửi thông báo cho admin/landlord
            # (Giả định: Lấy tất cả user có role ADMIN/LANDLORD)
            from app.models.user import User
            from app.models.role import Role
            stmt = select(User.id).join(Role).where(Role.role_code.in_(["ADMIN", "LANDLORD"]))
            result = await self.session.execute(stmt)
            admin_ids = result.scalars().all()
            
            for admin_id in admin_ids:
                await self.create_notification(
                    user_id=admin_id,
                    title="Yêu cầu chấm dứt hợp đồng",
                    content=f"Người thuê phòng {contract.tenant.last_name} đã yêu cầu chấm dứt hợp đồng {contract.contract_number}.",
                    notification_type=NotificationType.CONTRACT.value,
                    related_id=contract.id,
                    related_type="CONTRACT"
                )
        else: # requester_role == "LANDLORD"
            # Gửi thông báo cho người thuê
            await self.create_notification(
                user_id=contract.tenant_id,
                title="Yêu cầu chấm dứt hợp đồng",
                content=f"Chủ nhà đã yêu cầu chấm dứt hợp đồng {contract.contract_number} của bạn.",
                notification_type=NotificationType.CONTRACT.value,
                related_id=contract.id,
                related_type="CONTRACT"
            )

    async def create_termination_approval_notification(self, contract):
        """
        Tạo thông báo khi yêu cầu chấm dứt hợp đồng được phê duyệt.
        """
        # Gửi cho người thuê
        await self.create_notification(
            user_id=contract.tenant_id,
            title="Hợp đồng đã được chấm dứt",
            content=f"Yêu cầu chấm dứt hợp đồng {contract.contract_number} của bạn đã được phê duyệt. Hợp đồng đã chính thức kết thúc.",
            notification_type=NotificationType.CONTRACT.value,
            related_id=contract.id,
            related_type="CONTRACT"
        )
        
        # Gửi cho admin/landlord
        from app.models.user import User
        from app.models.role import Role
        stmt = select(User.id).join(Role).where(Role.role_code.in_(["ADMIN", "LANDLORD"]))
        result = await self.session.execute(stmt)
        admin_ids = result.scalars().all()

        for admin_id in admin_ids:
            await self.create_notification(
                user_id=admin_id,
                title="Hợp đồng đã được chấm dứt",
                content=f"Hợp đồng {contract.contract_number} đã được chấm dứt thành công.",
                notification_type=NotificationType.CONTRACT.value,
                related_id=contract.id,
                related_type="CONTRACT"
            )
