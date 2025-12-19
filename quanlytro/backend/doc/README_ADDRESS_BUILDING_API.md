# Address & Building Management API

API RESTful để quản lý địa chỉ và tòa nhà trong hệ thống quản lý phòng trọ.

## 📋 Mục lục
- [Address API](#address-api)
- [Building API](#building-api)
- [Business Rules](#business-rules)
- [Examples](#examples)

---

## Address API

Quản lý địa chỉ của các tòa nhà trong hệ thống.

### 1. Lấy danh sách địa chỉ
```
GET /api/v1/addresses
```

**Query Parameters:**
- `city` (string, optional): Lọc theo thành phố (hỗ trợ tìm kiếm gần đúng)
- `offset` (int, default=0): Vị trí bắt đầu
- `limit` (int, default=20, max=100): Số lượng tối đa

**Response (200):**
```json
{
  "code": 200,
  "message": "Lấy danh sách địa chỉ thành công",
  "data": {
    "items": [
      {
        "id": "uuid",
        "address_line": "123 Nguyễn Văn Linh",
        "ward": "Phường Tân Phú",
        "city": "Hồ Chí Minh",
        "country": "Vietnam",
        "full_address": "123 Nguyễn Văn Linh, Phường Tân Phú, Hồ Chí Minh, Vietnam",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 10,
    "offset": 0,
    "limit": 20
  }
}
```

### 2. Tạo địa chỉ mới
```
POST /api/v1/addresses
```

**Request Body:**
```json
{
  "address_line": "123 Nguyễn Văn Linh",
  "ward": "Phường Tân Phú",
  "city": "Hồ Chí Minh",
  "country": "Vietnam"
}
```

**Response (201):**
```json
{
  "code": 201,
  "message": "Tạo địa chỉ thành công",
  "data": {
    "id": "uuid",
    "address_line": "123 Nguyễn Văn Linh",
    "ward": "Phường Tân Phú",
    "city": "Hồ Chí Minh",
    "country": "Vietnam",
    "full_address": "123 Nguyễn Văn Linh, Phường Tân Phú, Hồ Chí Minh, Vietnam",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

### 3. Xem chi tiết địa chỉ
```
GET /api/v1/addresses/{address_id}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Lấy thông tin địa chỉ thành công",
  "data": {
    "id": "uuid",
    "address_line": "123 Nguyễn Văn Linh",
    "ward": "Phường Tân Phú",
    "city": "Hồ Chí Minh",
    "country": "Vietnam",
    "full_address": "123 Nguyễn Văn Linh, Phường Tân Phú, Hồ Chí Minh, Vietnam",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

### 4. Cập nhật địa chỉ
```
PUT /api/v1/addresses/{address_id}
```

**Request Body (Partial Update):**
```json
{
  "address_line": "456 Lê Văn Việt",
  "ward": "Phường Tăng Nhơn Phú A"
}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Cập nhật địa chỉ thành công",
  "data": {
    "id": "uuid",
    "address_line": "456 Lê Văn Việt",
    "ward": "Phường Tăng Nhơn Phú A",
    "city": "Hồ Chí Minh",
    "country": "Vietnam",
    "full_address": "456 Lê Văn Việt, Phường Tăng Nhơn Phú A, Hồ Chí Minh, Vietnam",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T12:00:00Z"
  }
}
```

### 5. Xóa địa chỉ
```
DELETE /api/v1/addresses/{address_id}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Xóa địa chỉ thành công",
  "data": {}
}
```

---

## Building API

Quản lý thông tin các tòa nhà/khu trọ.

### 1. Lấy danh sách tòa nhà
```
GET /api/v1/buildings
```

**Query Parameters:**
- `address_id` (UUID, optional): Lọc theo địa chỉ
- `status` (string, optional): Lọc theo trạng thái (ACTIVE, INACTIVE, SUSPENDED)
- `offset` (int, default=0): Vị trí bắt đầu
- `limit` (int, default=20, max=100): Số lượng tối đa

**Response (200):**
```json
{
  "code": 200,
  "message": "Lấy danh sách tòa nhà thành công",
  "data": {
    "items": [
      {
        "id": "uuid",
        "building_code": "BLD001",
        "building_name": "Tòa nhà A",
        "address_id": "uuid",
        "description": "Tòa nhà cao cấp, tiện nghi đầy đủ",
        "status": "ACTIVE"
      }
    ],
    "total": 5,
    "offset": 0,
    "limit": 20
  }
}
```

### 2. Tạo tòa nhà mới
```
POST /api/v1/buildings
```

**Request Body:**
```json
{
  "building_code": "BLD001",
  "building_name": "Tòa nhà A",
  "address_id": "uuid",
  "description": "Tòa nhà cao cấp, tiện nghi đầy đủ",
  "status": "ACTIVE"
}
```

**Response (201):**
```json
{
  "code": 201,
  "message": "Tạo tòa nhà thành công",
  "data": {
    "id": "uuid",
    "building_code": "BLD001",
    "building_name": "Tòa nhà A",
    "address_id": "uuid",
    "description": "Tòa nhà cao cấp, tiện nghi đầy đủ",
    "status": "ACTIVE"
  }
}
```

**Response (409) - Conflict:**
```json
{
  "code": 409,
  "message": "Mã tòa nhà BLD001 đã tồn tại",
  "data": {}
}
```

### 3. Xem chi tiết tòa nhà
```
GET /api/v1/buildings/{building_id}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Lấy thông tin tòa nhà thành công",
  "data": {
    "id": "uuid",
    "building_code": "BLD001",
    "building_name": "Tòa nhà A",
    "address_id": "uuid",
    "description": "Tòa nhà cao cấp, tiện nghi đầy đủ",
    "status": "ACTIVE"
  }
}
```

### 4. Cập nhật tòa nhà
```
PUT /api/v1/buildings/{building_id}
```

**Request Body (Partial Update):**
```json
{
  "building_name": "Tòa nhà A - Nâng cấp",
  "description": "Tòa nhà đã được nâng cấp hoàn toàn",
  "status": "ACTIVE"
}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Cập nhật tòa nhà thành công",
  "data": {
    "id": "uuid",
    "building_code": "BLD001",
    "building_name": "Tòa nhà A - Nâng cấp",
    "address_id": "uuid",
    "description": "Tòa nhà đã được nâng cấp hoàn toàn",
    "status": "ACTIVE"
  }
}
```

### 5. Xóa tòa nhà
```
DELETE /api/v1/buildings/{building_id}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Xóa tòa nhà thành công",
  "data": {}
}
```

---

## Business Rules

### Address Rules:
- ✅ `address_line`, `ward`, `city` không được để trống
- ✅ `full_address` sẽ được tự động tạo nếu không cung cấp
- ✅ `full_address` sẽ được tự động cập nhật khi thay đổi các trường liên quan
- ✅ Không xóa được địa chỉ đang được sử dụng bởi tòa nhà (TODO)

### Building Rules:
- ✅ `building_code` phải unique trong toàn hệ thống
- ✅ `building_name` không được để trống
- ✅ `address_id` phải tồn tại trong hệ thống
- ✅ `status` phải là một trong: ACTIVE, INACTIVE, SUSPENDED
- ✅ Không được update sang `building_code` đã tồn tại
- ✅ Không xóa được tòa nhà đang có phòng (TODO)

---

## Status Enum

Building sử dụng `StatusEnum`:
- `ACTIVE`: Tòa nhà đang hoạt động
- `INACTIVE`: Tòa nhà tạm ngưng hoạt động
- `SUSPENDED`: Tòa nhà bị đình chỉ

---

## Examples

### Workflow: Tạo tòa nhà với địa chỉ mới

#### 1. Tạo địa chỉ trước
```bash
curl -X POST "http://localhost:8000/api/v1/addresses" \
  -H "Content-Type: application/json" \
  -d '{
    "address_line": "123 Nguyễn Văn Linh",
    "ward": "Phường Tân Phú",
    "city": "Hồ Chí Minh",
    "country": "Vietnam"
  }'
```

Response:
```json
{
  "code": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    ...
  }
}
```

#### 2. Tạo tòa nhà với address_id vừa tạo
```bash
curl -X POST "http://localhost:8000/api/v1/buildings" \
  -H "Content-Type: application/json" \
  -d '{
    "building_code": "BLD001",
    "building_name": "Tòa nhà A",
    "address_id": "550e8400-e29b-41d4-a716-446655440000",
    "description": "Tòa nhà cao cấp",
    "status": "ACTIVE"
  }'
```

#### 3. Lấy danh sách tòa nhà theo địa chỉ
```bash
curl -X GET "http://localhost:8000/api/v1/buildings?address_id=550e8400-e29b-41d4-a716-446655440000"
```

---

## Error Handling

### Common Error Codes:

**400 Bad Request** - Validation lỗi:
```json
{
  "code": 400,
  "message": "Địa chỉ không được để trống",
  "data": {}
}
```

**404 Not Found** - Không tìm thấy resource:
```json
{
  "code": 404,
  "message": "Không tìm thấy địa chỉ với ID: {address_id}",
  "data": {}
}
```

**409 Conflict** - Vi phạm business rules:
```json
{
  "code": 409,
  "message": "Mã tòa nhà BLD001 đã tồn tại",
  "data": {}
}
```

**500 Internal Server Error**:
```json
{
  "code": 500,
  "message": "Lỗi hệ thống: ...",
  "data": {}
}
```

---

## Architecture

```
┌──────────────────────────────────────┐
│         Router Layer                 │
│  (Address.py / Building.py)          │
│  • HTTP request/response handling    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│         Service Layer                │
│  (AddressService / BuildingService)  │
│  • Business logic & validation       │
│  • Check address exists for building │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│       Repository Layer               │
│  (AddressRepository /                │
│   BuildingRepository)                │
│  • Database CRUD operations          │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│         ORM Models                   │
│  (Address / Building)                │
│  • SQLAlchemy models                 │
└──────────────────────────────────────┘
```

---

## Relationships

```
Address (1) ──────< (N) Building (1) ──────< (N) Room

- Một Address có thể có nhiều Building
- Một Building thuộc về một Address
- Một Building có thể có nhiều Room
```

---

## Testing

### Test với curl:

```bash
# Test Address API
./test_address_api.sh

# Test Building API
./test_building_api.sh
```

### Test với pytest:

```bash
pytest tests/test_address_api.py -v
pytest tests/test_building_api.py -v
```

---

## Next Steps

- [ ] Implement soft delete
- [ ] Add validation: không xóa address đang có building
- [ ] Add validation: không xóa building đang có room
- [ ] Add eager loading cho relationships
- [ ] Add search by building name
- [ ] Add statistics endpoints
- [ ] Add building photos management

---

## See Also

- [Room Management API](README_ROOM_API.md)
- [API Documentation](http://localhost:8000/docs)
- [Architecture Guidelines](.github/copilot-instructions.md)
