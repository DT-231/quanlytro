import React from "react";

const AccountChangePassword = ({ user }) => {
  return (
    <div className="w-full flex justify-center mt-6">
      <div className="w-[450px] bg-white p-8 rounded-xl shadow-lg border">
        <div className="flex flex-col items-center mb-4">
          <img
            src={user?.avatar || "/img/avatar-default.png"}
            alt="avatar"
            className="w-16 h-16 rounded-full border object-cover"
          />
          <p className="mt-2 font-semibold">{user?.fullName}</p>
          <p className="text-gray-500 text-sm">{user?.phone}</p>
        </div>

        <label>Mật khẩu cũ</label>
        <input className="w-full mt-1 p-2 border rounded" type="password" />

        <p className="mt-1 text-blue-600 text-sm cursor-pointer">
          Bạn quên mật khẩu?
        </p>

        <label className="mt-4">Mật khẩu mới</label>
        <input className="w-full mt-1 p-2 border rounded" type="password" />

        <label className="mt-4">Xác nhận mật khẩu mới</label>
        <input className="w-full mt-1 p-2 border rounded" type="password" />

        <button className="mt-6 w-full py-2 bg-black text-white rounded">
          Đổi mật khẩu
        </button>
      </div>
    </div>
  );
};

export default AccountChangePassword;
