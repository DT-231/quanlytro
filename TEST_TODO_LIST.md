# 🧪 Todo List - Test Hệ Thống Quản Lý Phòng Trọ

## 🎯 Mục Đích
Danh sách các chức năng cần test để chuẩn bị demo, sắp xếp theo mức độ quan trọng (từ quan trọng nhất đến ít quan trọng).

## 📋 Danh Sách Test Cases

### 🔥 CRITICAL (Quan Trọng Nhất - Phải Hoạt Động Cho Demo)

#### 1. **Authentication & Authorization**
- [ ] Đăng nhập với tài khoản admin mặc định
- [ ] Đăng nhập với tài khoản user thường
- [ ] Đăng ký tài khoản mới
- [ ] Phân quyền: Admin vs User (test các API endpoints)
- [ ] JWT token validation và refresh
- [ ] Logout và token invalidation

#### 2. **Core CRUD Operations**
- [ ] **Rooms Management**: Tạo, đọc, cập nhật, xóa phòng trọ
- [ ] **Users Management**: Tạo, đọc, cập nhật, xóa user
- [ ] **Room Types**: CRUD room types
- [ ] **Buildings**: CRUD buildings
- [ ] **Addresses**: CRUD addresses

#### 3. **Contract Management**
- [ ] Tạo hợp đồng thuê mới
- [ ] Xem danh sách hợp đồng
- [ ] Cập nhật trạng thái hợp đồng
- [ ] Kết thúc hợp đồng

### 💰 HIGH PRIORITY (Quan Trọng - Tính Năng Chính)

#### 4. **Payment Integration**
- [ ] Tạo hóa đơn thanh toán
- [ ] Tích hợp PayOS (thanh toán online)
- [ ] Xem lịch sử thanh toán
- [ ] Xử lý callback từ PayOS

#### 5. **Search & Filtering**
- [ ] Tìm kiếm phòng trọ theo tiêu chí
- [ ] Lọc phòng theo giá, diện tích, địa điểm
- [ ] Tìm kiếm user theo tên, email
- [ ] Tìm kiếm hợp đồng theo trạng thái

### 🎨 MEDIUM PRIORITY (Trung Bình - UX/UI)

#### 6. **Frontend UI/UX**
- [ ] Giao diện đăng nhập/đăng ký
- [ ] Dashboard admin (thống kê, quản lý)
- [ ] Dashboard user (xem phòng, hợp đồng)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Form validation và error messages
- [ ] Loading states và empty states

#### 7. **Advanced Features**
- [ ] Appointment scheduling (đặt lịch xem phòng)
- [ ] Maintenance requests (báo cáo sửa chữa)
- [ ] Notification system (thông báo)
- [ ] Invoice generation và export

### 🐛 LOW PRIORITY (Ít Quan Trọng - Edge Cases)

#### 8. **Error Handling & Edge Cases**
- [ ] Validation errors (input không hợp lệ)
- [ ] Network errors (mất kết nối)
- [ ] Permission denied errors
- [ ] Database constraint violations
- [ ] File upload errors (nếu có)

#### 9. **Performance & Security**
- [ ] API response times (< 2s)
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] Rate limiting
- [ ] CORS configuration

#### 10. **Documentation & Testing**
- [ ] API Documentation (Swagger/ReDoc)
- [ ] Unit tests coverage
- [ ] Integration tests
- [ ] E2E tests (nếu có)

## 📊 Test Scenarios Theo User Journey

### 👤 **User Journey 1: Khách Hàng Tiềm Năng**
1. [ ] Đăng ký tài khoản mới
2. [ ] Đăng nhập
3. [ ] Tìm kiếm phòng trọ
4. [ ] Xem chi tiết phòng
5. [ ] Đặt lịch xem phòng
6. [ ] Nhận thông báo

### 🏠 **User Journey 2: Người Thuê Phòng**
1. [ ] Đăng nhập (TENANT role)
2. [ ] Xem hợp đồng hiện tại
3. [ ] Xem hóa đơn thanh toán
4. [ ] Thanh toán tiền thuê
5. [ ] Báo cáo vấn đề bảo trì

### 👑 **User Journey 3: Admin/Chủ Trọ**
1. [ ] Đăng nhập (ADMIN role)
2. [ ] Xem dashboard thống kê
3. [ ] Quản lý phòng trọ (CRUD)
4. [ ] Quản lý user accounts
5. [ ] Xem báo cáo doanh thu
6. [ ] Xử lý maintenance requests

## 🧪 Test Environments

### 🔧 **Local Development**
- [ ] Docker setup (backend + frontend + database)
- [ ] Local database với sample data
- [ ] API testing với Postman/Swagger

### 🌐 **Staging/Production**
- [ ] Deployed version
- [ ] Real payment gateway (PayOS)
- [ ] Production database
- [ ] SSL certificates

## 📝 Test Checklist Template

### ✅ **Pre-Test Setup**
- [ ] Database đã được seed với data mẫu
- [ ] Admin account đã được tạo
- [ ] Frontend và backend đang chạy
- [ ] Network connectivity tốt

### ✅ **Post-Test Verification**
- [ ] Tất cả critical features hoạt động
- [ ] Không có console errors
- [ ] UI responsive trên mobile
- [ ] Performance acceptable
- [ ] Security headers đúng

## 🎯 Demo Preparation

### 📋 **Demo Script**
1. **Introduction** (30s): Giới thiệu hệ thống
2. **Admin Demo** (2-3 min): CRUD operations, user management
3. **User Demo** (2-3 min): Search, booking, payment
4. **Technical Demo** (1-2 min): API docs, architecture
5. **Q&A** (2-3 min): Trả lời câu hỏi

### 🚨 **Risk Assessment**
- [ ] Critical bugs: Authentication, Payment, Data integrity
- [ ] High risk: UI crashes, slow performance
- [ ] Medium risk: Minor UI issues, edge cases
- [ ] Low risk: Documentation, non-critical features

## 📈 Success Criteria

### ✅ **Must Have (Demo Day)**
- Authentication hoạt động 100%
- Basic CRUD operations ổn định
- Payment flow hoàn chỉnh
- UI không crash
- Response time < 3s

### 🎯 **Should Have (Tuần Sau)**
- Advanced search/filtering
- All user roles working
- Error handling proper
- Mobile responsive

### ⭐ **Nice To Have (Tương Lai)**
- Advanced analytics
- Real-time notifications
- File uploads
- Export features

---

## 📞 Support & Communication

**Test Coordinator:** [Tên bạn]
**Tester:** [Tên người test]
**Communication Channel:** [Slack/Teams/Email]

**Bug Report Template:**
```
Title: [Feature] - [Issue Description]
Severity: Critical/High/Medium/Low
Steps to Reproduce:
1. Step 1
2. Step 2
3. Expected: ...
4. Actual: ...
Environment: Local/Staging/Prod
Browser: Chrome/Firefox/Safari
```

---

*Created: December 23, 2025*
*Last Updated: December 23, 2025*