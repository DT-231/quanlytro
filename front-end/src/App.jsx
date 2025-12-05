import { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar"; // Import Sidebar tự viết (Custom)
import { useAuth } from "./context/AuthContext";

// Import các Pages...
import HomePage from "./pages/public/HomePage";
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";
import AccountManagement from "./pages/admin/AccountManagement";

function App() {
  const { user, login, logout } = useAuth();
  const role = user?.role;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden">
      
      <div className="h-14 border-b bg-white shrink-0 z-50">
         <Header user={user} onLogout={logout} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        <Sidebar role={role} />
        <main className="flex-1 flex flex-col relative overflow-hidden">
           <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              <div className="mx-auto max-w-7xl pb-10">
                 <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/search-rooms" element={<div>Tìm kiếm phòng</div>} />
                    {role === 'admin' && (
                      <>
                        <Route path="/admin/users" element={<AccountManagement />} />
                        <Route path="/admin/dashboard" element={<div>Dashboard</div>} />
                        <Route path="/admin/buildings" element={<div>Quản lý Toà nhà</div>} />
                      </>
                    )}

                    {role === 'user' && (
                      <Route path="/member/profile" element={<div>Hồ sơ cá nhân</div>} />
                    )}
                    <Route path="*" element={<div>404 - Trang không tồn tại</div>} />
                 </Routes>
              </div>
           </div>
        </main>
      </div>
    </div>
  )
}

export default App;