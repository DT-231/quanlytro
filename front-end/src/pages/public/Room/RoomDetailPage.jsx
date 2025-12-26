import React, { useEffect, useState } from "react";
import {
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Maximize2,
  Users,
  Home,
  Zap,
  Droplets,
  Wallet,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import formatPrice from "@/Utils/formatPrice";
import { useParams } from "react-router-dom";
import { roomService } from "@/services/roomService";
import AppointmentBookingForm from "@/components/AppointmentBookingForm";

/**
 * RoomDetailPage - Trang chi tiết phòng cho thuê
 * 
 * Hiển thị thông tin chi tiết phòng với UI hiện đại, tối giản (đen trắng shadcn).
 * Bao gồm gallery ảnh, thông tin cơ bản, giá thuê, tiện ích và các nút liên hệ.
 */
const RoomDetailPage = () => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { id } = useParams();
  const [roomInfor, setRoomInfor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataRoom = async () => {
      setLoading(true);
      try {
        let res = await roomService.getById(id);
        if (res && res.success) {
          setRoomInfor(res.data);
        }
      } catch (error) {
        console.error("Error fetching room:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDataRoom();
  }, [id]);

  const nextImage = () => {
    if (!roomInfor?.photos?.length) return;
    setActiveImageIndex((prev) => (prev + 1) % roomInfor.photos.length);
  };

  const prevImage = () => {
    if (!roomInfor?.photos?.length) return;
    setActiveImageIndex(
      (prev) => (prev - 1 + roomInfor.photos.length) % roomInfor.photos.length
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
          <p className="text-gray-500">Đang tải thông tin phòng...</p>
        </div>
      </div>
    );
  }

  // Lấy màu badge theo trạng thái phòng
  const getStatusColor = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500 text-white";
      case "OCCUPIED":
        return "bg-blue-500 text-white";
      case "MAINTENANCE":
        return "bg-yellow-400 text-gray-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  // Dịch trạng thái sang tiếng Việt
  const getStatusLabel = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "Phòng trống";
      case "OCCUPIED":
        return "Đã thuê";
      case "MAINTENANCE":
        return "Bảo trì";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Full width image gallery */}
      <div className="w-full bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden">
            <img
              src={
                roomInfor?.photos?.length > 0
                  ? roomInfor?.photos?.[activeImageIndex]?.image_base64
                  : "https://placehold.net/1280x720.png?text=Chưa+có+ảnh"
              }
              alt={roomInfor?.room_name || "Ảnh phòng"}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://placehold.net/1280x720.png?text=Lỗi+tải+ảnh";
              }}
              className="w-full h-full object-cover"
            />

            {/* Image counter badge */}
            {roomInfor?.photos?.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                {activeImageIndex + 1} / {roomInfor.photos.length}
              </div>
            )}

            {/* Navigation Arrows */}
            {roomInfor?.photos && roomInfor.photos.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black p-3 rounded-full shadow-lg transition-all hover:scale-105"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black p-3 rounded-full shadow-lg transition-all hover:scale-105"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {roomInfor?.photos && roomInfor.photos.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto justify-center bg-white border-b">
              {roomInfor.photos.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className="flex-shrink-0"
                >
                  <img
                    src={img?.image_base64 || img}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`w-20 h-20 object-cover rounded-lg transition-all ${
                      activeImageIndex === idx
                        ? "ring-2 ring-black ring-offset-2 opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Room Details (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Title & Status */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {roomInfor?.room_name || `Phòng ${roomInfor?.room_number}`}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{roomInfor?.full_address || "Chưa cập nhật địa chỉ"}</span>
                  </div>
                </div>
                <span className={`text-sm px-4 py-1 rounded-full font-medium ${getStatusColor(roomInfor?.status)}`}>
                  {getStatusLabel(roomInfor?.status)}
                </span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Home className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số phòng</p>
                    <p className="font-semibold text-gray-900">{roomInfor?.room_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Maximize2 className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Diện tích</p>
                    <p className="font-semibold text-gray-900">{roomInfor?.area} m²</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Users className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Đang ở / Sức chứa</p>
                    <p className="font-semibold text-gray-900">
                      {roomInfor?.current_occupants ?? 0} / {roomInfor?.capacity} người
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Wallet className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tiền cọc</p>
                    <p className="font-semibold text-gray-900">{formatPrice(roomInfor?.deposit_amount)}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Mô tả chi tiết</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {roomInfor?.description ||
                  "Chủ phòng chưa cung cấp mô tả chi tiết cho phòng này. Vui lòng liên hệ để biết thêm thông tin."}
              </p>
            </div>

            <Separator />

            {/* Utilities */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Tiện ích & Tiện nghi</h2>
              {roomInfor?.utilities && roomInfor.utilities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {roomInfor.utilities.map((util, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{util}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Chưa cập nhật thông tin tiện ích.</p>
              )}
            </div>

            <Separator />

            {/* Phí dịch vụ */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Phí dịch vụ hàng tháng</h2>
              {roomInfor?.default_service_fees && roomInfor.default_service_fees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roomInfor.default_service_fees.map((fee, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-700">{fee.name}</span>
                        {fee.description && (
                          <p className="text-sm text-gray-500">{fee.description}</p>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">{formatPrice(fee.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Không có phí dịch vụ bổ sung.</p>
              )}
            </div>
          </div>

          {/* Right Column - Pricing & Actions (1/3 width on large screens) */}
          <div className="space-y-4">
            {/* Sticky Pricing Card */}
            <div className="lg:sticky lg:top-4 space-y-4">
              {/* Price Card */}
              <Card className="border-2 border-black shadow-lg p-4 gap-2">
                <CardHeader className="pb-2 px-0">
                  <CardTitle className="text-2xl font-bold text-center">
                    {formatPrice(roomInfor?.base_price)} <span className="text-base font-normal text-gray-500">VNĐ/tháng</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-0">
                  <Separator />
                  
                  {/* Pricing Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Zap className="w-4 h-4" />
                        <span>Tiền điện</span>
                      </div>
                      <span className="font-medium">{formatPrice(roomInfor?.electricity_price)} /kWh</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Droplets className="w-4 h-4" />
                        <span>Tiền nước</span>
                      </div>
                      <span className="font-medium">{formatPrice(roomInfor?.water_price_per_person)} /người</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Wallet className="w-4 h-4" />
                        <span>Tiền cọc</span>
                      </div>
                      <span className="font-medium">{formatPrice(roomInfor?.deposit_amount)}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <AppointmentBookingForm
                      roomId={id}
                      roomNumber={roomInfor?.room_number}
                      buildingName={roomInfor?.building_name}
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="border-2 border-black hover:bg-gray-100"
                      >
                        <a href="tel:+84934970856" className="flex items-center justify-center gap-2">
                          <Phone className="w-4 h-4" />
                          Gọi ngay
                        </a>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="border-2 border-black hover:bg-gray-100"
                      >
                        <a
                          href="https://zalo.me/+84934970856"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Zalo
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notice Card */}
              <Card className="bg-gray-50 border border-gray-200">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">💡 Lưu ý:</span> Đặt lịch trước
                    ít nhất 01 ngày để chủ trọ chuẩn bị phòng và sắp xếp thời gian
                    tiếp đón bạn.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;
