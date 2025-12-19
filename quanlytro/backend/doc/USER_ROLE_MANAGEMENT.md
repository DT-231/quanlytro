# 👥 User Registration & Role Management

## 📋 Roles trong Hệ Thống

1. **CUSTOMER** - Khách hàng tiềm năng (chưa thuê)
2. **TENANT** - Người thuê (đã ký hợp đồng)
3. **ADMIN** - Quản trị/Chủ nhà

---

## 🎯 Flow Đăng Ký & Nâng Cấp Role

### 1. Public Registration (CUSTOMER)
```
User → Register (Public API) → Role = CUSTOMER
```

**API:** `POST /api/v1/auth/register`

**Body:**
```json
{
  "first_name": "Nguyen Van",
  "last_name": "A",
  "email": "customer@example.com",
  "password": "password123",
  "confirm_password": "password123"
}
```

**Response:**
- Role tự động: `CUSTOMER`
- Nhận access_token & refresh_token

---

### 2. Landlord Create TENANT
```
Landlord → Create Tenant → Check Email:
  - Email mới → Tạo user với role = TENANT
  - Email đã tồn tại (CUSTOMER) → Upgrade lên TENANT
  - Email đã tồn tại (TENANT/ADMIN) → Báo lỗi
```

**API:** `POST /api/v1/auth/create-tenant`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Body:**
```json
{
  "first_name": "Tran Thi",
  "last_name": "B",
  "email": "tenant@example.com",
  "phone": "0912345678",
  "gender": "Nam",
  "password": "password123",
  "role_id": "00000000-0000-0000-0000-000000000000"
}
```

**Fields:**
- `first_name`: Tên (required)
- `last_name`: Họ (required)
- `email`: Email (required)
- `phone`: Số điện thoại (optional)
- `gender`: Giới tính - "Nam" hoặc "Nữ" (default: "Nam")
- `password`: Mật khẩu (required, 8-16 ký tự)
- `role_id`: Optional, hệ thống tự động set TENANT role

**Permissions:**
- ✅ Chỉ ADMIN (landlord) được gọi API này
- ❌ CUSTOMER/TENANT không có quyền

**Cases:**

#### Case 1: Email chưa tồn tại
```json
{
  "code": 201,
  "message": "Đã tạo tài khoản TENANT mới",
  "data": {
    "user": {...}
  }
}
```

#### Case 2: Email đã có (CUSTOMER)
```json
{
  "code": 201,
  "message": "Đã nâng cấp tài khoản từ CUSTOMER lên TENANT",
  "data": {
    "user": {...}
  }
}
```

#### Case 3: Email đã có (TENANT/ADMIN)
```json
{
  "code": 400,
  "message": "Email đã tồn tại với role khác (không phải CUSTOMER)"
}
```

---

### 3. Auto Upgrade on Contract Creation
```
CUSTOMER + Tạo Contract → Role tự động = TENANT
```

**Khi tạo contract thành công:**

**API:** `POST /api/v1/contracts`

**Logic trong `ContractService.create_contract()`:**
```python
# Sau khi tạo contract thành công
auth_service.upgrade_customer_to_tenant(tenant_id)
# → CUSTOMER auto upgrade to TENANT
```

**Flow:**
1. Landlord tạo contract với tenant_id
2. Contract được tạo thành công
3. Hệ thống check: Nếu tenant là CUSTOMER → Upgrade lên TENANT
4. Room status: AVAILABLE → OCCUPIED

---

## 📝 Business Rules

### Registration Rules:
1. ✅ Ai cũng có thể register → Role = CUSTOMER
2. ✅ Email phải unique
3. ✅ Password min 8 ký tự
4. ✅ Confirm password phải match

### Create Tenant Rules:
1. ✅ Chỉ ADMIN được tạo
2. ✅ Nếu email là CUSTOMER → Upgrade lên TENANT
3. ✅ Nếu email mới → Tạo TENANT mới
4. ❌ Nếu email đã là TENANT/ADMIN → Báo lỗi

### Auto Upgrade Rules:
1. ✅ Khi tạo contract, check tenant role
2. ✅ Nếu CUSTOMER → Upgrade TENANT
3. ✅ Nếu đã là TENANT → Không làm gì
4. ✅ Log thông báo upgrade

---

## 🔧 Implementation Details

