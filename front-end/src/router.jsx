import { createBrowserRouter } from "react-router-dom";

// --- Layouts ---
import App from "./App"; 
import AdminLayout from "./components/layouts/AdminLayout";
import MemberLayout from "./components/layouts/MemberLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// --- Public Pages---
import HomePage from "./pages/public/HomePage";
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";

// --- Admin Pages---

import AccountManagement from "./pages/admin/AccountManagement";
import InvoiceManagement from "./Pages/admin/InvoiceManagement";

// --- Member Pages---
import ProfilePage from "./pages/member/ProfilePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, 
    children: [
      // 1. PUBLIC ROUTES
      { path: "/", element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      
      // Trang chưa làm -> Dùng div tạm
      { path: "search-rooms", element: <div className="p-10 text-center">Trang Tìm kiếm phòng (Đang phát triển)</div> },

      // 2. MEMBER ROUTES 
      {
        path: "member",
        element: <ProtectedRoute allowedRoles={['user']}><MemberLayout /></ProtectedRoute>,
        children: [
          { path: "profile", element: <ProfilePage /> },
          
          // Các trang chưa làm -> Dùng div tạm
          { path: "my-contracts", element: <div className="p-10">Hợp đồng của tôi (Đang phát triển)</div> },
          { path: "my-invoices", element: <div className="p-10">Hóa đơn của tôi (Đang phát triển)</div> },
          { path: "incidents", element: <div className="p-10">Báo cáo sự cố (Đang phát triển)</div> },
        ]
      }
    ]
  },

  // 3. ADMIN ROUTES 
  {
    path: "/admin",
    element: <ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>,
    children: [
      { path: "dashboard", element: <div className="p-10">Dashboard Thống kê (Đang phát triển)</div> },
      { path: "users", element: <AccountManagement /> },
      { path: "buildings", element: <div className="p-10">Quản lý Tòa nhà (Đang phát triển)</div> },
      { path: "rooms", element: <div className="p-10">Quản lý Phòng (Đang phát triển)</div> },
      { path: "invoices", element:<InvoiceManagement/> },
      { path: "contracts", element: <div className="p-10">Quản lý Hợp đồng (Đang phát triển)</div> },
      { path: "incidents", element: <div className="p-10">Quản lý Sự cố (Đang phát triển)</div> },
    ]
  },

  // 404 Not Found
  { path: "*", element: <div className="p-20 text-center text-red-500 font-bold text-2xl">404 - Trang không tồn tại</div> }
]);

export default router;