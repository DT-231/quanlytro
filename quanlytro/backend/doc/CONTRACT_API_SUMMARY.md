# Contract API Summary

## 📊 Overview

API quản lý hợp đồng thuê phòng với đầy đủ chức năng CRUD, thống kê, và tự động cập nhật trạng thái phòng.

## 🎯 Key Features

✅ **CRUD đầy đủ**: Create, Read, Update, Delete hợp đồng  
✅ **Statistics**: Thống kê cho dashboard (tổng/active/sắp hết hạn/đã hết hạn)  
✅ **Smart Filters**: Pagination + lọc theo status, building, search  
✅ **Auto Room Status**: Tự động cập nhật trạng thái phòng khi tạo/kết thúc hợp đồng  
✅ **Validation**: Business rules đầy đủ (phòng available, không trùng hợp đồng active...)  
✅ **Auto Contract Number**: Tự sinh mã HD001, HD002, HD003...  

## 📡 Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/contracts/stats` | Thống kê hợp đồng |
| GET | `/api/v1/contracts` | List với pagination & filters |
| POST | `/api/v1/contracts` | Tạo hợp đồng mới |
| GET | `/api/v1/contracts/{id}` | Chi tiết hợp đồng |
| PUT | `/api/v1/contracts/{id}` | Cập nhật hợp đồng |
| DELETE | `/api/v1/contracts/{id}` | Xóa hợp đồng |

## 🔑 Key Schemas

### ContractListItem (cho UI table)
```typescript
{
  contract_number: "HD01",           // Mã hợp đồng
  room_number: 111,                  // Phòng
  tenant_name: "Phan Mạnh Quỳnh",   // Khách hàng
  building_name: "Chung cư Hoàng Anh Gia Lai",
  start_date: "2025-02-15",          // Từ
  end_date: "2025-12-14",            // Đến
  rental_price: 2000000.00,          // Giá thuê
  status: "ACTIVE"                   // Trạng thái
}
```

### ContractCreate
```typescript
{
  room_id: UUID,                     // Required
  tenant_id: UUID,                   // Required
  start_date: date,                  // Required
  end_date: date,                    // Required
  rental_price: Decimal,             // Required (> 0)
  deposit_amount: Decimal,           // Required (>= 0)
  payment_day: 15,                   // Optional (1-31)
  number_of_tenants: 1,              // Optional (>= 1)
  contract_number: "HD01",           // Optional (tự sinh nếu không có)
  payment_cycle_months: 3,           // Optional (1-12)
  electricity_price: 3500.00,        // Optional
  water_price: 15000.00,             // Optional
  service_fees: ["Phí rác", "..."], // Optional
  terms_and_conditions: "...",       // Optional
  notes: "..."                       // Optional
}
```

## ⚖️ Business Rules

### Tạo hợp đồng
- Phòng phải `AVAILABLE` và không có hợp đồng `ACTIVE`
- `end_date` > `start_date`
- Sau khi tạo → phòng chuyển sang `OCCUPIED`
- Mã tự sinh: HD001, HD002, HD003...

### Cập nhật hợp đồng
- Chuyển sang `TERMINATED`/`EXPIRED` → phòng về `AVAILABLE`
- Chuyển sang `ACTIVE` → phòng sang `OCCUPIED`

### Xóa hợp đồng
- Không xóa được nếu có invoice (TODO)
- Nếu `ACTIVE` → phòng về `AVAILABLE`

## 📊 Statistics Response
```json
{
  "total_contracts": 582,      // Tổng hợp đồng
  "active_contracts": 188,     // Đang hoạt động
  "expiring_soon": 199,        // Sắp hết hạn (< 30 ngày)
  "expired_contracts": 10      // Đã hết hạn
}
```

## 🎨 UI Mapping

### Dashboard Cards
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Tổng hợp đồng  │  │ Đang hoạt động │  │ Sắp hết hạn    │  │ Đã hết hạn     │
│      582       │  │      188       │  │      199       │  │       10       │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Table Columns
| Mã hợp đồng | Phòng | Tên khách hàng | Tòa nhà | Thời hạn | Giá thuê | Trạng thái | Thao tác |
|-------------|-------|----------------|---------|----------|----------|------------|----------|
| HD01 | 111 | Phan Mạnh Quỳnh | Chung cư Hoàng Anh Gia Lai | Từ: 15/02/2025<br>Đến: 14/12/2025 | 2.000.000đ | 🔴 Đã hết hạn | ✏️ 🗑️ |
| HD02 | 118 | Lâm Minh Phú | VinHome quận 7 | Từ: 15/02/2025<br>Đến: 14/12/2025 | 2.000.000đ | 🟢 Đang hoạt động | ✏️ 🗑️ |

