# 🚀 Hướng Dẫn Setup Backend - Rental Management System

## 📋 Yêu Cầu Hệ Thống

- **Python**: 3.11 trở lên
- **PostgreSQL**: 14 trở lên (chạy trên port 5433)
- **Git**: Để clone repository

---

## 🎯 Setup Nhanh (Recommended)

### Cho macOS/Linux:

```bash
# 1. Clone repository
git clone <repository-url>
cd backend

# 2. Chạy script setup tự động
chmod +x setup.sh
./setup.sh
```

### Cho Windows:

**Option 1 - PowerShell (Recommended):**
```powershell
# 1. Clone repository
git clone <repository-url>
cd backend

# 2. Chạy script PowerShell
.\setup.ps1

# Nếu gặp lỗi ExecutionPolicy, chạy trước:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Option 2 - Command Prompt (CMD):**
```cmd
REM 1. Clone repository
git clone <repository-url>
cd backend

REM 2. Chạy script batch
setup.bat
```

### Cho tất cả OS (Python):

```bash
# Sau khi clone repository
python setup_after_pull.py
# hoặc
python3 setup_after_pull.py
```

---

## 📝 Setup Thủ Công (Chi Tiết)

### Bước 1: Tạo Môi Trường Ảo

**macOS/Linux:**
```bash
python3 -m venv env
source env/bin/activate
```

**Windows:**
```cmd
python -m venv env
env\Scripts\activate
```

### Bước 2: Cài Đặt Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Bước 3: Cấu Hình Database

1. **Tạo database PostgreSQL:**
```sql
CREATE DATABASE rental_management;
```

2. **Tạo file `.env`:**
```bash
cp .env.example .env
```

3. **Cập nhật thông tin trong `.env`:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/rental_management
SECRET_KEY=your-super-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Bước 4: Chạy Migrations

```bash
alembic upgrade head
```

### Bước 5: Seed Dữ Liệu Ban Đầu

```bash
# Tạo roles và admin user
python scripts/seed_roles_and_admin.py

# (Optional) Tạo dữ liệu test
python scripts/seed_test_data.py
```

### Bước 6: Khởi Động Server

```bash
uvicorn main:app --reload
```

Server sẽ chạy tại: **http://localhost:8000**

---

## 🔄 Sau Khi Pull Code Mới

Mỗi khi pull code mới từ Git, chạy một trong các lệnh sau:

**macOS/Linux:**
```bash
./setup.sh
```

**Windows PowerShell:**
```powershell
.\setup.ps1
```

**Windows CMD:**
```cmd
setup.bat
```

**Cross-platform (Python):**
```bash
python setup_after_pull.py
```

**Hoặc thủ công:**
```bash
# 1. Activate environment
source env/bin/activate  # macOS/Linux
.\env\Scripts\Activate.ps1  # Windows PowerShell
env\Scripts\activate     # Windows CMD

# 2. Update dependencies
pip install -r requirements.txt

# 3. Run migrations
alembic upgrade head

# 4. Restart server
uvicorn main:app --reload
```

---

## 🔑 Thông Tin Đăng Nhập Mặc Định

### Admin Account:
- **Email**: `admin@rental.com`
- **Password**: `Admin@123`
- **Role**: Chủ trọ (ADMIN)

### Test Users (sau khi seed_test_data.py):
- **Email**: `user1@test.com` đến `user20@test.com`
- **Password**: `password123`
- **Role**: Người thuê (TENANT)

---

## 📚 API Documentation

Sau khi server chạy, truy cập:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🛠️ Các Lệnh Thường Dùng

### Quản Lý Database Migration:

```bash
# Tạo migration mới (auto-generate)
alembic revision --autogenerate -m "description"

# Chạy tất cả migrations
alembic upgrade head

# Rollback 1 migration
alembic downgrade -1

# Xem lịch sử migrations
alembic history

# Xem migration hiện tại
alembic current
```

### Chạy Tests:

```bash
pytest tests/
pytest tests/test_room_api.py -v
```

### Format Code:

```bash
black app/
isort app/
ruff check app/
```

---

## 🐛 Xử Lý Lỗi Thường Gặp

### 1. Lỗi kết nối PostgreSQL:
```
sqlalchemy.exc.OperationalError: could not connect to server
```
**Giải pháp:**
- Kiểm tra PostgreSQL đang chạy: `brew services list` (macOS)
- Start PostgreSQL: `brew services start postgresql@14`
- Kiểm tra port 5433: `lsof -i :5433`
- Verify DATABASE_URL trong `.env`

### 2. Lỗi import module:
```
ModuleNotFoundError: No module named 'xxx'
```
**Giải pháp:**
```bash
pip install -r requirements.txt
```

### 3. Lỗi Alembic migration conflict:
```
alembic.util.exc.CommandError: Can't locate revision identified by 'xxx'
```
**Giải pháp:**
```bash
# Xóa versions cũ và tạo lại
rm migrations/versions/*.py
alembic revision --autogenerate -m "initial_migration"
alembic upgrade head
```

### 4. Lỗi "duplicate key value violates unique constraint":
**Giải pháp:**
- Drop và recreate database:
```sql
DROP DATABASE rental_management;
CREATE DATABASE rental_management;
```
- Chạy lại migrations: `alembic upgrade head`
- Seed lại data: `python scripts/seed_roles_and_admin.py`

---

## 📂 Cấu Trúc Thư Mục

```
backend/
├── app/
│   ├── api/v1/routes/      # API endpoints
│   ├── core/               # Config, security, exceptions
│   ├── models/             # SQLAlchemy ORM models
│   ├── repositories/       # Data access layer
│   ├── schemas/            # Pydantic schemas
│   ├── services/           # Business logic layer
│   └── utils/              # Utilities
├── migrations/             # Alembic migrations
├── scripts/                # Setup & seed scripts
├── tests/                  # Test files
├── .env                    # Environment variables (not in git)
├── .env.example            # Example env file
├── alembic.ini             # Alembic config
├── main.py                 # FastAPI entry point
├── requirements.txt        # Python dependencies
├── setup.sh                # Unix setup script
├── setup.bat               # Windows setup script
└── setup_after_pull.py     # Cross-platform setup script
```

---

## 🔗 Tài Liệu Liên Quan

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

---

## 💡 Tips

1. **Luôn activate môi trường ảo** trước khi làm việc:
   ```bash
   source env/bin/activate  # macOS/Linux
   env\Scripts\activate     # Windows
   ```

2. **Kiểm tra dependencies thường xuyên:**
   ```bash
   pip list --outdated
   ```

3. **Backup database trước khi migration:**
   ```bash
   pg_dump -U postgres -h localhost -p 5433 rental_management > backup.sql
   ```

4. **Sử dụng .gitignore** để không commit:
   - `.env` (chứa secrets)
   - `env/` (môi trường ảo)
   - `__pycache__/` (Python cache)

---

## 👥 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra phần **Xử Lý Lỗi Thường Gặp** ở trên
2. Xem logs trong terminal
3. Tạo issue trong repository
4. Liên hệ team lead

---

**Happy Coding! 🎉**
