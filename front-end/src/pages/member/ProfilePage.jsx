import React from "react";
import { Link } from "react-router-dom";
import { User, KeyRound, Phone } from "lucide-react";

const ProfilePage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Trang chủ</h1>
      <p className="text-gray-600 mb-6">
        Chào mừng đến với hệ thống quản lý phòng trọ.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
        {/* Hồ sơ cá nhân */}
        <Link
          to="/member/account/profile"
          className="p-6 border rounded-xl shadow hover:bg-gray-50 transition flex items-center gap-3"
        >
          <User size={24} />
          <div>
            <h3 className="font-semibold">Hồ sơ của tôi</h3>
            <p className="text-sm text-gray-500">
              Xem và chỉnh sửa thông tin cá nhân
            </p>
          </div>
        </Link>

        {/* Đổi mật khẩu */}
        <Link
          to="/member/account/change-password"
          className="p-6 border rounded-xl shadow hover:bg-gray-50 transition flex items-center gap-3"
        >
          <KeyRound size={24} />
          <div>
            <h3 className="font-semibold">Đổi mật khẩu</h3>
            <p className="text-sm text-gray-500">Thay đổi mật khẩu đăng nhập</p>
          </div>
        </Link>

        {/* Đổi số điện thoại */}
        <Link
          to="/member/account/change-phone"
          className="p-6 border rounded-xl shadow hover:bg-gray-50 transition flex items-center gap-3"
        >
          <Phone size={24} />
          <div>
            <h3 className="font-semibold">Đổi số điện thoại</h3>
            <p className="text-sm text-gray-500">Cập nhật số điện thoại mới</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ProfilePage;
