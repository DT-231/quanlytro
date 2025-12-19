# Hướng dẫn Test Contract API với Dữ liệu Thực tế

## 🎯 Mục tiêu
Hướng dẫn từng bước để test Contract API với dữ liệu thực tế từ database.

---

## 📋 Các bước chuẩn bị

### 1. Chạy Server
```bash
# Chạy từ thư mục backend
python main.py

# Hoặc với uvicorn
uvicorn main:app --reload

# Server sẽ chạy tại: http://localhost:8000
```

### 2. Truy cập Swagger UI
Mở trình duyệt và truy cập:
```
http://localhost:8000/docs
```

### 3. Lấy UUID thực tế từ Database

Bạn cần lấy UUID của:
- **Room** (phòng trống, status = AVAILABLE)
- **User** (khách hàng, role = TENANT)

#### Cách 1: Sử dụng pgAdmin hoặc psql
```sql
-- Lấy phòng available
SELECT id, room_number, building_id, status 
FROM rooms 
WHERE status = 'AVAILABLE' 
LIMIT 5;

-- Lấy user (tenant)
SELECT id, first_name, last_name, email 
FROM users 
WHERE role_id IN (SELECT id FROM roles WHERE role_name = 'TENANT')
LIMIT 5;
```

#### Cách 2: Sử dụng Room API
```bash
# List rooms available
curl http://localhost:8000/api/v1/rooms?status=AVAILABLE
```

---

## 🧪 Test Cases

### Test 1: Lấy thống kê hợp đồng

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/contracts/stats" | jq .
```

**Expected Response:**
```json
{
  "data": {
    "total_contracts": 0,
    "active_contracts": 0,
    "expiring_soon": 0,
    "expired_contracts": 0
  },
  "message": "success"
}
```

**Note:** Nếu database chưa có hợp đồng, các giá trị sẽ là 0.

---

### Test 2: List hợp đồng (empty)

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/contracts?page=1&size=10" | jq .
```

**Expected Response:**
```json
{
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "size": 10,
    "pages": 0
  },
  "message": "success"
}
```

---

### Test 3: Tạo hợp đồng đầu tiên

**Bước 1: Thay UUID thực tế**

Giả sử bạn có:
- Room ID: `01936f89-a1b2-7c3d-8e4f-0123456789ab`
- User ID: `01936f89-b2c3-7d4e-8f5a-0123456789cd`

**Bước 2: Tạo request**

```bash
curl -X POST "http://localhost:8000/api/v1/contracts" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "01936f89-a1b2-7c3d-8e4f-0123456789ab",
    "tenant_id": "01936f89-b2c3-7d4e-8f5a-0123456789cd",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "rental_price": 2000000.00,
    "deposit_amount": 2000000.00,
    "payment_day": 15,
    "number_of_tenants": 1,
    "terms_and_conditions": "Điều khoản về việc sử dụng và bảo quản tài sản thuê. Bên thuê có trách nhiệm sử dụng phòng đúng mục đích, giữ gìn sạch sẽ, không làm hư hỏng tài sản. Nếu tài sản bị hỏng do lỗi của bên thuê, bên thuê phải bồi thường theo giá trị thực tế. Mọi hư hỏng phải sinh ra thông báo ngay cho bên cho thuê để kiểm tra và xử lý.",
    "notes": "Khách hàng đã thanh toán đầy đủ tiền cọc",
    "payment_cycle_months": 3,
    "electricity_price": 3500.00,
    "water_price": 15000.00,
    "service_fees": ["Phí rác", "Phí giữ xe"]
  }' | jq .
```

**Expected Response:**
```json
{
  "data": {
    "id": "01936f89-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "contract_id": "01936f89-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "contract_number": "HD001",
    "room_id": "01936f89-a1b2-7c3d-8e4f-0123456789ab",
    "tenant_id": "01936f89-b2c3-7d4e-8f5a-0123456789cd",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "rental_price": 2000000.00,
    "deposit_amount": 2000000.00,
    "payment_day": 15,
    "number_of_tenants": 1,
    "status": "ACTIVE",
    "terms_and_conditions": "...",
    "notes": "Khách hàng đã thanh toán đầy đủ tiền cọc",
    "created_by": null,
    "created_at": "2025-11-22T10:00:00",
    "updated_at": "2025-11-22T10:00:00"
  },
  "message": "Tạo hợp đồng thành công"
}
```

