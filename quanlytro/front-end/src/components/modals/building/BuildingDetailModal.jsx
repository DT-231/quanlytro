import React, { useMemo } from "react";
import { 
  FaTimes, 
  FaMapMarkerAlt, 
  FaClock, 
  FaInfoCircle, 
  FaCheckCircle 
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

// Danh sách chuẩn để đối chiếu
const AMENITIES_LIST = [
  { id: "pool", label: "Hồ bơi" },
  { id: "elevator", label: "Thang máy" },
  { id: "camera", label: "Camera" },
  { id: "security", label: "Bảo vệ" },
  { id: "parking", label: "Giữ xe" },
  { id: "gym", label: "Gym" },
  { id: "wifi", label: "Wifi" },
  { id: "air-conditioner", label: "Điều hòa" },
];

const BuildingDetailModal = ({ isOpen, onClose, building, loading }) => {
  if (!isOpen) return null;

  // --- XỬ LÝ DỮ LIỆU ---
  const { cleanDescription, activeAmenitiesLabels, formattedAddress } = useMemo(() => {
    if (!building) return { cleanDescription: "", activeAmenitiesLabels: [], formattedAddress: "" };

    // 1. Tách Mô tả và Tiện ích
    const fullDesc = building.description || "";
    const match = fullDesc.match(/\[Tiện ích: (.*?)\]/);
    
    let cleanDesc = fullDesc;
    let foundAmenities = [];

    if (match && match[1]) {
      const utilsStr = match[1].split(",").map(s => s.trim().toLowerCase());
      // Lọc ra các tiện ích có trong danh sách chuẩn
      foundAmenities = AMENITIES_LIST.filter(item => 
        utilsStr.includes(item.label.toLowerCase())
      );
      cleanDesc = fullDesc.replace(match[0], "").trim();
    }

    // 2. Xử lý Địa chỉ (Logic cải tiến để bắt được mọi trường hợp)
    let addr = "Chưa cập nhật địa chỉ";

    // Trường hợp 1: API trả về object address lồng nhau (chuẩn RESTful thường dùng)
    if (building.address && typeof building.address === 'object') {
        addr = building.address.full_address 
            || building.address.address_line 
            || `${building.address.street || ''}, ${building.address.city || ''}`;
    } 
    // Trường hợp 2: API trả về string phẳng ngay bên ngoài
    else if (building.full_address) {
        addr = building.full_address;
    } 
    else if (building.address_line) {
        addr = building.address_line;
    }

    // Xóa các dấu phẩy dư thừa nếu dữ liệu bị rỗng 1 phần
    addr = addr.replace(/^,\s*/, '').replace(/,\s*$/, ''); 

    return { 
      cleanDescription: cleanDesc || "Không có mô tả thêm.", 
      activeAmenitiesLabels: foundAmenities, 
      formattedAddress: addr
    };
  }, [building]);

  // Helper render Badge trạng thái
  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: "bg-green-100 text-green-700 border-green-200",
      INACTIVE: "bg-red-100 text-red-700 border-red-200",
      SUSPENDED: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    const labels = {
      ACTIVE: "Đang hoạt động",
      INACTIVE: "Ngừng hoạt động",
      SUSPENDED: "Tạm dừng",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wide ${styles[status] || "bg-gray-100"}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-white text-black max-h-[90vh] flex flex-col gap-0 shadow-lg">
        
        {/* --- HEADER --- */}
        <div className="p-5 pb-3 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <FaInfoCircle className="text-gray-900" size={18} />
              Chi tiết tòa nhà
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-1">
              Thông tin chi tiết
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
          ) : building ? (
            <>
              {/* 1. Thông tin chính */}
              <div className="bg-gray-50/80 p-4 rounded-lg border border-gray-100 space-y-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">Tên tòa nhà</label>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-gray-900">{building.name || building.building_name}</p>
                    {getStatusBadge(building.status)}
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-200/50">
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">Địa chỉ</label>
                  <div className="flex items-start gap-2 text-gray-700">
                    <FaMapMarkerAlt className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                    <span className="text-sm font-medium leading-snug">{formattedAddress}</span>
                  </div>
                </div>
              </div>

              {/* 2. Thống kê (Dữ liệu từ Backend) */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                  <span className="block text-xl font-black text-blue-600">{building.total_rooms || 0}</span>
                  <span className="text-[10px] font-bold text-blue-400 uppercase">Tổng phòng</span>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-center">
                   <span className="block text-xl font-black text-red-500">{building.available_rooms || 0}</span>
                   <span className="text-[10px] font-bold text-red-400 uppercase">Còn trống</span>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-center">
                   <span className="block text-xl font-black text-green-600">{building.rented_rooms || 0}</span>
                   <span className="text-[10px] font-bold text-green-400 uppercase">Đang thuê</span>
                </div>
              </div>

              {/* 3. Mô tả */}
              <div>
                <Label className="text-sm font-bold text-gray-800 mb-2 block">Mô tả</Label>
                <div className="bg-white p-3 rounded-md border border-gray-200 text-sm text-gray-600 min-h-[60px] whitespace-pre-line">
                  {cleanDescription}
                </div>
              </div>

              {/* 4. Tiện ích */}
              <div>
                <Label className="text-sm font-bold text-gray-800 mb-2 block">Tiện ích đang có</Label>
                {activeAmenitiesLabels.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {activeAmenitiesLabels.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                        <FaCheckCircle className="text-green-600 flex-shrink-0" size={14} />
                        <span className="text-sm font-medium text-gray-900">{item.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic p-2 bg-gray-50 rounded border border-dashed border-gray-200">
                    Không có tiện ích nào được ghi nhận.
                  </div>
                )}
              </div>

              {/* 5. Footer thông tin */}
              <div className="flex items-center justify-end gap-2 text-xs text-gray-400 mt-2">
                <FaClock size={12}/>
                <span>Ngày tạo: {building.created_at ? new Date(building.created_at).toLocaleDateString('vi-VN') : "N/A"}</span>
              </div>
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

export default BuildingDetailModal;