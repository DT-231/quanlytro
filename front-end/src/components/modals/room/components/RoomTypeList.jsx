import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { roomTypeService } from "@/services/roomTypeService"; // Import service của bạn
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal"; // Import Modal Xóa
import { Button } from "@/components/ui/button"; // Ví dụ dùng Button của shadcn
import { Pencil, Trash2 } from "lucide-react"; // Icon

export default function RoomTypeList({ onCreate, onEdit }) {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE CHO MODAL XÓA ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // 1. Hàm tải dữ liệu
  const fetchRoomTypes = async () => {
    try {
      setLoading(true);

      const res = await roomTypeService.getSimpleList({ is_active: true });

      setRoomTypes(res.data?.data || res.data || []); 
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách loại phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomTypes();
  }, []);


  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await roomTypeService.delete(itemToDelete.id);
      
      toast.success(`Đã xóa "${itemToDelete.name}"`);
      
      // Refresh lại danh sách sau khi xóa
      fetchRoomTypes(); 
    } catch (error) {
      console.error(error);
      toast.error("Xóa thất bại");
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  if (loading) return <div className="text-center py-4">Đang tải...</div>;

  return (
    <div className="space-y-4">
      {/* Nút thêm mới */}
      <div className="flex justify-end">
        <Button onClick={onCreate} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          + Thêm mới
        </Button>
      </div>

      {/* Danh sách */}
      <div className="border rounded-md">
        {roomTypes.length === 0 ? (
          <p className="p-4 text-center text-gray-500">Chưa có loại phòng nào.</p>
        ) : (
          <ul className="divide-y">
            {roomTypes.map((item) => (
              <li key={item.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-medium">{item.name}</p>
                </div>
                
                <div className="flex gap-2">
                  {/* Nút Sửa */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEdit(item)}
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  {/* Nút Xóa */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteClick(item)}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete?.name}
        itemType="Loại phòng"
      />
    </div>
  );
}