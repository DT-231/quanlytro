import React, { useMemo } from "react";
import { 
  FaTimes, 
  FaDoorOpen, 
  FaInfoCircle, 
  FaCheckCircle,
  FaBed,
  FaRulerCombined,
  FaMoneyBillWave,
  FaBolt,
  FaTint
} from "react-icons/fa";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Danh sách tiện ích chuẩn để đối chiếu
const AMENITIES_LIST = [
  { id: "ac", label: "Điều hoà" },
  { id: "kitchen", label: "Bếp" },
  { id: "bed", label: "Giường" },
  { id: "tv", label: "TV" },
  { id: "balcony", label: "Ban công" },
  { id: "window", label: "Cửa sổ" },
  { id: "wifi", label: "Wifi" },
  { id: "fridge", label: "Tủ lạnh" },
  { id: "wm", label: "Máy giặt" },
];

const RoomDetailModal = ({ isOpen, onClose, room, loading }) => {
  if (!isOpen) return null;

  // --- XỬ LÝ DỮ LIỆU ---
  const activeAmenities = useMemo(() => {
    if (!room || !room.utilities) return [];
    // Nếu API trả về mảng string ["Wifi", "Bếp"] thì dùng luôn
    // Nếu trả về string dài thì split ra
    if (Array.isArray(room.utilities)) {
      return room.utilities; 
    }
    return []; 
  }, [room]);

  // Helper render Badge trạng thái
  const getStatusBadge = (status) => {
    const styles = {
      AVAILABLE: "bg-green-100 text-green-700 border-green-200",
      OCCUPIED: "bg-blue-100 text-blue-700 border-blue-200",
      MAINTENANCE: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    const labels = {
      AVAILABLE: "Còn trống",
      OCCUPIED: "Đang thuê",
      MAINTENANCE: "Đang sửa",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wide ${styles[status] || "bg-gray-100"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-white text-black max-h-[90vh] flex flex-col gap-0 shadow-lg">
        
        {/* --- HEADER --- */}
        <div className="p-5 pb-3 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <FaInfoCircle className="text-gray-900" size={18} />
              Chi tiết phòng {room?.room_number}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-1">
              Thông tin chi tiết phòng trọ
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* --- BODY --- */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-10 gap-2 text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <p className="text-xs">Đang tải dữ liệu...</p>
            </div>
          ) : room ? (
            <>
              {/* 1. Thông tin chung (Box xám) */}
              <div className="bg-gray-50/80 p-4 rounded-lg border border-gray-100 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">Tòa nhà</label>
                    <p className="text-sm font-bold text-gray-900">{room.building_name || "Chưa cập nhật"}</p>
                  </div>
                  {getStatusBadge(room.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200/50">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">Loại phòng</label>
                    <div className="flex items-center gap-2 text-gray-700">
                      <FaDoorOpen className="text-gray-400" size={12} />
                      <span className="text-sm font-medium">{room.room_type}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">Diện tích</label>
                    <div className="flex items-center gap-2 text-gray-700">
                      <FaRulerCombined className="text-gray-400" size={12} />
                      <span className="text-sm font-medium">{room.area} m²</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Chi phí (Grid) */}
              <div>
                <Label className="text-xs font-bold text-gray-800 mb-2 block uppercase">Bảng giá</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded border border-gray-200 flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><FaMoneyBillWave className="text-green-600"/> Giá thuê</span>
                    <span className="text-sm font-bold text-gray-900">{formatMoney(room.base_price)}</span>
                  </div>
                  <div className="p-3 bg-white rounded border border-gray-200 flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center gap-1">Cọc</span>
                    <span className="text-sm font-bold text-gray-900">{formatMoney(room.deposit_amount)}</span>
                  </div>
                  <div className="p-3 bg-white rounded border border-gray-200 flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><FaBolt className="text-yellow-500"/> Điện</span>
                    <span className="text-sm font-bold text-gray-900">{formatMoney(room.electricity_cost)}</span>
                  </div>
                  <div className="p-3 bg-white rounded border border-gray-200 flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><FaTint className="text-blue-500"/> Nước</span>
                    <span className="text-sm font-bold text-gray-900">{formatMoney(room.water_cost)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Tiện ích (Chỉ hiện cái có) */}
              <div>
                <Label className="text-xs font-bold text-gray-800 mb-2 block uppercase">Tiện ích có sẵn</Label>
                {activeAmenities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeAmenities.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-full border border-gray-200">
                        <FaCheckCircle className="text-green-600" size={10} />
                        <span className="text-xs font-medium text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">Không có tiện ích nào.</div>
                )}
              </div>

              {/* 4. Mô tả */}
              {room.description && (
                <div>
                  <Label className="text-xs font-bold text-gray-800 mb-1 block uppercase">Mô tả</Label>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded border border-gray-100">
                    {room.description}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-red-500 text-sm">Không tìm thấy dữ liệu.</div>
          )}
        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <Button onClick={onClose} className="bg-white border border-gray-300 text-black hover:bg-gray-100 px-6 h-9 text-sm shadow-sm">
            Đóng
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailModal;