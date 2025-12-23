import React, { useState, useMemo } from "react";
import {
  FaTimes,
  FaInfoCircle,
  FaImage,
  FaBuilding,
  FaTag,
  FaAlignLeft,
  FaMoneyBillWave,
  FaBolt,
  FaTint,
  FaRulerCombined,
  FaBed,
  FaCheckCircle,
  FaUserFriends,
  FaPhone,
} from "react-icons/fa";
import { Image as LucideImage } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const RoomDetailModal = ({ isOpen, onClose, room, loading }) => {
  const [activeTab, setActiveTab] = useState("info");

  const activeAmenities = useMemo(() => {
    if (!room || !room.utilities) return [];
    if (Array.isArray(room.utilities)) return room.utilities;
    if (typeof room.utilities === "string")
      return room.utilities.split(",").map((u) => u.trim());
    return [];
  }, [room]);

  const roomImages = useMemo(() => {
    if (!room || !room.photos || !Array.isArray(room.photos)) return [];
    return room.photos
      .map((item) => item?.image_base64 || item?.url || null)
      .filter((img) => img);
  }, [room]);

  const getStringValue = (val) => {
    if (!val) return "N/A";
    if (typeof val === "string") return val;
    if (val.name) return val.name;
    if (val.label) return val.label;
    return String(val);
  };

  if (!isOpen) return null;

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
      <span
        className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wide ${
          styles[status] || "bg-gray-100"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const formatMoney = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);

  // Helper để lấy danh sách người thuê (tương thích cả data cũ và mới)
  const tenantList =
    room?.tenants || (room?.tenant_info ? [room.tenant_info] : []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-white text-black max-h-[90vh] flex flex-col gap-0 shadow-lg overflow-hidden">
        <div className="p-5 pb-0 border-b border-gray-100">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-800">
              Chi tiết phòng {room?.room_number}
            </DialogTitle>
          </DialogHeader>

          {/* TABS HEADER */}
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("info")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "info"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaInfoCircle /> Thông tin
            </button>
            <button
              onClick={() => setActiveTab("images")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "images"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaImage /> Hình ảnh
              {roomImages.length > 0 && (
                <span className="ml-1 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-bold text-gray-600">
                  {roomImages.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* --- BODY --- */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/30 [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-10 gap-2 text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <p className="text-xs">Đang tải dữ liệu...</p>
            </div>
          ) : room ? (
            <>
              {/* === TAB 1: THÔNG TIN === */}
              {activeTab === "info" && (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  {/* 1. Thông tin cơ bản */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full pr-2">
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                            <FaBuilding className="text-gray-400" /> Tòa nhà
                          </label>
                          <p className="text-sm font-bold text-gray-900">
                            {getStringValue(room.building_name)}
                          </p>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                            <FaTag className="text-gray-400" /> Tên phòng
                          </label>
                          <p className="text-sm font-bold text-gray-900">
                            {room.room_name || room.room_number || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(room.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 mt-2">
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">
                          Loại phòng
                        </label>
                        <span className="text-sm font-medium text-gray-700">
                          {getStringValue(room.room_type)}
                        </span>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">
                          Diện tích
                        </label>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FaRulerCombined
                            className="text-gray-400"
                            size={12}
                          />
                          <span className="text-sm font-medium">
                            {room.area} m²
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">
                          Sức chứa
                        </label>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FaBed className="text-gray-400" size={12} />
                          <span className="text-sm font-medium">
                            {room.capacity} người
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">
                          Đang ở
                        </label>
                        <span className="text-sm font-bold text-blue-600">
                          {room.current_occupants || 0} người
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Mô tả */}
                  {room.description && (
                    <div>
                      <Label className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1 uppercase">
                        <FaAlignLeft className="text-gray-500" /> Mô tả
                      </Label>
                      <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-600 shadow-sm leading-relaxed">
                        {room.description}
                      </div>
                    </div>
                  )}

                  {/* 3. Chi phí */}
                  <div>
                    <Label className="text-xs font-bold text-gray-800 mb-2 block uppercase">
                      Bảng giá & Chi phí
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded border border-gray-200 flex justify-between items-center shadow-sm">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FaMoneyBillWave className="text-green-600" /> Giá
                          thuê
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatMoney(room.base_price)}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded border border-gray-200 flex justify-between items-center shadow-sm">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          Cọc
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatMoney(room.deposit_amount)}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded border border-gray-200 flex justify-between items-center shadow-sm">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FaBolt className="text-yellow-500" /> Điện
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatMoney(
                            room.electricity_cost || room.electricity_price
                          )}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded border border-gray-200 flex justify-between items-center shadow-sm">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FaTint className="text-blue-500" /> Nước
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatMoney(
                            room.water_cost || room.water_price_per_person
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Tiện ích */}
                  <div>
                    <Label className="text-xs font-bold text-gray-800 mb-2 block uppercase">
                      Tiện ích
                    </Label>
                    {activeAmenities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {activeAmenities.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm"
                          >
                            <FaCheckCircle
                              className="text-green-600"
                              size={10}
                            />
                            <span className="text-xs font-medium text-gray-700">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">
                        Không có tiện ích nào.
                      </div>
                    )}
                  </div>

                  {/* 5. DANH SÁCH NGƯỜI THUÊ (LOGIC MỚI) */}
                  <div>
                    <Label className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1 uppercase">
                      <FaUserFriends className="text-blue-600" /> Danh sách
                      người thuê ({tenantList.length})
                    </Label>

                    {tenantList.length > 0 ? (
                      <div className="space-y-2">
                        {tenantList.map((tenant, idx) => (
                          <div
                            key={idx}
                            className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                {tenant.name || tenant.tenant_name}
                                {(tenant.is_representative ||
                                  tenant.representative) && (
                                  <span className="text-[9px] bg-yellow-400 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-sm">
                                    Đại diện
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                <FaPhone size={10} />{" "}
                                {tenant.phone ||
                                  tenant.tenant_phone ||
                                  "SĐT: N/A"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center bg-gray-50">
                        <p className="text-xs text-gray-400 italic">
                          Chưa có người thuê
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === TAB 2: HÌNH ẢNH === */}
              {activeTab === "images" && (
                <div className="animate-in fade-in duration-200 min-h-[300px]">
                  {roomImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {roomImages.map((imgUrl, index) => (
                        <div
                          key={index}
                          className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                        >
                          <img
                            src={imgUrl}
                            alt={`Room Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://placehold.co/600x400?text=Error+Loading+Image";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                      <LucideImage size={48} className="opacity-20 mb-2" />
                      <p className="text-sm font-medium">
                        Chưa có hình ảnh nào
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-red-500 text-sm">
              Không tìm thấy dữ liệu phòng.
            </div>
          )}
        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
          <Button
            onClick={onClose}
            className="bg-white border border-gray-300 text-black hover:bg-gray-100 px-6 h-9 text-sm shadow-sm transition-all hover:shadow"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailModal;
