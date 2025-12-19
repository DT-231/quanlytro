# Contract API Documentation

API để quản lý hợp đồng thuê phòng trong hệ thống EasyRent.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Endpoints](#endpoints)
- [Schemas](#schemas)
- [Business Rules](#business-rules)
- [Examples](#examples)

---

## 🎯 Tổng quan

Contract API cung cấp các chức năng CRUD đầy đủ cho quản lý hợp đồng thuê phòng:

- ✅ Tạo hợp đồng mới với validation đầy đủ
- ✅ Xem danh sách hợp đồng với pagination và filters
- ✅ Thống kê hợp đồng cho dashboard
- ✅ Cập nhật thông tin hợp đồng
- ✅ Xóa hợp đồng (với kiểm tra ràng buộc)
- ✅ Tự động cập nhật trạng thái phòng khi tạo/kết thúc hợp đồng

---

## 📡 Endpoints

### 1. GET `/api/v1/contracts/stats`

Lấy thống kê hợp đồng cho dashboard.

**Response:**
```json
{
  "data": {
    "total_contracts": 582,
    "active_contracts": 188,
    "expiring_soon": 199,
    "expired_contracts": 10
  },
  "message": "success"
}
```

**Hiển thị trên UI:**
- Tổng hợp đồng: 582
- Đang hoạt động: 188 (status = ACTIVE)
- Sắp hết hạn: 199 (hết hạn trong vòng 30 ngày)
- Đã hết hạn: 10 (status = EXPIRED)

---

### 2. GET `/api/v1/contracts`

Lấy danh sách hợp đồng với pagination và filters.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Số trang (default: 1) |
| `size` | integer | No | Số items/trang (default: 20, max: 100) |
| `status` | string | No | Lọc theo trạng thái: ACTIVE, EXPIRED, TERMINATED, PENDING |
| `building` | string | No | Lọc theo tên tòa nhà (tìm kiếm gần đúng) |
| `search` | string | No | Tìm kiếm theo mã hợp đồng / tên khách / số điện thoại |

**Response:**
```json
{
  "data": {
    "items": [
      {
        "id": "01936f89-1234-7abc-8def-0123456789ab",
        "contract_number": "HD01",
        "room_number": 111,
        "tenant_name": "Phan Mạnh Quỳnh",
        "building_name": "Chung cư Hoàng Anh Gia Lai",
        "start_date": "2025-02-15",
        "end_date": "2025-12-14",
        "rental_price": 2000000.00,
        "status": "ACTIVE",
        "created_at": "2025-01-01T00:00:00"
      }
    ],
    "total": 582,
    "page": 1,
    "size": 20,
    "pages": 30
  },
  "message": "success"
}
```

**Hiển thị trên UI Table:**
| Mã hợp đồng | Phòng | Tên khách hàng | Tòa nhà | Thời hạn | Giá thuê | Trạng thái | Thao tác |
|-------------|-------|----------------|---------|----------|----------|------------|----------|
| HD01 | 111 | Phan Mạnh Quỳnh | Chung cư Hoàng Anh Gia Lai | 15/02/2025 - 14/12/2025 | 2.000.000đ | 🔴 Đã hết hạn | ✏️ 🗑️ |
| HD02 | 118 | Lâm Minh Phú | VinHome quận 7 | 15/02/2025 - 14/12/2025 | 2.000.000đ | 🟢 Đang hoạt động | ✏️ 🗑️ |

**Examples:**
```bash
# Lấy trang đầu tiên
GET /api/v1/contracts?page=1&size=10

# Lọc hợp đồng đang hoạt động
GET /api/v1/contracts?status=ACTIVE

# Lọc theo tòa nhà
GET /api/v1/contracts?building=VinHome

# Tìm kiếm
GET /api/v1/contracts?search=HD01
GET /api/v1/contracts?search=Phan Mạnh Quỳnh
GET /api/v1/contracts?search=0912345678

# Kết hợp filters
GET /api/v1/contracts?page=1&size=20&status=ACTIVE&building=VinHome
```

---

### 3. POST `/api/v1/contracts`

Tạo hợp đồng mới.

**Request Body:**
```json
{
  "room_id": "01936f89-1234-7abc-8def-0123456789ab",
  "tenant_id": "01936f89-5678-7abc-8def-0123456789ab",
  "start_date": "2025-02-15",
  "end_date": "2025-12-14",
  "rental_price": 2000000.00,
  "deposit_amount": 2000000.00,
  "payment_day": 15,
  "number_of_tenants": 1,
  "terms_and_conditions": "Điều khoản hợp đồng...",
  "notes": "Ghi chú...",
  "contract_number": "HD01",
  "payment_cycle_months": 3,
  "electricity_price": 3500.00,
  "water_price": 15000.00,
  "service_fees": ["Phí rác", "Phí giữ xe"]
}
```

**Required Fields:**
- `room_id`: UUID của phòng thuê
- `tenant_id`: UUID của khách hàng
- `start_date`: Ngày bắt đầu hợp đồng
- `end_date`: Ngày kết thúc (phải sau start_date)
- `rental_price`: Giá thuê (phải > 0)
- `deposit_amount`: Tiền đặt cọc (phải >= 0)

**Optional Fields:**
- `contract_number`: Mã hợp đồng (tự sinh HD001, HD002... nếu không nhập)
- `payment_day`: Ngày thanh toán hàng tháng (1-31, default: 15)
- `number_of_tenants`: Số người ở (default: 1)
- `payment_cycle_months`: Chu kỳ thanh toán (1-12 tháng)
- `electricity_price`: Giá điện (VNĐ/kWh)
- `water_price`: Giá nước (VNĐ/m³)
- `service_fees`: Danh sách phí dịch vụ
- `terms_and_conditions`: Điều khoản hợp đồng
- `notes`: Ghi chú

**Response:**
```json
{
  "data": {
    "id": "01936f89-1234-7abc-8def-0123456789ab",
    "contract_id": "01936f89-1234-7abc-8def-0123456789ab",
    "contract_number": "HD01",
    "room_id": "01936f89-1234-7abc-8def-0123456789ab",
    "tenant_id": "01936f89-5678-7abc-8def-0123456789ab",
    "start_date": "2025-02-15",
    "end_date": "2025-12-14",
    "rental_price": 2000000.00,
    "deposit_amount": 2000000.00,
    "payment_day": 15,
    "number_of_tenants": 1,
    "status": "ACTIVE",
    "terms_and_conditions": "...",
    "notes": "...",
    "created_by": null,
    "created_at": "2025-11-22T10:00:00",
    "updated_at": "2025-11-22T10:00:00"
  },
  "message": "Tạo hợp đồng thành công"
}
```

**Status Code:**
- `201 Created`: Tạo thành công
- `400 Bad Request`: Validation error hoặc vi phạm business rules
- `500 Internal Server Error`: Lỗi server

---

### 4. GET `/api/v1/contracts/{contract_id}`

Lấy chi tiết hợp đồng theo ID.

**Path Parameters:**
- `contract_id` (UUID): ID của hợp đồng

**Response:**
```json
{
  "data": {
    "id": "01936f89-1234-7abc-8def-0123456789ab",
    "contract_id": "01936f89-1234-7abc-8def-0123456789ab",
    "contract_number": "HD01",
    "room_id": "01936f89-1234-7abc-8def-0123456789ab",
    "tenant_id": "01936f89-5678-7abc-8def-0123456789ab",
    "start_date": "2025-02-15",
    "end_date": "2025-12-14",
    "rental_price": 2000000.00,
    "deposit_amount": 2000000.00,
    "payment_day": 15,
    "number_of_tenants": 1,
    "status": "ACTIVE",
    "terms_and_conditions": "...",
    "notes": "...",
    "created_by": null,
    "created_at": "2025-11-22T10:00:00",
    "updated_at": "2025-11-22T10:00:00"
  },
  "message": "success"
}
```

**Status Code:**
- `200 OK`: Thành công
- `404 Not Found`: Không tìm thấy hợp đồng

---

### 5. PUT `/api/v1/contracts/{contract_id}`

Cập nhật hợp đồng (partial update).

**Path Parameters:**
- `contract_id` (UUID): ID của hợp đồng

**Request Body (tất cả fields đều optional):**
```json
{
  "start_date": "2025-02-15",
  "end_date": "2025-12-14",
  "rental_price": 2500000.00,
  "deposit_amount": 2500000.00,
  "payment_day": 20,
  "number_of_tenants": 2,
  "status": "TERMINATED",
  "terms_and_conditions": "...",
  "notes": "...",
  "payment_cycle_months": 6,
  "electricity_price": 4000.00,
  "water_price": 18000.00
}
```

**Response:**
```json
{
  "data": {
    "id": "01936f89-1234-7abc-8def-0123456789ab",
    "contract_number": "HD01",
    ...
  },
  "message": "Cập nhật hợp đồng thành công"
}
```

**Status Code:**
- `200 OK`: Cập nhật thành công
- `404 Not Found`: Không tìm thấy hợp đồng
- `400 Bad Request`: Validation error

---

### 6. DELETE `/api/v1/contracts/{contract_id}`

Xóa hợp đồng.

**Path Parameters:**
- `contract_id` (UUID): ID của hợp đồng

**Response:**
- HTTP 204 No Content (không có body)

**Status Code:**
- `204 No Content`: Xóa thành công
- `404 Not Found`: Không tìm thấy hợp đồng
- `400 Bad Request`: Không thể xóa (có invoice liên quan)

---

## 📦 Schemas

### ContractCreate
```typescript
{
  room_id: UUID;              // Required
  tenant_id: UUID;            // Required
  start_date: date;           // Required
  end_date: date;             // Required (phải sau start_date)
  rental_price: Decimal;      // Required (phải > 0)
  deposit_amount: Decimal;    // Required (phải >= 0)
  payment_day?: number;       // Optional (1-31, default: 15)
  number_of_tenants?: number; // Optional (>= 1, default: 1)
  terms_and_conditions?: string;
  notes?: string;
  contract_number?: string;   // Optional (tự sinh nếu không có)
  payment_cycle_months?: number; // Optional (1-12)
  electricity_price?: Decimal;
  water_price?: Decimal;
  service_fees?: string[];
}
```

### ContractUpdate
```typescript
{
  // Tất cả fields đều optional (partial update)
  start_date?: date;
  end_date?: date;
  rental_price?: Decimal;
  deposit_amount?: Decimal;
  payment_day?: number;
  number_of_tenants?: number;
  status?: string;
  terms_and_conditions?: string;
  notes?: string;
  payment_cycle_months?: number;
  electricity_price?: Decimal;
  water_price?: Decimal;
}
```

### ContractOut
```typescript
{
  id: UUID;
  contract_id: UUID;
  contract_number: string;
  room_id: UUID;
  tenant_id: UUID;
  start_date: date;
  end_date: date;
  rental_price: Decimal;
  deposit_amount: Decimal;
  payment_day: number | null;
  number_of_tenants: number;
  status: string;
  terms_and_conditions: string | null;
  notes: string | null;
  created_by: UUID | null;
  created_at: datetime | null;
  updated_at: datetime | null;
}
```

### ContractListItem
```typescript
{
  id: UUID;
  contract_number: string;    // HD01, HD02...
  room_number: number;        // 111, 118...
  tenant_name: string;        // Phan Mạnh Quỳnh
  building_name: string;      // Chung cư Hoàng Anh Gia Lai
  start_date: date;           // 2025-02-15
  end_date: date;             // 2025-12-14
  rental_price: Decimal;      // 2000000.00
  status: string;             // ACTIVE, EXPIRED, TERMINATED, PENDING
  created_at: datetime | null;
}
```

---

## ⚖️ Business Rules

### 1. Tạo hợp đồng
- ✅ Phòng phải tồn tại và ở trạng thái `AVAILABLE`
- ✅ Khách hàng (tenant) phải tồn tại trong hệ thống
- ✅ Một phòng chỉ có thể có 1 hợp đồng `ACTIVE` tại một thời điểm
- ✅ `end_date` phải sau `start_date`
- ✅ `rental_price` phải > 0
- ✅ `deposit_amount` phải >= 0
- ✅ Sau khi tạo hợp đồng `ACTIVE`, phòng tự động chuyển sang `OCCUPIED`
- ✅ Mã hợp đồng tự động sinh nếu không nhập: HD001, HD002, HD003...

### 2. Cập nhật hợp đồng
- ✅ Hỗ trợ partial update (chỉ cập nhật các fields được gửi)
- ✅ Khi chuyển status sang `TERMINATED` hoặc `EXPIRED`, phòng tự động về `AVAILABLE`
- ✅ Khi chuyển status sang `ACTIVE`, phòng tự động sang `OCCUPIED`
- ✅ Validate `end_date` > `start_date` khi cả hai đều được cập nhật

### 3. Xóa hợp đồng
- ✅ Không thể xóa hợp đồng đã có invoice (TODO: chưa implement)
- ✅ Nếu hợp đồng `ACTIVE`, phòng sẽ về `AVAILABLE` sau khi xóa

### 4. Trạng thái hợp đồng
- `ACTIVE`: Hợp đồng đang có hiệu lực
- `EXPIRED`: Hợp đồng đã hết hạn
- `TERMINATED`: Hợp đồng đã bị chấm dứt trước hạn
- `PENDING`: Hợp đồng đang chờ xử lý/ký

---

## 💡 Examples

### Example 1: Lấy thống kê dashboard
```bash
curl -X GET "http://localhost:8000/api/v1/contracts/stats"
```

### Example 2: List hợp đồng với filters
```bash
# Tất cả hợp đồng
curl -X GET "http://localhost:8000/api/v1/contracts?page=1&size=10"

# Chỉ hợp đồng ACTIVE
curl -X GET "http://localhost:8000/api/v1/contracts?status=ACTIVE"

# Tìm theo tòa nhà
curl -X GET "http://localhost:8000/api/v1/contracts?building=VinHome"

# Tìm kiếm
curl -X GET "http://localhost:8000/api/v1/contracts?search=HD01"
```

### Example 3: Tạo hợp đồng mới
```bash
curl -X POST "http://localhost:8000/api/v1/contracts" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "01936f89-1234-7abc-8def-0123456789ab",
    "tenant_id": "01936f89-5678-7abc-8def-0123456789ab",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "rental_price": 2000000.00,
    "deposit_amount": 2000000.00,
    "payment_day": 15,
    "number_of_tenants": 1,
    "terms_and_conditions": "Các điều khoản hợp đồng...",
    "notes": "Ghi chú...",
    "payment_cycle_months": 3,
    "electricity_price": 3500.00,
    "water_price": 15000.00,
    "service_fees": ["Phí rác", "Phí giữ xe"]
  }'
```

### Example 4: Cập nhật hợp đồng
```bash
curl -X PUT "http://localhost:8000/api/v1/contracts/01936f89-1234-7abc-8def-0123456789ab" \
  -H "Content-Type: application/json" \
  -d '{
    "rental_price": 2500000.00,
    "notes": "Đã tăng giá thuê"
  }'
```

### Example 5: Xóa hợp đồng
```bash
curl -X DELETE "http://localhost:8000/api/v1/contracts/01936f89-1234-7abc-8def-0123456789ab"
```

---

## 🚀 Testing

### 1. Run server
```bash
python main.py
# hoặc
uvicorn main:app --reload
```

### 2. Truy cập Swagger UI
```
http://localhost:8000/docs
```

### 3. Run test script
```bash
chmod +x test_contract_api_examples.sh
./test_contract_api_examples.sh
```

---

## 📝 Notes

### TODO
- [ ] Implement JWT authentication (hiện tại `created_by` là None)
- [ ] Add validation để không cho xóa hợp đồng có invoice
- [ ] Add file upload cho contract documents
- [ ] Add contract renewal (gia hạn hợp đồng)
- [ ] Add contract termination request workflow

### Known Issues
- Authentication chưa được implement, tất cả API đều public
- Chưa có validation cho contract documents (bảng `contract_documents`)
- Service fees hiện tại chỉ là array string, chưa có bảng riêng

---

## 📚 Related Documentation

- [Room API Documentation](./README_ROOM_API.md)
- [Building API Documentation](./README_ADDRESS_BUILDING_API.md)
- [GitHub Copilot Instructions](../.github/copilot-instructions.md)