### Files Modified:

#### 1. `app/services/AuthService.py`
- ✅ `register_user()` - Set role_id = CUSTOMER
- ✅ `create_tenant_by_landlord()` - Create/upgrade tenant
- ✅ `upgrade_customer_to_tenant()` - Upgrade logic

#### 2. `app/api/v1/routes/Auth.py`
- ✅ `POST /auth/register` - Public registration
- ✅ `POST /auth/create-tenant` - Landlord create tenant

#### 3. `app/services/ContractService.py`
- ✅ `create_contract()` - Auto upgrade customer to tenant

---

## 🧪 Testing

### Test Script:
```bash
./test_user_roles.sh
```

### Manual Tests:

#### Test 1: Register CUSTOMER
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "password": "password123",
    "confirm_password": "password123"
  }'
```

**Expected:** Role = CUSTOMER

#### Test 2: Landlord Create TENANT (New)
```bash
curl -X POST "http://localhost:8000/api/v1/auth/create-tenant" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "New",
    "last_name": "Tenant",
    "email": "newtenant@example.com",
    "phone": "0912345678",
    "gender": "Nam",
    "password": "password123",
    "role_id": "00000000-0000-0000-0000-000000000000"
  }'
```

**Expected:** Created new TENANT

#### Test 3: Landlord Create TENANT (Upgrade)
```bash
curl -X POST "http://localhost:8000/api/v1/auth/create-tenant" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "phone": "0923456789",
    "gender": "Nữ",
    "password": "password123",
    "role_id": "00000000-0000-0000-0000-000000000000"
  }'
```

**Expected:** Upgraded CUSTOMER → TENANT

#### Test 4: Create Contract (Auto Upgrade)
```bash
curl -X POST "http://localhost:8000/api/v1/contracts" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "{room_uuid}",
    "tenant_id": "{customer_uuid}",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "deposit_amount": 5000000,
    "monthly_rent": 3000000
  }'
```

**Expected:** 
- Contract created ✅
- Room: AVAILABLE → OCCUPIED ✅
- Tenant: CUSTOMER → TENANT ✅

---

## 🎨 Frontend Integration

### Registration Page:
```jsx
// Public registration form
<form onSubmit={registerCustomer}>
  <input name="email" />
  <input name="password" type="password" />
  <button>Đăng Ký</button>
</form>
```

### Landlord Dashboard - Create Tenant:
```jsx
// Only show for ADMIN
{user.role === 'ADMIN' && (
  <button onClick={() => openCreateTenantModal()}>
    Tạo Tài Khoản Người Thuê
  </button>
)}
```

### Contract Form:
```jsx
// Auto upgrade handled by backend
<form onSubmit={createContract}>
  <select name="tenant_id">
    {/* List all users with role CUSTOMER or TENANT */}
  </select>
  <button>Tạo Hợp Đồng</button>
</form>
```

---

## 💡 Tips

1. **Role Check:**
   ```python
   from app.core.Enum.userEnum import UserRole
   
   if user.role.role_code == UserRole.CUSTOMER.value:
       # User is customer
   ```

2. **Permission Check:**
   ```python
   if current_user.role.role_code != UserRole.ADMIN.value:
       raise HTTPException(403, "Only admin can do this")
   ```

3. **Upgrade Log:**
   - Check server logs khi tạo contract
   - Sẽ thấy: "✅ Upgraded user {id} to TENANT"

---

## 🐛 Common Issues

### Issue 1: "Role CUSTOMER không tồn tại"
**Cause:** Database chưa có roles
**Fix:**
```bash
cd backend
python3 scripts/seed_roles.py
```

### Issue 2: "403 Forbidden" khi create-tenant
**Cause:** User không phải ADMIN
**Fix:** Đảm bảo user login có role = ADMIN

### Issue 3: Không auto upgrade khi tạo contract
**Cause:** Logic không chạy hoặc user đã là TENANT
**Fix:** Check logs, verify user role trước khi tạo contract

---

## 📚 Related APIs

- `POST /auth/register` - Public registration (CUSTOMER)
- `POST /auth/login` - Login
- `POST /auth/create-tenant` - Landlord create tenant
- `POST /contracts` - Create contract (auto upgrade)
- `GET /users/me` - Get current user info

---

**Status:** ✅ Implemented & Ready for Testing
