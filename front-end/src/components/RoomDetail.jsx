// src/components/RoomDetail.jsx
import { useState } from "react";

const RoomDetail = ({ room, onClose }) => {
  if (!room) return null;
  const [activeImage, setActiveImage] = useState(room.images?.[0]);

  const formatVND = (v) => (v || 0).toLocaleString("vi-VN");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
          aria-label="Đóng"
        >
          ✖
        </button>

        {/* Tiêu đề + thông tin cơ bản */}
        <h2 className="text-2xl font-bold mb-1">{room.name}</h2>
        <div className="text-sm text-gray-600 mb-4">
          Số phòng: {room.roomNumber} • Địa chỉ: {room.address} • Diện tích:{" "}
          {room.area} m² • Số người tối đa: {room.maxPeople} người • Trạng thái:{" "}
          {room.status}
        </div>

        {/* Gallery ảnh */}
        <div className="mb-4">
          <img
            src={activeImage || room.images?.[0]}
            alt={room.name}
            className="w-full h-[360px] object-cover rounded-md"
          />
          {room.images && room.images.length > 1 && (
            <div className="flex gap-3 mt-3">
              {room.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`border rounded-md overflow-hidden ${
                    activeImage === img ? "ring-2 ring-blue-600" : ""
                  }`}
                  aria-label={`Ảnh ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    className="w-28 h-16 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid: Giá và tiện ích */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Giá thuê & chi phí */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-semibold mb-3">Giá thuê</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-medium">Giá thuê:</span>{" "}
                {formatVND(room.price)}đ/tháng
              </li>
              <li>
                <span className="font-medium">Tiền điện:</span>{" "}
                {formatVND(room.electricityPrice)}đ/kWh
              </li>
              <li>
                <span className="font-medium">Tiền nước:</span>{" "}
                {formatVND(room.waterPrice)}đ/người
              </li>
              <li>
                <span className="font-medium">Tiền cọc:</span>{" "}
                {formatVND(room.deposit)}đ
              </li>
            </ul>
          </div>

          {/* Tiện ích */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-semibold mb-3">Tiện ích</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {(room.utilities || []).map((u, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-green-600">✔</span> {u}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Liên hệ & đặt lịch */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`tel:${room.phone}`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            📞 {room.phone}
          </a>
          <a
            href={room.zalo}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            💬 Nhắn Zalo
          </a>
          <button
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            onClick={() => alert("Vui lòng đặt lịch trước ít nhất 01 ngày.")}
          >
            🗓️ Đặt lịch
          </button>
        </div>

        {/* Lưu ý */}
        <div className="mt-4 text-sm text-gray-700">
          <span className="font-medium">Lưu ý:</span> Đặt lịch trước ít nhất 01
          ngày để chủ trọ chuẩn bị phòng và sắp xếp thời gian tiếp đón.
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
