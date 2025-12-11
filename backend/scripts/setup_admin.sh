#!/bin/bash

# Script để seed roles và tạo admin
# Usage: ./scripts/setup_admin.sh

set -e  # Exit on error

echo "=================================================="
echo "🚀 SETUP ROLES & ADMIN"
echo "=================================================="
echo ""

# Kiểm tra xem đang chạy trong Docker hay local
if [ -f "/.dockerenv" ]; then
    # Đang trong Docker container
    echo "✓ Đang chạy trong Docker container"
    PYTHON_CMD="python"
else
    # Đang chạy local, check xem có Docker container đang chạy không
    if docker ps | grep -q rental_api; then
        echo "✓ Phát hiện Docker container đang chạy"
        echo "  Sẽ chạy script trong container rental_api"
        echo ""
        
        # Chạy trong Docker
        docker exec -it rental_api python scripts/seed_roles_and_admin.py "$@"
        exit 0
    else
        # Chạy local
        echo "✓ Chạy ở chế độ local"
        PYTHON_CMD="python"
        
        # Check virtual environment
        if [ -d "env/bin" ]; then
            echo "  Activating virtual environment..."
            source env/bin/activate
        elif [ -d "venv/bin" ]; then
            echo "  Activating virtual environment..."
            source venv/bin/activate
        fi
    fi
fi

echo ""
echo "Đang chạy seed_roles_and_admin.py..."
echo ""

# Chạy script
$PYTHON_CMD scripts/seed_roles_and_admin.py "$@"

echo ""
echo "=================================================="
echo "✅ HOÀN THÀNH!"
echo "=================================================="
