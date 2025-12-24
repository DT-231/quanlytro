import api from "@/lib/api"; 

// Helper: Luôn trả về mảng, bất kể API trả về { data: [...] } hay [...]
const normalizeData = (response) => {
  if (!response) return [];
  // Trường hợp 1: response là axios object, lấy data ra trước
  const data = response.data ? response.data : response;
  
  // Trường hợp 2: data chính là mảng
  if (Array.isArray(data)) return data;
  
  // Trường hợp 3: data bọc trong thuộc tính data hoặc items
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.items && Array.isArray(data.items)) return data.items;
  
  return [];
};

export const invoiceService = {
  // 1. Lấy danh sách tòa nhà
  getBuildingsDropdown: async () => {
    try {
      const response = await api.get("/invoices/buildings");
      return normalizeData(response); 
    } catch (error) {
      console.error("Lỗi lấy tòa nhà:", error);
      try {
         const fb = await api.get("/invoices/buildings");
         return normalizeData(fb);
      } catch (e) { return []; }
    }
  },

  // 2. Lấy danh sách phòng theo tòa nhà (QUAN TRỌNG: Đã fix lỗi parsing)
  getRoomsByBuilding: async (buildingId) => {
    if (!buildingId) return [];
    try {
      // Gọi API: /api/v1/invoices/rooms/{id}
      const response = await api.get(`/invoices/rooms/${buildingId}`);
      console.log(`Rooms for building ${buildingId}:`, response.data); // Debug log
      return normalizeData(response);
    } catch (error) {
      console.error("Lỗi lấy phòng:", error);
      return [];
    }
  },

  // 3. Lấy danh sách hóa đơn
  getAll: async (params) => {
    try {
      // Xóa params rác
      const cleanParams = { ...params };
      if (!cleanParams.building_id) delete cleanParams.building_id;
      
      const response = await api.get("/invoices", { params: cleanParams });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy hóa đơn:", error);
      return { items: [], total: 0 };
    }
  },

  // 4. Tạo hóa đơn
  create: async (data) => {
    const response = await api.post("/invoices", data);
    return response.data;
  },

  // 5. Chi tiết hóa đơn
  getById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  // 6. Cập nhật hóa đơn
  update: async (id, data) => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  },

  // 7. Cập nhật trạng thái thanh toán (dành cho admin xác nhận COD)
  updateStatus: async (id, status) => {
    const response = await api.put(`/invoices/${id}`, { status });
    return response.data;
  }
};