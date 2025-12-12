import api from "../lib/api";

export const roomService = {
  // Lấy danh sách phòng
  getAll: async (params) => {
    const response = await api.get("/rooms", { params });
    return response.data;
  },

  // Tạo phòng mới
  create: async (data) => {
    const response = await api.post("/rooms", data);
    return response.data;
  },

  // Lấy chi tiết phòng
  getById: async (id) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  // Cập nhật phòng
  update: async (id, data) => {
    const response = await api.put(`/rooms/${id}`, data);
    return response.data;
  },

  // Xóa phòng
  delete: async (id) => {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  },
};