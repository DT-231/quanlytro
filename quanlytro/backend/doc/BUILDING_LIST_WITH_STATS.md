# Building List API với Room Statistics

## 📋 Tổng quan

API `GET /api/v1/buildings` đã được nâng cấp để trả về thông tin đầy đủ như bảng UI, bao gồm:
- ✅ Tên tòa nhà
- ✅ Địa chỉ đầy đủ
- ✅ Tổng số phòng
- ✅ Số phòng trống (AVAILABLE)
- ✅ Số phòng đang thuê (OCCUPIED)
- ✅ Trạng thái tòa nhà
- ✅ Ngày tạo

---

## 🎯 Các thay đổi chính

### 1. **Schema mới: `BuildingListItem`**

File: `app/schemas/building_schema.py`

```python
class BuildingListItem(BaseModel):
    """Schema for Building list item with aggregated data.
    
    Dùng cho API list buildings, bao gồm thông tin tổng hợp về phòng.
    """
    
    id: uuid.UUID
    building_code: str
    building_name: str
    address_line: str  # Địa chỉ đầy đủ từ relationship
    total_rooms: int  # Tổng số phòng
    available_rooms: int  # Số phòng trống (AVAILABLE)
    rented_rooms: int  # Số phòng đang thuê (RENTED)
    status: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}
```

### 2. **Repository: Query với JOIN và COUNT**

File: `app/repositories/building_repository.py`

**Thêm method mới**: `list_with_room_stats()`

```python
def list_with_room_stats(
    self,
    address_id: Optional[UUID] = None,
    status: Optional[str] = None,
    offset: int = 0,
    limit: int = 100,
) -> list[dict]:
    """Lấy danh sách tòa nhà kèm thống kê số phòng.
    
    Sử dụng:
    - JOIN với Address để lấy full_address
    - LEFT JOIN với subqueries để đếm phòng theo status
    - COALESCE để xử lý NULL (tòa nhà chưa có phòng)
    """
```

**SQL Logic**:
- 3 subqueries riêng biệt để đếm:
  - `total_rooms`: Tổng số phòng
  - `available_rooms`: Phòng AVAILABLE
  - `rented_rooms`: Phòng RENTED
- JOIN với `Address` để lấy `full_address`
- OUTER JOIN với các subqueries
- COALESCE để trả về 0 thay vì NULL

### 3. **Service: Sử dụng schema mới**

File: `app/services/BuildingService.py`

```python
def list_buildings(...) -> dict:
    """Lấy danh sách tòa nhà với thống kê phòng."""
    
    # Lấy data với room stats từ repo
    items_data = self.building_repo.list_with_room_stats(...)
    
    # Convert dict sang Pydantic schemas
    items_out = [BuildingListItem(**item) for item in items_data]
    
    return {
        "items": items_out,
        "total": total,
        "offset": offset,
        "limit": limit,
    }
```

### 4. **Router: Cập nhật documentation**

File: `app/api/v1/routes/Building.py`

- Updated summary và description
- Thêm example response format trong docstring

---

## 📊 Response Format

### **Endpoint**: `GET /api/v1/buildings`

**Query Parameters**:
- `address_id` (UUID, optional): Lọc theo địa chỉ
- `status` (string, optional): Lọc theo trạng thái (ACTIVE, INACTIVE, SUSPENDED)
- `offset` (int, default=0): Vị trí bắt đầu
- `limit` (int, default=20, max=100): Số lượng tối đa

**Response Example**:
```json
{
  "code": 200,
  "message": "Lấy danh sách tòa nhà thành công",
  "data": {
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "building_code": "BLD-001",
        "building_name": "Chung cư hoàng anh",
        "address_line": "72 Hàm nghi, Đà Nẵng",
        "total_rooms": 15,
        "available_rooms": 1,
        "rented_rooms": 14,
        "status": "ACTIVE",
        "description": "Tòa nhà cao cấp",
        "created_at": "2025-02-10T12:00:00"
      },
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
        "building_code": "BLD-002",
        "building_name": "VinHome quận 7",
        "address_line": "512 Nguyễn Xiển, P. Long Thạnh Mỹ, TP.HCM",
        "total_rooms": 5,
        "available_rooms": 1,
        "rented_rooms": 4,
        "status": "ACTIVE",
        "description": null,
        "created_at": "2025-01-23T10:30:00"
      }
    ],
    "total": 10,
    "offset": 0,
    "limit": 20
  }
}
```

---

## 🧪 Testing

### **Chạy test script**:

```bash
chmod +x test_building_fix.sh
./test_building_fix.sh
```

### **Manual Testing**:

