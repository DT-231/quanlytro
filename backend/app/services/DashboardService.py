"""Dashboard Service - Business logic layer cho Dashboard Admin.

Service tổng hợp dữ liệu từ nhiều nguồn để hiển thị dashboard:
- Room stats (tổng phòng, phòng trống, doanh thu)
- Maintenance stats (sự cố)
- Contract stats (hợp đồng)
- Recent activities (hoạt động gần đây)
- Pending appointments (lịch hẹn chờ xác nhận)
"""

from __future__ import annotations

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc

from app.models import Room, Contract, Invoice, MaintenanceRequest, Appointment
from app.models.user import User
from app.services.MaintenanceService import MaintenanceService
from app.services.ContractService import ContractService


class DashboardService:
    """Service xử lý business logic cho Dashboard Admin.

    Tổng hợp dữ liệu từ nhiều nguồn:
    - Rooms
    - Contracts  
    - Invoices
    - Maintenance Requests
    - Appointments

    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """

    def __init__(self, db: Session):
        self.db = db
        self.maintenance_service = MaintenanceService(db)
        self.contract_service = ContractService(db)

    def _get_user_full_name(self, user: User) -> str:
        """Helper để lấy tên đầy đủ của user.
        
        User model có first_name và last_name, không có full_name.
        """
        if not user:
            return "N/A"
        first_name = user.first_name or ""
        last_name = user.last_name or ""
        return f"{first_name} {last_name}".strip() or "N/A"

    def get_room_stats(self, building_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Lấy thống kê phòng.
        
        Args:
            building_id: Filter theo tòa nhà (optional)
            
        Returns:
            Dict chứa:
            - total_rooms: Tổng số phòng
            - empty_rooms: Phòng trống (AVAILABLE)
            - occupied_rooms: Phòng đang thuê (OCCUPIED)
            - revenue: Tổng doanh thu từ phòng đang thuê
        """
        room_query = self.db.query(Room)
        if building_id:
            room_query = room_query.filter(Room.building_id == building_id)
        
        rooms = room_query.all()
        total_rooms = len(rooms)
        
        # Đếm phòng trống
        empty_rooms = sum(1 for r in rooms if r.status == "AVAILABLE")
        
        # Tính doanh thu từ phòng đang thuê
        occupied_rooms = [r for r in rooms if r.status == "OCCUPIED"]
        revenue = sum(float(r.base_price or 0) for r in occupied_rooms)
        
        return {
            "total_rooms": total_rooms,
            "empty_rooms": empty_rooms,
            "occupied_rooms": len(occupied_rooms),
            "revenue": revenue
        }

    def get_maintenance_stats(
        self, 
        user_id: UUID, 
        building_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Lấy thống kê sự cố/bảo trì.
        
        Args:
            user_id: ID của admin
            building_id: Filter theo tòa nhà (optional)
            
        Returns:
            Dict chứa total, pending, in_progress, completed
        """
        return self.maintenance_service.get_stats(
            user_id=user_id,
            is_admin=True,
            building_id=building_id
        )

    def get_contract_stats(self) -> Dict[str, Any]:
        """Lấy thống kê hợp đồng.
        
        Returns:
            Dict chứa:
            - total_contracts: Tổng hợp đồng
            - active_contracts: Đang hoạt động
            - expiring_soon: Sắp hết hạn
            - expired_contracts: Đã hết hạn
        """
        return self.contract_service.get_contract_stats()

    def get_recent_activities(
        self, 
        building_id: Optional[UUID] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Lấy danh sách hoạt động gần đây.
        
        Bao gồm:
        1. Thanh toán hóa đơn (payments) - Invoice PAID
        2. Yêu cầu hủy hợp đồng (termination requests)
        3. Sự cố mới (maintenance issues)
        4. Hợp đồng mới (new contracts)
        
        Args:
            building_id: Filter theo tòa nhà (optional)
            limit: Số lượng hoạt động tối đa (default: 10)
            
        Returns:
            List các hoạt động, sắp xếp theo thời gian mới nhất
        """
        activities = []
        
        # 1. Thanh toán gần đây (Invoices đã thanh toán)
        payment_query = self.db.query(Invoice).options(
            joinedload(Invoice.contract).joinedload(Contract.tenant),
            joinedload(Invoice.contract).joinedload(Contract.room)
        ).filter(Invoice.status == "PAID")
        
        if building_id:
            # Filter theo building thông qua contract -> room
            payment_query = payment_query.join(Invoice.contract).join(Contract.room).filter(
                Room.building_id == building_id
            )
        
        recent_payments = payment_query.order_by(
            Invoice.updated_at.desc()
        ).limit(5).all()
        
        for inv in recent_payments:
            # Lấy thông tin từ contract relationship
            tenant_name = "Người thuê"
            room_number = "N/A"
            if inv.contract:
                if inv.contract.tenant:
                    tenant_name = self._get_user_full_name(inv.contract.tenant)
                if inv.contract.room:
                    room_number = inv.contract.room.room_number
            
            # Tính total_amount
            total_amount = float(inv.room_price or 0) + float(inv.service_fee or 0) + float(inv.internet_fee or 0) + float(inv.parking_fee or 0) + float(inv.other_fees or 0)
            # Tính tiền điện
            if inv.electricity_new_index and inv.electricity_old_index:
                electricity_usage = inv.electricity_new_index - inv.electricity_old_index
                total_amount += electricity_usage * float(inv.electricity_unit_price or 0)
            # Tính tiền nước
            total_amount += float(inv.number_of_people or 1) * float(inv.water_unit_price or 0)
            
            activities.append({
                "id": f"payment-{inv.id}",
                "type": "payment",
                "title": "Thanh toán hóa đơn",
                "description": f"{tenant_name} - Phòng {room_number}",
                "amount": total_amount,
                "created_at": (inv.updated_at or inv.created_at).isoformat() if (inv.updated_at or inv.created_at) else None,
                "status": inv.status
            })
        
        # 2. Yêu cầu hủy hợp đồng (Contracts có status TERMINATION_REQUESTED_BY_TENANT hoặc TERMINATION_REQUESTED_BY_LANDLORD)
        termination_query = self.db.query(Contract).options(
            joinedload(Contract.tenant),
            joinedload(Contract.room)
        ).filter(
            Contract.status.in_([
                "TERMINATION_REQUESTED_BY_TENANT",
                "TERMINATION_REQUESTED_BY_LANDLORD"
            ])
        )
        
        if building_id:
            termination_query = termination_query.filter(
                Contract.room_id.in_(
                    self.db.query(Room.id).filter(Room.building_id == building_id)
                )
            )
        
        termination_requests = termination_query.order_by(
            Contract.updated_at.desc()
        ).limit(5).all()
        
        for contract in termination_requests:
            tenant_name = self._get_user_full_name(contract.tenant)
            room_number = contract.room.room_number if contract.room else "N/A"
            
            activities.append({
                "id": f"termination-{contract.id}",
                "type": "termination",
                "title": "Yêu cầu hủy hợp đồng",
                "description": f"{tenant_name} - Phòng {room_number}",
                "amount": None,
                "created_at": (contract.updated_at or contract.created_at).isoformat() if (contract.updated_at or contract.created_at) else None,
                "status": contract.status
            })
        
        # 3. Sự cố mới (Maintenances pending/in_progress)
        issue_query = self.db.query(MaintenanceRequest).options(
            joinedload(MaintenanceRequest.room),
            joinedload(MaintenanceRequest.tenant)
        ).filter(
            MaintenanceRequest.status.in_(["PENDING", "IN_PROGRESS"])
        )
        
        if building_id:
            issue_query = issue_query.filter(
                MaintenanceRequest.room_id.in_(
                    self.db.query(Room.id).filter(Room.building_id == building_id)
                )
            )
        
        recent_issues = issue_query.order_by(
            MaintenanceRequest.created_at.desc()
        ).limit(5).all()
        
        for issue in recent_issues:
            room_number = issue.room.room_number if issue.room else "N/A"
            tenant_name = self._get_user_full_name(issue.tenant)
            
            activities.append({
                "id": f"issue-{issue.id}",
                "type": "issue",
                "title": f"Sự cố: {issue.title or issue.request_type}",
                "description": f"{tenant_name} - Phòng {room_number}",
                "amount": None,
                "created_at": issue.created_at.isoformat() if issue.created_at else None,
                "status": issue.status
            })
        
        # 4. Hợp đồng mới được tạo (trong 7 ngày gần đây)
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        new_contract_query = self.db.query(Contract).options(
            joinedload(Contract.tenant),
            joinedload(Contract.room)
        ).filter(
            Contract.created_at >= seven_days_ago,
            Contract.status.in_(["ACTIVE", "PENDING"])
        )
        
        if building_id:
            new_contract_query = new_contract_query.filter(
                Contract.room_id.in_(
                    self.db.query(Room.id).filter(Room.building_id == building_id)
                )
            )
        
        new_contracts = new_contract_query.order_by(
            Contract.created_at.desc()
        ).limit(3).all()
        
        for contract in new_contracts:
            tenant_name = self._get_user_full_name(contract.tenant)
            room_number = contract.room.room_number if contract.room else "N/A"
            
            activities.append({
                "id": f"new-contract-{contract.id}",
                "type": "contract",
                "title": "Hợp đồng mới",
                "description": f"{tenant_name} - Phòng {room_number}",
                "amount": float(contract.rental_price or 0),
                "created_at": contract.created_at.isoformat() if contract.created_at else None,
                "status": contract.status
            })
        
        # Sắp xếp activities theo thời gian mới nhất
        activities.sort(key=lambda x: x["created_at"] or "", reverse=True)
        return activities[:limit]

    def get_pending_appointments(
        self, 
        building_id: Optional[UUID] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Lấy danh sách lịch hẹn xem phòng đang chờ xác nhận.
        
        Args:
            building_id: Filter theo tòa nhà (optional)
            limit: Số lượng tối đa (default: 5)
            
        Returns:
            List các lịch hẹn pending
        """
        appointment_query = self.db.query(Appointment).options(
            joinedload(Appointment.room)
        ).filter(Appointment.status == "PENDING")
        
        if building_id:
            appointment_query = appointment_query.filter(
                Appointment.room_id.in_(
                    self.db.query(Room.id).filter(Room.building_id == building_id)
                )
            )
        
        recent_appointments = appointment_query.order_by(
            Appointment.appointment_datetime.asc()
        ).limit(limit).all()
        
        appointments = []
        for apt in recent_appointments:
            room_number = apt.room.room_number if apt.room else "N/A"
            
            appointments.append({
                "id": str(apt.id),
                "full_name": apt.full_name,
                "phone": apt.phone,
                "email": apt.email,
                "appointment_datetime": apt.appointment_datetime.isoformat() if apt.appointment_datetime else None,
                "room_number": room_number,
                "status": apt.status,
                "notes": apt.notes
            })
        
        return appointments

    def get_dashboard_stats(
        self, 
        user_id: UUID,
        building_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Lấy toàn bộ thống kê cho Dashboard Admin trong 1 request.
        
        Tổng hợp tất cả dữ liệu cần thiết:
        - room_stats: Thống kê phòng
        - maintenance_stats: Thống kê sự cố
        - contract_stats: Thống kê hợp đồng
        - recent_activities: Hoạt động gần đây
        - pending_appointments: Lịch hẹn chờ xác nhận
        
        Args:
            user_id: ID của admin
            building_id: Filter theo tòa nhà (optional)
            
        Returns:
            Dict chứa tất cả dữ liệu dashboard
        """
        return {
            "room_stats": self.get_room_stats(building_id),
            "maintenance_stats": self.get_maintenance_stats(user_id, building_id),
            "contract_stats": self.get_contract_stats(),
            "recent_activities": self.get_recent_activities(building_id),
            "pending_appointments": self.get_pending_appointments(building_id),
            "building_filter": str(building_id) if building_id else None
        }
