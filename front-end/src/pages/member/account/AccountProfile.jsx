import React, { useState, useRef, useEffect } from "react";
import { User, Upload, Loader2, Save } from "lucide-react";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const AccountProfile = () => {
  const { user: currentUser, refreshUser } = useAuth();
  
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    cccd: "",
    date_of_birth: "",
    gender: "Nam",
    hometown: "",
  });

  const [previews, setPreviews] = useState({
    avatar: null,
    cccd_front: null,
    cccd_back: null,
  });

  const [existingImages, setExistingImages] = useState({
    avatar: null,
    cccd_front: null,
    cccd_back: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const avatarRef = useRef(null);
  const cccdFrontRef = useRef(null);
  const cccdBackRef = useRef(null);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await authService.getCurrentUser();
        
        if (response && response.success && response.data) {
          const data = response.data;
          
          setProfile({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            phone: data.phone || "",
            email: data.email || "",
            cccd: data.cccd || "",
            date_of_birth: data.date_of_birth || "",
            gender: data.gender || "Nam",
            hometown: data.hometown || "",
          });

          // Parse existing images from documents array
          if (data.documents && Array.isArray(data.documents)) {
            const images = {};
            data.documents.forEach(doc => {
              if (doc.type === "AVATAR") images.avatar = doc.url;
              if (doc.type === "CCCD_FRONT") images.cccd_front = doc.url;
              if (doc.type === "CCCD_BACK") images.cccd_back = doc.url;
            });
            setExistingImages(images);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin người dùng:", err);
        toast.error("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ảnh không được vượt quá 5MB");
        return;
      }

      const base64 = await fileToBase64(file);
      setPreviews((prev) => ({ ...prev, [type]: base64 }));
    }
  };

  const handleSaveChanges = async () => {
    if (!currentUser?.id) {
      toast.error("Không tìm thấy thông tin người dùng");
      return;
    }

    // Validate required fields
    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }

    if (!profile.email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }

    setSaving(true);
    
    try {
      // Build update payload (JSON with base64 images)
      const payload = {
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        phone: profile.phone?.trim() || null,
        cccd: profile.cccd?.trim() || null,
        date_of_birth: profile.date_of_birth || null,
        hometown: profile.hometown?.trim() || null,
      };

      // Add images if new ones were selected
      if (previews.avatar) {
        payload.avatar = previews.avatar;
      }
      if (previews.cccd_front) {
        payload.cccd_front = previews.cccd_front;
      }
      if (previews.cccd_back) {
        payload.cccd_back = previews.cccd_back;
      }

      const result = await userService.update(currentUser.id, payload);
      
      if (result) {
        toast.success("Cập nhật thông tin thành công!");
        // Refresh user context if available
        if (refreshUser) {
          await refreshUser();
        }
        // Clear previews after successful save
        setPreviews({
          avatar: null,
          cccd_front: null,
          cccd_back: null,
        });
        // Reload to get updated images
        window.location.reload();
      }
    } catch (err) {
      console.error("Update error:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Cập nhật thất bại";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white p-6 md:p-8 rounded-xl shadow-lg flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 md:p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-8 border-b pb-4">
        Thông tin cá nhân
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
        {/* Left Column - Basic Info */}
        <div>
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-6">
            <div className="w-28 h-28 rounded-full border-2 border-gray-200 flex items-center justify-center bg-gray-100 overflow-hidden">
              {previews.avatar || existingImages.avatar ? (
                <img
                  src={previews.avatar || existingImages.avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-14 h-14 text-gray-400" />
              )}
            </div>
            <input
              type="file"
              ref={avatarRef}
              onChange={(e) => handleImageChange(e, "avatar")}
              className="hidden"
              accept="image/*"
            />
            <button
              onClick={() => avatarRef.current.click()}
              className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Đổi ảnh đại diện
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-sm">Họ:</label>
                <input
                  name="first_name"
                  className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  value={profile.first_name}
                  onChange={handleInputChange}
                  placeholder="Nguyễn"
                />
              </div>
              <div>
                <label className="font-semibold text-sm">Tên:</label>
                <input
                  name="last_name"
                  className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  value={profile.last_name}
                  onChange={handleInputChange}
                  placeholder="Văn A"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-sm">Số điện thoại:</label>
              <input
                name="phone"
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                value={profile.phone}
                onChange={handleInputChange}
                placeholder="0901234567"
              />
            </div>

            <div>
              <label className="font-semibold text-sm">Email:</label>
              <input
                name="email"
                type="email"
                className="w-full mt-1 p-2 border rounded-md bg-gray-100 cursor-not-allowed"
                value={profile.email}
                disabled
                title="Email không thể thay đổi"
              />
              <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
            </div>

            <div>
              <label className="font-semibold text-sm">Số CCCD:</label>
              <input
                name="cccd"
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                value={profile.cccd}
                onChange={handleInputChange}
                placeholder="001234567890"
                maxLength={12}
              />
            </div>

            <div>
              <label className="font-semibold text-sm">Ngày sinh:</label>
              <input
                name="date_of_birth"
                type="date"
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                value={profile.date_of_birth}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="font-semibold text-sm">Quê quán:</label>
              <input
                name="hometown"
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                value={profile.hometown}
                onChange={handleInputChange}
                placeholder="Đà Nẵng"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 border-t pt-6 flex justify-end">
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="w-48 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Documents */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Tài liệu và hình ảnh</h3>

          <div className="space-y-6">
            <ImageUploader
              title="Ảnh CCCD mặt trước"
              preview={previews.cccd_front}
              existingImage={existingImages.cccd_front}
              onImageChange={(e) => handleImageChange(e, "cccd_front")}
              inputRef={cccdFrontRef}
            />
            <ImageUploader
              title="Ảnh CCCD mặt sau"
              preview={previews.cccd_back}
              existingImage={existingImages.cccd_back}
              onImageChange={(e) => handleImageChange(e, "cccd_back")}
              inputRef={cccdBackRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageUploader = ({ title, preview, existingImage, onImageChange, inputRef }) => {
  const displayImage = preview || existingImage;
  
  return (
    <div className="border p-4 rounded-lg">
      <p className="font-semibold mb-3">{title}</p>
      <div
        className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => inputRef.current.click()}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={`${title} preview`}
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <div className="text-center text-gray-500">
            <Upload className="mx-auto h-8 w-8" />
            <p className="mt-2 text-sm">Nhấn để tải ảnh lên</p>
            <p className="text-xs text-gray-400">Tối đa 5MB</p>
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
      {preview && (
        <p className="text-xs text-green-600 mt-2">✓ Ảnh mới đã được chọn</p>
      )}
    </div>
  );
};

export default AccountProfile;
