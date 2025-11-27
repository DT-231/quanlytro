import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/ui/sidebar";
import Header from "./components/Header";

function App() {
  // Trạng thái user hiện tại
  // null = chưa load xong, false = chưa đăng nhập, object = đã đăng nhập
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // --- GIẢ LẬP LOGIC KIỂM TRA ĐĂNG NHẬP ---
    // Thực tế: Bạn sẽ lấy thông tin này từ localStorage sau khi Login API trả về
    // Ví dụ: const storedUser = JSON.parse(localStorage.getItem('user'));
    
    // TÌNH HUỐNG 1: Admin đăng nhập
    const mockAdmin = { id: 1, name: "Admin Code", role: "admin" };
    
    // TÌNH HUỐNG 2: User đăng nhập (Bỏ comment dòng dưới để test User)
    // const mockUser = { id: 2, name: "Nguyễn Văn A", role: "user" };

    setCurrentUser(mockAdmin); // Set user vào state
  }, []);

  // Màn hình chờ khi đang tải user (tránh màn hình trắng)
  if (!currentUser) return <div className="h-screen flex items-center justify-center">Đang tải...</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      
      <Header user={currentUser} />

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar tự động nhận role từ currentUser */}
        <Sidebar role={currentUser.role} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <Routes>
              {/* --- ROUTING LOGIC --- */}
              
              {/* Route chung */}
              <Route path="/" element={<div>Dashboard (Dành cho {currentUser.role})</div>} />

              {/* Các Route riêng cho ADMIN */}
              {currentUser.role === 'admin' && (
                <>
                  <Route path="/users" element={<div>Quản lý người dùng</div>} />
                  <Route path="/building" element={<div>Quản lý Toà nhà</div>} />
                  <Route path="/rooms" element={<div>Quản lý Phòng</div>} />
                  <Route path="/invoice" element={<div>Quản lý Hoá đơn</div>} />
                  <Route path="/contract" element={<div>Quản lý Hợp đồng</div>} />
                  <Route path="/incidents" element={<div>Xử lý sự cố</div>} />
                </>
              )}

              {/* Các Route riêng cho USER */}
              {currentUser.role === 'user' && (
                <>
                  <Route path="/profile" element={<div>Hồ sơ cá nhân</div>} />
                  <Route path="/my-contract" element={<div>Xem hợp đồng</div>} />
                  <Route path="/my-invoice" element={<div>Xem hoá đơn</div>} />
                  <Route path="/report" element={<div>Báo cáo sự cố</div>} />
                </>
              )}

              {/* Trang 404 */}
              <Route path="*" element={<div className="text-center mt-10">Trang không tồn tại hoặc bạn không có quyền truy cập</div>} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App;