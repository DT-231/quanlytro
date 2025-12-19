"""Invoice Repository - data access layer cho Invoice entity.

Chỉ xử lý truy vấn database, không chứa business logic.
"""

from __future__ import annotations

from typing import Optional, List
from uuid import UUID
from datetime import date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_

from app.models.invoice import Invoice
from app.models.contract import Contract
from app.models.room import Room
from app.models.building import Building
from app.models.user import User
from app.core.Enum.invoiceEnum import InvoiceStatus


class InvoiceRepository:
    """Repository cho Invoice entity.
    
    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, invoice_id: UUID) -> Optional[Invoice]:
        """Lấy invoice theo ID (không load relationships).
        
        Args:
            invoice_id: UUID của hóa đơn
            
        Returns:
            Invoice ORM instance hoặc None
        """
        return self.db.query(Invoice).filter(Invoice.id == invoice_id).first()
    
    def get_by_id_with_relations(self, invoice_id: UUID) -> Optional[Invoice]:
        """Lấy invoice theo ID kèm relationships (contract, room, tenant).
        
        Args:
            invoice_id: UUID của hóa đơn
            
        Returns:
            Invoice ORM instance với eager-loaded relationships hoặc None
        """
        return (
            self.db.query(Invoice)
            .options(
                joinedload(Invoice.contract)
                .joinedload(Contract.room)
                .joinedload(Room.building),
                joinedload(Invoice.contract)
                .joinedload(Contract.tenant)
            )
            .filter(Invoice.id == invoice_id)
            .first()
        )
    
    def get_by_invoice_number(self, invoice_number: str) -> Optional[Invoice]:
        """Lấy invoice theo mã hóa đơn.
        
        Args:
            invoice_number: Mã hóa đơn
            
        Returns:
            Invoice ORM instance hoặc None
        """
        return self.db.query(Invoice).filter(Invoice.invoice_number == invoice_number).first()
    
    def list_with_details(
        self,
        status_filter: Optional[str] = None,
        building_id: Optional[UUID] = None,
        tenant_id: Optional[UUID] = None,
        offset: int = 0,
        limit: int = 20
    ) -> List[dict]:
        """Lấy danh sách hóa đơn với thông tin chi tiết.
        
        Args:
            status_filter: Lọc theo trạng thái (PENDING, PAID, OVERDUE, CANCELLED)
            building_id: Lọc theo tòa nhà
            tenant_id: Lọc theo người thuê
            offset: Vị trí bắt đầu
            limit: Số lượng tối đa
            
        Returns:
            List[dict] chứa thông tin hóa đơn
        """
        # Ghép tên đầy đủ của tenant
        tenant_full_name = func.concat(User.last_name, ' ', User.first_name)
        
        # Tính tổng tiền
        electricity_cost = (Invoice.electricity_new_index - Invoice.electricity_old_index) * Invoice.electricity_unit_price
        water_cost = Invoice.number_of_people * Invoice.water_unit_price
        total_amount = (
            Invoice.room_price + 
            func.coalesce(electricity_cost, 0) + 
            water_cost +
            Invoice.service_fee +
            Invoice.internet_fee +
            Invoice.parking_fee +
            Invoice.other_fees
        )
        
        query = (
            self.db.query(
                Invoice.id,
                Invoice.invoice_number,
                tenant_full_name.label("tenant_name"),
                Invoice.billing_month,
                total_amount.label("total_amount"),
                Building.building_name,
                Room.room_number,
                Invoice.due_date,
                Invoice.status,
                Invoice.created_at
            )
            .join(Contract, Invoice.contract_id == Contract.id)
            .join(Room, Contract.room_id == Room.id)
            .join(Building, Room.building_id == Building.id)
            .join(User, Contract.tenant_id == User.id)
        )
        
        # Apply filters
        if status_filter:
            query = query.filter(Invoice.status == status_filter)
        
        if building_id:
            query = query.filter(Building.id == building_id)
        
        if tenant_id:
            query = query.filter(Contract.tenant_id == tenant_id)
        
        # Order by created_at desc
        query = query.order_by(Invoice.created_at.desc())
        
        # Pagination
        query = query.offset(offset).limit(limit)
        
        # Convert to dict list
        results = query.all()
        return [
            {
                "id": row.id,
                "invoice_number": row.invoice_number,
                "tenant_name": row.tenant_name,
                "billing_month": row.billing_month,
                "total_amount": row.total_amount,
                "building_name": row.building_name,
                "room_number": row.room_number,
                "due_date": row.due_date,
                "status": row.status,
                "created_at": row.created_at
            }
            for row in results
        ]
    
    def count(
        self,
        status_filter: Optional[str] = None,
        building_id: Optional[UUID] = None,
        tenant_id: Optional[UUID] = None
    ) -> int:
        """Đếm tổng số hóa đơn.
        
        Args:
            status_filter: Lọc theo trạng thái
            building_id: Lọc theo tòa nhà
            tenant_id: Lọc theo người thuê
            
        Returns:
            Số lượng hóa đơn
        """
        query = (
            self.db.query(func.count(Invoice.id))
            .join(Contract, Invoice.contract_id == Contract.id)
            .join(Room, Contract.room_id == Room.id)
            .join(Building, Room.building_id == Building.id)
        )
        
        if status_filter:
            query = query.filter(Invoice.status == status_filter)
        
        if building_id:
            query = query.filter(Building.id == building_id)
        
        if tenant_id:
            query = query.filter(Contract.tenant_id == tenant_id)
        
        return query.scalar()
    
    def create(self, invoice_data: dict) -> Invoice:
        """Tạo hóa đơn mới.
        
        Args:
            invoice_data: Dict chứa thông tin hóa đơn
            
        Returns:
            Invoice ORM instance
        """
        invoice = Invoice(**invoice_data)
        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)
        return invoice
    
    def update(self, invoice: Invoice, update_data: dict) -> Invoice:
        """Cập nhật hóa đơn.
        
        Args:
            invoice: Invoice ORM instance
            update_data: Dict chứa dữ liệu cập nhật
            
        Returns:
            Invoice ORM instance đã cập nhật
        """
        for key, value in update_data.items():
            if hasattr(invoice, key):
                setattr(invoice, key, value)
        
        self.db.commit()
        self.db.refresh(invoice)
        return invoice
    
    def delete(self, invoice: Invoice) -> None:
        """Xóa hóa đơn.
        
        Args:
            invoice: Invoice ORM instance
        """
        self.db.delete(invoice)
        self.db.commit()
    
    def get_invoices_by_contract(self, contract_id: UUID) -> List[Invoice]:
        """Lấy tất cả hóa đơn theo hợp đồng.
        
        Args:
            contract_id: UUID của hợp đồng
            
        Returns:
            List[Invoice]
        """
        return (
            self.db.query(Invoice)
            .filter(Invoice.contract_id == contract_id)
            .order_by(Invoice.billing_month.desc())
            .all()
        )
