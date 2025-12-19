import React from "react";

const AccountChangePhone = ({ user }) => {
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

        <label>Số điện thoại cũ</label>
        <input
          className="w-full mt-1 p-2 border rounded"
          defaultValue={user?.phone}
          readOnly
        />

        <label className="mt-4">Số điện thoại mới</label>
        <input className="w-full mt-1 p-2 border rounded" />

        <button className="mt-4 w-full py-2 bg-black text-white rounded">
          Lấy mã xác thực
        </button>

        <label className="mt-4">Nhập mã xác thực</label>
        <input className="w-full mt-1 p-2 border rounded" />

        <button className="mt-6 w-full py-2 bg-black text-white rounded">
          Cập nhật
        </button>
      </div>
    </div>
  );
};

export default AccountChangePhone;
