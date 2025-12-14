import api from "@/lib/api"; 

export const invoiceService = {
  // 1. Lấy danh sách tòa nhà cho dropdown
  getBuildingsDropdown: async () => {
    const response = await api.get("/invoices/buildings");
    return response.data; 
  },

  // 2. Lấy danh sách phòng theo tòa nhà
  getRoomsByBuilding: async (buildingId) => {
    if (!buildingId) return { data: [] };
    const response = await api.get(`/invoices/rooms/${buildingId}`);
    return response.data;
  },

  // 3. Lấy danh sách hóa đơn (có filter)
  getAll: async (params) => {
    const response = await api.get("/invoices", { params });
    return response.data;
  },

  // 4. Tạo hóa đơn mới
  create: async (data) => {
    const response = await api.post("/invoices", data);
    return response.data;
  },

  // 5. Xem chi tiết hóa đơn
  getById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  // 6. Cập nhật hóa đơn
  update: async (id, data) => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  }
};