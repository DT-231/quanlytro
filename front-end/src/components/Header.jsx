import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm'; // 1. Import form quên mật khẩu

export default function Header() {
  const [open, setOpen] = useState(false);
  // State view bây giờ sẽ quản lý 3 giá trị: 'login', 'register', 'forgot'
  const [view, setView] = useState('login'); 

  // Hàm helper để reset về login mỗi khi mở dialog
  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) setTimeout(() => setView('login'), 200); 
  };

  return (
    <header className="w-full bg-white border-b shadow-sm h-14 flex items-center py-1">
      <div className="flex items-center justify-between w-full px-3">

        {/* LEFT: Logo... (giữ nguyên) */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center text-sm font-semibold">N1</div>
          <div className="leading-tight">
            <h1 className="text-base font-semibold">Nhóm 1</h1>
            <p className="text-[12px] text-gray-500">Hệ thống phòng trọ</p>
          </div>
        </div>

        {/* RIGHT: Buttons */}
        <div className="flex items-center gap-2 ">
          
          <Dialog open={open} onOpenChange={handleOpenChange}>
            {/* Nút Đăng nhập -> Mở Dialog Login */}
            <DialogTrigger asChild>
              <button 
                onClick={() => setView('login')}
                className="px-5 py-1.5 rounded-full bg-black text-white text-sm hover:opacity-90 transition"
              >
                Đăng nhập
              </button>
            </DialogTrigger>

            {/* Nút Đăng ký -> Mở Dialog Register */}
            <DialogTrigger asChild>
               <button 
                 onClick={() => setView('register')}
                 className="px-5 py-1.5 rounded-full bg-gray-200 text-sm hover:bg-gray-300 transition"
               >
                Đăng ký
               </button>
            </DialogTrigger>
            
            {/* NỘI DUNG DIALOG */}
            <DialogContent className="sm:max-w-[400px] bg-white text-black p-6 overflow-y-auto max-h-[90vh]">
               
               {/* Trường hợp 1: Form Đăng nhập */}
               {view === 'login' && (
                 <LoginForm 
                    onClose={() => setOpen(false)} 
                    onSwitchToRegister={() => setView('register')} 
                    onSwitchToForgot={() => setView('forgot')} // Thêm dòng này
                 />
               )}

               {/* Trường hợp 2: Form Đăng ký */}
               {view === 'register' && (
                 <RegisterForm 
                    onSwitchToLogin={() => setView('login')} 
                 />
               )}

               {/* Trường hợp 3: Form Quên mật khẩu */}
               {view === 'forgot' && (
                 <ForgotPasswordForm 
                    onSwitchToLogin={() => setView('login')}
                    onSwitchToRegister={() => setView('register')}
                 />
               )}

            </DialogContent>
          </Dialog>

        </div>
      </div>
    </header>
  );
}