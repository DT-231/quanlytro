# Hướng dẫn fix lỗi migration

## Vấn đề
Migration bị lỗi do transaction đang trong trạng thái failed.

## Giải pháp

### Bước 1: Rollback transaction hiện tại trong PostgreSQL

Kết nối vào PostgreSQL và chạy:

```sql
-- Kết nối vào database
psql -h localhost -p 5433 -U postgres -d rental_management

-- Rollback transaction
ROLLBACK;

-- Kiểm tra version hiện tại
SELECT * FROM alembic_version;
```

### Bước 2: Reset alembic version (nếu cần)

Nếu alembic_version đã bị update nhầm:

```sql
-- Xóa version hiện tại
DELETE FROM alembic_version;

-- Insert version trước đó
INSERT INTO alembic_version VALUES ('4ee3ff0fa09c');
```

### Bước 3: Chạy lại migration

```bash
# Từ thư mục backend
alembic upgrade 51c82f7c88ab
```

## Hoặc sử dụng script Python để fix

```python
# fix_migration.py
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv('.env.docker')

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Rollback any pending transaction
    conn.execute(text("ROLLBACK"))
    conn.commit()
    
    # Check current version
    result = conn.execute(text("SELECT * FROM alembic_version"))
    current = result.fetchone()
    print(f"Current version: {current}")
    
    # Reset to previous version if needed
    if current and current[0] == '51c82f7c88ab':
        conn.execute(text("DELETE FROM alembic_version"))
        conn.execute(text("INSERT INTO alembic_version VALUES ('4ee3ff0fa09c')"))
        conn.commit()
        print("Reset to version 4ee3ff0fa09c")

print("Done! Now run: alembic upgrade 51c82f7c88ab")
```

Chạy script:
```bash
cd backend
python fix_migration.py
alembic upgrade 51c82f7c88ab
```

## Migration đã được sửa

File migration mới đã:
- ✅ Sử dụng `DROP ... IF EXISTS` để tránh lỗi
- ✅ Sử dụng raw SQL để drop constraints và indexes
- ✅ Xử lý lỗi khi inspect database
- ✅ Không query database sau khi có lỗi

## Nếu vẫn lỗi

### Option 1: Manual migration (An toàn nhất)

```sql
-- Connect to database
psql -h localhost -p 5433 -U postgres -d rental_management

-- Rollback
ROLLBACK;

-- Add columns
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS ward VARCHAR(100);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Update data
UPDATE addresses SET ward = 'N/A' WHERE ward IS NULL;
UPDATE addresses SET city = 'N/A' WHERE city IS NULL;

-- Set NOT NULL
ALTER TABLE addresses ALTER COLUMN ward SET NOT NULL;
ALTER TABLE addresses ALTER COLUMN city SET NOT NULL;

-- Create index
DROP INDEX IF EXISTS ix_addresses_city;
CREATE INDEX ix_addresses_city ON addresses(city);

-- Drop old indexes
DROP INDEX IF EXISTS ix_address_city_ward;
DROP INDEX IF EXISTS ix_addresses_city_id;
DROP INDEX IF EXISTS ix_addresses_ward_id;
DROP INDEX IF EXISTS ix_addresses_address_line;
DROP INDEX IF EXISTS ix_addresses_full_address;

-- Drop old constraints
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS fk_addresses_city;
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS fk_addresses_ward;

-- Drop old columns
ALTER TABLE addresses DROP COLUMN IF EXISTS ward_id;
ALTER TABLE addresses DROP COLUMN IF EXISTS city_id;

-- Drop old tables
DROP TABLE IF EXISTS wards CASCADE;
DROP TABLE IF EXISTS cities CASCADE;

-- Update alembic version
DELETE FROM alembic_version;
INSERT INTO alembic_version VALUES ('51c82f7c88ab');

-- Commit
COMMIT;
```

### Option 2: Skip migration và tạo mới

```bash
# Đánh dấu migration đã chạy (không thực thi)
alembic stamp 51c82f7c88ab

# Tạo migration mới nếu cần
alembic revision --autogenerate -m "your_next_migration"
```

## Kiểm tra kết quả

```sql
-- Kiểm tra structure
\d addresses

-- Kiểm tra version
SELECT * FROM alembic_version;

-- Kiểm tra data
SELECT id, city, ward FROM addresses LIMIT 5;
```
