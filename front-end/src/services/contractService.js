import api from "@/lib/api"; 

export const contractService = {

  getAll: async (params) => {
    const response = await apiClient.get("/contracts/", { params });
    return response.data;
  },

  // 2. Lấy thống kê Dashboard
  getStats: async () => {
    const response = await apiClient.get("/contracts/stats");
    return response.data;
  },

  // 3. Tạo hợp đồng mới (Dùng cho hàm onSubmit)
  create: async (contractData) => {
    // API trả về 201 Created
    const response = await apiClient.post("/contracts/", contractData);
    return response.data; // Trả về data để Component "hứng" và kiểm tra
  },

  // 4. Xóa hợp đồng
  delete: async (id) => {
    const response = await apiClient.delete(`/contracts/${id}`);
    return response.data;
  },


  getAvailableRooms: async () => {
    const response = await apiClient.get("/api/v1/rooms/", { 
      params: { status: "AVAILABLE", size: 100 } 
    });
    return response.data; 
  },
  getTenants: async () => {
    const response = await apiClient.get("/tenants/", {
      params: { size: 100 }
    });
    return response.data;
  }
};