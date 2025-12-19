# Room List API với Full Details

## 📋 Tổng quan

API `GET /api/v1/rooms` đã được nâng cấp để trả về thông tin đầy đủ như bảng UI, bao gồm:
- ✅ Số phòng (room_number)
- ✅ Tên tòa nhà (building_name)
- ✅ Diện tích m² (area)
- ✅ Tối đa người (capacity)
- ✅ Hiện ở (current_occupants) - từ contract ACTIVE
- ✅ Trạng thái (status)
- ✅ Giá thuê (base_price)
- ✅ Đại diện (representative) - tên người thuê từ contract

---

## 🎯 Các thay đổi chính

### 1. **Schema mới: `RoomListItem`**

File: `app/schemas/room_schema.py`

```python
class RoomListItem(BaseModel):
    """Schema for Room list item with additional data.
    
    Dùng cho API list rooms, bao gồm thông tin building và tenant.
    """
    
    id: uuid.UUID
    room_number: str
    building_name: str  # Tên tòa nhà từ relationship
    area: Optional[float] = None
    capacity: int
    current_occupants: int = 0  # Số người đang ở (từ contract active)
    status: str
    base_price: Decimal
    representative: Optional[str] = None  # Tên người đại diện (từ contract)
    
    model_config = {"from_attributes": True}
```

### 2. **Repository: Query với JOIN và Subquery**

File: `app/repositories/room_repository.py`

**Thêm method mới**: `list_with_details()`

```python
def list_with_details(
    self,
    building_id: Optional[UUID] = None,
    status: Optional[str] = None,
    offset: int = 0,
    limit: int = 100,
) -> list[dict]:
    """Lấy danh sách phòng kèm thông tin building và tenant.
    
    Logic:
    1. Subquery lấy contract ACTIVE mới nhất của mỗi phòng
    2. JOIN với Building để lấy building_name
    3. LEFT JOIN với contract subquery
    4. LEFT JOIN với User để lấy tenant name
    5. COALESCE để xử lý phòng không có contract
    """
```

**SQL Logic**:
```sql
-- Subquery: Lấy contract ACTIVE mới nhất
WITH active_contracts AS (
  SELECT 
    room_id,
    tenant_id,
    number_of_tenants,
    ROW_NUMBER() OVER (PARTITION BY room_id ORDER BY created_at DESC) as rn
  FROM contracts
  WHERE status = 'ACTIVE'
)

-- Main query
SELECT
  r.id,
  r.room_number,
  r.area,
  r.capacity,
  r.status,
  r.base_price,
  b.building_name,
  COALESCE(ac.number_of_tenants, 0) as current_occupants,
  CONCAT(u.last_name, ' ', u.first_name) as representative
FROM rooms r
INNER JOIN buildings b ON r.building_id = b.id
LEFT JOIN active_contracts ac ON r.id = ac.room_id AND ac.rn = 1
LEFT JOIN users u ON ac.tenant_id = u.id
WHERE ... -- filters
ORDER BY r.created_at DESC
LIMIT ... OFFSET ...
```

### 3. **Service: Sử dụng schema mới**

File: `app/services/RoomService.py`

```python
def list_rooms(...) -> dict:
    """Lấy danh sách phòng với thông tin đầy đủ."""
    
    # Lấy data với details từ repo
    items_data = self.room_repo.list_with_details(...)
    
    # Convert dict sang Pydantic schemas
    items_out = [RoomListItem(**item) for item in items_data]
    
    return {
        "items": items_out,
        "total": total,
        "offset": offset,
        "limit": limit,
    }
```

### 4. **Router: Cập nhật documentation**

File: `app/api/v1/routes/Room.py`

- Updated summary: "Lấy danh sách phòng với thông tin chi tiết"
- Thêm example response format trong docstring

---

## 📊 Response Format

### **Endpoint**: `GET /api/v1/rooms`

**Query Parameters**:
- `building_id` (UUID, optional): Lọc theo tòa nhà
- `status` (string, optional): Lọc theo trạng thái (AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED)
- `offset` (int, default=0): Vị trí bắt đầu
- `limit` (int, default=20, max=100): Số lượng tối đa

**Response Example**:
```json
{
  "code": 200,
  "message": "Lấy danh sách phòng thành công",
  "data": {
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "room_number": "101",
        "building_name": "Chung cư hoàng anh gia lai",
        "area": 50.0,
        "capacity": 4,
        "current_occupants": 2,
        "status": "OCCUPIED",
        "base_price": 7000000,
        "representative": "Phan Mạnh Quỳnh"
      },
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
        "room_number": "110",
        "building_name": "VinHome quận 7",
        "area": 40.0,
        "capacity": 2,
        "current_occupants": 2,
        "status": "OCCUPIED",
        "base_price": 2000000,
        "representative": "Lâm Minh Phú"
      },
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa8",
        "room_number": "602",
        "building_name": "VinHome quận 7",
        "area": 75.0,
        "capacity": 2,
        "current_occupants": 0,
        "status": "AVAILABLE",
        "base_price": 7000000,
        "representative": null
      }
    ],
    "total": 50,
    "offset": 0,
    "limit": 20
  }
}
```

---

## 🧪 Testing

### **Chạy test script**:

```bash
chmod +x test_room_list.sh
./test_room_list.sh
```

### **Manual Testing**:

```bash
# 1. Lấy tất cả rooms
curl "http://localhost:8000/api/v1/rooms?limit=10"

# 2. Lọc theo status
curl "http://localhost:8000/api/v1/rooms?status=OCCUPIED&limit=5"

# 3. Lọc theo building_id
curl "http://localhost:8000/api/v1/rooms?building_id=YOUR-UUID&limit=10"

# 4. Pagination
curl "http://localhost:8000/api/v1/rooms?offset=0&limit=3"
```

