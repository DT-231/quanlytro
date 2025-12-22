import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

export default function Header({ user, onLogout, onToggleSidebar }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- LOGIC XỬ LÝ ĐƯỜNG DẪN LOGO ---
  // Bạn kiểm tra role chính xác mà backend trả về (ví dụ: 'ADMIN', 'admin', hay 'super_admin')
  // Và đường dẫn admin dashboard của bạn (ví dụ: '/admin', '/dashboard', hay '/admin/dashboard')
  const logoPath = user?.role === 'ADMIN' ? '/admin' : '/';

  return (
    <header className="w-full bg-white border-b shadow-sm h-14 flex items-center justify-between px-4 sticky top-0 z-20">
      
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Icon */}
        <button onClick={onToggleSidebar} className="lg:hidden text-gray-600 hover:text-gray-900">
          <Menu size={24} />
        </button>

        {/* --- LOGO --- */}
        {/* Thay đổi to="/" thành to={logoPath} */}
        <Link to={logoPath} className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold shrink-0">N1</div>
          <div className="leading-tight hidden sm:block">
            <h1 className="text-xm font-bold text-gray-900">Nhóm 1</h1>
            <p className="text-xs text-gray-500">Hệ thống phòng trọ</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800"> {user.last_name} {user.first_name}</p>
              <p className="text-[10px] text-gray-500 uppercase">{user.role}</p>
            </div>

            {/* Avatar - Click vào đây để toggle dropdown */}
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-8 h-8 rounded-full bg-gray-200 border overflow-hidden hover:ring-2 hover:ring-gray-300 transition focus:outline-none"
            >
              <img 
                src="https://github.com/shadcn.png"
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </button>

            {/* --- DROPDOWN MENU --- */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="sm:hidden px-4 py-2 border-b border-gray-100">
                   <p className="text-sm font-bold text-gray-900 truncate">{user.first_name} {user.last_name}</p>
                   <p className="text-xs text-gray-500">{user.role}</p>
                </div>

                <Link 
                  to="/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Hồ sơ cá nhân
                </Link>
                
                <Link 
                  to="/settings" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Cài đặt
                </Link>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button 
                  onClick={() => {
                    onLogout();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          // --- KHI CHƯA ĐĂNG NHẬP ---
          <>
            <Link to="/login">
              <button className="px-5 py-1.5 rounded-full bg-black text-white text-sm hover:opacity-90 transition font-medium">
                Đăng nhập
              </button>
            </Link>

            <Link to="/register">
              <button className="px-5 py-1.5 rounded-full bg-gray-100 text-sm hover:bg-gray-200 transition font-medium">
                Đăng ký
              </button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}