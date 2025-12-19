@echo off
REM Script setup tự động cho Windows
REM Chạy: setup.bat

echo ==================================================
echo 🚀 SETUP BACKEND - RENTAL MANAGEMENT SYSTEM
echo ==================================================

REM Bước 1: Kiểm tra Python
echo.
echo 📋 Bước 1: Kiểm tra Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python chưa được cài đặt!
    echo Vui lòng cài Python 3.11+ từ: https://www.python.org/downloads/
    pause
    exit /b 1
)
python --version
echo ✅ Python đã cài đặt

REM Bước 2: Tạo môi trường ảo
echo.
echo 📦 Bước 2: Tạo môi trường ảo...
if not exist "env\" (
    python -m venv env
    echo ✅ Đã tạo môi trường ảo
) else (
    echo ✅ Môi trường ảo đã tồn tại
)

REM Bước 3: Kích hoạt và cài dependencies
echo.
echo 📥 Bước 3: Cài đặt dependencies...
call env\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
echo ✅ Đã cài đặt dependencies

REM Bước 4: Tạo file .env
echo.
echo 📝 Bước 4: Kiểm tra file .env...
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env
        echo ✅ Đã tạo file .env từ .env.example
        echo ⚠️  Vui lòng cập nhật thông tin trong .env:
        echo    - DATABASE_URL (PostgreSQL connection string^)
        echo    - SECRET_KEY (JWT secret^)
    ) else (
        echo ❌ Không tìm thấy .env.example
        echo Vui lòng tạo file .env thủ công
    )
) else (
    echo ✅ File .env đã tồn tại
)

REM Bước 5: Nhắc kiểm tra PostgreSQL
echo.
echo 🗄️  Bước 5: Kiểm tra PostgreSQL...
echo Đảm bảo PostgreSQL đang chạy:
echo   - Kiểm tra trong pgAdmin hoặc Services
echo   - Docker: docker-compose up -d postgres
echo.
set /p confirm="PostgreSQL đã chạy chưa? (y/n): "
if /i not "%confirm%"=="y" (
    echo ❌ Vui lòng khởi động PostgreSQL trước!
    pause
    exit /b 1
)

REM Bước 6: Chạy migrations
echo.
echo 🔄 Bước 6: Chạy database migrations...
if exist "alembic.ini" (
    alembic upgrade head
    echo ✅ Migrations hoàn tất
) else (
    echo ⚠️  Không tìm thấy alembic.ini
)

REM Bước 7: Seed data (optional)
echo.
echo 🌱 Bước 7: Seed dữ liệu ban đầu (optional^)
set /p seed="Bạn có muốn seed roles và admin user không? (y/n): "
if /i "%seed%"=="y" (
    if exist "scripts\seed_roles_and_admin.py" (
        python scripts\seed_roles_and_admin.py
        echo ✅ Đã seed roles và admin
    ) else (
        echo ⚠️  Không tìm thấy script seed
    )
)

REM Hoàn tất
echo.
echo ==================================================
echo ✅ SETUP HOÀN TẤT!
echo ==================================================
echo.
echo 📋 Các bước tiếp theo:
echo.
echo 1. Kiểm tra file .env và cập nhật thông tin
echo.
echo 2. Khởi động development server:
echo    env\Scripts\activate
echo    uvicorn main:app --reload
echo.
echo 3. Truy cập API docs:
echo    http://localhost:8000/docs
echo.
echo 4. Test API với admin account:
echo    Email: admin@rental.com
echo    Password: Admin@123
echo.
echo ==================================================
pause
