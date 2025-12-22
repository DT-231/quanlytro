import React, { useEffect, useState } from "react";
import {
  Phone,
  MessageCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import formatPrice from "@/Utils/formatPrice";
import { useParams } from "react-router-dom";
import { roomService } from "@/services/roomService";

const RoomDetailPage = () => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { id } = useParams();
  const [roomInfor, setRoomInfor] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    note: "",
    agree: false,
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (checked) => {
    setBookingForm((prev) => ({
      ...prev,
      agree: checked,
    }));
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingForm.agree) {
      alert("Vui lòng đồng ý với điều khoản trước khi đặt lịch");
      return;
    }
    console.log("Booking data:", bookingForm);
    // TODO: Call API to submit booking
    alert("Đặt lịch thành công!");
    setIsBookingOpen(false);
    setBookingForm({
      fullName: "",
      phone: "",
      email: "",
      date: "",
      time: "",
      note: "",
      agree: false,
    });
  };

  const closeBookingModal = () => {
    setIsBookingOpen(false);
    setBookingForm({
      fullName: "",
      phone: "",
      email: "",
      date: "",
      time: "",
      note: "",
      agree: false,
    });
  };

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

              <Button
                size="lg"
                className="bg-black hover:bg-gray-800 text-white"
                onClick={() => setIsBookingOpen(true)}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Đặt lịch
              </Button>
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

        {/* Booking Modal Placeholder */}
        {isBookingOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              {/* Close Button */}
              <button
                onClick={closeBookingModal}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <CardHeader>
                <CardTitle className="text-2xl">Đặt lịch xem phòng</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Người xem phòng cần cung cấp họ tên, số điện thoại, thời gian
                  mong muốn và phòng muốn xem.
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Full Name and Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Họ tên
                      </label>
                      <Input
                        type="text"
                        name="fullName"
                        placeholder="Nguyễn Văn A"
                        value={bookingForm.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Số điện thoại
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        placeholder="12312312323"
                        value={bookingForm.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Email, Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={bookingForm.email}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Ngày
                      </label>
                      <Input
                        type="date"
                        name="date"
                        value={bookingForm.date}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Giờ
                      </label>
                      <Input
                        type="time"
                        name="time"
                        value={bookingForm.time}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ghi chú
                    </label>
                    <Textarea
                      name="note"
                      placeholder="Ghi chú các mong muốn của bạn để (chủ trọ) có thể chuẩn bị trước"
                      value={bookingForm.note}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full resize-none"
                    />
                  </div>

                  {/* Agreement Checkbox */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agree"
                      checked={bookingForm.agree}
                      onCheckedChange={handleCheckboxChange}
                      className="mt-1"
                    />
                    <label
                      htmlFor="agree"
                      className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                    >
                      Tôi đồng ý đặt lịch xem phòng và xác nhận thông tin là
                      chính xác.{" "}
                      <span className="text-gray-500">
                        Lưu ý: đặt trước 1 ngày
                      </span>
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={closeBookingModal}
                    >
                      Huỷ
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-black hover:bg-gray-800 text-white"
                      disabled={!bookingForm.agree}
                    >
                      Đặt lịch
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomDetailPage;
