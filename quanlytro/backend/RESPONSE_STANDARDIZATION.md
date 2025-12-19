# Chuẩn hóa Response Structure

## Tổng quan

Đã thực hiện chuẩn hóa toàn bộ response structure để đảm bảo:
- ✅ **HTTP status code chính xác** (200, 201, 400, 401, 403, 404, 409, 422, 500)
- ✅ **Response format nhất quán** với field `success: true/false`
- ✅ **Exception handling tập trung** qua middleware

## Cấu trúc Response chuẩn

### Response thành công
```json
{
  "success": true,
  "code": 200,
  "message": "Lấy danh sách phòng thành công",
  "data": {
    "items": [...],
    "total": 50,
    "offset": 0,
    "limit": 20
  }
}
```

### Response lỗi
```json
{
  "success": false,
  "code": 404,
  "message": "Không tìm thấy phòng",
  "data": {}
}
```

## HTTP Status Codes

| Code | Tên | Khi nào dùng |
|------|-----|--------------|
| 200  | OK | Truy vấn thành công (GET, PUT, DELETE) |
| 201  | Created | Tạo mới thành công (POST) |
| 400  | Bad Request | Request không hợp lệ, validation lỗi |
| 401  | Unauthorized | Chưa đăng nhập hoặc token không hợp lệ |
| 403  | Forbidden | Không có quyền truy cập |
| 404  | Not Found | Không tìm thấy resource |
| 409  | Conflict | Trùng lặp dữ liệu (duplicate code, email) |
| 422  | Unprocessable Entity | Pydantic validation error |
| 500  | Internal Server Error | Lỗi server không xác định |

## Thay đổi trong code

### 1. Response Schema (`app/schemas/response_schema.py`)
```python
class Response(GenericModel, Generic[T]):
    success: bool  # ✅ THÊM MỚI
    code: int
    message: str
    data: Optional[T]
```

### 2. Response Helpers (`app/core/response.py`)
Tất cả các helper đã được cập nhật để có `success` flag:
```python
def success(data, message) -> Response:
    return Response(success=True, code=200, ...)

def bad_request(message, data) -> Response:
    return Response(success=False, code=400, ...)
```

### 3. Custom Exceptions (`app/core/exceptions.py`)
Tạo mới các exception classes:
- `BadRequestException` → HTTP 400
- `UnauthorizedException` → HTTP 401
- `ForbiddenException` → HTTP 403
- `NotFoundException` → HTTP 404
- `ConflictException` → HTTP 409
- `InternalServerException` → HTTP 500

### 4. Exception Handlers (`app/core/exception_handlers.py`)
Middleware tự động convert exceptions thành response chuẩn:
```python
@app.add_exception_handler(AppException)
async def app_exception_handler(exc):
    return JSONResponse(
        status_code=exc.status_code,  # ✅ Status code đúng
        content=response.custom(
            code=exc.status_code,
            message=exc.message,
            data=exc.data
        ).model_dump()
    )
```

### 5. Routes Refactoring
**TRƯỚC** (HTTP status code luôn là 200):
```python
@router.get("/rooms/{room_id}")
def get_room(room_id):
    try:
        room = service.get_room(room_id)
        return response.success(data=room)  # ❌ Status code 200
    except ValueError:
        return response.not_found(...)  # ❌ Vẫn 200!
```

**SAU** (HTTP status code chính xác):
```python
@router.get("/rooms/{room_id}")
def get_room(room_id):
    try:
        room = service.get_room(room_id)
        return response.success(data=room)  # ✅ Status code 200
    except ValueError as e:
        raise NotFoundException(message=str(e))  # ✅ Status code 404
```

## Quy tắc sử dụng

### Trong Router (API endpoints)

#### ✅ **CÓ** (Raise exception cho lỗi)
```python
try:
    result = service.do_something()
    return response.success(data=result)  # Trả response cho success
except ValueError as e:
    raise NotFoundException(message=str(e))  # Raise exception cho lỗi
```

#### ❌ **KHÔNG** (Return response cho lỗi)
```python
try:
    result = service.do_something()
    return response.success(data=result)
except ValueError as e:
    return response.not_found(message=str(e))  # ❌ KHÔNG làm thế này
```

### Mapping Exception trong Router

```python
try:
    service.update_room(room_id, data)
    return response.success(message="Cập nhật thành công")
except ValueError as e:
    # Phân loại exception dựa vào message
    error_msg = str(e).lower()
    if "không tìm thấy" in error_msg:
        raise NotFoundException(message=str(e))
    elif "không có quyền" in error_msg:
        raise ForbiddenException(message=str(e))
    else:
        raise BadRequestException(message=str(e))
except Exception as e:
    raise InternalServerException(message=f"Lỗi hệ thống: {str(e)}")
```

## Testing

### Kiểm tra success response
```bash
curl -X GET http://localhost:8000/api/v1/rooms

# Response:
# Status: 200 OK
{
  "success": true,
  "code": 200,
  "message": "Lấy danh sách phòng thành công",
  "data": {...}
}
```

### Kiểm tra error response
```bash
curl -X GET http://localhost:8000/api/v1/rooms/invalid-uuid

# Response:
# Status: 404 Not Found
{
  "success": false,
  "code": 404,
  "message": "Không tìm thấy phòng",
  "data": {}
}
```

### Kiểm tra validation error
```bash
curl -X POST http://localhost:8000/api/v1/rooms \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Response:
# Status: 422 Unprocessable Entity
{
  "success": false,
  "code": 422,
  "message": "Validation error",
  "data": {
    "errors": [...]
  }
}
```

## Migration cho Frontend

Frontend cần update code để:
1. Kiểm tra `success` flag thay vì chỉ dựa vào HTTP status
2. Xử lý `data` có thể là object hoặc array tùy endpoint
3. Hiển thị `message` cho user

```typescript
// Frontend example
const response = await fetch('/api/v1/rooms');
const json = await response.json();

if (json.success) {
  // Xử lý thành công
  console.log(json.data);
} else {
  // Hiển thị lỗi
  alert(json.message);
}

// Hoặc kiểm tra HTTP status
if (response.status === 200) {
  // Success
} else if (response.status === 404) {
  // Not found
}
```

## Checklist

- [x] Thêm `success` field vào `Response` schema
- [x] Cập nhật tất cả response helpers
- [x] Tạo custom exception classes
- [x] Tạo exception handlers middleware
- [x] Cập nhật `main.py` để đăng ký handlers
- [x] Refactor **tất cả routes** (Room, Invoice, Contract, Maintenance, Building, User, Address, Auth)
- [ ] Test tất cả endpoints
- [ ] Update Swagger documentation
- [ ] Thông báo cho Frontend team

## Lưu ý

- **Service layer KHÔNG thay đổi**: Service vẫn raise `ValueError`, `PermissionError`, etc.
- **Router chịu trách nhiệm mapping**: Router convert business exceptions thành HTTP exceptions
- **Exception handler tự động format**: Middleware đảm bảo response format nhất quán
- **HTTP status code được middleware set**: Không cần set `status_code` trong decorator nữa (trừ success cases)

---

**Created**: 2025-12-14  
**Author**: GitHub Copilot  
**Version**: 1.0
