"""Script tự động setup sau khi pull code về - Hỗ trợ cả Windows và Unix.

Chạy file này sau khi git pull để:
1. Kích hoạt môi trường ảo
2. Cài đặt/cập nhật dependencies
3. Chạy migration database
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


def check_virtual_env():
    """Kiểm tra môi trường ảo có tồn tại không."""
    python_path = get_python_executable()
    
    if not os.path.exists(python_path):
        print("❌ Không tìm thấy môi trường ảo!")
        print(f"   Vui lòng tạo môi trường ảo trước:")
        
        if platform.system() == "Windows":
            print("   python -m venv env")
        else:
            print("   python3 -m venv env")
        
        sys.exit(1)
    
    print(f"✅ Đã tìm thấy môi trường ảo: {python_path}")


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


def main():
    """Hàm chính - chạy tất cả các bước setup."""
    print("\n" + "="*60)
    print("🚀 SETUP SAU KHI GIT PULL")
    print("="*60)
    print(f"Platform: {platform.system()}")
    print(f"Python: {sys.version}")
    
    # Bước 1: Kiểm tra môi trường ảo
    check_virtual_env()
    
    # Bước 2: Cài đặt dependencies
    if not install_dependencies():
        print("\n⚠️  Cài đặt dependencies thất bại, nhưng vẫn tiếp tục...")
    
    # Bước 3: Chạy migrations
    if not run_migrations():
        print("\n❌ Migration thất bại!")
        print("Vui lòng kiểm tra:")
        print("  - Database có đang chạy không?")
        print("  - Cấu hình DATABASE_URL trong .env có đúng không?")
        sys.exit(1)
    
    # Hoàn thành
    print("\n" + "="*60)
    print("✅ SETUP HOÀN TẤT!")
    print("="*60)
    print("\nBạn có thể chạy server bằng lệnh:")
    
    if platform.system() == "Windows":
        print("  env\\Scripts\\python.exe main.py")
    else:
        print("  source env/bin/activate && python main.py")
    
    print("\nhoặc:")
    print("  uvicorn main:app --reload")


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
