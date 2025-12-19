# 🔧 Hướng Dẫn Khắc Phục Lỗi Cài Đặt Dependencies Trên Windows

## ❌ Nguyên nhân lỗi

File `setup_after_pull.py` bị lỗi cú pháp (thiếu code hàm `install_dependencies`). Đã được sửa trong commit mới nhất.

## ✅ Cách khắc phục

### Option 1: Dùng Script PowerShell (Khuyên dùng)

```powershell
# 1. Pull code mới nhất
git pull

# 2. Chạy PowerShell script
.\setup.ps1

# Nếu gặp lỗi ExecutionPolicy:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

### Option 2: Dùng Script Batch (CMD)

```cmd
REM 1. Pull code mới nhất
git pull

REM 2. Chạy batch script
setup.bat
```

### Option 3: Dùng Python Script (đã sửa)

```cmd
REM 1. Pull code mới nhất
git pull

REM 2. Chạy Python script
python setup_after_pull.py
```

### Option 4: Cài Thủ Công (nếu script vẫn lỗi)

```cmd
REM 1. Tạo môi trường ảo (nếu chưa có)
python -m venv env

REM 2. Kích hoạt môi trường ảo
env\Scripts\activate

REM 3. Nâng cấp pip
python -m pip install --upgrade pip

REM 4. Cài đặt dependencies
pip install -r requirements.txt

REM 5. Tạo file .env (nếu chưa có)
copy .env.example .env

REM 6. Chỉnh sửa .env với thông tin database của bạn
notepad .env

REM 7. Chạy migrations
alembic upgrade head

REM 8. (Optional) Seed data
python scripts\seed_roles_and_admin.py

REM 9. Khởi động server
uvicorn main:app --reload
```

## 🐛 Các lỗi thường gặp khi cài dependencies

### 1. **Lỗi: "python is not recognized"**
**Nguyên nhân**: Python chưa được thêm vào PATH

**Giải pháp**:
- Cài lại Python và tick "Add Python to PATH"
- Hoặc dùng Python Launcher: `py -m pip install -r requirements.txt`

### 2. **Lỗi: "Microsoft Visual C++ 14.0 is required"**
**Nguyên nhân**: Thiếu C++ build tools cho một số package

**Giải pháp**:
```cmd
REM Download và cài Microsoft C++ Build Tools
REM https://visualstudio.microsoft.com/visual-cpp-build-tools/

REM Hoặc cài Visual Studio Community với "Desktop development with C++"
```

### 3. **Lỗi: "Access is denied" khi cài package**
**Nguyên nhân**: Thiếu quyền admin hoặc antivirus chặn

**Giải pháp**:
```cmd
REM Chạy CMD/PowerShell as Administrator
REM Hoặc tắt tạm antivirus

REM Thử cài với --user flag
pip install --user -r requirements.txt
```

### 4. **Lỗi: "Cannot find command 'pip'"**
**Nguyên nhân**: pip chưa được cài hoặc venv chưa activate

**Giải pháp**:
```cmd
REM Đảm bảo đã activate venv
env\Scripts\activate

REM Kiểm tra pip
python -m pip --version

REM Nếu không có pip, cài lại
python -m ensurepip --upgrade
```

### 5. **Lỗi: Timeout khi download packages**
**Nguyên nhân**: Mạng chậm hoặc PyPI bị chặn

**Giải pháp**:
```cmd
REM Tăng timeout
pip install --timeout=100 -r requirements.txt

REM Hoặc dùng mirror (nếu ở VN)
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
```

### 6. **Lỗi: "psycopg2" installation failed**
**Nguyên nhân**: psycopg2 cần PostgreSQL development files

**Giải pháp**:
```cmd
REM Dùng psycopg2-binary thay vì psycopg2
pip install psycopg2-binary

REM Hoặc sửa requirements.txt:
REM psycopg2==2.9.9  ->  psycopg2-binary==2.9.9
```

### 7. **Lỗi: Package version conflict**
**Nguyên nhân**: Conflict giữa các version packages

**Giải pháp**:
```cmd
REM Xóa venv cũ và tạo mới
rmdir /s /q env
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
```

## 📝 Checklist trước khi cài

- [ ] Python 3.11+ đã cài đặt: `python --version`
- [ ] pip đã cài: `python -m pip --version`
- [ ] Git đã pull code mới nhất: `git pull`
- [ ] File `requirements.txt` tồn tại
- [ ] File `.env.example` tồn tại (để tạo `.env`)
- [ ] PostgreSQL đã cài và chạy (port 5433)
- [ ] Database `rental_management` đã tạo

## 🚀 Quy trình chuẩn cho Windows

```cmd
REM ===== LẦN ĐẦU SETUP =====
git clone <repository-url>
cd backend
.\setup.ps1

REM ===== SAU MỖI LẦN PULL =====
git pull
.\setup.ps1

REM ===== CHẠY SERVER =====
env\Scripts\activate
uvicorn main:app --reload
```

## 💡 Tips cho Windows

1. **Dùng PowerShell thay vì CMD** (hiện đại hơn, hỗ trợ tốt hơn)

2. **Tạo shortcut khởi động**:
```cmd
REM Tạo file start_server.bat:
@echo off
call env\Scripts\activate
uvicorn main:app --reload
```

3. **Dùng Windows Terminal** (đẹp hơn, nhiều tính năng hơn)
   - Download: Microsoft Store → "Windows Terminal"

4. **Kiểm tra Python path**:
```cmd
where python
where pip
```

## 📞 Vẫn gặp lỗi?

Nếu vẫn gặp lỗi sau khi thử các cách trên:

1. Chụp **full screenshot lỗi** (cả command và error message)
2. Kiểm tra:
   - Python version: `python --version`
   - Pip version: `pip --version`
   - OS version: `winver`
3. Share thông tin để team hỗ trợ

---

**Lưu ý**: Script đã được sửa trong commit mới nhất. Hãy đảm bảo `git pull` trước khi chạy lại!