### Form "Thêm hợp đồng"
```
┌─────────────────────────────────────────┐
│ Nhập thông tin                          │
├─────────────────────────────────────────┤
│ Tên khách hàng:   [Nguyễn Văn A      ▼] │
│ Mã hợp đồng:      [HD01              ] │ ← Tự sinh nếu không nhập
│ Phòng:            [111               ▼] │
│ Tòa nhà:          [Chung cư...       ] │ ← Tự động từ phòng
├─────────────────────────────────────────┤
│ Ngày bắt đầu:     [dd/MM/yyyy       📅] │
│ Ngày kết thúc:    [dd/MM/yyyy       📅] │
├─────────────────────────────────────────┤
│ Giá thuê (VNĐ/Tháng): [0            ] │
│ Tiền cọc (VNĐ):       [0            ] │
├─────────────────────────────────────────┤
│ Chu kỳ thanh toán:                      │
│  ○ 3 Tháng  ○ 6 Tháng  ○ 1 Năm        │
├─────────────────────────────────────────┤
│ Giá điện (VNĐ/kWh):  [0             ] │
│ Giá nước (VNĐ/m³):   [0             ] │
├─────────────────────────────────────────┤
│ Ngày thanh toán:     [15            ] │
├─────────────────────────────────────────┤
│ Điều khoản:                             │
│ [                                     ] │
│ [                                     ] │
├─────────────────────────────────────────┤
│ Phí dịch vụ:                            │
│ • Phí rác            [      ]  [×]     │
│ • Phí giữ xe         [      ]  [×]     │
│ [+ Tên dịch vụ                  ] [+]  │
├─────────────────────────────────────────┤
│           [Hủy]         [Thêm]          │
└─────────────────────────────────────────┘
```

## 🔍 Query Parameters

### List Contracts
```bash
# Pagination
?page=1&size=20

# Filter by status
?status=ACTIVE
?status=EXPIRED
?status=TERMINATED
?status=PENDING

# Filter by building
?building=VinHome

# Search (mã hợp đồng / tên khách / số điện thoại)
?search=HD01
?search=Phan Mạnh Quỳnh
?search=0912345678

# Combined
?page=1&size=20&status=ACTIVE&building=VinHome&search=HD
```

## 🚀 Quick Start

### 1. Run Server
```bash
python main.py
# hoặc
uvicorn main:app --reload
```

### 2. Test API
```bash
# Swagger UI
http://localhost:8000/docs

# Test script
chmod +x test_contract_api_examples.sh
./test_contract_api_examples.sh
```

### 3. Example Requests
```bash
# Get statistics
curl http://localhost:8000/api/v1/contracts/stats

# List contracts
curl http://localhost:8000/api/v1/contracts?page=1&size=10

# Filter active contracts
curl http://localhost:8000/api/v1/contracts?status=ACTIVE

# Search
curl http://localhost:8000/api/v1/contracts?search=HD01
```

## 📁 Architecture

```
app/
├── schemas/contract_schema.py          # Pydantic models
├── repositories/contract_repository.py  # Data access layer
├── services/ContractService.py          # Business logic
└── api/v1/routes/Contract.py           # HTTP endpoints
```

### Clean Architecture Pattern
```
Router (HTTP)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
ORM Models (Database)
```

## ✅ Implementation Checklist

- [x] ContractCreate schema với validation đầy đủ
- [x] ContractUpdate schema hỗ trợ partial update
- [x] ContractOut schema cho detail response
- [x] ContractListItem schema cho table display
- [x] ContractRepository với JOIN queries phức tạp
- [x] ContractService với business rules đầy đủ
- [x] Contract Router với 6 endpoints chính
- [x] Auto contract number generation (HD001, HD002...)
- [x] Auto room status update khi tạo/kết thúc hợp đồng
- [x] Statistics endpoint cho dashboard
- [x] Pagination + filters (status, building, search)
- [x] Comprehensive documentation
- [x] Test script examples

## 📝 TODO

- [ ] JWT authentication (hiện tại `created_by` = None)
- [ ] Validate không cho xóa hợp đồng có invoice
- [ ] File upload cho contract documents
- [ ] Contract renewal workflow
- [ ] Contract termination request workflow
- [ ] Email notification khi hợp đồng sắp hết hạn

## 📚 Related

- [Full Documentation](./README_CONTRACT_API.md)
- [Room API](./README_ROOM_API.md)
- [Building API](./README_ADDRESS_BUILDING_API.md)