### **Swagger UI**:
```
http://localhost:8000/docs#/Room%20Management/list_rooms_rooms_get
```

---

## 📈 Performance Considerations

### **Ưu điểm**:
✅ **Single Query**: Tất cả data trong 1 query với JOINs  
✅ **Subquery Optimization**: ROW_NUMBER() để lấy contract mới nhất  
✅ **No N+1 Problem**: Không loop qua từng room  
✅ **Indexed Columns**: `building_id`, `status`, `room_id`, `tenant_id` có index  

### **Xử lý Edge Cases**:
- ✅ Phòng không có contract: `current_occupants = 0`, `representative = null`
- ✅ Phòng có nhiều contract: Chỉ lấy ACTIVE mới nhất (ROW_NUMBER)
- ✅ User không có tên: CONCAT vẫn hoạt động
- ✅ Area NULL: Trả về `null` (Optional[float])

---

## 🎨 Mapping với UI Table

| UI Column | API Field | Type | Description |
|-----------|-----------|------|-------------|
| **Phòng** | `room_number` | string | Số phòng (101, 220, 430, etc.) |
| **Tòa nhà** | `building_name` | string | Tên tòa nhà từ Building |
| **Diện tích (m²)** | `area` | float/null | Diện tích phòng |
| **Tối đa (người)** | `capacity` | int | Số người tối đa |
| **Hiện ở** | `current_occupants` | int | Số người đang ở (từ Contract.number_of_tenants) |
| **Trạng thái** | `status` | string | AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED |
| **Giá thuê** | `base_price` | decimal | Giá thuê cơ bản/tháng |
| **Đại diện** | `representative` | string/null | Tên người thuê (last_name + first_name) |

### **Badge Mapping**:
- `status = "OCCUPIED"` → Badge màu đen "Đang thuê"
- `status = "AVAILABLE"` → Badge màu xanh "Trống"
- `status = "MAINTENANCE"` → Badge màu vàng "Bảo trì"
- `status = "RESERVED"` → Badge màu cam "Đã đặt"

---

## 🔄 So sánh với trước

### **Trước**:
```json
{
  "items": [
    {
      "id": "uuid",
      "room_number": "101",
      "building_id": "uuid",
      "area": 50.0,
      "capacity": 4,
      "status": "OCCUPIED",
      "base_price": 7000000
    }
  ]
}
```
❌ Không có tên tòa nhà  
❌ Không có số người đang ở  
❌ Không có tên người thuê  
❌ Frontend phải gọi thêm 2-3 API  

### **Sau**:
```json
{
  "items": [
    {
      "id": "uuid",
      "room_number": "101",
      "building_name": "Chung cư hoàng anh",
      "area": 50.0,
      "capacity": 4,
      "current_occupants": 2,
      "status": "OCCUPIED",
      "base_price": 7000000,
      "representative": "Phan Mạnh Quỳnh"
    }
  ]
}
```
✅ Có tên tòa nhà  
✅ Có số người đang ở  
✅ Có tên người thuê  
✅ Frontend chỉ cần 1 API call  

---

## 🚀 Best Practices Applied

### ✅ **Clean Architecture**:
- Repository: Query DB, trả dict
- Service: Business logic + convert schema
- Router: Mỏng, chỉ gọi service

### ✅ **Type Safety**:
- Return type rõ ràng: `list[dict]`, `RoomListItem`
- Pydantic validation tự động

### ✅ **SQL Optimization**:
- Subquery với window function (ROW_NUMBER)
- JOIN thay vì multiple queries
- COALESCE xử lý NULL

### ✅ **Documentation**:
- Docstrings đầy đủ
- Example response trong Router
- Markdown doc file

---

## 📝 Important Notes

### **Room Status Enum**:
```python
class RoomStatus(BaseEnum):
    AVAILABLE = "AVAILABLE"      # Phòng trống
    OCCUPIED = "OCCUPIED"        # Đang thuê
    MAINTENANCE = "MAINTENANCE"  # Bảo trì
    RESERVED = "RESERVED"        # Đã đặt cọc
```

### **Contract Status Enum**:
```python
class ContractStatus(BaseEnum):
    ACTIVE = "ACTIVE"           # Đang hiệu lực
    EXPIRED = "EXPIRED"         # Đã hết hạn
    TERMINATED = "TERMINATED"   # Chấm dứt
    PENDING = "PENDING"         # Chờ xử lý
```

### **Subquery Logic**:
- Chỉ lấy contract có `status = 'ACTIVE'`
- Sắp xếp theo `created_at DESC` → lấy mới nhất
- `ROW_NUMBER() OVER (PARTITION BY room_id)` → 1 contract/phòng
- Filter `rn = 1` → chỉ lấy hàng đầu tiên

### **User Name Concatenation**:
- Format: `last_name + ' ' + first_name`
- Example: "Phan" + " " + "Mạnh Quỳnh" = "Phan Mạnh Quỳnh"
- NULL handling: CONCAT tự động xử lý

---

## 🎉 Kết luận

API list rooms giờ đây:
- ✅ Trả về đầy đủ thông tin như UI table
- ✅ Performance tốt (single query với JOINs)
- ✅ Type-safe với Pydantic
- ✅ Clean code theo architecture
- ✅ Handle edge cases (no contract, null fields)
- ✅ Documentation đầy đủ

Frontend chỉ cần map trực tiếp response vào table! 🚀
