import api from "@/lib/api";

export const maintenanceService = {
  // 1. Lấy danh sách sự cố (có filter & pagination)
  getAll: (params = {}) => {
    // params có thể bao gồm:
    // search, status, priority, request_type, building_id, room_id, page, pageSize
    return api.get("/maintenances", { params });
  },

  // 2. Lấy thống kê sự cố (Stats)
  getStats: (params = {}) => {
    // params: building_id (optional - admin only)
    return api.get("/maintenances/stats", { params });
  },

  // 3. Lấy chi tiết sự cố theo ID
  getById: (id) => {
    return api.get(`/maintenances/${id}`);
  },

  // 4. Tạo yêu cầu sự cố mới (Tenant)
  create: (data) => {
    // data format: { room_id, request_type, title, description, priority, photos: [] }
    return api.post("/maintenances", data);
  },

  // 5. Cập nhật sự cố (Admin/Tenant)
  update: (id, data) => {
    // data format: { title, description, priority, status, estimated_cost, actual_cost, ... }
    return api.put(`/maintenances/${id}`, data);
  },

  // 6. Xóa sự cố (Admin/Tenant)
  delete: (id) => {
    return api.delete(`/maintenances/${id}`);
  },
};