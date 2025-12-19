"""Script demo để kiểm tra response structure mới.

Chạy script này để test các trường hợp:
1. Success response (200)
2. Created response (201)
3. Bad request (400)
4. Not found (404)
5. Conflict (409)
6. Internal error (500)
"""

import sys
sys.path.insert(0, '/Users/hoangnguyen/workspace/Learning/DoAnChuyenNghanh/backend')

from app.core import response
from app.core.exceptions import (
    BadRequestException,
    NotFoundException,
    ConflictException,
    InternalServerException,
)

print("=" * 60)
print("DEMO: Response Structure Chuẩn hóa")
print("=" * 60)

# 1. Success response
print("\n1. SUCCESS RESPONSE (200)")
resp = response.success(
    data={"id": "123", "name": "Phòng 101"},
    message="Lấy thông tin phòng thành công"
)
print(f"   success: {resp.success}")
print(f"   code: {resp.code}")
print(f"   message: {resp.message}")
print(f"   HTTP Status: 200 OK ✅")

# 2. Created response
print("\n2. CREATED RESPONSE (201)")
resp = response.created(
    data={"id": "456", "name": "Phòng 102"},
    message="Tạo phòng thành công"
)
print(f"   success: {resp.success}")
print(f"   code: {resp.code}")
print(f"   message: {resp.message}")
print(f"   HTTP Status: 201 Created ✅")

# 3. Bad request
print("\n3. BAD REQUEST (400)")
resp = response.bad_request(
    message="Giá phòng phải lớn hơn 0"
)
print(f"   success: {resp.success}")
print(f"   code: {resp.code}")
print(f"   message: {resp.message}")
print(f"   HTTP Status: 400 Bad Request ❌")

# 4. Not found
print("\n4. NOT FOUND (404)")
resp = response.not_found(
    message="Không tìm thấy phòng"
)
print(f"   success: {resp.success}")
print(f"   code: {resp.code}")
print(f"   message: {resp.message}")
print(f"   HTTP Status: 404 Not Found ❌")

# 5. Conflict
print("\n5. CONFLICT (409)")
resp = response.conflict(
    message="Mã phòng đã tồn tại"
)
print(f"   success: {resp.success}")
print(f"   code: {resp.code}")
print(f"   message: {resp.message}")
print(f"   HTTP Status: 409 Conflict ❌")

# 6. Internal error
print("\n6. INTERNAL ERROR (500)")
resp = response.internal_error(
    message="Lỗi hệ thống"
)
print(f"   success: {resp.success}")
print(f"   code: {resp.code}")
print(f"   message: {resp.message}")
print(f"   HTTP Status: 500 Internal Server Error ❌")

# 7. Demo exceptions
print("\n" + "=" * 60)
print("DEMO: Custom Exceptions")
print("=" * 60)

print("\n7. BadRequestException")
exc = BadRequestException(message="Dữ liệu không hợp lệ")
print(f"   message: {exc.message}")
print(f"   status_code: {exc.status_code}")

print("\n8. NotFoundException")
exc = NotFoundException(message="Resource không tồn tại")
print(f"   message: {exc.message}")
print(f"   status_code: {exc.status_code}")

print("\n9. ConflictException")
exc = ConflictException(message="Dữ liệu bị trùng lặp")
print(f"   message: {exc.message}")
print(f"   status_code: {exc.status_code}")

print("\n" + "=" * 60)
print("✅ Tất cả responses đều có cấu trúc chuẩn:")
print("   - success: bool (true/false)")
print("   - code: int (HTTP status code)")
print("   - message: str")
print("   - data: object/array")
print("=" * 60)
