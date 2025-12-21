# API Quản lý Loại Phòng (Room Type)

## Tổng quan

API này cho phép quản lý các loại phòng như Studio, 1 Phòng Ngủ, Duplex, v.v. trong hệ thống quản lý phòng trọ.

## API Endpoints

### 1. Lấy danh sách đơn giản với tìm kiếm (cho dropdown)

**Endpoint:** `GET /api/v1/room-types/simple`

**Authentication:** Không yêu cầu

**Query Parameters:**
- `is_active` (boolean, default: true) - Chỉ lấy loại phòng đang active
- `search` (string, optional) - Tìm kiếm theo tên loại phòng

**Response:**
```json
{
  "code": 200,
  "message": "Lấy danh sách loại phòng thành công",
  "data": [
    {
      "id": "uuid",
      "name": "Studio"
    },
    {
      "id": "uuid",
      "name": "1 Phòng Ngủ"
    }
  ]
}
```

**Ví dụ sử dụng:**
```bash
# Lấy tất cả
curl -X GET "http://localhost:8000/api/v1/room-types/simple?is_active=true"

# Tìm kiếm
curl -X GET "http://localhost:8000/api/v1/room-types/simple?is_active=true&search=studio"
```

---

### 2. Tạo loại phòng mới

**Endpoint:** `POST /api/v1/room-types`

**Authentication:** Yêu cầu (Admin)

**Request Body:**
```json
{
  "name": "Phòng đôi",
  "description": "Phòng có 2 giường đơn",
  "is_active": true
}
```

**Response:**
```json
{
  "code": 201,
  "message": "Tạo loại phòng 'Phòng đôi' thành công",
  "data": {
    "id": "uuid",
    "name": "Phòng đôi",
    "description": "Phòng có 2 giường đơn",
    "is_active": true,
    "created_at": "2025-12-21T12:00:00",
    "updated_at": "2025-12-21T12:00:00"
  }
}
```

---

### 3. Cập nhật loại phòng

**Endpoint:** `PUT /api/v1/room-types/{room_type_id}`

**Authentication:** Yêu cầu (Admin)

**Request Body:** (Tất cả field đều optional)
```json
{
  "name": "Studio cao cấp",
  "description": "Phòng studio cao cấp với nội thất đẹp",
  "is_active": true
}
```

---

### 4. Xóa loại phòng

**Endpoint:** `DELETE /api/v1/room-types/{room_type_id}`

**Authentication:** Yêu cầu (Admin)

**Query Parameters:**
- `soft` (boolean, default: true) - True = soft delete (ẩn), False = hard delete (xóa vĩnh viễn)

**Response:**
```json
{
  "code": 200,
  "message": "Đã tạm ẩn loại phòng 'Studio'",
  "data": {
    "message": "Đã tạm ẩn loại phòng 'Studio'"
  }
}
```

---

## Tích hợp với API Room

### Khi tạo phòng mới

**Request Body có thêm field `room_type_id`:**
```json
{
  "building_id": "uuid",
  "room_type_id": "uuid",  // <-- Field mới
  "room_number": "A101",
  "room_name": "Studio Premium",
  ...
}
```

### Response khi xem phòng

**Response có thêm field `room_type`:**
```json
{
  "id": "uuid",
  "room_type_id": "uuid",
  "room_type": {
    "id": "uuid",
    "name": "Studio"
  },
  "room_number": "A101",
  ...
}
```

---

## Cách sử dụng trong Front-end

### 1. Load dropdown loại phòng với tìm kiếm
```javascript
// Không cần authentication
const loadRoomTypes = async (search = '') => {
  const url = new URL('http://localhost:8000/api/v1/room-types/simple');
  url.searchParams.append('is_active', 'true');
  if (search) {
    url.searchParams.append('search', search);
  }
  
  const response = await fetch(url);
  const result = await response.json();
  return result.data; // [{id, name}, ...]
};
```

### 2. Hiển thị trong form với search
```jsx
const [roomTypes, setRoomTypes] = useState([]);
const [searchTerm, setSearchTerm] = useState('');

// Debounce search
useEffect(() => {
  const timer = setTimeout(() => {
    loadRoomTypes(searchTerm).then(setRoomTypes);
  }, 300);
  
  return () => clearTimeout(timer);
}, [searchTerm]);

// Trong render
<input 
  type="text"
  placeholder="Tìm loại phòng..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

<select name="room_type_id">
  <option value="">-- Chọn loại phòng --</option>
  {roomTypes.map(rt => (
    <option key={rt.id} value={rt.id}>{rt.name}</option>
  ))}
</select>
```

---

## Dữ liệu mặc định

Hệ thống tự động tạo 6 loại phòng sau khi chạy migration:
1. **Studio** - Phòng studio không gian mở, không chia phòng
2. **1 Phòng Ngủ** - Căn hộ có 1 phòng ngủ riêng biệt
3. **2 Phòng Ngủ** - Căn hộ có 2 phòng ngủ riêng biệt
4. **3 Phòng Ngủ** - Căn hộ có 3 phòng ngủ riêng biệt
5. **Duplex** - Căn hộ 2 tầng (duplex)
6. **Penthouse** - Căn hộ cao cấp trên tầng cao nhất
