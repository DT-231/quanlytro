# Setup After Git Pull

Script tự động để setup môi trường sau khi pull code mới về.

## Cách sử dụng

### Windows
```cmd
python setup_after_pull.py
```

### Linux/Mac
```bash
python3 setup_after_pull.py
```

## Script sẽ tự động:

1. ✅ Kiểm tra môi trường ảo (`env/`)
2. ✅ Cài đặt/cập nhật dependencies từ `requirements.txt`
3. ✅ Chạy database migrations (`alembic upgrade head`)

## Yêu cầu

- Python 3.11+
- Môi trường ảo đã được tạo (nếu chưa có, chạy `python -m venv env`)
- Database đang chạy (PostgreSQL)
- File `.env` hoặc `.env.docker` đã cấu hình đúng

## Lưu ý cho Windows

Script tự động phát hiện Windows và sử dụng:
- `env\Scripts\python.exe`
- `env\Scripts\pip.exe`

## Lưu ý cho Linux/Mac

Script tự động phát hiện Unix và sử dụng:
- `env/bin/python`
- `env/bin/pip`

## Troubleshooting

### Lỗi "Không tìm thấy môi trường ảo"
```bash
# Tạo môi trường ảo mới
python -m venv env
```

### Lỗi migration thất bại
- Kiểm tra PostgreSQL có đang chạy không
- Kiểm tra `DATABASE_URL` trong file `.env`
- Chạy thủ công: `alembic current` để xem trạng thái

### Lỗi dependencies
- Cập nhật pip: `python -m pip install --upgrade pip`
- Chạy thủ công: `pip install -r requirements.txt`
