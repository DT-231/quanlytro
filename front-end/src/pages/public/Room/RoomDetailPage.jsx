import React, { useEffect, useState } from "react";
import {
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import formatPrice from "@/Utils/formatPrice";
import { useParams } from "react-router-dom";
import { roomService } from "@/services/roomService";
import AppointmentBookingForm from "@/components/AppointmentBookingForm";

const RoomDetailPage = () => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { id } = useParams();
  const [roomInfor, setRoomInfor] = useState(null);

  useEffect(() => {
    const fetchDataRoom = async () => {
      let res = await roomService.getById(id);
      if (res && res.success) {
        console.log(res);
        setRoomInfor(res.data);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-2 lg:p-4">
      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Images & Actions */}
          <div className="space-y-4 ">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-4">
                {/* Main Image */}
                <div className="relative mb-4">
                  <img
                    src={
                      roomInfor?.photos.length > 0
                        ? roomInfor?.photos?.[activeImageIndex].image_base64
                        : "https://placehold.net/1280x720.png?text=Chưa+có+ảnh"
                    }
                    alt={roomInfor?.room_name || "Ảnh phòng"}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://placehold.net/1280x720.png?text=Lỗi+tải+ảnh";
                    }}
                    className="w-full h-[440px] object-cover rounded-sm bg-gray-200"
                  />

                  {/* Navigation, Dots, and Thumbnails - only if more than 1 image */}
                  {roomInfor?.photos && roomInfor.photos.length > 1 && (
                    <>
                      {/* Navigation Arrows */}
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      {/* Dots Indicator */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {roomInfor.photos.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition ${
                              activeImageIndex === idx
                                ? "bg-white"
                                : "bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {roomInfor?.photos && roomInfor.photos.length > 1 && (
                  <div className="flex gap-2 justify-center row-span-1">
                    {roomInfor.photos.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className="flex-shrink-0"
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className={`w-24 h-24 object-cover rounded-md transition ${
                            activeImageIndex === idx
                              ? "ring-2 ring-black opacity-100"
                              : "opacity-60 hover:opacity-80"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                asChild
                size="lg"
                className="bg-black hover:bg-gray-800 text-white"
              >
                <a
                  href={`tel:+84934970856`}
                  className="flex items-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  +84934970856
                </a>
              </Button>

              <Button
                asChild
                size="lg"
                className="bg-black hover:bg-gray-800 text-white"
              >
                <a
                  href="https://zalo.me/+84934970856"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Nhắn Zalo
                </a>
              </Button>

              <AppointmentBookingForm
                roomId={id}
                roomNumber={roomInfor?.room_number}
                buildingName={roomInfor?.building_name}
              />
            </div>

            {/* Notice */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Lưu ý:</span> Đặt lịch trước
                  ít nhất 01 ngày để chủ trọ chuẩn bị phòng và sắp xếp thời gian
                  tiếp đón.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-4">
            {/* Basic Information */}
            <Card className="py-4 gap-2">
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  {roomInfor?.room_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="">
                <div className="flex flex-col gap-3 ">
                  <div className="text-lg">
                    <span className="font-semibold text-xl pr-2">
                      Số phòng:
                    </span>
                    {roomInfor?.room_number}
                  </div>
                  <div className="text-lg">
                    <span className="font-semibold text-xl pr-2">Địa chỉ:</span>{" "}
                    {roomInfor?.full_address}
                  </div>
                  <div className="text-lg">
                    <span className="font-semibold text-xl pr-2">
                      Diện tích:
                    </span>{" "}
                    {roomInfor?.area} m²
                  </div>
                  <div className="text-lg">
                    <span className="font-semibold text-xl pr-2">
                      Số người tối đa:
                    </span>
                    {roomInfor?.capacity} người
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-xl pr-2">
                      Trạng thái:
                    </span>{" "}
                    <Badge
                      variant={
                        roomInfor?.status === "Chưa thuê"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {roomInfor?.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Mô tả chi tiết</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {roomInfor?.description ||
                    "Chủ phòng chưa cung cấp mô tả chi tiết cho phòng này."}
                </p>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="gap-2 py-4">
              <CardHeader>
                <CardTitle className="text-2xl ">Giá thuê</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-xl">Giá thuê:</span>
                  <span className="">
                    {formatPrice(roomInfor?.base_price)} VNĐ
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-xl">Tiền điện:</span>
                  <span>
                    {formatPrice(roomInfor?.electricity_price)} VNĐ/kwh
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-xl">Tiền nước:</span>
                  <span>
                    {" "}
                    {formatPrice(roomInfor?.water_price_per_person)} VNĐ/người
                  </span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-semibold text-xl">Tiền cọc:</span>
                  <span>{formatPrice(roomInfor?.deposit_amount)} VNĐ</span>
                </div>
              </CardContent>
            </Card>

            {/* Utilities */}
            <Card className="py-6 gap-2">
              <CardHeader>
                <CardTitle className="text-2xl ">Tiện ích</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-3 gap-3 text-base">
                  {roomInfor?.utilities?.map((util, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>{util}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;
