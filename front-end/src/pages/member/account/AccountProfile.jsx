import React, { useState, useRef } from "react";
import { User, Upload } from "lucide-react";

const AccountProfile = () => {
  const [profile, setProfile] = useState({
    fullName: "Lương Công Phúc",
    phone: "0328582153",
    email: "Luongcongphuct1@gmail.com",
    cccd: "02555552554444",
    relativeName: "Đinh Song Quỳnh Như",
    relativePhone: "0555475596",
    avatar: "/images/avatar-default.png", // URL ảnh hiện tại
  });

  const [previews, setPreviews] = useState({
    avatar: null,
    cccd: null,
    residence: null,
  });
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [type]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    // TODO: Thêm logic gọi API để lưu dữ liệu và tải lên ảnh
    console.log("Đang lưu dữ liệu:", {
      ...profile,
      previews,
    });
    alert("Đã lưu thay đổi! (Kiểm tra console log)");
  };

  return (
    // Sử dụng các lớp CSS nhất quán với thiết kế chung
    <div className="w-full bg-white p-6 md:p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-8 border-b pb-4">
        Thông tin cá nhân
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
        {/* LEFT SIDE */}
        <div>
          <div className="flex items-center gap-6 mb-6">
            <div className="w-28 h-28 rounded-full border-2 border-gray-200 flex items-center justify-center bg-gray-100 overflow-hidden">
              {previews.avatar || profile.avatar ? (
                <img
                  src={previews.avatar || profile.avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-14 h-14 text-gray-400" />
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleImageChange(e, "avatar")}
              className="hidden"
              accept="image/*"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Đổi ảnh đại diện
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="font-semibold">Họ và tên:</label>
              <p className="text-gray-800">{profile.fullName}</p>
            </div>
            <div>
              <label className="font-semibold">Số điện thoại:</label>
              <p className="text-gray-800">{profile.phone}</p>
            </div>
            <div>
              <label className="font-semibold">Email:</label>
              <input
                name="email"
                className="w-full mt-1 p-2 border rounded-md"
                value={profile.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="font-semibold">CCCD:</label>
              <input
                name="cccd"
                className="w-full mt-1 p-2 border rounded-md"
                value={profile.cccd}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="font-semibold">Người thân:</label>
              <div className="flex gap-3 mt-1">
                <input
                  name="relativeName"
                  className="w-1/2 p-2 border rounded-md"
                  value={profile.relativeName}
                  onChange={handleInputChange}
                  placeholder="Họ tên người thân"
                />
                <input
                  name="relativePhone"
                  className="w-1/2 p-2 border rounded-md"
                  value={profile.relativePhone}
                  onChange={handleInputChange}
                  placeholder="SĐT người thân"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 flex justify-end">
            <button
              onClick={handleSaveChanges}
              className="w-48 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>

        {/* RIGHT SIDE — DOCUMENT IMAGES */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Tài liệu và hình ảnh</h3>

          <div className="space-y-6">
            <ImageUploader
              title="Ảnh CCCD/CMND"
              preview={previews.cccd}
              onImageChange={(e) => handleImageChange(e, "cccd")}
            />
            <ImageUploader
              title="Ảnh đăng ký tạm trú"
              preview={previews.residence}
              onImageChange={(e) => handleImageChange(e, "residence")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageUploader = ({ title, preview, onImageChange }) => {
  const inputRef = useRef(null);
  return (
    <div className="border p-4 rounded-lg">
      <p className="font-semibold mb-3">{title}</p>
      <div
        className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100"
        onClick={() => inputRef.current.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt={`${title} preview`}
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <div className="text-center text-gray-500">
            <Upload className="mx-auto h-8 w-8" />
            <p className="mt-2 text-sm">Nhấn để tải ảnh lên</p>
          </div>
        )}
      </div>
      <input
        type="file"
        ref={inputRef}
        onChange={onImageChange}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
};

export default AccountProfile;
