# 🔐 Hướng Dẫn Seed Roles và Tạo Admin

## 📋 Tổng Quan

Thư mục này chứa các script tiện ích để khởi tạo dữ liệu ban đầu cho hệ thống:

- **seed_roles.py**: Seed các roles mặc định (ADMIN, TENANT, CUSTOMER)
- **seed_roles_and_admin.py**: Seed roles + tạo tài khoản admin (khuyến nghị)
- **create_admin.py**: Tạo nhanh tài khoản admin

## 🚀 Cách Sử Dụng

### 1. Seed Roles + Tạo Admin (Khuyến nghị)

Script này sẽ thực hiện đầy đủ:
1. Tạo các roles: ADMIN, TENANT, CUSTOMER
2. Tạo tài khoản admin đầu tiên

```bash
# Sử dụng thông tin mặc định
python scripts/seed_roles_and_admin.py

# Hoặc tùy chỉnh thông tin admin
python scripts/seed_roles_and_admin.py --email boss@company.com --password SecurePass123
```

**Thông tin mặc định:**
- Email: `admin@rental.com`
- Password: `Admin@123456`

### 2. Chỉ Seed Roles

Nếu bạn chỉ muốn tạo roles mà không tạo admin:

```bash
python scripts/seed_roles.py
```

### 3. Tạo Admin Nhanh

Nếu roles đã tồn tại, sử dụng script này để tạo admin nhanh:

```bash
# Mặc định
python scripts/create_admin.py

# Tùy chỉnh đầy đủ
python scripts/create_admin.py \
  --email myemail@example.com \
  --password MySecurePass123 \
  --firstname John \
  --lastname Doe \
  --phone 0987654321
```

## 🐳 Chạy trong Docker

### Với Docker Compose

```bash
# Seed roles và admin
docker exec -it rental_api python scripts/seed_roles_and_admin.py

# Với custom email/password
docker exec -it rental_api python scripts/seed_roles_and_admin.py \
  --email boss@company.com --password MyPass123

# Chỉ seed roles
docker exec -it rental_api python scripts/seed_roles.py

# Tạo admin nhanh
docker exec -it rental_api python scripts/create_admin.py
```

### Interactive Mode (Cho phép nhập thông tin)

```bash
# Truy cập vào container
docker exec -it rental_api bash

# Chạy script
python scripts/seed_roles_and_admin.py --email your@email.com --password YourPass

# Hoặc với create_admin
python scripts/create_admin.py
```

## 📊 Roles Được Tạo

| Role Code | Role Name      | Description                                      |
|-----------|----------------|--------------------------------------------------|
| ADMIN     | Administrator  | Quản trị viên/Chủ trọ - Toàn quyền hệ thống    |
| TENANT    | Tenant         | Người thuê phòng - Đã ký hợp đồng thuê         |
| CUSTOMER  | Customer       | Khách hàng tiềm năng - Có tài khoản chưa thuê  |

## 🔑 Thông Tin Admin Mặc Định

Sau khi chạy `seed_roles_and_admin.py`, bạn có thể đăng nhập với:

```json
{
  "email": "admin@rental.com",
  "password": "Admin@123456"
}
```

**API Endpoint:**
```bash
POST http://localhost:8000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@rental.com",
  "password": "Admin@123456"
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rental.com",
    "password": "Admin@123456"
  }'
```

## ⚠️ Lưu Ý Quan Trọng

### Bảo Mật

1. **Đổi password ngay sau khi đăng nhập lần đầu**
2. **Không sử dụng thông tin mặc định trong production**
3. **Sử dụng password mạnh** (ít nhất 8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt)

### Script Idempotent

- Các script được thiết kế để chạy nhiều lần mà không gây lỗi
- Nếu roles đã tồn tại, sẽ bỏ qua
- Nếu email đã tồn tại, sẽ thông báo và không tạo mới

### Khi Nào Cần Chạy?

- **Lần đầu khởi tạo database**: Chạy `seed_roles_and_admin.py`
- **Sau khi reset database**: Chạy lại `seed_roles_and_admin.py`
- **Cần tạo thêm admin**: Sử dụng `create_admin.py`

## 🔍 Kiểm Tra Kết Quả

### Kiểm tra trong Database

```bash
# Truy cập PostgreSQL
docker exec -it rental_db psql -U postgres -d rental_management

# Kiểm tra roles
SELECT * FROM roles;

# Kiểm tra admin user
SELECT id, first_name, last_name, email, role_id FROM users;
```

### Kiểm tra qua API

```bash
# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@rental.com", "password": "Admin@123456"}'
```

## 🐛 Troubleshooting

### "ADMIN role không tồn tại"

```bash
# Chạy seed roles trước
python scripts/seed_roles.py
# Sau đó tạo admin
python scripts/create_admin.py
```

### "Email đã tồn tại"

Script sẽ thông báo và hỏi bạn có muốn nâng cấp user hiện tại lên ADMIN không.

### Database connection error

```bash
# Kiểm tra database đang chạy
docker ps | grep rental_db

# Restart database nếu cần
docker-compose restart db

# Kiểm tra connection string trong .env
cat .env | grep DATABASE_URL
```

## 📝 Flow Khởi Tạo Hoàn Chỉnh

```bash
# 1. Khởi động services
docker-compose up -d

# 2. Chờ database sẵn sàng
docker-compose logs -f db

# 3. Chạy migrations
docker exec -it rental_api alembic upgrade head

# 4. Seed roles và tạo admin
docker exec -it rental_api python scripts/seed_roles_and_admin.py

# 5. Verify
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@rental.com", "password": "Admin@123456"}'
```

## 📚 Tham Khảo

- [User Roles Documentation](../doc/USER_ROLE_MANAGEMENT.md)
- [Authentication API](../doc/README_CONTRACT_API.md)
- [Database Schema](../migrations/README)

---

**💡 Tip**: Sau khi tạo admin thành công, hãy lưu access_token để sử dụng cho các API calls tiếp theo!
