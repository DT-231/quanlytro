import React, { useState, useRef, useEffect } from "react";
import { User, Upload } from "lucide-react";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";

const AccountProfile = ({ currentUser, userId }) => {
  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    email: "",
    cccd: "",
    relativeName: "",
    relativePhone: "",
    avatar: "",
  });

  const [previews, setPreviews] = useState({
    avatar: null,
    cccd: null,
    residence: null,
  });

  const fileInputRef = useRef(null);
  const cccdRef = useRef(null);
  const residenceRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getCurrentUser();
        setProfile({
          fullName: `${data.first_name || ""} ${data.last_name || ""}`,
          phone: data.phone || "",
          email: data.email || "",
          cccd: data.cccd || "",
          relativeName: data.relativeName || "",
          relativePhone: data.relativePhone || "",
          avatar: data.avatar || "/images/avatar-default.png",
        });
      } catch (err) {
        console.error("Lỗi khi tải thông tin người dùng:", err);
      }
    };

    fetchProfile();
  }, []);

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

  const handleSaveChanges = async () => {
    let canUpdate = false;

    if (currentUser?.role === "ADMIN") {
      canUpdate = true;
    } else if (currentUser?.role === "CUSTOMER" && currentUser?.id === userId) {
      canUpdate = true;
    }

    if (!canUpdate) {
      alert("Bạn không có quyền cập nhật thông tin người dùng này.");
      return;
    }

    const formData = new FormData();
    const [firstName, ...lastNameParts] = profile.fullName.split(" ");
    formData.append("first_name", firstName);
    formData.append("last_name", lastNameParts.join(" "));
    formData.append("email", profile.email);
    formData.append("phone", profile.phone);
    formData.append("cccd", profile.cccd);
    formData.append("relativeName", profile.relativeName);
    formData.append("relativePhone", profile.relativePhone);

    if (fileInputRef.current?.files[0]) {
      formData.append("avatar", fileInputRef.current.files[0]);
    }
    if (cccdRef.current?.files[0]) {
      formData.append("cccd_image", cccdRef.current.files[0]);
    }
    if (residenceRef.current?.files[0]) {
      formData.append("residence_image", residenceRef.current.files[0]);
    }

    try {
      const updated = await userService.update(userId, formData);
      alert("Cập nhật thành công!");
      console.log("Thông tin mới:", updated);
    } catch (err) {
      alert(`Cập nhật thất bại: ${err.message}`);
    }
  };

  return (
    <div className="w-full bg-white p-6 md:p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-8 border-b pb-4">
        Thông tin cá nhân
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
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
              <input
                name="fullName"
                className="w-full mt-1 p-2 border rounded-md"
                value={profile.fullName || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="font-semibold">Số điện thoại:</label>
              <input
                name="phone"
                className="w-full mt-1 p-2 border rounded-md"
                value={profile.phone || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="font-semibold">Email:</label>
              <input
                name="email"
                className="w-full mt-1 p-2 border rounded-md"
                value={profile.email || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="font-semibold">CCCD:</label>
              <input
                name="cccd"
                className="w-full mt-1 p-2 border rounded-md"
                value={profile.cccd || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="font-semibold">Người thân:</label>
              <div className="flex gap-3 mt-1">
                <input
                  name="relativeName"
                  className="w-1/2 p-2 border rounded-md"
                  value={profile.relativeName || ""}
                  onChange={handleInputChange}
                  placeholder="Họ tên người thân"
                />
                <input
                  name="relativePhone"
                  className="w-1/2 p-2 border rounded-md"
                  value={profile.relativePhone || ""}
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

        <div>
          <h3 className="text-xl font-semibold mb-4">Tài liệu và hình ảnh</h3>

          <div className="space-y-6">
            <ImageUploader
              title="Ảnh CCCD/CMND"
              preview={previews.cccd}
              onImageChange={(e) => handleImageChange(e, "cccd")}
              inputRef={cccdRef}
            />
            <ImageUploader
              title="Ảnh đăng ký tạm trú"
              preview={previews.residence}
              onImageChange={(e) => handleImageChange(e, "residence")}
              inputRef={residenceRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageUploader = ({ title, preview, onImageChange, inputRef }) => {
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
