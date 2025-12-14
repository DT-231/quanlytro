# Test Response Structure

## Test bằng cURL

### 1. Test Success Response (200)
```bash
curl -X GET http://localhost:8000/api/v1/rooms \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# HTTP/1.1 200 OK
{
  "success": true,
  "code": 200,
  "message": "Lấy danh sách phòng thành công",
  "data": {
    "items": [...],
    "total": 10,
    "offset": 0,
    "limit": 20
  }
}
```

### 2. Test Not Found (404)
```bash
curl -X GET http://localhost:8000/api/v1/rooms/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# HTTP/1.1 404 Not Found
{
  "success": false,
  "code": 404,
  "message": "Không tìm thấy phòng",
  "data": {}
}
```

### 3. Test Validation Error (422)
```bash
curl -X POST http://localhost:8000/api/v1/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "room_number": "",
    "base_price": -1000
  }'

# Expected Response:
# HTTP/1.1 422 Unprocessable Entity
{
  "success": false,
  "code": 422,
  "message": "Validation error",
  "data": {
    "errors": [
      {
        "field": "body -> room_number",
        "message": "ensure this value has at least 1 characters",
        "type": "value_error.any_str.min_length"
      }
    ]
  }
}
```

### 4. Test Unauthorized (401)
```bash
curl -X GET http://localhost:8000/api/v1/rooms/detail/some-id

# Expected Response:
# HTTP/1.1 401 Unauthorized
{
  "success": false,
  "code": 401,
  "message": "Not authenticated",
  "data": {}
}
```

### 5. Test Conflict (409)
```bash
# Tạo phòng với mã đã tồn tại
curl -X POST http://localhost:8000/api/v1/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "room_number": "101",
    "building_id": "existing-building-id",
    ...
  }'

# Expected Response:
# HTTP/1.1 409 Conflict
{
  "success": false,
  "code": 409,
  "message": "Mã phòng đã tồn tại trong tòa nhà này",
  "data": {}
}
```

## Test bằng Swagger UI

1. Mở http://localhost:8000/docs
2. Thử các endpoint và quan sát:
   - **Response status code** (200, 201, 400, 404, 409, 422, 500)
   - **Response body** có `success` field
   - **Response body** format nhất quán

## Kiểm tra trong Browser DevTools

```javascript
// Console
fetch('http://localhost:8000/api/v1/rooms')
  .then(res => {
    console.log('HTTP Status:', res.status);  // Kiểm tra status code
    return res.json();
  })
  .then(data => {
    console.log('Success flag:', data.success);  // Kiểm tra success field
    console.log('Code:', data.code);
    console.log('Message:', data.message);
    console.log('Data:', data.data);
  });
```

## Checklist Testing

- [ ] GET endpoint trả về 200 với `success: true`
- [ ] POST endpoint tạo mới trả về 201 với `success: true`
- [ ] GET với ID không tồn tại trả về 404 với `success: false`
- [ ] POST với dữ liệu trùng lặp trả về 409 với `success: false`
- [ ] POST với dữ liệu không hợp lệ trả về 422 với `success: false`
- [ ] Endpoint cần auth mà không có token trả về 401 với `success: false`
- [ ] Endpoint cần quyền admin mà user không phải admin trả về 403 với `success: false`
- [ ] Lỗi server trả về 500 với `success: false`

## Lưu ý

- **HTTP status code** phải khớp với `code` trong response body
- **success** phải là `true` cho 2xx, `false` cho các code khác
- **message** phải rõ ràng và bằng tiếng Việt
- **data** có thể là object `{}` hoặc array `[]` tùy endpoint
