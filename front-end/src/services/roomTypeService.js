import api from "@/lib/api";

export const roomTypeService = {
  getSimpleList: (params = { is_active: true }) => {
    return api.get("/room-types/simple", { params });
  },

  create: (data) => {
    return api.post("/room-types", data);
  },

  // 3. Cập nhật loại phòng
  update: (id, data) => {
    return api.put(`/room-types/${id}`, data);
  },

  // 4. Xóa loại phòng
  delete: (id, soft = true) => {
    return api.delete(`/room-types/${id}`, {
      params: { soft },
    });
  },
};