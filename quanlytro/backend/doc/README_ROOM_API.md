# Room Management API

API RESTful để quản lý phòng trọ được xây dựng với FastAPI, PostgreSQL, và SQLAlchemy.

## Cấu trúc dự án

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── routes/
│   │   │   └── Room.py          # Room endpoints
│   │   └── api.py               # API router aggregator
│   ├── core/
│   │   ├── settings.py          # App configuration
│   │   ├── response.py          # Response helpers
│   │   └── Enum/roomEnum.py     # Room status enums
│   ├── models/
│   │   └── room.py              # SQLAlchemy Room model
│   ├── schemas/
│   │   └── room_schema.py       # Pydantic schemas
│   ├── repositories/
│   │   └── room_repository.py   # Data access layer
│   ├── services/
│   │   └── RoomService.py       # Business logic layer
│   └── infrastructure/db/
│       └── session.py           # Database session
├── migrations/                  # Alembic migrations
├── main.py                      # Application entry point
└── requirements.txt             # Python dependencies
```

## Room API Endpoints

### 1. Lấy danh sách phòng
```
GET /api/v1/rooms
```

**Query Parameters:**
- `building_id` (UUID, optional): Lọc theo tòa nhà
- `status` (string, optional): Lọc theo trạng thái (AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED)
- `offset` (int, default=0): Vị trí bắt đầu
- `limit` (int, default=20, max=100): Số lượng tối đa

**Response (200):**
```json
{
  "code": 200,
  "message": "Lấy danh sách phòng thành công",
  "data": {
    "items": [
      {
        "id": "uuid",
        "building_id": "uuid",
        "room_number": "101",
        "room_name": "Phòng đơn",
        "area": 25.0,
        "capacity": 2,
        "base_price": "3000000.00",
        "electricity_price": "3500.00",
        "water_price_per_person": "100000.00",
        "deposit_amount": "3000000.00",
        "status": "AVAILABLE",
        "description": "Phòng đẹp, view thoáng"
      }
    ],
    "total": 10,
    "offset": 0,
    "limit": 20
  }
}
```

### 2. Tạo phòng mới
```
POST /api/v1/rooms
```

**Request Body:**
```json
{
  "building_id": "uuid",
  "room_number": "101",
  "room_name": "Phòng đơn",
  "area": 25.0,
  "capacity": 2,
  "base_price": "3000000.00",
  "electricity_price": "3500.00",
  "water_price_per_person": "100000.00",
  "deposit_amount": "3000000.00",
  "status": "AVAILABLE",
  "description": "Phòng đẹp, view thoáng"
}
```

**Response (201):**
```json
{
  "code": 201,
  "message": "Tạo phòng thành công",
  "data": {
    "id": "uuid",
    "building_id": "uuid",
    "room_number": "101",
    ...
  }
}
```

**Response (409) - Conflict:**
```json
{
  "code": 409,
  "message": "Số phòng 101 đã tồn tại trong tòa nhà này",
  "data": {}
}
```

### 3. Xem chi tiết phòng
```
GET /api/v1/rooms/{room_id}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Lấy thông tin phòng thành công",
  "data": {
    "id": "uuid",
    "building_id": "uuid",
    "room_number": "101",
    ...
  }
}
```

**Response (404):**
```json
{
  "code": 404,
  "message": "Không tìm thấy phòng với ID: {room_id}",
  "data": {}
}
```

### 4. Cập nhật phòng
```
PUT /api/v1/rooms/{room_id}
```

**Request Body (Partial Update):**
```json
{
  "room_name": "Phòng VIP",
  "base_price": "3500000.00",
  "status": "OCCUPIED"
}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Cập nhật phòng thành công",
  "data": {
    "id": "uuid",
    "room_name": "Phòng VIP",
    "base_price": "3500000.00",
    ...
  }
}
```

### 5. Xóa phòng
```
DELETE /api/v1/rooms/{room_id}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Xóa phòng thành công",
  "data": {}
}
```

## Room Status Enum

- `AVAILABLE`: Phòng trống, sẵn sàng cho thuê
- `OCCUPIED`: Phòng đã được thuê
- `MAINTENANCE`: Phòng đang bảo trì
- `RESERVED`: Phòng đã được đặt trước

## Business Rules

### Tạo phòng:
- Số phòng phải unique trong cùng tòa nhà
- Giá thuê (`base_price`) phải > 0
- Sức chứa (`capacity`) phải ≥ 1
- Status phải hợp lệ theo enum

### Cập nhật phòng:
- Không được update sang số phòng đã tồn tại trong cùng tòa nhà
- Giá thuê phải > 0 nếu được update
- Status phải hợp lệ nếu được update
- Hỗ trợ partial update (chỉ gửi field cần thay đổi)

### Xóa phòng:
- Không xóa được phòng đang có hợp đồng active (TODO: implement sau)

## Chạy ứng dụng

### 1. Cài đặt dependencies
```bash
pip install -r requirements.txt
```

### 2. Cấu hình environment
Tạo file `.env.development`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SECRET_KEY=your-secret-key
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

### 3. Chạy migrations
```bash
alembic upgrade head
```

### 4. Chạy server
```bash
# Development
python main.py

# hoặc với uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Truy cập API docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## Testing

```bash
# Chạy tất cả tests
pytest

# Chạy tests với coverage
pytest --cov=app tests/

# Chạy tests cụ thể
pytest tests/test_room_api.py -v
```

## Architecture

Project tuân thủ **Schema-Based Clean Architecture**:

```
Router (Controller) → Service (Business Logic) → Repository (Data Access) → ORM Model
                ↓
            Schemas (Pydantic) - hợp nhất DTO cho input/output
```

### Layers:

1. **Router** (`app/api/v1/routes/Room.py`): 
   - Xử lý HTTP requests/responses
   - Validate input với Pydantic schemas
   - Gọi Service layer
   - Map exceptions thành HTTP status codes

2. **Service** (`app/services/RoomService.py`):
   - Chứa business logic và use cases
   - Validate business rules
   - Điều phối operations qua Repository

3. **Repository** (`app/repositories/room_repository.py`):
   - Data access layer
   - Chỉ thao tác với database
   - Không chứa business logic

4. **Schemas** (`app/schemas/room_schema.py`):
   - Pydantic models cho validation
   - Input/Output DTOs
   - Serialize ORM models → JSON

5. **Models** (`app/models/room.py`):
   - SQLAlchemy ORM models
   - Database schema mapping

## Error Handling

API sử dụng chuẩn response format:

```json
{
  "code": 200,
  "message": "success message",
  "data": {}
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `409 Conflict`: Business rule violation
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

## Development Guidelines

Xem chi tiết tại: `.github/copilot-instructions.md`

### Coding Standards:
- Python ≥ 3.11
- Type hints đầy đủ
- Docstrings theo Google style
- Black formatting (line length 100)
- Clean Code principles

### Database:
- PostgreSQL với SQLAlchemy 2.x
- Async sessions (optional)
- Alembic cho migrations
- Proper indexing và constraints

## License

MIT
