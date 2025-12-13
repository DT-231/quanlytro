# Room Search Feature - Tìm kiếm phòng

## Tổng quan

Đã thêm chức năng tìm kiếm vào API danh sách phòng thống nhất (`GET /api/v1/rooms`), cho phép tìm kiếm theo:
- **Số phòng** (room_number)
- **Tên phòng** (room_name)  
- **Tên tòa nhà** (building_name)

## API Endpoint

```
GET /api/v1/rooms?search={keyword}
```

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| search | string | No | Tìm kiếm theo tên phòng, số phòng, hoặc tên tòa nhà | `?search=hoàng anh` |
| building_id | UUID | No | Lọc theo tòa nhà | `?building_id=uuid` |
| status | string | No | Lọc theo trạng thái (Admin only) | `?status=AVAILABLE` |
| offset | int | No | Vị trí bắt đầu (default: 0) | `?offset=0` |
| limit | int | No | Số lượng (Public max 20, Admin max 100) | `?limit=10` |

### Ví dụ sử dụng

**1. Tìm kiếm phòng theo tên tòa nhà (Public - không cần login)**
```bash
GET /api/v1/rooms?search=hoàng anh&limit=10
```

**2. Tìm kiếm phòng theo số phòng (Admin - có token)**
```bash
GET /api/v1/rooms?search=A101&status=AVAILABLE
Authorization: Bearer <token>
```

**3. Tìm kiếm phòng theo tên phòng kết hợp filter**
```bash
GET /api/v1/rooms?search=studio&building_id=uuid&limit=20
Authorization: Bearer <token>
```

## Response Format

### Public Response (không login hoặc role ≠ ADMIN)

```json
{
  "code": 200,
  "message": "Lấy danh sách phòng thành công",
  "data": {
    "items": [
      {
        "id": "uuid",
        "room_number": "A101",
        "room_name": "Studio Premium",
        "building_name": "Chung cư Hoàng Anh",
        "full_address": "123 Đường ABC, Phường XYZ, Đà Nẵng",
        "base_price": 5000000,
        "area": 35.0,
        "capacity": 2,
        "is_available": true,
        "primary_photo": "data:image/png;base64,...",
        "created_at": "2025-01-23T10:30:00"
      }
    ],
    "total": 5,
    "offset": 0,
    "limit": 10
  }
}
```

### Admin Response (có login + role = ADMIN)

```json
{
  "code": 200,
  "message": "Lấy danh sách phòng thành công",
  "data": {
    "items": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "room_number": "A101",
        "building_name": "Chung cư Hoàng Anh",
        "area": 50.0,
        "capacity": 4,
        "current_occupants": 2,
        "status": "OCCUPIED",
        "base_price": 7000000,
        "representative": "Nguyễn Văn A"
      }
    ],
    "total": 15,
    "offset": 0,
    "limit": 20
  }
}
```

## Cách hoạt động

### 1. Router Layer (`app/api/v1/routes/Room.py`)

- Nhận tham số `search` từ query parameter
- Xác định quyền của user (Admin hoặc Public)
- Gọi service tương ứng với parameter search

```python
def list_rooms(
    search: Optional[str] = Query(None, description="Tìm kiếm theo tên phòng, tên tòa nhà"),
    ...
):
    if is_admin:
        result = room_service.list_rooms(
            search=search,  # Truyền search vào
            building_id=building_id,
            status=room_status,
            ...
        )
    else:
        result = room_service.list_rooms_public(
            search=search,  # Truyền search vào
            building_id=building_id,
            ...
        )
```

### 2. Service Layer (`app/services/RoomService.py`)

**Admin Service (`list_rooms`)**
- Nhận parameter `search: Optional[str] = None`
- Truyền xuống repository layer

```python
def list_rooms(
    self,
    building_id: Optional[UUID] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,  # Thêm parameter
    offset: int = 0,
    limit: int = 100,
) -> dict:
    items_data = self.room_repo.list_with_details(
        building_id=building_id,
        status=status,
        search=search,  # Truyền xuống repo
        offset=offset,
        limit=limit
    )
    
    total = self.room_repo.count(
        building_id=building_id,
        status=status,
        search=search  # Truyền xuống repo
    )
```

**Public Service (`list_rooms_public`)**
- Nhận parameter `search: Optional[str] = None`
- Thực hiện SQL query với filter search

```python
def list_rooms_public(
    self,
    building_id: Optional[UUID] = None,
    search: Optional[str] = None,  # Thêm parameter
    offset: int = 0,
    limit: int = 10,
) -> dict:
    query = self.db.query(Room).options(...)
    
    # Apply search filter
    if search:
        query = query.join(Building, Room.building_id == Building.id)
        search_pattern = f"%{search}%"
        query = query.filter(
            (Room.room_number.ilike(search_pattern)) |
            (Room.room_name.ilike(search_pattern)) |
            (Building.building_name.ilike(search_pattern))
        )
```

### 3. Repository Layer (`app/repositories/room_repository.py`)

**Method `list_with_details` (Admin)**

```python
def list_with_details(
    self,
    building_id: Optional[UUID] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,  # Thêm parameter
    offset: int = 0,
    limit: int = 100,
) -> list[dict]:
    # Main query với joins
    query = (
        self.db.query(Room.id, Room.room_number, ...)
        .join(Building, Room.building_id == Building.id)
        ...
    )
    
    # Apply search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Room.room_number.ilike(search_pattern)) |
            (Room.room_name.ilike(search_pattern)) |
            (Building.building_name.ilike(search_pattern))
        )
    
    # Apply filters, pagination...
    results = query.offset(offset).limit(limit).all()
```

