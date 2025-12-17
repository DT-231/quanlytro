#!/bin/bash
# Script setup tự động cho Unix/Linux/macOS
# Chạy: chmod +x setup.sh && ./setup.sh

set -e  # Exit on error

echo "=================================================="
echo "🚀 SETUP BACKEND - RENTAL MANAGEMENT SYSTEM"
echo "=================================================="

# Màu sắc cho output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Bước 1: Kiểm tra Python
echo -e "\n${YELLOW}📋 Bước 1: Kiểm tra Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 chưa được cài đặt!${NC}"
    echo "Vui lòng cài Python3 trước:"
    echo "  - macOS: brew install python@3.11"
    echo "  - Ubuntu: sudo apt-get install python3.11"
    exit 1
fi
echo -e "${GREEN}✅ Python version: $(python3 --version)${NC}"

# Bước 2: Tạo môi trường ảo
echo -e "\n${YELLOW}📦 Bước 2: Tạo môi trường ảo...${NC}"
if [ ! -d "env" ]; then
    python3 -m venv env
    echo -e "${GREEN}✅ Đã tạo môi trường ảo${NC}"
else
    echo -e "${GREEN}✅ Môi trường ảo đã tồn tại${NC}"
fi

# Bước 3: Kích hoạt và cài dependencies
echo -e "\n${YELLOW}📥 Bước 3: Cài đặt dependencies...${NC}"
source env/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✅ Đã cài đặt dependencies${NC}"

# Bước 4: Tạo file .env
echo -e "\n${YELLOW}📝 Bước 4: Kiểm tra file .env...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Đã tạo file .env từ .env.example${NC}"
        echo -e "${YELLOW}⚠️  Vui lòng cập nhật thông tin trong .env:${NC}"
        echo "   - DATABASE_URL (PostgreSQL connection string)"
        echo "   - SECRET_KEY (JWT secret)"
    else
        echo -e "${RED}❌ Không tìm thấy .env.example${NC}"
        echo "Vui lòng tạo file .env thủ công"
    fi
else
    echo -e "${GREEN}✅ File .env đã tồn tại${NC}"
fi

# Bước 5: Kiểm tra PostgreSQL
echo -e "\n${YELLOW}🗄️  Bước 5: Kiểm tra PostgreSQL...${NC}"
echo "Đảm bảo PostgreSQL đang chạy:"
echo "  - macOS: brew services list | grep postgresql"
echo "  - Start: brew services start postgresql@14"
echo "  - Docker: docker-compose up -d postgres"

read -p "PostgreSQL đã chạy chưa? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Vui lòng khởi động PostgreSQL trước!${NC}"
    exit 1
fi

# Bước 6: Chạy migrations
echo -e "\n${YELLOW}🔄 Bước 6: Chạy database migrations...${NC}"
if [ -f "alembic.ini" ]; then
    alembic upgrade head
    echo -e "${GREEN}✅ Migrations hoàn tất${NC}"
else
    echo -e "${YELLOW}⚠️  Không tìm thấy alembic.ini${NC}"
fi

# Bước 7: Seed data (optional)
echo -e "\n${YELLOW}🌱 Bước 7: Seed dữ liệu ban đầu (optional)${NC}"
read -p "Bạn có muốn seed roles và admin user không? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "scripts/seed_roles_and_admin.py" ]; then
        python scripts/seed_roles_and_admin.py
        echo -e "${GREEN}✅ Đã seed roles và admin${NC}"
    else
        echo -e "${YELLOW}⚠️  Không tìm thấy script seed${NC}"
    fi
fi

# Hoàn tất
echo -e "\n=================================================="
echo -e "${GREEN}✅ SETUP HOÀN TẤT!${NC}"
echo "=================================================="
echo ""
echo "📋 Các bước tiếp theo:"
echo ""
echo "1. Kiểm tra file .env:"
echo "   nano .env"
echo ""
echo "2. Khởi động development server:"
echo "   source env/bin/activate"
echo "   uvicorn main:app --reload"
echo ""
echo "3. Truy cập API docs:"
echo "   http://localhost:8000/docs"
echo ""
echo "4. Test API với admin account:"
echo "   Email: admin@rental.com"
echo "   Password: Admin@123"
echo ""
echo "=================================================="
