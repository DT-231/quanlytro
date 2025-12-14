import api from "@/lib/api"; 

// Helper để tránh crash ứng dụng khi API lỗi
const safeRequest = async (requestPromise) => {
  try {
    const response = await requestPromise;
    return response.data;
  } catch (error) {
    console.error("API Error:", error?.response?.data || error.message);
    // Trả về null hoặc object rỗng để UI không bị trắng trang
    return error?.response?.data || null; 
  }
};

export const contractService = {

  
  getAll: async (params) => {
    return safeRequest(api.get("/api/v1/contracts/", { params }));
  },

  getStats: async () => {
    return safeRequest(api.get("/api/v1/contracts/stats"));
  },

  create: async (contractData) => {
    return safeRequest(api.post("/api/v1/contracts/", contractData));
  },

  delete: async (id) => {
    return safeRequest(api.delete(`/api/v1/contracts/${id}`));
  },

  getById: async (id) => {
    return safeRequest(api.get(`/api/v1/contracts/${id}`));
  },

  
  getTenants: async () => {
    return safeRequest(api.get("/tenants/", { 
      params: { size: 100 } 
    }));
  },

  getBuildingsDropdown: async () => {
    return safeRequest(api.get("/invoices/buildings"));
  },

  getRoomsByBuilding: async (buildingId) => {
    if (!buildingId) return { data: [] };
    return safeRequest(api.get(`/invoices/rooms/${buildingId}`));
  }
};