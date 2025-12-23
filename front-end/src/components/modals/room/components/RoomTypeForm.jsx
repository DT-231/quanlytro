import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaSave } from "react-icons/fa";
import { toast } from "sonner";
import { roomTypeService } from "@/services/roomTypeService";

export default function RoomTypeForm({ initialData, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    name: initialData?.name || "",
    description: initialData?.description || "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

 const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning("Vui lòng nhập tên loại phòng");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || "", 
        is_active: true,                   
      };
      
      if (formData.id) {
        await roomTypeService.update(formData.id, payload);
        toast.success("Cập nhật thành công");
      } else {
        // Gửi payload thay vì chỉ gửi formData
        await roomTypeService.create(payload);
        toast.success("Thêm mới thành công");
      }
      onSuccess(); 
    } catch (error) {
      console.error("Lỗi chi tiết:", error);
      
      // Xử lý hiển thị lỗi từ Backend
      if (error.response) {
          // Nếu backend trả về thông báo lỗi cụ thể (ví dụ: Tên đã tồn tại)
          const serverMessage = error.response.data?.detail || error.response.data?.message;
          toast.error(serverMessage || "Lỗi máy chủ (" + error.response.status + ")");
      } else {
          toast.error("Không thể kết nối đến máy chủ");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col h-full">
      {/* Form Content */}
      <div className="flex-1 p-1">
        <form id="room-type-form" onSubmit={handleSave} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Tên loại phòng <span className="text-red-500">*</span>
            </label>
            <Input 
              placeholder="Ví dụ: Studio, Căn hộ 1 ngủ..." 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              autoFocus
            />
          </div>
        </form>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-9 px-4 text-sm"
        >
          Quay lại
        </Button>
        <Button 
          form="room-type-form" // Link button với form ở trên
          type="submit"
          className="bg-gray-900 hover:bg-gray-800 text-white h-9 px-4 text-sm gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang lưu..." : <><FaSave size={12}/> Lưu lại</>}
        </Button>
      </div>
    </div>
  );
}