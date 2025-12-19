import React from "react";
import { Link } from "react-router-dom";
import { User, KeyRound, Phone } from "lucide-react";

const ProfilePage = () => {
  return (
    <div className="p-4 md:p-6 bg-[rgba(217,217,217,0.25)] min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Quản lý tài khoản</h1>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Hồ sơ cá nhân */}
          <Link
            to="/member/account/profile"
            className="p-6 border rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-300 flex items-center gap-4"
          >
            <User size={28} className="text-gray-700" />
            <div>
              <h3 className="font-semibold text-lg">Hồ sơ của tôi</h3>
              <p className="text-sm text-gray-500">
                Xem và chỉnh sửa thông tin cá nhân
              </p>
            </div>
          </Link>

          {/* Đổi mật khẩu */}
          <Link
            to="/member/account/change-password"
            className="p-6 border rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-300 flex items-center gap-4"
          >
            <KeyRound size={28} className="text-gray-700" />
            <div>
              <h3 className="font-semibold text-lg">Đổi mật khẩu</h3>
              <p className="text-sm text-gray-500">
                Thay đổi mật khẩu đăng nhập
              </p>
            </div>
          </Link>

          {/* Đổi số điện thoại */}
          <Link
            to="/member/account/change-phone"
            className="p-6 border rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-300 flex items-center gap-4"
          >
            <Phone size={28} className="text-gray-700" />
            <div>
              <h3 className="font-semibold text-lg">Đổi số điện thoại</h3>
              <p className="text-sm text-gray-500">
                Cập nhật số điện thoại mới
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
