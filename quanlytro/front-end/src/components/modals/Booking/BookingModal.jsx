import { useState } from "react";

const BookingModal = ({ room, onClose }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    note: "",
    agree: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.agree) {
      alert("Bạn cần xác nhận thông tin chính xác để đặt lịch.");
      return;
    }
    alert(`Đặt lịch thành công cho phòng ${room.name}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
        >
          ✖
        </button>
        <h2 className="text-xl font-bold mb-4">Đặt lịch xem phòng</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Họ tên"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <div className="flex gap-4">
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-1/2 border p-2 rounded"
            />
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
              required
              className="w-1/2 border p-2 rounded"
            />
          </div>
          <textarea
            name="note"
            placeholder="Ghi chú các mong muốn của bạn để chủ trọ chuẩn bị trước"
            value={form.note}
            onChange={handleChange}
            rows={3}
            className="w-full border p-2 rounded"
          />
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={handleChange}
              className="mr-2"
            />
            Tôi đồng ý đặt lịch xem phòng và xác nhận thông tin là chính xác.
          </label>
          <p className="text-xs text-gray-500">Lưu ý: đặt trước 1 ngày</p>
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Đặt lịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
