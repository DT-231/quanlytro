"""Script tự động setup sau khi pull code về - Hỗ trợ cả Windows và Unix.

Chạy file này sau khi git pull để:
1. Tạo môi trường ảo (nếu chưa có)
2. Cài đặt/cập nhật dependencies
3. Tạo file .env (nếu chưa có)
4. Chạy migration database

Cách dùng:
    python setup_after_pull.py
"""

import os
import sys
import subprocess
import platform


def get_python_executable():
    """Lấy đường dẫn Python executable trong virtual environment."""
    system = platform.system()
    
    if system == "Windows":
        # Windows: env\Scripts\python.exe
        return os.path.join("env", "Scripts", "python.exe")
    else:
        # Unix/Linux/Mac: env/bin/python
        return os.path.join("env", "bin", "python")


def get_pip_executable():
    """Lấy đường dẫn pip executable trong virtual environment."""
    system = platform.system()
    
    if system == "Windows":
        return os.path.join("env", "Scripts", "pip.exe")
    else:
        return os.path.join("env", "bin", "pip")


def run_command(command, description):
    """Chạy command và hiển thị kết quả.
    
    Args:
        command: List of command arguments
        description: Mô tả command đang chạy
    """
    print(f"\n{'='*60}")
    print(f"🔧 {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            command,
            check=True,
            text=True,
            capture_output=True
        )
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        print(f"✅ Thành công: {description}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Lỗi: {description}")
        print(f"Error output: {e.stderr}")
        return False
    except FileNotFoundError:
        print(f"❌ Không tìm thấy command: {command[0]}")
        return False


def create_virtual_env():
    """Tạo môi trường ảo nếu chưa có."""
    python_path = get_python_executable()
    
    if os.path.exists(python_path):
        print(f"✅ Môi trường ảo đã tồn tại: {python_path}")
        return True
    
    print("📦 Chưa có môi trường ảo, đang tạo mới...")
    
    # Tìm Python command phù hợp
    python_cmd = "python" if platform.system() == "Windows" else "python3"
    
    try:
        result = subprocess.run(
            [python_cmd, "-m", "venv", "env"],
            check=True,
            capture_output=True,
            text=True
        )
        print("✅ Đã tạo môi trường ảo thành công!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Lỗi khi tạo môi trường ảo: {e.stderr}")
        return False
    except FileNotFoundError:
        print(f"❌ Không tìm thấy Python! Vui lòng cài Python trước.")
        return False


def install_dependencies():
    """Cài đặt/cập nhật dependencies từ requirements.txt."""
    pip_path = get_pip_executable()
    
    if not os.path.exists("requirements.txt"):
        print("⚠️  Không tìm thấy requirements.txt, bỏ qua bước cài đặt dependencies")
        return True
    
    return run_command(
        [pip_path, "install", "-r", "requirements.txt"],
        "Cài đặt/cập nhật dependencies"
    )


def run_migrations():
    """Chạy Alembic migration để cập nhật database."""
    python_path = get_python_executable()
    
    # Kiểm tra alembic.ini có tồn tại không
    if not os.path.exists("alembic.ini"):
        print("⚠️  Không tìm thấy alembic.ini, bỏ qua migration")
        return True
    
    return run_command(
        [python_path, "-m", "alembic", "upgrade", "head"],
        "Chạy database migrations"
    )


def check_env_file():
    """Kiểm tra và tạo file .env từ .env.example nếu chưa có."""
    if os.path.exists(".env"):
        print("✅ File .env đã tồn tại")
        return True
    
    if os.path.exists(".env.example"):
        print("📝 Đang tạo file .env từ .env.example...")
        try:
            with open(".env.example", "r", encoding="utf-8") as src:
                content = src.read()
            with open(".env", "w", encoding="utf-8") as dst:
                dst.write(content)
            print("✅ Đã tạo file .env")
            print("⚠️  Vui lòng kiểm tra và cập nhật thông tin DATABASE_URL, SECRET_KEY trong .env")
            return True
        except Exception as e:
            print(f"❌ Lỗi khi tạo .env: {e}")
            return False
    else:
        print("⚠️  Không tìm thấy .env.example, bỏ qua bước này")
        print("   Vui lòng tạo file .env thủ công với các biến:")
        print("   - DATABASE_URL")
        print("   - SECRET_KEY")
        return True


def main():
    """Hàm chính - chạy tất cả các bước setup."""
    print("\n" + "="*60)
    print("🚀 SETUP SAU KHI GIT PULL")
    print("="*60)
    print(f"Platform: {platform.system()}")
    print(f"Python: {sys.version}")
    
    # Bước 1: Tạo môi trường ảo (nếu chưa có)
    if not create_virtual_env():
        print("\n❌ Không thể tạo môi trường ảo!")
        sys.exit(1)
    
    # Bước 2: Cài đặt dependencies
    if not install_dependencies():
        print("\n❌ Cài đặt dependencies thất bại!")
        sys.exit(1)
    
    # Bước 3: Kiểm tra file .env
    check_env_file()
    
    # Bước 4: Chạy migrations
    print("\n⚠️  Đảm bảo PostgreSQL đang chạy trước khi tiếp tục!")
    print("   - macOS: brew services start postgresql@14")
    print("   - Windows: Mở pgAdmin hoặc start PostgreSQL service")
    print("   - Docker: docker-compose up -d postgres")
    
    input("\nNhấn Enter để tiếp tục migration (hoặc Ctrl+C để hủy)...")
    
    if not run_migrations():
        print("\n❌ Migration thất bại!")
        print("Vui lòng kiểm tra:")
        print("  - Database có đang chạy không? (PostgreSQL port 5433)")
        print("  - Cấu hình DATABASE_URL trong .env có đúng không?")
        print("  - Database 'rental_management' đã được tạo chưa?")
        sys.exit(1)
    
    # Hoàn thành
    print("\n" + "="*60)
    print("✅ SETUP HOÀN TẤT!")
    print("="*60)
    print("\n📋 Các bước tiếp theo:")
    print("\n1. Kiểm tra file .env và cập nhật thông tin nếu cần")
    print("2. Chạy seed data (tùy chọn):")
    
    if platform.system() == "Windows":
        print("     env\\Scripts\\python.exe scripts/seed_roles_and_admin.py")
    else:
        print("     ./env/bin/python scripts/seed_roles_and_admin.py")
    
    print("\n3. Khởi động server:")
    if platform.system() == "Windows":
        print("     env\\Scripts\\uvicorn.exe main:app --reload")
    else:
        print("     ./env/bin/uvicorn main:app --reload")
    
    print("\n4. Truy cập API docs tại: http://localhost:8000/docs")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Đã hủy bởi người dùng")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Lỗi không mong muốn: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
