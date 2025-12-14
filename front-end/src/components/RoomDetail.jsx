// src/components/RoomDetail.jsx
import { useState } from "react";
import BookingModal from "./modals/Booking/BookingModal";

const RoomDetail = ({ room, onClose }) => {
  if (!room) return null;
  // Mặc định hiển thị ảnh chính của phòng, hoặc ảnh đầu tiên trong danh sách
  const imageList = [room.image, ...(room.images || [])];
  const [activeImage, setActiveImage] = useState(imageList[0]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const formatVND = (v) => (v || 0).toLocaleString("vi-VN");

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 overflow-y-auto">
        <div className="bg-gray-50 p-5 rounded-lg w-full max-w-7xl h-full max-h-[95vh] relative flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl z-10"
            aria-label="Đóng"
          >
            ✖
          </button>

          <div className="flex-grow overflow-y-auto">
            <div className="flex flex-col lg:flex-row gap-5">
              {/* --- CỘT TRÁI: ẢNH & HÀNH ĐỘNG --- */}
              <div className="w-full lg:w-[717px] flex-shrink-0">
                {/* Gallery ảnh */}
                <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-200">
                  <img
                    src={activeImage}
                    alt={room.name}
                    className="w-full h-[440px] object-cover rounded-md mb-2.5"
                  />
                  <div className="flex justify-center items-center gap-2.5 mb-2.5">
                    {imageList.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className={`w-2.5 h-2.5 rounded-full ${
                          activeImage === img ? "bg-black" : "bg-gray-300"
                        }`}
                        aria-label={`Xem ảnh ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2.5">
                    {imageList.map((img, idx) => (
                      <button key={idx} onClick={() => setActiveImage(img)}>
                        <img
                          src={img}
                          alt={`Thumb ${idx + 1}`}
                          className={`w-[100px] h-[100px] object-cover rounded-md ${
                            activeImage === img
                              ? "ring-2 ring-black"
                              : "opacity-70"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Liên hệ & đặt lịch */}
                <div className="mt-3.5 flex flex-wrap justify-between items-center gap-4">
                  <a
                    href={`tel:${room.phone || "0938554128"}`}
                    className="flex items-center justify-center gap-4 bg-black text-white px-5 py-2.5 rounded-md text-lg font-semibold flex-grow"
                  >
                    📞 {room.phone || "0938 554 128"}
                  </a>
                  <a
                    href={room.zalo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-md text-lg font-semibold flex-grow"
                  >
                    💬 Nhắn Zalo
                  </a>
                  <button
                    onClick={() => setIsBookingOpen(true)}
                    className="bg-black text-white px-10 py-2.5 rounded-md text-lg font-semibold flex-grow"
                  >
                    Đặt lịch
                  </button>
                </div>

                {/* Lưu ý */}
                <div className="mt-3.5 text-base text-black">
                  <span className="font-medium">Lưu ý:</span> Đặt lịch trước ít
                  nhất 01 ngày để chủ trọ chuẩn bị phòng và sắp xếp thời gian
                  tiếp đón.
                </div>
              </div>

              {/* --- CỘT PHẢI: THÔNG TIN CHI TIẾT --- */}
              {isBookingOpen ? (
                <div className="w-full lg:w-[482px] flex-shrink-0">
                  <BookingModal
                    room={room}
                    onClose={() => setIsBookingOpen(false)}
                    isEmbedded={true}
                  />
                </div>
              ) : (
                <div className="w-full lg:w-[482px] flex-shrink-0 flex flex-col gap-5">
                  {/* Thông tin cơ bản */}
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    <h2 className="text-3xl font-bold text-center h-[68px] flex items-center justify-center">
                      {room.name}
                    </h2>
                    <div className="space-y-2 text-lg font-bold">
                      <p>Số phòng: {room.roomNumber || "020"}</p>
                      <p>Địa chỉ: {room.address}</p>
                      <p>Diện tích: {room.area} m²</p>
                      <p>Số người tối đa: {room.capacity} người</p>
                      <p>Trạng thái: {room.status || "Chưa thuê"}</p>
                    </div>
                  </div>

                  {/* Giá thuê & chi phí */}
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-3">
                    <h3 className="text-2xl font-bold mb-2">Giá thuê</h3>
                    <p className="text-lg flex justify-between">
                      <span>Giá thuê:</span>{" "}
                      <span className="font-bold">
                        {formatVND(room.price)}đ
                      </span>
                    </p>
                    <p className="text-lg flex justify-between">
                      <span>Tiền điện:</span>{" "}
                      <span className="font-bold">4.000đ/kwh</span>
                    </p>
                    <p className="text-lg flex justify-between">
                      <span>Tiền nước:</span>{" "}
                      <span className="font-bold">50.000đ/người</span>
                    </p>
                    <p className="text-lg flex justify-between">
                      <span>Tiền cọc:</span>{" "}
                      <span className="font-bold">
                        {formatVND(room.price)}đ
                      </span>
                    </p>
                  </div>

                  {/* Tiện ích */}
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-2xl font-bold mb-3 h-10 flex items-center">
                      Tiện ích
                    </h3>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                      {[
                        "Khu vực đông dân cư",
                        "Bãi giữ xe rộng rãi",
                        "Rộng rãi thoáng mát",
                        "Vị trí thuận lợi",
                        "Vệ sinh sạch sẽ",
                        "Không bị ngập",
                        "Có gác",
                        "Có máy lạnh",
                      ].map((util, i) => (
                        <li key={i}>{util}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomDetail;
