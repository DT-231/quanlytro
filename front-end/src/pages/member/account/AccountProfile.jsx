import React from "react";

const AccountProfile = () => {
  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md border">
      <h2 className="text-xl font-bold mb-6">Thông tin cá nhân</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* LEFT SIDE */}
        <div>
          <div className="flex items-center gap-4">
            <img
              src="/images/avatar-default.png"
              alt="avatar"
              className="w-28 h-28 rounded-full border"
            />
            <button className="px-3 py-1 bg-black text-white rounded">
              Đổi ảnh đại diện
            </button>
          </div>

          <p className="mt-4">
            <span className="font-semibold">Họ và tên:</span> Lương Công Phúc
          </p>
          <p className="mt-1">
            <span className="font-semibold">Số điện thoại:</span> 0328582153
          </p>

          <div className="mt-4">
            <label>Email:</label>
            <input
              className="w-full mt-1 p-2 border rounded"
              defaultValue="Luongcongphuct1@gmail.com"
            />
          </div>

          <div className="mt-4">
            <label>CCCD:</label>
            <input
              className="w-full mt-1 p-2 border rounded"
              defaultValue="02555552554444"
            />
          </div>

          <div className="mt-4">
            <label>Người thân:</label>
            <div className="flex gap-3 mt-1">
              <input
                className="w-1/2 p-2 border rounded"
                defaultValue="Đinh Song Quỳnh Như"
              />
              <input
                className="w-1/2 p-2 border rounded"
                defaultValue="0555475596"
              />
            </div>
          </div>

          <button className="mt-6 w-40 px-4 py-2 bg-black text-white rounded">
            Lưu thay đổi
          </button>
        </div>

        {/* RIGHT SIDE — DOCUMENT IMAGES */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Tài liệu và hình ảnh</h3>

          <div className="flex gap-6">
            <div>
              <img
                src="/images/cccd.png"
                alt="Ảnh CCCD"
                className="w-44 h-28 object-cover rounded border"
              />
              <p className="text-center mt-1">Ảnh CCCD</p>
            </div>

            <div>
              <img
                src="/images/hopdong.png"
                alt="Hợp đồng"
                className="w-44 h-28 object-cover rounded border"
              />
              <p className="text-center mt-1">File hợp đồng thuê</p>
            </div>
          </div>

          <div className="mt-6">
            <img
              src="/images/tamvang.png"
              alt="Đăng ký tạm vắng"
              className="w-72 h-40 object-cover rounded border mx-auto"
            />
            <p className="text-center mt-1">Ảnh đăng ký tạm trú tạm vắng</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountProfile;