**Method `count` (Admin)**

```python
def count(
    self,
    building_id: Optional[UUID] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,  # Thêm parameter
) -> int:
    query = self.db.query(Room)
    
    # Join với Building nếu cần search theo building_name
    if search:
        query = query.join(Building, Room.building_id == Building.id)
    
    # Apply filters...
    
    # Apply search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Room.room_number.ilike(search_pattern)) |
            (Room.room_name.ilike(search_pattern)) |
            (Building.building_name.ilike(search_pattern))
        )
    
    return query.count()
```

## Kỹ thuật Implementation

### 1. Case-Insensitive Search
Dùng `ilike()` của SQLAlchemy để tìm kiếm không phân biệt chữ hoa/thường:

```python
Room.room_number.ilike(search_pattern)
```

### 2. Wildcard Pattern
Thêm `%` vào đầu và cuối để tìm kiếm substring:

```python
search_pattern = f"%{search}%"  # Ví dụ: "%hoàng anh%"
```

### 3. Multi-Field Search với OR
Tìm kiếm trên nhiều cột bằng operator `|` (OR):

```python
query = query.filter(
    (Room.room_number.ilike(search_pattern)) |
    (Room.room_name.ilike(search_pattern)) |
    (Building.building_name.ilike(search_pattern))
)
```

### 4. Conditional Join
Chỉ join với Building khi cần thiết (tránh overhead):

```python
# Repository count method
if search:
    query = query.join(Building, Room.building_id == Building.id)
```

## Performance Considerations

### Indexes
Để tối ưu performance, nên tạo index cho các cột search:

```sql
CREATE INDEX idx_room_number ON rooms(room_number);
CREATE INDEX idx_room_name ON rooms(room_name);
CREATE INDEX idx_building_name ON buildings(building_name);
```

### N+1 Query Prevention
Public service dùng `joinedload()` để tránh N+1:

```python
query = self.db.query(Room).options(
    joinedload(Room.building).joinedload(Building.address),
    joinedload(Room.room_photos)
)
```

## Testing

### Test Cases

1. **Search by room number**
   - Input: `?search=A101`
   - Expected: Phòng có số phòng chứa "A101"

2. **Search by room name**
   - Input: `?search=studio`
   - Expected: Phòng có tên chứa "studio"

3. **Search by building name**
   - Input: `?search=hoàng anh`
   - Expected: Phòng thuộc tòa nhà có tên chứa "hoàng anh"

4. **Case insensitive search**
   - Input: `?search=HOÀNG ANH` hoặc `?search=hoàng anh`
   - Expected: Cùng kết quả

5. **Combined with other filters**
   - Input: `?search=studio&status=AVAILABLE&building_id=uuid`
   - Expected: Phòng studio available ở tòa nhà cụ thể

6. **Empty search**
   - Input: `?search=`
   - Expected: Trả về tất cả (như không có search)

7. **No results**
   - Input: `?search=xyz123notfound`
   - Expected: `{ items: [], total: 0 }`

## Files Modified

1. **app/repositories/room_repository.py**
   - `list_with_details()`: Thêm parameter `search`, thêm filter logic
   - `count()`: Thêm parameter `search`, thêm filter logic + conditional join

2. **app/services/RoomService.py**
   - Import `List`, `Decimal` (fix typing errors)
   - `list_rooms()`: Thêm parameter `search`, truyền xuống repo
   - `list_rooms_public()`: Thêm parameter `search`, thực hiện query với filter

3. **app/api/v1/routes/Room.py**
   - `list_rooms()`: Đã có sẵn parameter `search` trong query params, truyền vào service

## Benefits

### 1. Reduced API Count
- Trước: Cần nhiều endpoint riêng cho search
- Sau: Chỉ 1 endpoint với parameter `search` optional

### 2. Flexible Search
- Có thể search theo nhiều field cùng lúc
- Kết hợp được với các filter khác (building_id, status)

### 3. Consistent Experience
- Cùng endpoint cho cả Public và Admin
- Tự động phân quyền dựa vào token

### 4. Easy to Extend
- Dễ dàng thêm field search khác (ví dụ: utilities)
- Chỉ cần thêm vào filter condition với operator `|`

## Future Enhancements

### 1. Full-Text Search
Nếu cần search phức tạp hơn, có thể dùng PostgreSQL Full-Text Search:

```python
from sqlalchemy import func

query = query.filter(
    func.to_tsvector('english', Room.room_name).match(search)
)
```

### 2. Search by Utilities
Thêm join với `room_utilities` để search theo tiện ích:

```python
from app.models.room_utility import RoomUtility

if search:
    query = query.outerjoin(RoomUtility, Room.id == RoomUtility.room_id)
    query = query.filter(
        (Room.room_number.ilike(search_pattern)) |
        (Room.room_name.ilike(search_pattern)) |
        (Building.building_name.ilike(search_pattern)) |
        (RoomUtility.utility_name.ilike(search_pattern))
    )
```

### 3. Search Score/Ranking
Thêm điểm số ưu tiên (exact match > partial match):

```python
from sqlalchemy import case

query = query.add_columns(
    case(
        (Room.room_number == search, 3),  # Exact match = 3 points
        (Room.room_number.ilike(f"{search}%"), 2),  # Starts with = 2 points
        else_=1  # Contains = 1 point
    ).label('search_score')
).order_by('search_score DESC')
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-24  
**Author**: Backend Team
