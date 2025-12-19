import React, { useState, useRef, useEffect } from "react";
import { User, Upload } from "lucide-react";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";

const AccountProfile = () => {
  const [userId, setUserId] = useState("");

  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    email: "",
    cccd: "",
    relativeName: "",
    relativePhone: "",
    avatar: "/img/avatar.png",
    cccdImage: "/img/cccd.jpg",
    residenceImage: "/img/ngoaitru.jpg",
  });

  const [previews, setPreviews] = useState({
    avatar: null,
    cccd: null,
    residence: null,
  });

  const fileInputRef = useRef(null);
  const cccdRef = useRef(null);
  const residenceRef = useRef(null);

  // ===== LOAD USER FROM TOKEN =====
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let response = await authService.getCurrentUser();

        // Đảm bảo response là một object. Nếu là string, parse nó.
        if (typeof response === "string") {
          try {
            response = JSON.parse(response);
          } catch (e) {
            throw new Error("Failed to parse user data from storage.");
          }
        }

        // Xử lý các cấu trúc lồng nhau: response.data (API get-me), response.user (API login), hoặc response
        const userData = response.data || response.user || response;

        if (!userData.id) throw new Error("User ID not found in response");

        setUserId(userData.id);

        // Tìm ảnh đại diện và cccd từ documents
        const avatarDoc = userData.documents?.find(
          (doc) => doc.type === "AVATAR"
        );
        const cccdFrontDoc = userData.documents?.find(
          (doc) => doc.type === "CCCD_FRONT"
        );
        // TODO: Tìm ảnh tạm trú khi backend hỗ trợ

        setProfile({
          fullName: `${userData.first_name || ""} ${
            userData.last_name || ""
          }`.trim(),
          phone: userData.phone || "",
          email: userData.email || "",
          cccd: userData.cccd || "",
          relativeName: userData.relative_name || "",
          relativePhone: userData.relative_phone || "",
          avatar: avatarDoc?.url || "/img/avatar.png",
          cccdImage: cccdFrontDoc?.url || "/img/cccd.jpg",
          residenceImage: "/img/ngoaitru.jpg", // Giữ ảnh mặc định
        });
      } catch (error) {
        console.error("Load user thất bại:", error);
        alert("Không tải được thông tin người dùng");
      }
    };

    fetchProfile();
  }, []);

  // ===== INPUT CHANGE =====
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // ===== IMAGE PREVIEW =====
  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews((prev) => ({ ...prev, [type]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // ===== SAVE =====
  const handleSaveChanges = async () => {
    if (!userId) {
      alert("Không xác định được người dùng");
      return;
    }

    // ===== HIỂN THỊ LOADING HOẶC VÔ HIỆU HÓA NÚT LƯU =====

    try {
      // Tách họ và tên
      const nameParts = profile.fullName.trim().split(" ");
      const lastName = nameParts.pop() || "";
      const firstName = nameParts.join(" ");

      // 1. Chuẩn bị dữ liệu để cập nhật
      // Bao gồm cả thông tin văn bản và ảnh (dưới dạng base64 nếu có thay đổi)
      const updateData = {
        first_name: firstName,
        last_name: lastName,
        email: profile.email,
        phone: profile.phone,
        cccd: profile.cccd,
        relative_name: profile.relativeName,
        relative_phone: profile.relativePhone,
      };

      // 2. Thêm ảnh (base64) vào payload nếu người dùng có chọn ảnh mới
      // `previews` state đang lưu trữ ảnh mới dưới dạng base64
      if (previews.avatar) {
        updateData.avatar = previews.avatar; // Gửi chuỗi base64
      }
      if (previews.cccd) {
        updateData.cccd_front = previews.cccd; // Gửi chuỗi base64
      }
      // Backend chưa có trường cho ảnh tạm trú, nên tạm thời bỏ qua
      // if (previews.residence) {
      //   updateData.residence_image = previews.residence;
      // }

      // 3. Gọi API một lần duy nhất
      const updatedUser = await userService.update(userId, updateData);

      alert("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Update thất bại:", error);
      alert("Cập nhật thất bại");
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6">Thông tin cá nhân</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* LEFT */}
        <div>
          <div className="flex items-center gap-6 mb-6">
            <div className="w-28 h-28 rounded-full border flex items-center justify-center bg-gray-100 overflow-hidden">
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
              className="hidden"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "avatar")}
            />

            <button
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 bg-black text-white rounded-lg"
            >
              Đổi ảnh đại diện
            </button>
          </div>

          <div className="space-y-4">
            <Input
              label="Họ và tên"
              name="fullName"
              value={profile.fullName}
              onChange={handleInputChange}
            />
            <Input
              label="Số điện thoại"
              name="phone"
              value={profile.phone}
              onChange={handleInputChange}
            />
            <Input
              label="Email"
              name="email"
              value={profile.email}
              onChange={handleInputChange}
            />
            <Input
              label="CCCD"
              name="cccd"
              value={profile.cccd}
              onChange={handleInputChange}
            />

            <div>
              <label className="font-semibold">Người thân:</label>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <div>
                  <label className="font-medium text-gray-600">Họ và tên</label>
                  <input
                    name="relativeName"
                    className="w-full p-2 mt-1 border rounded-md"
                    value={profile.relativeName || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-600">
                    Số điện thoại
                  </label>
                  <input
                    name="relativePhone"
                    className="w-full p-2 mt-1 border rounded-md"
                    value={profile.relativePhone || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-right">
            <button
              onClick={handleSaveChanges}
              className="px-6 py-2 bg-black text-white rounded-lg"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <ImageUploader
            title="Ảnh CCCD/CMND"
            preview={previews.cccd || profile.cccdImage}
            inputRef={cccdRef}
            onImageChange={(e) => handleImageChange(e, "cccd")}
          />
          <ImageUploader
            title="Ảnh đăng ký tạm trú"
            preview={previews.residence || profile.residenceImage}
            inputRef={residenceRef}
            onImageChange={(e) => handleImageChange(e, "residence")}
          />
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    <label className="font-semibold">{label}:</label>
    <input {...props} className="w-full mt-1 p-2 border rounded-md" />
  </div>
);

const ImageUploader = ({ title, preview, inputRef, onImageChange }) => (
  <div className="border p-4 rounded-lg">
    <p className="font-semibold mb-2">{title}</p>
    <div
      className="h-40 border-2 border-dashed rounded flex items-center justify-center cursor-pointer"
      onClick={() => inputRef.current.click()}
    >
      {preview ? (
        <img src={preview} className="h-full object-contain" />
      ) : (
        <Upload />
      )}
    </div>
    <input
      type="file"
      ref={inputRef}
      className="hidden"
      accept="image/*"
      onChange={onImageChange}
    />
  </div>
);

export default AccountProfile;
