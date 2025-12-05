import React from 'react';
import { Link } from 'react-router-dom';

export default function Header({ user, onLogout, onOpenLogin }) {
  return (
    <header className="w-full bg-white border-b shadow-sm h-14 flex items-center justify-between px-4 sticky top-0 z-20">
      
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold">N1</div>
        <div className="leading-tight">
          <h1 className="text-xm font-bold text-gray-900">Nhóm 1</h1>
          <p className="text-xs text-gray-500">Hệ thống phòng trọ</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{user.name}</p>
              <p className="text-[10px] text-gray-500 uppercase">{user.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200 border overflow-hidden">
                <img src={user.avatar || "https://github.com/shadcn.png"} alt="Avatar" className="w-full h-full object-cover"/>
            </div>
            <button 
              onClick={onLogout}
              className="px-4 py-1.5 rounded-full border border-gray-300 text-xs font-medium hover:bg-gray-100 transition"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          // --- KHI CHƯA ĐĂNG NHẬP ---
          <>
            {/* 3. Dùng Link để chuyển sang trang Login */}
            <Link to="/login">
              <button 
                className="px-5 py-1.5 rounded-full bg-black text-white text-sm hover:opacity-90 transition font-medium"
              >
                Đăng nhập
              </button>
            </Link>

            {/* 4. Dùng Link để chuyển sang trang Register */}
            <Link to="/register">
              <button 
                  className="px-5 py-1.5 rounded-full bg-gray-100 text-sm hover:bg-gray-200 transition font-medium"
                >
                Đăng ký
              </button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}