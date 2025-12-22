import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaEdit, FaTrashAlt, FaPlus, FaArrowLeft, FaSave, FaTimes } from "react-icons/fa";
import { toast } from "sonner";
import { roomTypeService } from "@/services/roomTypeService";

export default function RoomTypeManagerModal({ isOpen, onClose }) {
  // States
  const [view, setView] = useState("LIST"); // "LIST" | "FORM"
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ id: null, name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load danh sách khi mở modal hoặc khi quay lại view LIST
  useEffect(() => {
    if (isOpen && view === "LIST") {
      fetchTypes();
    }
  }, [isOpen, view]);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await roomTypeService.getSimpleList();
      // Logic fallback: nếu API trả về { data: items } hoặc mảng trực tiếp
      const data = res?.data?.items || (Array.isArray(res?.data) ? res.data : []);
      setTypes(data);
    } catch (error) {
      console.error("Lỗi API:", error);
      // Không hiển thị toast lỗi liên tục nếu backend đang chết, chỉ log ra console
    } finally {
      setLoading(false);
    }
  };

  // Chuyển sang chế độ Thêm mới
  const handleCreate = () => {
    setFormData({ id: null, name: "" });
    setView("FORM");
  };

  // Chuyển sang chế độ Sửa
  const handleEdit = (type) => {
    setFormData({ id: type.id, name: type.name });
    setView("FORM");
  };

  // Xử lý Lưu
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning("Vui lòng nhập tên loại phòng");
      return;
    }

    setIsSubmitting(true);
    try {
      if (formData.id) {
        await roomTypeService.update(formData.id, { name: formData.name });
        toast.success("Cập nhật thành công");
      } else {
        await roomTypeService.create({ name: formData.name });
        toast.success("Thêm mới thành công");
      }
      fetchTypes(); // Refresh data trước khi chuyển view
      setView("LIST");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý Xóa
  const handleDelete = async (id) => {
    if (window.confirm("Xóa loại phòng này?")) {
      try {
        await roomTypeService.delete(id);
        toast.success("Đã xóa");
        fetchTypes();
      } catch (error) {
        toast.error("Không thể xóa (đang được sử dụng)");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-white text-black p-0 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
          <DialogTitle className="text-lg font-bold">
            {view === "LIST" ? "Quản lý Loại Phòng" : (formData.id ? "Sửa Loại Phòng" : "Thêm Loại Phòng")}
          </DialogTitle>

        </div>

        {/* BODY - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {view === "LIST" ? (
            /* --- VIEW: DANH SÁCH --- */
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 font-medium">Danh sách hiện có:</span>
                <Button 
                  onClick={handleCreate} 
                  size="sm" 
                  className="bg-gray-900 hover:bg-gray-800 text-white gap-2 text-xs h-8 px-3"
                >
                  <FaPlus size={10} /> Thêm mới
                </Button>
              </div>

              {loading ? (
                 <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                 </div>
              ) : types.length > 0 ? (
                <div className="border rounded-lg divide-y bg-white shadow-sm">
                  {types.map((type) => (
                    <div key={type.id} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-sm text-gray-700">{type.name}</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEdit(type)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title="Sửa"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(type.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition"
                          title="Xóa"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 border-2 border-dashed rounded-lg bg-gray-50/50">
                  <p className="text-sm">Chưa có loại phòng nào</p>
                </div>
              )}
            </div>
          ) : (
            /* --- VIEW: FORM --- */
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Tên loại phòng <span className="text-red-500">*</span>
                </label>
                <Input 
                  placeholder="Ví dụ: Studio, Căn hộ 1 ngủ..." 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  autoFocus
                  className="h-10"
                />
              </div>
            </form>
          )}
        </div>

        {/* FOOTER - Nằm cố định dưới cùng */}
        {view === "FORM" && (
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2 shrink-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setView("LIST")}
              disabled={isSubmitting}
              className="h-9 px-4 text-sm hover:bg-gray-100"
            >
              Quay lại
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-gray-900 hover:bg-gray-800 text-white h-9 px-4 text-sm gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Đang lưu..." 
              ) : (
                <> <FaSave size={12}/> Lưu lại </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}