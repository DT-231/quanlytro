"""Invoice Service - business logic layer cho Invoice entity.

Service xử lý các use case và business rules liên quan đến Invoice.
"""

from __future__ import annotations

from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session

from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.contract_repository import ContractRepository
from app.repositories.building_repository import BuildingRepository
from app.repositories.room_repository import RoomRepository
from app.schemas.invoice_schema import (
    InvoiceCreate, InvoiceUpdate, InvoiceOut, InvoiceListItem,
    BuildingOption, RoomOption, ServiceFeeItem
)
from app.models.invoice import Invoice
from app.core.Enum.invoiceEnum import InvoiceStatus
from app.core.Enum.contractEnum import ContractStatus
from app.core.utils.uuid import generate_uuid7


class InvoiceService:
    """Service xử lý business logic cho Invoice.
    
    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.invoice_repo = InvoiceRepository(db)
        self.contract_repo = ContractRepository(db)
        self.building_repo = BuildingRepository(db)
        self.room_repo = RoomRepository(db)
    
    def get_buildings_for_dropdown(self) -> List[BuildingOption]:
        """Lấy danh sách tòa nhà cho dropdown."""
        from app.models.building import Building
        
        buildings = self.db.query(Building).filter(Building.status == "ACTIVE").all()
        return [BuildingOption(id=b.id, building_name=b.building_name) for b in buildings]
    
    def get_rooms_by_building(self, building_id: UUID) -> List[RoomOption]:
        """Lấy danh sách phòng theo tòa nhà (chỉ phòng có hợp đồng active).
        
        Args:
            building_id: UUID của tòa nhà
            
        Returns:
            List[RoomOption] với thông tin phòng + tenant + contract
        """
        from app.models.room import Room
        from app.models.contract import Contract
        from app.models.user import User
        from sqlalchemy.orm import joinedload
        from sqlalchemy import and_
        
        # Query phòng có hợp đồng ACTIVE
        rooms = (
            self.db.query(Room)
            .outerjoin(Contract, and_(
                Contract.room_id == Room.id,
                Contract.status == ContractStatus.ACTIVE.value
            ))
            .options(
                joinedload(Room.contracts).joinedload(Contract.tenant)
            )
            .filter(Room.building_id == building_id)
            .all()
        )
        
        result = []
        for room in rooms:
            # Tìm contract active
            active_contract = next(
                (c for c in room.contracts if c.status == ContractStatus.ACTIVE.value),
                None
            )
            
            if active_contract:
                tenant = active_contract.tenant
                tenant_name = f"{tenant.last_name} {tenant.first_name}" if tenant else None
                
                result.append(RoomOption(
                    id=room.id,
                    room_number=room.room_number,
                    tenant_name=tenant_name,
                    tenant_id=tenant.id if tenant else None,
                    contract_id=active_contract.id
                ))
        
        return result
    
    def create_invoice(self, invoice_data: InvoiceCreate, created_by: UUID) -> InvoiceOut:
        """Tạo hóa đơn mới.
        
        Business rules:
        - Hợp đồng phải tồn tại và đang ACTIVE
        - Không tạo trùng hóa đơn cho cùng tháng của 1 hợp đồng
        - Tính toán tự động: tiền điện, nước, tổng tiền
        
        Args:
            invoice_data: Thông tin hóa đơn
            created_by: UUID của user tạo hóa đơn
            
        Returns:
            InvoiceOut
            
        Raises:
            ValueError: Nếu vi phạm business rules
        """
        # Validate contract
        contract = self.contract_repo.get_by_id_with_relations(invoice_data.contract_id)
        if not contract:
            raise ValueError("Không tìm thấy hợp đồng")
        
        if contract.status != ContractStatus.ACTIVE.value:
            raise ValueError("Hợp đồng không còn hoạt động")
        
        # Kiểm tra trùng hóa đơn trong tháng
        existing_invoices = self.invoice_repo.get_invoices_by_contract(contract.id)
        for inv in existing_invoices:
            if inv.billing_month.year == invoice_data.billing_month.year and \
               inv.billing_month.month == invoice_data.billing_month.month:
                raise ValueError(f"Đã tồn tại hóa đơn cho tháng {invoice_data.billing_month.month}/{invoice_data.billing_month.year}")
        
        # Lấy thông tin giá từ hợp đồng/phòng
        room = contract.room
        room_price = contract.rental_price  # Giá thuê từ hợp đồng
        electricity_unit_price = room.electricity_price if room.electricity_price else Decimal("3500")
        water_unit_price = room.water_price_per_person if room.water_price_per_person else Decimal("80000")
        
        # Tính tiền điện
        electricity_usage = 0
        if invoice_data.electricity_new_index and invoice_data.electricity_old_index:
            electricity_usage = invoice_data.electricity_new_index - invoice_data.electricity_old_index
        
        # Parse service fees
        service_fee = Decimal(0)
        internet_fee = Decimal(0)
        parking_fee = Decimal(0)
        other_fees = Decimal(0)
        other_fees_description = ""
        
        if invoice_data.service_fees:
            for fee in invoice_data.service_fees:
                fee_name = fee.name.lower()
                if "dịch vụ" in fee_name or "service" in fee_name:
                    service_fee += fee.amount
                elif "internet" in fee_name or "mạng" in fee_name:
                    internet_fee += fee.amount
                elif "xe" in fee_name or "parking" in fee_name:
                    parking_fee += fee.amount
                else:
                    other_fees += fee.amount
                    if other_fees_description:
                        other_fees_description += ", "
                    desc = f"{fee.name}: {fee.amount:,.0f}đ"
                    if fee.description:
                        desc += f" ({fee.description})"
                    other_fees_description += desc
        
        # Generate invoice_number (format: INV-YYYYMM-XXX)
        billing_year_month = invoice_data.billing_month.strftime("%Y%m")
        invoice_count = len(existing_invoices) + 1
        invoice_number = f"INV-{billing_year_month}-{invoice_count:03d}"
        
        # Tạo invoice dict
        invoice_dict = {
            "invoice_id": generate_uuid7(),
            "invoice_number": invoice_number,
            "contract_id": contract.id,
            "billing_month": invoice_data.billing_month,
            "due_date": invoice_data.due_date,
            "room_price": room_price,
            "electricity_old_index": invoice_data.electricity_old_index,
            "electricity_new_index": invoice_data.electricity_new_index,
            "electricity_unit_price": electricity_unit_price,
            "number_of_people": invoice_data.number_of_people,
            "water_unit_price": water_unit_price,
            "service_fee": service_fee,
            "internet_fee": internet_fee,
            "parking_fee": parking_fee,
            "other_fees": other_fees,
            "other_fees_description": other_fees_description,
            "status": InvoiceStatus.PENDING.value,
            "notes": invoice_data.notes
        }
        
        invoice = self.invoice_repo.create(invoice_dict)
        
        # Convert to InvoiceOut
        return self._invoice_to_out(invoice)
    
    def get_invoice(self, invoice_id: UUID, user_id: UUID, user_role: str) -> InvoiceOut:
        """Lấy chi tiết hóa đơn.
        
        - Admin: Xem được tất cả
        - Tenant: Chỉ xem được hóa đơn của phòng mình
        
        Args:
            invoice_id: UUID của hóa đơn
            user_id: UUID của user đang xem
            user_role: Role code (ADMIN, TENANT, CUSTOMER)
            
        Returns:
            InvoiceOut
            
        Raises:
            ValueError: Nếu không tìm thấy hoặc không có quyền
        """
        invoice = self.invoice_repo.get_by_id_with_relations(invoice_id)
        if not invoice:
            raise ValueError("Không tìm thấy hóa đơn")
        
        # Check permission
        if user_role != "ADMIN":
            # Tenant chỉ xem được hóa đơn của mình
            if invoice.contract.tenant_id != user_id:
                raise ValueError("Bạn không có quyền xem hóa đơn này")
        
        return self._invoice_to_out(invoice)
    
    def list_invoices(
        self,
        user_id: UUID,
        user_role: str,
        status: Optional[str] = None,
        building_id: Optional[UUID] = None,
        offset: int = 0,
        limit: int = 20
    ) -> dict:
        """Lấy danh sách hóa đơn.
        
        - Admin: Xem tất cả hóa đơn
        - Tenant: Chỉ xem hóa đơn của phòng mình
        
        Args:
            user_id: UUID của user
            user_role: Role code
            status: Lọc theo trạng thái
            building_id: Lọc theo tòa nhà (chỉ admin)
            offset: Vị trí bắt đầu
            limit: Số lượng tối đa
            
        Returns:
            Dict chứa items, total, offset, limit
        """
        # Nếu là tenant, chỉ lấy hóa đơn của mình
        tenant_id = None if user_role == "ADMIN" else user_id
        
        # Nếu không phải admin, không cho filter theo building
        if user_role != "ADMIN":
            building_id = None
        
        items_data = self.invoice_repo.list_with_details(
            status_filter=status,
            building_id=building_id,
            tenant_id=tenant_id,
            offset=offset,
            limit=limit
        )
        
        total = self.invoice_repo.count(
            status_filter=status,
            building_id=building_id,
            tenant_id=tenant_id
        )
        
        items_out = [InvoiceListItem(**item) for item in items_data]
        
        return {
            "items": items_out,
            "total": total,
            "offset": offset,
            "limit": limit
        }
    
    def update_invoice(
        self,
        invoice_id: UUID,
        invoice_data: InvoiceUpdate,
        user_id: UUID,
        user_role: str
    ) -> InvoiceOut:
        """Cập nhật hóa đơn.
        
        Business rules:
        - Chỉ admin mới được sửa
        - Chỉ sửa được nếu chưa thanh toán (status = PENDING)
        
        Args:
            invoice_id: UUID của hóa đơn
            invoice_data: Dữ liệu cập nhật
            user_id: UUID của user
            user_role: Role code
            
        Returns:
            InvoiceOut
            
        Raises:
            ValueError: Nếu vi phạm rules
        """
        # Chỉ admin mới được sửa
        if user_role != "ADMIN":
            raise ValueError("Chỉ chủ nhà mới có quyền sửa hóa đơn")
        
        invoice = self.invoice_repo.get_by_id_with_relations(invoice_id)
        if not invoice:
            raise ValueError("Không tìm thấy hóa đơn")
        
        # Chỉ sửa được nếu chưa thanh toán
        if invoice.status != InvoiceStatus.PENDING.value:
            raise ValueError("Không thể sửa hóa đơn đã thanh toán hoặc đã hủy")
        
        # Parse service fees nếu có
        update_dict = invoice_data.model_dump(exclude_unset=True, exclude={'service_fees'})
        
        if invoice_data.service_fees is not None:
            service_fee = Decimal(0)
            internet_fee = Decimal(0)
            parking_fee = Decimal(0)
            other_fees = Decimal(0)
            other_fees_description = ""
            
            for fee in invoice_data.service_fees:
                fee_name = fee.name.lower()
                if "dịch vụ" in fee_name or "service" in fee_name:
                    service_fee += fee.amount
                elif "internet" in fee_name or "mạng" in fee_name:
                    internet_fee += fee.amount
                elif "xe" in fee_name or "parking" in fee_name:
                    parking_fee += fee.amount
                else:
                    other_fees += fee.amount
                    if other_fees_description:
                        other_fees_description += ", "
                    desc = f"{fee.name}: {fee.amount:,.0f}đ"
                    if fee.description:
                        desc += f" ({fee.description})"
                    other_fees_description += desc
            
            update_dict["service_fee"] = service_fee
            update_dict["internet_fee"] = internet_fee
            update_dict["parking_fee"] = parking_fee
            update_dict["other_fees"] = other_fees
            update_dict["other_fees_description"] = other_fees_description
        
        updated_invoice = self.invoice_repo.update(invoice, update_dict)
        return self._invoice_to_out(updated_invoice)
    
    def _invoice_to_out(self, invoice: Invoice) -> InvoiceOut:
        """Convert Invoice ORM to InvoiceOut schema.
        
        Args:
            invoice: Invoice ORM instance (with relations loaded)
            
        Returns:
            InvoiceOut
        """
        contract = invoice.contract
        room = contract.room
        building = room.building
        tenant = contract.tenant
        
        # Tính toán
        electricity_usage = None
        electricity_cost = Decimal(0)
        if invoice.electricity_new_index and invoice.electricity_old_index:
            electricity_usage = invoice.electricity_new_index - invoice.electricity_old_index
            electricity_cost = Decimal(electricity_usage) * invoice.electricity_unit_price
        
        water_cost = invoice.number_of_people * invoice.water_unit_price
        
        total_amount = (
            invoice.room_price +
            electricity_cost +
            water_cost +
            invoice.service_fee +
            invoice.internet_fee +
            invoice.parking_fee +
            invoice.other_fees
        )
        
        return InvoiceOut(
            id=invoice.id,
            invoice_number=invoice.invoice_number,
            contract_id=contract.id,
            billing_month=invoice.billing_month,
            due_date=invoice.due_date,
            status=invoice.status,
            room_number=room.room_number,
            building_name=building.building_name,
            tenant_name=f"{tenant.last_name} {tenant.first_name}",
            room_price=invoice.room_price,
            electricity_old_index=invoice.electricity_old_index,
            electricity_new_index=invoice.electricity_new_index,
            electricity_usage=electricity_usage,
            electricity_unit_price=invoice.electricity_unit_price,
            electricity_cost=electricity_cost,
            number_of_people=invoice.number_of_people,
            water_unit_price=invoice.water_unit_price,
            water_cost=water_cost,
            service_fee=invoice.service_fee,
            internet_fee=invoice.internet_fee,
            parking_fee=invoice.parking_fee,
            other_fees=invoice.other_fees,
            other_fees_description=invoice.other_fees_description,
            total_amount=total_amount,
            notes=invoice.notes,
            created_at=invoice.created_at,
            updated_at=invoice.updated_at
        )
