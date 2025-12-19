import { useState } from "react";

const IssueReport = () => {
  const [form, setForm] = useState({
    name: "",
    room: "",
    severity: "Thấp",
    date: "",
    title: "",
    description: "",
    images: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + form.images.length > 5) {
      alert("Tối đa 5 ảnh!");
      return;
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Đã gửi báo cáo sự cố!");
  };

  return (
    <div className="bg-white text-black p-8 rounded-lg shadow max-w-4xl mx-auto">
      {/* Tiêu đề */}
      <h2 className="text-2xl font-bold mb-6 border-b border-gray-300 pb-2">
        Báo cáo sự cố
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nhóm thông tin cá nhân */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium">Họ tên</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Nguyễn Văn A"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Phòng</label>
            <input
              name="room"
              value={form.room}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="A101"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Mức độ</label>
            <select
              name="severity"
              value={form.severity}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option>Thấp</option>
              <option>Trung bình</option>
              <option>Cao</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Ngày gửi yêu cầu</label>
            <input
              name="date"
              value={form.date}
              onChange={handleChange}
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
        </div>

        {/* Nhóm nội dung sự cố */}
        <div>
          <label className="block mb-2 font-medium">Tiêu đề</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Ví dụ: Rò rỉ nước"
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Mô tả</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Chi tiết sự cố..."
            required
          />
        </div>

        {/* Upload ảnh */}
        <div>
          <label className="block mb-2 font-medium">Tải lên tối đa 5 ảnh</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="block"
          />
          <div className="mt-2 text-sm text-gray-600">
            {form.images.map((img, idx) => (
              <div key={idx}>{img.name}</div>
            ))}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-300">
          <button
            type="button"
            onClick={() => setForm({ ...form, images: [] })}
            className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800"
          >
            Báo cáo sự cố
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueReport;
