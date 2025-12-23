# 🚀 Hướng Dẫn Setup Dự Án - Team Development Guide

> **Mục đích**: Hướng dẫn setup môi trường phát triển cho team members khi clone repo lần đầu hoặc pull code mới nhất về để tiếp tục phát triển/test chức năng.

---

## 📋 Mục Lục

- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Setup Lần Đầu (Clone Repo)](#-setup-lần-đầu-clone-repo)
- [Setup Sau Khi Pull Code Mới](#-setup-sau-khi-pull-code-mới)
- [Chạy Development Environment](#-chạy-development-environment)
- [Troubleshooting](#-troubleshooting)
- [Hữu Ích Commands](#-hữu-ích-commands)

---

## 🛠️ Yêu Cầu Hệ Thống

Đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

### Bắt Buộc:
- **Git**: [Download](https://git-scm.com/downloads)
- **Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop/)
  - Docker version 20.10+
  - Docker Compose version 2.0+

### Tùy Chọn (Cho Local Development):
- **Python 3.11+**: [Download](https://www.python.org/downloads/)
- **Node.js 18+**: [Download](https://nodejs.org/)
- **PostgreSQL 15**: [Download](https://www.postgresql.org/download/) (nếu không dùng Docker)

### Kiểm Tra Cài Đặt:

```bash
# Kiểm tra Git
git --version

# Kiểm tra Docker
docker --version
docker-compose --version

# Kiểm tra Python (optional)
python3 --version

# Kiểm tra Node.js (optional)
node --version
npm --version
```

---

## 🎯 Setup Lần Đầu (Clone Repo)

### Bước 1: Clone Repository

```bash
# Clone repo về máy
git clone https://github.com/DT-231/QuanLyTro.git

# Di chuyển vào thư mục dự án
cd QuanLyTro
```

### Bước 2: Tạo File Cấu Hình

#### 2.1 Tạo File `.env` Ở Thư Mục Gốc

```bash
# Tạo file .env
cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=rental_management

# Backend Configuration
SECRET_KEY=dev-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE=30
REFRESH_TOKEN_EXPIRE_DAY=7
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
ENVIRONMENT=development
EOF
```

**Hoặc copy từ template:**

```bash
# Nếu có file .env.example
cp .env.example .env
```

#### 2.2 Tạo File `.env` Cho Backend (Optional - nếu chạy local)

```bash
cd backend
cp .env.example .env
cd ..
```

### Bước 3: Build và Khởi Động Services

```bash
# Build và start tất cả containers
docker-compose up -d --build

# Xem logs để theo dõi
docker-compose logs -f
```

**Chờ cho đến khi thấy:**
- ✅ `rental_db` - Database healthy
- ✅ `rental_api` - Backend API started
- ✅ `rental_web` - Frontend started

Nhấn `Ctrl+C` để thoát logs.

### Bước 4: Chạy Database Migrations

```bash
# Chạy migrations để tạo database schema
docker exec -it rental_api alembic upgrade head
```

### Bước 5: Seed Database (Tạo Roles và Admin)

```bash
# Tạo roles và tài khoản admin mặc định
docker exec -it rental_api python scripts/seed_roles_and_admin.py
```

**Thông tin đăng nhập mặc định:**
- Email: `admin@rental.com`
- Password: `Admin@123456`

⚠️ **Lưu ý**: Đổi password sau khi đăng nhập lần đầu!

### Bước 6: Verify Setup

```bash
# Test API health
curl http://localhost:8000/health

# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rental.com",
    "password": "Admin@123456"
  }'
```

### Bước 7: Truy Cập Ứng Dụng

Mở trình duyệt và truy cập:

- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Documentation (Swagger)**: http://localhost:8000/docs
- 📖 **API Documentation (ReDoc)**: http://localhost:8000/redoc

---

## 🔄 Setup Sau Khi Pull Code Mới

Khi team member khác push code mới lên repo, bạn cần pull về và update môi trường của mình.

### Option 1: Sử Dụng Docker (Khuyến Nghị)

```bash
# 1. Pull code mới nhất
git pull origin main

# 2. Stop containers hiện tại
docker-compose down

# 3. Rebuild images (nếu có thay đổi Dockerfile hoặc dependencies)
docker-compose up -d --build

# 4. Chạy migrations mới (nếu có)
docker exec -it rental_api alembic upgrade head

# 5. Restart containers
docker-compose restart
```

### Option 2: Setup Backend Local (Python)

```bash
# 1. Pull code mới nhất
git pull origin main

# 2. Di chuyển vào thư mục backend
cd backend

# 3. Chạy script tự động setup
python setup_after_pull.py
```

**Script `setup_after_pull.py` sẽ tự động:**
- Tạo virtual environment (nếu chưa có)
- Cài đặt/update dependencies
- Tạo file .env (nếu chưa có)
- Chạy migrations

### Option 3: Manual Setup Backend

```bash
cd backend

# Tạo virtual environment (nếu chưa có)
python3 -m venv env

# Activate virtual environment
# Trên macOS/Linux:
source env/bin/activate
# Trên Windows:
# env\Scripts\activate

# Cài đặt/update dependencies
pip install -r requirements.txt

# Chạy migrations
alembic upgrade head

# Chạy server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Setup Frontend Local (React)

```bash
cd front-end

# Cài đặt/update dependencies
npm install
# hoặc
yarn install

# Chạy development server
npm run dev
# hoặc
yarn dev
```

---

## 💻 Chạy Development Environment

### Chạy Với Docker (Khuyến Nghị)

```bash
# Start tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f db

# Stop tất cả services
docker-compose down

# Stop và xóa volumes (reset database)
docker-compose down -v
```

### Chạy Backend Local

```bash
cd backend

# Activate virtual environment
source env/bin/activate  # macOS/Linux
# env\Scripts\activate    # Windows

# Chạy với uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Hoặc chạy với hot reload và auto-restart
python main.py
```

**Backend sẽ chạy tại:** http://localhost:8000

### Chạy Frontend Local

```bash
cd front-end

# Chạy development server
npm run dev

# Frontend sẽ chạy tại: http://localhost:5173 (Vite default)
```

### Chạy Database Migration

```bash
# Tạo migration mới
cd backend
alembic revision --autogenerate -m "Description of changes"

# Xem các migrations
alembic history

# Upgrade lên version mới nhất
alembic upgrade head

# Downgrade về version trước
alembic downgrade -1

# Xem current version
alembic current
```

---

## 🧪 Testing

### Test Backend

```bash
cd backend

# Chạy tất cả tests
pytest

# Chạy với coverage
pytest --cov=app tests/

# Chạy test cụ thể
pytest tests/test_room_api.py

# Chạy test với verbose
pytest -v
```

### Test API Endpoints

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@rental.com", "password": "Admin@123456"}'

# Hoặc sử dụng Swagger UI
# Truy cập: http://localhost:8000/docs
```

---

## 🐛 Troubleshooting

### 1. Port Đã Được Sử Dụng

**Lỗi:** `Error: port is already allocated`

**Giải pháp:**

```bash
# Kiểm tra port đang được sử dụng
# Port 5433 (Database)
lsof -i :5433
netstat -ano | findstr :5433  # Windows

# Port 8000 (Backend)
lsof -i :8000

# Port 3000 (Frontend)
lsof -i :3000

# Kill process
kill -9 <PID>

# Hoặc thay đổi port trong docker-compose.yml
```

### 2. Database Connection Error

**Lỗi:** `could not connect to server: Connection refused`

**Giải pháp:**

```bash
# Kiểm tra database container
docker ps | grep rental_db

# Kiểm tra logs
docker logs rental_db

# Restart database
docker-compose restart db

# Kiểm tra health
docker exec -it rental_db pg_isready -U postgres
```

### 3. Migration Error

**Lỗi:** `Can't locate revision identified by 'xxxxx'`

**Giải pháp:**

```bash
cd backend

# Xem current revision
docker exec -it rental_api alembic current

# Xem history
docker exec -it rental_api alembic history

# Reset về đầu
docker exec -it rental_api alembic downgrade base

# Upgrade lên head
docker exec -it rental_api alembic upgrade head

# Nếu vẫn lỗi, xóa database và tạo lại
docker-compose down -v
docker-compose up -d
docker exec -it rental_api alembic upgrade head
```

### 4. Permission Denied (Docker)

**Lỗi:** `Permission denied while trying to connect to the Docker daemon socket`

**Giải pháp:**

```bash
# Thêm user vào docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Restart Docker Desktop (Windows/Mac)
```

### 5. Dependencies Installation Failed

**Lỗi:** `pip install` hoặc `npm install` failed

**Giải pháp:**

```bash
# Backend
cd backend
rm -rf env
python3 -m venv env
source env/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Frontend
cd front-end
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 6. Frontend Can't Connect to Backend

**Lỗi:** `Network Error` hoặc `CORS Error`

**Giải pháp:**

```bash
# Kiểm tra backend đang chạy
curl http://localhost:8000/health

# Kiểm tra CORS settings trong .env
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Restart backend
docker-compose restart api
```

### 7. Docker Build Failed

**Lỗi:** `Error during build`

**Giải pháp:**

```bash
# Xóa tất cả containers và images
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose up -d --build --force-recreate
```

---

## 📝 Hữu Ích Commands

### Docker Commands

```bash
# Xem tất cả containers
docker ps -a

# Xem images
docker images

# Stop tất cả containers
docker-compose down

# Stop và xóa volumes
docker-compose down -v

# Rebuild một service cụ thể
docker-compose up -d --build api

# Exec vào container
docker exec -it rental_api bash
docker exec -it rental_db psql -U postgres -d rental_management

# Xem logs
docker-compose logs -f --tail=100

# Restart service
docker-compose restart api
```

### Database Commands

```bash
# Connect vào PostgreSQL
docker exec -it rental_db psql -U postgres -d rental_management

# Trong PostgreSQL shell:
\dt                    # List tables
\d+ table_name         # Describe table
\l                     # List databases
\q                     # Quit

# Backup database
docker exec -t rental_db pg_dump -U postgres rental_management > backup.sql

# Restore database
docker exec -i rental_db psql -U postgres rental_management < backup.sql
```

### Git Commands

```bash
# Pull latest code
git pull origin main

# Check current branch
git branch

# Switch branch
git checkout <branch-name>

# Create new branch
git checkout -b feature/your-feature-name

# Stash changes
git stash
git stash pop

# View changes
git status
git diff
```

### Alembic Commands

```bash
# Create new migration
alembic revision --autogenerate -m "add new column"

# Upgrade to latest
alembic upgrade head

# Downgrade one step
alembic downgrade -1

# View migration history
alembic history

# View current version
alembic current

# Upgrade to specific version
alembic upgrade <revision_id>
```

---

## 🔐 Security Notes

### Environment Variables

⚠️ **QUAN TRỌNG**: 

- **KHÔNG BAO GIỜ** commit file `.env` lên Git
- Mỗi môi trường (dev, staging, prod) phải có `.env` riêng
- Đổi `SECRET_KEY` trong production
- Sử dụng password mạnh cho database trong production

### Default Credentials

Các thông tin đăng nhập mặc định chỉ dùng cho development:

```
Admin Account:
- Email: admin@rental.com
- Password: Admin@123456

Database:
- User: postgres
- Password: postgres
- Database: rental_management
```

⚠️ **ĐỔI TẤT CẢ MẬT KHẨU TRƯỚC KHI DEPLOY LÊN PRODUCTION!**

---

## 📚 Tài Liệu Liên Quan

- [README.md](./README.md) - Tổng quan dự án
- [QUICKSTART.md](./QUICKSTART.md) - Khởi động nhanh
- [API Documentation](http://localhost:8000/docs) - Swagger UI
- [Backend Documentation](./backend/doc/) - Chi tiết API endpoints

---

## 🆘 Cần Trợ Giúp?

Nếu gặp vấn đề không được liệt kê ở trên:

1. Kiểm tra [Issues](https://github.com/DT-231/QuanLyTro/issues) trên GitHub
2. Tạo issue mới với description chi tiết
3. Liên hệ team lead hoặc senior developers

---

## ✅ Checklist Trước Khi Bắt Đầu Làm Việc

- [ ] Git đã được cài đặt
- [ ] Docker Desktop đã được cài đặt và đang chạy
- [ ] Clone repo thành công
- [ ] File `.env` đã được tạo
- [ ] `docker-compose up` chạy thành công
- [ ] Database migrations đã chạy
- [ ] Admin account đã được tạo
- [ ] Có thể đăng nhập vào http://localhost:3000
- [ ] API docs có thể truy cập tại http://localhost:8000/docs

---

**Happy Coding! 🎉**

*Last updated: December 23, 2025*
