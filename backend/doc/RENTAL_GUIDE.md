# Hướng dẫn Hệ thống Cho thuê Phòng trọ

## 📋 Mục lục
1. [Tổng quan](#tổng-quan)
2. [Quy trình cho thuê](#quy-trình-cho-thuê)
3. [Phòng ở ghép](#phòng-ở-ghép)
4. [Ký hợp đồng sớm](#ký-hợp-đồng-sớm)
5. [API Reference](#api-reference)
6. [Ví dụ thực tế](#ví-dụ-thực-tế)
7. [Business Rules](#business-rules)

---

## 🎯 Tổng quan

Hệ thống cho thuê phòng trọ hỗ trợ:
- ✅ **Cho thuê phòng đơn**: 1 phòng - 1 hợp đồng
- ✅ **Phòng ở ghép**: Nhiều hợp đồng riêng lẻ cho cùng 1 phòng
- ✅ **Ký hợp đồng sớm**: Trạng thái PENDING → ACTIVE
- ✅ **Quản lý sức chứa**: Tự động kiểm tra số người tối đa
- ✅ **Tự động cập nhật trạng thái phòng**: AVAILABLE ↔ RESERVED ↔ OCCUPIED

---

## 📝 Quy trình cho thuê

### **Bước 1: Kiểm tra phòng trống**

```bash
GET /api/v1/rooms?status=AVAILABLE
```

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "uuid-phòng-101",
        "room_number": "101",
        "building_name": "Nhà trọ ABC",
        "capacity": 3,           // ← Sức chứa tối đa
        "base_price": 2000000,
        "status": "AVAILABLE"
      }
    ]
  }
}
```

### **Bước 2: Tạo hợp đồng thuê**

```bash
POST /api/v1/contracts
```

**Request Body:**
```json
{
  "room_id": "uuid-phòng-101",
  "tenant_id": "uuid-khách-hàng",
  "start_date": "2025-12-15",
  "end_date": "2026-12-14",
  "rental_price": 2000000,
  "deposit_amount": 4000000,
  "number_of_tenants": 1,        // Số người ở
  "payment_day": 15,              // Ngày thanh toán hàng tháng
  "status": "ACTIVE",             // ACTIVE hoặc PENDING
  "contract_number": "HD001",     // Tự sinh nếu không nhập
  "electricity_price": 3500,
  "water_price": 15000,
  "notes": "Ghi chú thêm"
}
```

**Response:**
```json
{
  "code": 201,
  "message": "Tạo hợp đồng thành công",
  "data": {
    "id": "uuid-hợp-đồng",
    "contract_number": "HD001",
    "status": "ACTIVE",
    "room": {
      "room_number": "101",
      "status": "OCCUPIED"      // ← Tự động chuyển
    }
  }
}
```

### **Bước 3: Hệ thống tự động xử lý**

✅ **Kiểm tra:**
- Phòng tồn tại
- Khách hàng tồn tại
- Phòng còn chỗ trống (capacity)
- `end_date` > `start_date`

✅ **Tự động:**
1. **Chuyển phòng sang OCCUPIED** (nếu status=ACTIVE)
2. **Tạo mã hợp đồng** (HD001, HD002, ...)
3. **Nâng cấp quyền user**: CUSTOMER → TENANT
4. **Lưu hợp đồng**

---

## 👥 Phòng ở ghép

### **Khái niệm**

Một phòng có thể có **nhiều hợp đồng riêng lẻ** cho từng người, miễn tổng số người không vượt quá `capacity`.

### **Người đại diện**

Trong phòng ở ghép, **người ký hợp đồng đầu tiên** được coi là **người đại diện**:
- 📞 Chịu trách nhiệm liên lạc chính với chủ trọ
- 📋 Được đánh dấu `is_primary = true` trong hệ thống
- 👥 Đại diện phối hợp với chủ trọ về các vấn đề chung của phòng

**Cách xác định:**
```
Hợp đồng nào có created_at sớm nhất = Người đại diện
```

**API để lấy thông tin:**
```bash
GET /api/v1/contracts/room/{room_id}/tenants
```


### **Ví dụ: Phòng 3 người**

```
┌─────────────────────────────────────────────────────┐
│ Phòng 101                                           │
│ Sức chứa: 3 người                                   │
├─────────────────────────────────────────────────────┤
│ Tháng 1: Người A thuê (2 người)                    │
│   - Hợp đồng #1: 2 người                           │
│   - Còn trống: 1/3                                 │
│   - Trạng thái: OCCUPIED                           │
├─────────────────────────────────────────────────────┤
│ Tháng 3: Người B vào ở ghép (1 người)             │
│   - Hợp đồng #2: 1 người                           │
│   - Còn trống: 0/3 (ĐẦY)                           │
│   - Trạng thái: OCCUPIED                           │
├─────────────────────────────────────────────────────┤
│ Tháng 6: Người C muốn vào?                         │
│   - ❌ Từ chối: Phòng đã đầy (3/3)                 │
├─────────────────────────────────────────────────────┤
│ Tháng 9: Người A rời đi                            │
│   - Xóa hợp đồng #1                                │
│   - Còn trống: 2/3                                 │
│   - Trạng thái: OCCUPIED (còn người B)             │
├─────────────────────────────────────────────────────┤
│ Tháng 12: Người B rời đi                           │
│   - Xóa hợp đồng #2                                │
│   - Còn trống: 3/3                                 │
│   - Trạng thái: AVAILABLE (trống hoàn toàn)        │
└─────────────────────────────────────────────────────┘
```

### **API Flow**

#### **1. Tạo hợp đồng đầu tiên**
```bash
POST /api/v1/contracts
{
  "room_id": "uuid-phòng-101",
  "tenant_id": "uuid-người-A",
  "number_of_tenants": 2,        // ← 2 người
  "rental_price": 2000000,
  ...
}

# ✅ Thành công
# 📊 Phòng: AVAILABLE → OCCUPIED
# 👥 Đang ở: 2/3
```

#### **2. Thêm người ở ghép**
```bash
POST /api/v1/contracts
{
  "room_id": "uuid-phòng-101",   // ← Cùng phòng
  "tenant_id": "uuid-người-B",
  "number_of_tenants": 1,        // ← Thêm 1 người
  "rental_price": 1500000,       // Giá có thể khác
  ...
}

# ✅ Thành công
# 📊 Phòng: vẫn OCCUPIED
# 👥 Đang ở: 3/3 (ĐẦY)
```

#### **3. Thử thêm người vượt quá sức chứa**
```bash
POST /api/v1/contracts
{
  "room_id": "uuid-phòng-101",
  "tenant_id": "uuid-người-C",
  "number_of_tenants": 1,
  ...
}

# ❌ Error 400
{
  "code": 400,
  "message": "Phòng 101 chỉ còn 0/3 chỗ trống. Hiện có 3 người, không thể thêm 1 người nữa."
}
```

#### **4. Một người rời đi**
```bash
DELETE /api/v1/contracts/{hợp-đồng-A}

# ✅ Xóa thành công
# 📊 Phòng: vẫn OCCUPIED (còn người B)
# 👥 Đang ở: 1/3
```

#### **5. Người cuối cùng rời đi**
```bash
DELETE /api/v1/contracts/{hợp-đồng-B}

# ✅ Xóa thành công
# 📊 Phòng: OCCUPIED → AVAILABLE
# 👥 Đang ở: 0/3
```

---

## ⏰ Ký hợp đồng sớm

### **Tình huống**

Ký hợp đồng vào **15/12/2025** nhưng khách vào ở **01/01/2026**.

### **Giải pháp: Sử dụng status PENDING**

```bash
# Ngày 15/12/2025: Ký hợp đồng
POST /api/v1/contracts
{
  "room_id": "uuid-phòng",
  "tenant_id": "uuid-khách",
  "start_date": "2026-01-01",    // ← Ngày BẮT ĐẦU thuê
  "end_date": "2026-12-31",
  "rental_price": 2000000,
  "deposit_amount": 4000000,
  "status": "PENDING",           // ← Chờ kích hoạt
  "notes": "Ký sớm, vào ở 1/1/2026"
}

# Kết quả:
# - Hợp đồng: PENDING
# - Phòng: AVAILABLE → RESERVED (đã đặt cọc)
# - Không ai thuê được phòng này nữa
```

```bash
# Ngày 01/01/2026: Khách vào ở
PUT /api/v1/contracts/{contract_id}
{
  "status": "ACTIVE"             // ← Kích hoạt
}

# Kết quả:
# - Hợp đồng: PENDING → ACTIVE
# - Phòng: RESERVED → OCCUPIED
# - Bắt đầu tính tiền thuê
```

### **Timeline**

```
15/12/2025              01/01/2026              31/12/2026
    │                       │                       │
    ▼                       ▼                       ▼
┌─────────┐          ┌─────────┐          ┌─────────┐
│ PENDING │          │ ACTIVE  │          │ EXPIRED │
└─────────┘          └─────────┘          └─────────┘
    │                       │                       │
    ▼                       ▼                       ▼
┌─────────┐          ┌─────────┐          ┌─────────┐
│RESERVED │          │OCCUPIED │          │AVAILABLE│
└─────────┘          └─────────┘          └─────────┘
```

---

## 📡 API Reference

### **1. Tạo hợp đồng**

```
POST /api/v1/contracts
```

**Request:**
```json
{
  "room_id": "UUID",              // Required
  "tenant_id": "UUID",            // Required
  "start_date": "2025-12-15",     // Required
  "end_date": "2026-12-14",       // Required (> start_date)
  "rental_price": 2000000,        // Required (> 0)
  "deposit_amount": 4000000,      // Required (>= 0)
  "number_of_tenants": 1,         // Optional (default: 1, >= 1)
  "status": "ACTIVE",             // Optional (ACTIVE | PENDING, default: ACTIVE)
  "contract_number": "HD001",     // Optional (tự sinh nếu không có)
  "payment_day": 15,              // Optional (1-31, default: 15)
  "payment_cycle_months": 3,      // Optional (1-12, default: 1)
  "electricity_price": 3500,      // Optional (>= 0)
  "water_price": 15000,           // Optional (>= 0)
  "terms_and_conditions": "...",  // Optional
  "notes": "..."                  // Optional
}
```

**Response 201:**
```json
{
  "code": 201,
  "message": "Tạo hợp đồng thành công",
  "data": {
    "id": "UUID",
    "contract_number": "HD001",
    "status": "ACTIVE",
    "room": {
      "room_number": "101",
      "status": "OCCUPIED"
    },
    "tenant": {
      "full_name": "Nguyễn Văn A"
    }
  }
}
```

**Error 400:**
```json
{
  "code": 400,
  "message": "Phòng 101 chỉ còn 1/3 chỗ trống. Hiện có 2 người, không thể thêm 2 người nữa."
}
```

### **2. Cập nhật hợp đồng**

```
PUT /api/v1/contracts/{contract_id}
```

**Request (Partial Update):**
```json
{
  "status": "ACTIVE",             // Chuyển từ PENDING → ACTIVE
  "rental_price": 2500000,        // Tăng giá
  "number_of_tenants": 2,         // Tăng số người (kiểm tra capacity)
  "notes": "Cập nhật ghi chú"
}
```

**Response 200:**
```json
{
  "code": 200,
  "message": "Cập nhật hợp đồng thành công",
  "data": {
    "id": "UUID",
    "status": "ACTIVE",
    "number_of_tenants": 2
  }
}
```

### **3. Xóa hợp đồng**

```
DELETE /api/v1/contracts/{contract_id}
```

**Response 200:**
```json
{
  "code": 200,
  "message": "Xóa hợp đồng thành công"
}
```

### **4. Lấy danh sách hợp đồng**

```
GET /api/v1/contracts?page=1&size=20&status=ACTIVE
```

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "UUID",
        "contract_number": "HD001",
        "room_number": "101",
        "tenant_name": "Nguyễn Văn A",
        "building_name": "Nhà trọ ABC",
        "status": "ACTIVE"
      }
    ],
    "total": 50,
    "page": 1,
    "size": 20,
    "pages": 3
  }
}
```

### **5. Thống kê hợp đồng**

```
GET /api/v1/contracts/stats
```

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total_contracts": 582,      // Tổng hợp đồng
    "active_contracts": 188,     // Đang hoạt động
    "expiring_soon": 199,        // Sắp hết hạn (< 30 ngày)
    "expired_contracts": 10      // Đã hết hạn
  }
}
```

### **6. Lấy thông tin người thuê trong phòng (Ở ghép)**

```
GET /api/v1/contracts/room/{room_id}/tenants
```

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total_tenants": 3,          // Tổng số người đang ở
    "num_contracts": 2,          // Số lượng hợp đồng ACTIVE
    "primary_tenant": {          // Người đại diện (hợp đồng đầu tiên)
      "contract_id": "uuid",
      "contract_number": "HD001",
      "name": "Nguyễn Văn A",
      "phone": "0123456789",
      "email": "a@example.com",
      "number_of_tenants": 2,
      "created_at": "2025-01-01T00:00:00"
    },
    "other_tenants": [           // Người ở ghép khác
      {
        "name": "Trần Thị B",
        "phone": "0987654321",
        "number_of_tenants": 1
      }
    ],
    "contracts": [               // Chi tiết tất cả hợp đồng
      {
        "id": "uuid",
        "contract_number": "HD001",
        "tenant_name": "Nguyễn Văn A",
        "tenant_phone": "0123456789",
        "number_of_tenants": 2,
        "rental_price": 2000000.0,
        "is_primary": true,      // ← Người đại diện
        "created_at": "2025-01-01T00:00:00"
      },
      {
        "id": "uuid",
        "contract_number": "HD002",
        "tenant_name": "Trần Thị B",
        "tenant_phone": "0987654321",
        "number_of_tenants": 1,
        "rental_price": 1500000.0,
        "is_primary": false,     // ← Người ở ghép
        "created_at": "2025-03-01T00:00:00"
      }
    ]
  }
}
```

**Use Case:**
- Hiển thị danh sách người thuê trên UI quản lý phòng
- Xác định ai là người liên lạc chính
- Tính tổng số người đang ở

---

## 💼 Ví dụ thực tế

### **Case 1: Cho thuê phòng đơn**

```bash
# 1. Tìm phòng trống
GET /api/v1/rooms?status=AVAILABLE

# 2. Tạo hợp đồng
POST /api/v1/contracts
{
  "room_id": "phòng-201",
  "tenant_id": "khách-A",
  "start_date": "2025-12-15",
  "end_date": "2026-12-14",
  "rental_price": 3000000,
  "deposit_amount": 6000000,
  "number_of_tenants": 1,
  "status": "ACTIVE"
}

# 3. Kết quả
# ✅ Hợp đồng: ACTIVE
# 📊 Phòng: AVAILABLE → OCCUPIED
# 👤 1/2 người (nếu capacity = 2)
```

### **Case 2: Phòng ở ghép - 2 hợp đồng**

```bash
# Tháng 1: Người A thuê (1 người)
POST /api/v1/contracts
{
  "room_id": "phòng-101",
  "tenant_id": "người-A",
  "number_of_tenants": 1,
  "rental_price": 1500000,
  ...
}
# ✅ Phòng: OCCUPIED (1/3)

# Tháng 3: Người B ở ghép (2 người)
POST /api/v1/contracts
{
  "room_id": "phòng-101",      // ← Cùng phòng
  "tenant_id": "người-B",
  "number_of_tenants": 2,
  "rental_price": 2500000,
  ...
}
# ✅ Phòng: OCCUPIED (3/3 - ĐẦY)
```

### **Case 3: Ký sớm, vào ở sau**

```bash
# 15/12: Ký hợp đồng
POST /api/v1/contracts
{
  "room_id": "phòng-301",
  "tenant_id": "khách-C",
  "start_date": "2026-01-01",   // ← Vào ở 1/1/2026
  "end_date": "2026-12-31",
  "status": "PENDING",          // ← Chờ kích hoạt
  ...
}
# ✅ Hợp đồng: PENDING
# 📊 Phòng: RESERVED

# 01/01: Kích hoạt
PUT /api/v1/contracts/{id}
{
  "status": "ACTIVE"
}
# ✅ Hợp đồng: ACTIVE
# 📊 Phòng: OCCUPIED
```

### **Case 5: Kiểm tra ai là người đại diện**

```bash
# Tình huống: Phòng 101 có 2 hợp đồng
# Cần biết ai là người liên lạc chính

GET /api/v1/contracts/room/{phòng-101}/tenants

# Response:
{
  "total_tenants": 3,
  "num_contracts": 2,
  "primary_tenant": {
    "name": "Nguyễn Văn A",      // ← Người đại diện
    "phone": "0123456789",
    "contract_number": "HD001",
    "created_at": "2025-01-01"   // Ký hợp đồng đầu tiên
  },
  "other_tenants": [
    {
      "name": "Trần Thị B",      // Người ở ghép
      "phone": "0987654321",
      "number_of_tenants": 1
    }
  ]
}

# Use case:
# - Liên lạc về vấn đề phòng → gọi cho Người A
# - Thông báo bảo trì → gửi cho Người A
# - Yêu cầu thanh toán chung → liên hệ Người A
```

```bash
# Tình huống: Phòng có 2 hợp đồng (3 người)
# - Hợp đồng A: 2 người (người đại diện)
# - Hợp đồng B: 1 người

# Người A rời đi
DELETE /api/v1/contracts/{hợp-đồng-A}

# Kết quả:
# ✅ Xóa thành công
# 📊 Phòng: vẫn OCCUPIED (còn người B: 1/3)
# 💡 Có thể cho người khác ở ghép tiếp (còn 2 chỗ)
# ⚠️ Người B tự động trở thành người đại diện mới

# Kiểm tra lại người đại diện mới
GET /api/v1/contracts/room/{room_id}/tenants
# primary_tenant giờ là Người B (hợp đồng còn lại cũ nhất)

# Người B cũng rời đi
DELETE /api/v1/contracts/{hợp-đồng-B}

# Kết quả:
# ✅ Xóa thành công
# 📊 Phòng: OCCUPIED → AVAILABLE (0/3)
# 🏠 Phòng trống, sẵn sàng cho thuê
```

---

## ⚖️ Business Rules

### **Tạo hợp đồng**

✅ **Validation:**
- Phòng phải tồn tại
- Khách hàng phải tồn tại
- `end_date` > `start_date`
- `rental_price` > 0
- `deposit_amount` >= 0
- `number_of_tenants` >= 1

✅ **Kiểm tra sức chứa:**
```
current_tenants + new_tenants <= room.capacity
```

✅ **Trạng thái phòng:**
- **ACTIVE:** Phòng phải AVAILABLE, RESERVED, hoặc OCCUPIED (ở ghép)
- **PENDING:** Phòng phải AVAILABLE hoặc OCCUPIED (đặt trước cho ở ghép)

✅ **Tự động:**
- Tạo mã hợp đồng: HD001, HD002, HD003...
- Nâng quyền: CUSTOMER → TENANT
- Cập nhật trạng thái phòng:
  - ACTIVE → OCCUPIED
  - PENDING → RESERVED

### **Cập nhật hợp đồng**

✅ **Thay đổi số người:**
- Kiểm tra lại sức chứa
- Loại trừ hợp đồng hiện tại khi tính

✅ **Thay đổi status:**
- **PENDING → ACTIVE:** Phòng RESERVED/AVAILABLE → OCCUPIED
- **ACTIVE → TERMINATED/EXPIRED:** Kiểm tra còn người ở không
  - Còn người: Giữ OCCUPIED
  - Không còn: Chuyển AVAILABLE

### **Xóa hợp đồng**

✅ **Kiểm tra:**
- Không xóa nếu có invoice (TODO)

✅ **Tự động:**
- Kiểm tra còn hợp đồng ACTIVE nào khác không
- Chỉ chuyển về AVAILABLE khi không còn ai ở

### **Trạng thái hợp đồng**

| Status | Mô tả | Phòng |
|--------|-------|-------|
| **PENDING** | Chờ kích hoạt (ký sớm) | RESERVED |
| **ACTIVE** | Đang hoạt động | OCCUPIED |
| **EXPIRED** | Hết hạn | AVAILABLE* |
| **TERMINATED** | Chấm dứt trước hạn | AVAILABLE* |

*Chỉ chuyển về AVAILABLE khi không còn hợp đồng ACTIVE nào khác (ở ghép)

### **Trạng thái phòng**

| Status | Mô tả | Cho thuê được? |
|--------|-------|----------------|
| **AVAILABLE** | Trống hoàn toàn | ✅ Có |
| **RESERVED** | Đã đặt cọc, chờ vào ở | ✅ Có (ở ghép) |
| **OCCUPIED** | Đang có người ở | ✅ Có (nếu còn chỗ - ở ghép) |
| **MAINTENANCE** | Đang bảo trì | ❌ Không |

---

## 🔍 Queries hữu ích

### **Tìm phòng còn chỗ trống**

```sql
SELECT 
    r.id,
    r.room_number,
    r.capacity,
    COALESCE(SUM(c.number_of_tenants), 0) as current_tenants,
    r.capacity - COALESCE(SUM(c.number_of_tenants), 0) as available_slots
FROM rooms r
LEFT JOIN contracts c ON r.id = c.room_id 
    AND c.status = 'ACTIVE'
WHERE r.status IN ('AVAILABLE', 'OCCUPIED')
GROUP BY r.id
HAVING r.capacity > COALESCE(SUM(c.number_of_tenants), 0)
ORDER BY available_slots DESC;
```

### **Danh sách hợp đồng sắp hết hạn**

```sql
SELECT 
    c.contract_number,
    c.end_date,
    r.room_number,
    u.full_name as tenant_name,
    EXTRACT(DAY FROM c.end_date - CURRENT_DATE) as days_remaining
FROM contracts c
JOIN rooms r ON c.room_id = r.id
JOIN users u ON c.tenant_id = u.id
WHERE c.status = 'ACTIVE'
    AND c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY c.end_date ASC;
```

### **Thống kê phòng ở ghép**

```sql
SELECT 
    r.room_number,
    r.capacity,
    COUNT(c.id) as num_contracts,
    SUM(c.number_of_tenants) as total_tenants,
    r.capacity - SUM(c.number_of_tenants) as available_slots
FROM rooms r
JOIN contracts c ON r.id = c.room_id
WHERE c.status = 'ACTIVE'
GROUP BY r.id
HAVING COUNT(c.id) > 1  -- Phòng có nhiều hơn 1 hợp đồng
ORDER BY num_contracts DESC;
```

---

## 📞 Support

Nếu có vấn đề, vui lòng liên hệ:
- 📧 Email: support@example.com
- 📱 Hotline: 0123456789
- 📝 Documentation: `/backend/doc/`

---

## 📚 Tài liệu liên quan

- [Contract API Summary](./CONTRACT_API_SUMMARY.md)
- [Room API Summary](./ROOM_API_SUMMARY.md)
- [Contract API Testing Guide](./CONTRACT_API_TESTING_GUIDE.md)
- [Response Standardization](../RESPONSE_STANDARDIZATION.md)
