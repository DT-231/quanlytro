# PowerShell Setup Script for Windows
# Chạy: .\setup.ps1
# Nếu gặp lỗi ExecutionPolicy: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

param(
    [switch]$SkipSeed
)

# Màu sắc
$ESC = [char]27
$Green = "$ESC[32m"
$Yellow = "$ESC[33m"
$Red = "$ESC[31m"
$Reset = "$ESC[0m"

function Write-Success {
    param([string]$Message)
    Write-Host "${Green}✅ $Message${Reset}"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "${Yellow}⚠️  $Message${Reset}"
}

function Write-Error {
    param([string]$Message)
    Write-Host "${Red}❌ $Message${Reset}"
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "${Yellow}$Message${Reset}"
}

# Header
Write-Host "=================================================="
Write-Host "🚀 SETUP BACKEND - RENTAL MANAGEMENT SYSTEM"
Write-Host "=================================================="
Write-Host ""

# Bước 1: Kiểm tra Python
Write-Header "📋 Bước 1: Kiểm tra Python..."
try {
    $pythonVersion = python --version 2>&1
    Write-Success "Python version: $pythonVersion"
} catch {
    Write-Error "Python chưa được cài đặt!"
    Write-Host "Vui lòng cài Python 3.11+ từ: https://www.python.org/downloads/"
    Write-Host "Hoặc dùng: winget install Python.Python.3.11"
    exit 1
}

# Bước 2: Tạo môi trường ảo
Write-Header "📦 Bước 2: Tạo môi trường ảo..."
if (Test-Path "env\Scripts\python.exe") {
    Write-Success "Môi trường ảo đã tồn tại"
} else {
    Write-Host "Đang tạo môi trường ảo..."
    python -m venv env
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Đã tạo môi trường ảo"
    } else {
        Write-Error "Không thể tạo môi trường ảo!"
        exit 1
    }
}

# Bước 3: Cài đặt dependencies
Write-Header "📥 Bước 3: Cài đặt dependencies..."
Write-Host "Đang kích hoạt môi trường ảo..."
& ".\env\Scripts\Activate.ps1"

Write-Host "Đang nâng cấp pip..."
python -m pip install --upgrade pip --quiet

Write-Host "Đang cài đặt dependencies từ requirements.txt..."
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Success "Đã cài đặt dependencies"
} else {
    Write-Error "Cài đặt dependencies thất bại!"
    exit 1
}

# Bước 4: Tạo file .env
Write-Header "📝 Bước 4: Kiểm tra file .env..."
if (Test-Path ".env") {
    Write-Success "File .env đã tồn tại"
} else {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Success "Đã tạo file .env từ .env.example"
        Write-Warning "Vui lòng cập nhật thông tin trong .env:"
        Write-Host "   - DATABASE_URL (PostgreSQL connection string)"
        Write-Host "   - SECRET_KEY (JWT secret)"
    } else {
        Write-Warning "Không tìm thấy .env.example"
        Write-Host "Vui lòng tạo file .env thủ công"
    }
}

# Bước 5: Kiểm tra PostgreSQL
Write-Header "🗄️  Bước 5: Kiểm tra PostgreSQL..."
Write-Host "Đảm bảo PostgreSQL đang chạy:"
Write-Host "   - Kiểm tra trong Services (services.msc)"
Write-Host "   - Hoặc: Get-Service -Name postgresql*"
Write-Host "   - Docker: docker-compose up -d postgres"
Write-Host ""

$confirm = Read-Host "PostgreSQL đã chạy chưa? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Error "Vui lòng khởi động PostgreSQL trước!"
    Write-Host "Windows Services: services.msc"
    Write-Host "Docker: docker-compose up -d postgres"
    exit 1
}

# Bước 6: Chạy migrations
Write-Header "🔄 Bước 6: Chạy database migrations..."
if (Test-Path "alembic.ini") {
    Write-Host "Đang chạy migrations..."
    alembic upgrade head
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Migrations hoàn tất"
    } else {
        Write-Error "Migration thất bại!"
        Write-Host "Vui lòng kiểm tra:"
        Write-Host "  - PostgreSQL có đang chạy không? (port 5433)"
        Write-Host "  - DATABASE_URL trong .env có đúng không?"
        Write-Host "  - Database 'rental_management' đã được tạo chưa?"
        exit 1
    }
} else {
    Write-Warning "Không tìm thấy alembic.ini"
}

# Bước 7: Seed data (optional)
if (-not $SkipSeed) {
    Write-Header "🌱 Bước 7: Seed dữ liệu ban đầu (optional)"
    $seed = Read-Host "Bạn có muốn seed roles và admin user không? (y/n)"
    if ($seed -eq 'y' -or $seed -eq 'Y') {
        if (Test-Path "scripts\seed_roles_and_admin.py") {
            Write-Host "Đang seed data..."
            python scripts\seed_roles_and_admin.py
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Đã seed roles và admin"
            } else {
                Write-Warning "Seed data thất bại hoặc data đã tồn tại"
            }
        } else {
            Write-Warning "Không tìm thấy script seed"
        }
    }
}

# Hoàn tất
Write-Host ""
Write-Host "=================================================="
Write-Success "SETUP HOÀN TẤT!"
Write-Host "=================================================="
Write-Host ""
Write-Host "📋 Các bước tiếp theo:"
Write-Host ""
Write-Host "1. Kiểm tra file .env:"
Write-Host "   notepad .env"
Write-Host ""
Write-Host "2. Khởi động development server:"
Write-Host "   .\env\Scripts\Activate.ps1"
Write-Host "   uvicorn main:app --reload"
Write-Host ""
Write-Host "   Hoặc chạy trực tiếp:"
Write-Host "   .\env\Scripts\uvicorn.exe main:app --reload"
Write-Host ""
Write-Host "3. Truy cập API docs:"
Write-Host "   http://localhost:8000/docs"
Write-Host ""
Write-Host "4. Test API với admin account:"
Write-Host "   Email: admin@rental.com"
Write-Host "   Password: Admin@123"
Write-Host ""
Write-Host "=================================================="
Write-Host ""
Write-Host "${Green}Happy Coding! 🎉${Reset}"
