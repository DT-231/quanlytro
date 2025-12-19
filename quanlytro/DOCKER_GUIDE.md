# 🐳 Hướng Dẫn Sử Dụng Docker

## 📋 Yêu Cầu Hệ Thống

- Docker Desktop đã cài đặt (phiên bản 20.10 trở lên)
- Docker Compose đã cài đặt (phiên bản 1.29 trở lên)

## 🚀 Cách Chạy Dự Án

### 1. Clone và Cấu Hình

```bash
# Di chuyển vào thư mục dự án
cd /Users/hoangnguyen/workspace/Learning/DoAnChuyenNghanh

# Kiểm tra file .env đã được tạo
ls -la .env
```

### 2. Build và Chạy Containers

```bash
# Build tất cả các services
docker-compose build

# Khởi động tất cả services
docker-compose up

# Hoặc chạy ở chế độ background (detached)
docker-compose up -d
```

### 3. Kiểm Tra Services

Sau khi chạy thành công, các services sẽ có sẵn tại:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

### 4. Xem Logs

```bash
# Xem logs tất cả services
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f db
```

### 5. Dừng Services

```bash
# Dừng services (giữ lại volumes)
docker-compose down

# Dừng và xóa volumes (xóa database)
docker-compose down -v
```

## 🔧 Các Lệnh Hữu Ích

### Rebuild Một Service

```bash
# Rebuild backend
docker-compose build api

# Rebuild frontend
docker-compose build web

# Rebuild và restart
docker-compose up -d --build api
```

### Truy Cập Vào Container

```bash
# Truy cập backend container
docker exec -it rental_api bash

# Truy cập database container
docker exec -it rental_db psql -U postgres -d rental_management
```

### Chạy Migrations

```bash
# Chạy migrations trong container
docker exec -it rental_api alembic upgrade head

# Tạo migration mới
docker exec -it rental_api alembic revision --autogenerate -m "description"
```

### Reset Database

```bash
# Dừng services và xóa volumes
docker-compose down -v

# Khởi động lại
docker-compose up -d
```

## 🐛 Troubleshooting

### Port đã được sử dụng

Nếu port 5432, 8000, hoặc 3000 đã được sử dụng:

```bash
# Kiểm tra port đang sử dụng
lsof -i :5432
lsof -i :8000
lsof -i :3000

# Thay đổi port trong docker-compose.yml
# Ví dụ: "3001:80" thay vì "3000:80"
```

### Container không start

```bash
# Xem chi tiết lỗi
docker-compose logs api

# Rebuild từ đầu
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Database connection refused

```bash
# Kiểm tra database đã sẵn sàng chưa
docker exec -it rental_db pg_isready -U postgres

# Restart database
docker-compose restart db
```

## 📝 Cấu Trúc Dự Án

```
.
├── docker-compose.yml          # Cấu hình Docker Compose
├── .env                        # Biến môi trường
├── backend/
│   ├── Dockerfile             # Docker config cho backend
│   ├── .dockerignore          # Files bỏ qua khi build
│   ├── requirements.txt       # Python dependencies
│   └── ...
└── front-end/
    ├── Dockerfile             # Docker config cho frontend
    ├── .dockerignore          # Files bỏ qua khi build
    └── ...
```

## 🔐 Bảo Mật

⚠️ **Quan trọng**: Thay đổi các giá trị mặc định trong file `.env` trước khi deploy production:

- `SECRET_KEY`: Tạo key mới bằng `openssl rand -hex 32`
- `POSTGRES_PASSWORD`: Đổi mật khẩu mạnh
- CORS origins: Chỉ cho phép domain cụ thể

## 📚 Tài Liệu Tham Khảo

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