**Verify:**
1. Contract được tạo với `contract_number = "HD001"`
2. Room status đã chuyển sang `OCCUPIED` (kiểm tra qua Room API)

---

### Test 4: Verify phòng đã OCCUPIED

**Request:**
```bash
# Thay ROOM_ID bằng UUID thực tế
curl -X GET "http://localhost:8000/api/v1/rooms/01936f89-a1b2-7c3d-8e4f-0123456789ab" | jq .
```

**Expected:**
```json
{
  "data": {
    "id": "01936f89-a1b2-7c3d-8e4f-0123456789ab",
    "room_number": 111,
    "status": "OCCUPIED",  // ← Đã chuyển sang OCCUPIED
    ...
  }
}
```

---

### Test 5: Tạo hợp đồng thứ 2

**Request:**
```bash
# Với phòng khác và tenant khác
curl -X POST "http://localhost:8000/api/v1/contracts" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "ROOM_ID_2",
    "tenant_id": "USER_ID_2",
    "start_date": "2025-02-01",
    "end_date": "2025-07-31",
    "rental_price": 2500000.00,
    "deposit_amount": 2500000.00,
    "payment_day": 20,
    "number_of_tenants": 2,
    "payment_cycle_months": 6
  }' | jq .
```

**Expected:**
- Contract number tự tăng: `HD002`

---

### Test 6: List contracts (có dữ liệu)

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/contracts?page=1&size=10" | jq .
```

**Expected Response:**
```json
{
  "data": {
    "items": [
      {
        "id": "...",
        "contract_number": "HD002",
        "room_number": 118,
        "tenant_name": "Nguyễn Văn B",
        "building_name": "VinHome quận 7",
        "start_date": "2025-02-01",
        "end_date": "2025-07-31",
        "rental_price": 2500000.00,
        "status": "ACTIVE",
        "created_at": "..."
      },
      {
        "id": "...",
        "contract_number": "HD001",
        "room_number": 111,
        "tenant_name": "Nguyễn Văn A",
        "building_name": "Chung cư Hoàng Anh Gia Lai",
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "rental_price": 2000000.00,
        "status": "ACTIVE",
        "created_at": "..."
      }
    ],
    "total": 2,
    "page": 1,
    "size": 10,
    "pages": 1
  },
  "message": "success"
}
```

---

### Test 7: Get contract detail

**Request:**
```bash
# Thay CONTRACT_ID bằng UUID thực tế từ response của Test 3
curl -X GET "http://localhost:8000/api/v1/contracts/CONTRACT_ID" | jq .
```

---

### Test 8: Update contract

**Request:**
```bash
curl -X PUT "http://localhost:8000/api/v1/contracts/CONTRACT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "rental_price": 2200000.00,
    "notes": "Đã tăng giá thuê 10%"
  }' | jq .
```

**Expected:**
- Chỉ các fields được gửi sẽ được update
- Response trả về full contract info

---

### Test 9: Filter contracts

**Request 1: Filter by status**
```bash
curl -X GET "http://localhost:8000/api/v1/contracts?status=ACTIVE" | jq .
```

**Request 2: Filter by building**
```bash
curl -X GET "http://localhost:8000/api/v1/contracts?building=VinHome" | jq .
```

**Request 3: Search**
```bash
curl -X GET "http://localhost:8000/api/v1/contracts?search=HD001" | jq .
```

---

### Test 10: Terminate contract

**Request:**
```bash
curl -X PUT "http://localhost:8000/api/v1/contracts/CONTRACT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "TERMINATED",
    "notes": "Khách hàng yêu cầu chấm dứt hợp đồng sớm"
  }' | jq .
```

**Verify:**
1. Contract status chuyển sang `TERMINATED`
2. Room status chuyển về `AVAILABLE` (kiểm tra qua Room API)

---

### Test 11: Verify phòng về AVAILABLE

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/rooms/ROOM_ID" | jq .
```

**Expected:**
```json
{
  "data": {
    "status": "AVAILABLE"  // ← Đã về AVAILABLE
  }
}
```

---

### Test 12: Delete contract

**Request:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/contracts/CONTRACT_ID"
```

**Expected:**
- HTTP 204 No Content (không có response body)

**Verify:**
```bash
# Get contract sẽ trả 404
curl -X GET "http://localhost:8000/api/v1/contracts/CONTRACT_ID"
# Expected: 404 Not Found
```

---

### Test 13: Test validation errors

#### Test 13.1: Tạo hợp đồng với phòng đã có contract ACTIVE

**Request:**
```bash
# Tạo hợp đồng với phòng đã được thuê
curl -X POST "http://localhost:8000/api/v1/contracts" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "ROOM_ID_OCCUPIED",
    "tenant_id": "USER_ID",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "rental_price": 2000000.00,
    "deposit_amount": 2000000.00
  }'