```bash
# 1. Lấy tất cả buildings
curl "http://localhost:8000/api/v1/buildings?limit=10"

# 2. Lọc theo status
curl "http://localhost:8000/api/v1/buildings?status=ACTIVE&limit=5"

# 3. Pagination
curl "http://localhost:8000/api/v1/buildings?offset=0&limit=3"
```

### **Swagger UI**:
```
http://localhost:8000/docs#/Building%20Management/list_buildings_buildings_get
```

---

## 📈 Performance Considerations

### **Ưu điểm**:
✅ **Single Query**: Tất cả data được load trong 1 query duy nhất  
✅ **No N+1 Problem**: Không loop qua từng building để đếm rooms  
✅ **Database-level Aggregation**: COUNT thực hiện ở DB, nhanh hơn Python  
✅ **Indexed Columns**: `building_id`, `status` đều có index  

### **Tối ưu hóa**:
- ✅ Sử dụng subqueries cho aggregation
- ✅ OUTER JOIN để handle buildings không có phòng
- ✅ COALESCE để tránh NULL
- ✅ Limit và offset cho pagination

---

## 🔄 So sánh với trước

### **Trước**:
```json
{
  "items": [
    {
      "id": "uuid",
      "building_code": "BLD-001",
      "building_name": "Chung cư hoàng anh",
      "address_id": "uuid",
      "status": "ACTIVE",
      "description": "..."
    }
  ]
}
```
❌ Không có địa chỉ đầy đủ  
❌ Không có thống kê phòng  
❌ Frontend phải gọi thêm API để lấy info  

### **Sau**:
```json
{
  "items": [
    {
      "id": "uuid",
      "building_code": "BLD-001",
      "building_name": "Chung cư hoàng anh",
      "address_line": "72 Hàm nghi, Đà Nẵng",
      "total_rooms": 15,
      "available_rooms": 1,
      "rented_rooms": 14,
      "status": "ACTIVE",
      "created_at": "2025-02-10T..."
    }
  ]
}
```
✅ Có địa chỉ đầy đủ  
✅ Có thống kê phòng (tổng/trống/thuê)  
✅ Frontend chỉ cần 1 API call  
✅ Hiển thị trực tiếp trên bảng  

---

## 🎨 Mapping với UI Table

| UI Column | API Field | Description |
|-----------|-----------|-------------|
| **Tên tòa nhà** | `building_name` | Tên của tòa nhà |
| **Địa chỉ tòa nhà** | `address_line` | Địa chỉ đầy đủ (từ Address.full_address) |
| **Tổng phòng** | `total_rooms` | Tổng số phòng trong tòa nhà |
| **Phòng trống** | `available_rooms` | Số phòng có status = AVAILABLE |
| **Đang thuê** | `rented_rooms` | Số phòng có status = OCCUPIED |
| **Tiện ích** | `building_name` | (Có thể hiển thị tên hoặc custom) |
| **Ngày tạo** | `created_at` | Format: DD/MM/YYYY |
| **Thao tác** | - | Edit/Delete buttons (Frontend) |

---

## 🚀 Best Practices Applied

### ✅ **Clean Architecture**:
- Repository: Chỉ truy vấn DB, trả dict
- Service: Business logic + convert sang schema
- Router: Mỏng, chỉ gọi service

### ✅ **Type Safety**:
- Return type rõ ràng: `list[dict]`, `BuildingListItem`
- Pydantic validation tự động

### ✅ **Documentation**:
- Docstrings đầy đủ
- Example response trong Router
- Markdown doc file này

### ✅ **Performance**:
- Single query với JOINs
- Database-level aggregation
- Proper indexing

---

## 📝 Notes

### **Room Status Enum**:
```python
class RoomStatus(str, Enum):
    AVAILABLE = "AVAILABLE"      # Phòng trống
    OCCUPIED = "OCCUPIED"        # Đang thuê (không phải RENTED!)
    MAINTENANCE = "MAINTENANCE"  # Bảo trì
    RESERVED = "RESERVED"        # Đã đặt cọc
```

### **Building Status Enum**:
```python
class StatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
```

### **Xử lý Edge Cases**:
- Tòa nhà chưa có phòng: `total_rooms = 0`
- Address.full_address = NULL: Trả về empty string `''`
- Pagination: Validate limit (max 100)

---

## 🎉 Kết luận

API list buildings giờ đây:
- ✅ Trả về đầy đủ thông tin như UI table
- ✅ Performance tốt (single query)
- ✅ Type-safe với Pydantic
- ✅ Clean code theo architecture
- ✅ Documentation đầy đủ

Frontend chỉ cần map trực tiếp response vào table! 🚀
