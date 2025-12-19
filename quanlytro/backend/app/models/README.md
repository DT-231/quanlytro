# Database Models

Thư mục này chứa tất cả các SQLAlchemy models cho hệ thống quản lý nhà trọ.

## Cấu trúc Models

### Base Model
- `base.py`: Chứa BaseModel với UUID primary key và timestamps

### Main Models
- `user.py`: Model User với các roles (admin, tenant, visitor)
- `room.py`: Model Room với thông tin phòng trọ
- `contract.py`: Model Contract cho hợp đồng thuê
- `invoice.py`: Model Invoice cho hóa đơn
- `payment.py`: Model Payment cho thanh toán
- `maintenance_request.py`: Model MaintenanceRequest cho yêu cầu bảo trì
- `notification.py`: Model Notification cho thông báo
- `review.py`: Model Review cho đánh giá
- `room_utility.py`: Model RoomUtility cho tiện ích phòng
- `media_file.py`: Model MediaFile cho file đính kèm


## Đặc điểm chính

### UUID Primary Keys
Tất cả models sử dụng UUID làm primary key thay vì integer auto-increment:
```python
id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

### Timestamps
Tự động thêm `created_at` và `updated_at` cho tất cả models kế thừa từ BaseModel.

### Relationships
Các relationships được định nghĩa rõ ràng với back_populates để đảm bảo tính toàn vẹn dữ liệu.

### Enums
Sử dụng Python Enums cho các trường có giá trị cố định để đảm bảo tính nhất quán.

## Sử dụng

### Import models
```python
from app.models import User, Room, Contract, Invoice, Payment
from app.models import UserRole, RoomStatus, InvoiceStatus
```

### Tạo database tables
```bash
python create_tables.py
```

### Quản lý migrations
```bash
# Khởi tạo Alembic
python migrate.py init

# Tạo migration mới
python migrate.py create "Initial migration"

# Chạy migrations
python migrate.py upgrade

# Downgrade
python migrate.py downgrade
```

## Database Schema

Models được thiết kế dựa trên file `databaseScript.sql` với những cải tiến:

1. **UUID thay vì INT**: Tất cả primary keys sử dụng UUID
2. **Enum Types**: Sử dụng Python Enums thay vì string literals
3. **Relationships**: Định nghĩa rõ ràng các mối quan hệ
4. **Indexes**: Tự động tạo indexes cho các foreign keys
5. **Constraints**: Sử dụng SQLAlchemy constraints

## Lưu ý

- Đảm bảo database hỗ trợ UUID extension (PostgreSQL)
- Các enum types cần được tạo trước khi tạo tables
- Sử dụng Alembic để quản lý schema changes
- Test migrations trên môi trường development trước