```

**Expected:**
```json
{
  "detail": "Phòng 111 đã có hợp đồng đang hoạt động"
}
```
HTTP Status: 400

#### Test 13.2: End date trước start date

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/contracts" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "ROOM_ID",
    "tenant_id": "USER_ID",
    "start_date": "2025-12-31",
    "end_date": "2025-01-01",
    "rental_price": 2000000.00,
    "deposit_amount": 2000000.00
  }'
```

**Expected:**
```json
{
  "detail": [
    {
      "loc": ["body", "end_date"],
      "msg": "Ngày kết thúc phải sau ngày bắt đầu"
    }
  ]
}
```
HTTP Status: 422

#### Test 13.3: Giá thuê âm

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/contracts" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "ROOM_ID",
    "tenant_id": "USER_ID",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "rental_price": -1000000.00,
    "deposit_amount": 2000000.00
  }'
```

**Expected:**
```json
{
  "detail": [
    {
      "loc": ["body", "rental_price"],
      "msg": "Input should be greater than 0"
    }
  ]
}
```
HTTP Status: 422

---

### Test 14: Statistics sau khi có data

**Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/contracts/stats" | jq .
```

**Expected:**
```json
{
  "data": {
    "total_contracts": 5,
    "active_contracts": 3,
    "expiring_soon": 1,
    "expired_contracts": 1
  },
  "message": "success"
}
```

---

## 📊 Checklist Test đầy đủ

### Basic CRUD
- [ ] GET /stats - Thống kê
- [ ] GET / - List (empty)
- [ ] POST / - Tạo hợp đồng đầu tiên (HD001)
- [ ] POST / - Tạo hợp đồng thứ 2 (HD002)
- [ ] GET /{id} - Chi tiết hợp đồng
- [ ] PUT /{id} - Update hợp đồng
- [ ] DELETE /{id} - Xóa hợp đồng

### Filters & Search
- [ ] GET /?status=ACTIVE - Filter by status
- [ ] GET /?building=VinHome - Filter by building
- [ ] GET /?search=HD01 - Search by contract number
- [ ] GET /?search=Nguyễn - Search by tenant name
- [ ] GET /?page=2&size=10 - Pagination

### Business Rules
- [ ] Verify room OCCUPIED after create
- [ ] Verify room AVAILABLE after terminate/delete
- [ ] Error: Duplicate active contract
- [ ] Error: end_date < start_date
- [ ] Error: negative price
- [ ] Error: room not found
- [ ] Error: tenant not found

### Auto Generation
- [ ] Contract number auto-increment (HD001, HD002...)
- [ ] Contract ID (UUID v7)

---

## 🐛 Troubleshooting

### Lỗi: Room not found
```
Giải pháp: Kiểm tra UUID của phòng có đúng không, phòng có tồn tại không
```

### Lỗi: Phòng không ở trạng thái AVAILABLE
```
Giải pháp: 
1. List rooms: GET /api/v1/rooms?status=AVAILABLE
2. Chọn phòng AVAILABLE để tạo hợp đồng
```

### Lỗi: Tenant not found
```
Giải pháp: Cần có user trong database với role = TENANT
```

### Contract number không tăng đúng
```
Giải pháp: Kiểm tra database, có thể có contract_number không đúng format
```

---

## 📝 Notes

1. **UUID v7**: Tất cả ID đều dùng UUID v7 (có thứ tự thời gian)
2. **Auto Contract Number**: HD001, HD002, HD003...
3. **Room Status**: Tự động update khi tạo/kết thúc hợp đồng
4. **Validation**: Pydantic validate input, Service validate business rules
5. **Pagination**: Default page=1, size=20
6. **Filters**: Có thể combine nhiều filters cùng lúc

---

## 🚀 Next Steps

Sau khi test xong Contract API, tiếp tục với:
1. Invoice API (hóa đơn thanh toán theo hợp đồng)
2. Payment API (thanh toán hóa đơn)
3. Maintenance Request API (yêu cầu sửa chữa)
4. Review API (đánh giá phòng/tòa nhà)
