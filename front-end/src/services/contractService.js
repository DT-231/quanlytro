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

  // ========== CRUD Operations ==========
  
  getAll: async (params) => {
    return safeRequest(api.get("/api/v1/contracts/", { params }));
  },

  getStats: async () => {
    return safeRequest(api.get("/api/v1/contracts/stats"));
  },

  /**
   * Lấy danh sách phòng có thể tạo hợp đồng (phòng trống + phòng còn chỗ)
   * @param {string} buildingId - ID của tòa nhà
   * @returns {Promise<object>} - Danh sách phòng với capacity và current_occupants
   */
  getAvailableRooms: async (buildingId) => {
    return safeRequest(api.get(`/api/v1/contracts/available-rooms/${buildingId}`));
  },

  /**
   * Lấy thông tin phòng để auto-fill form tạo hợp đồng
   * Bao gồm: giá thuê, tiền cọc, giá điện/nước, phí dịch vụ mặc định
   * @param {string} roomId - ID của phòng
   * @returns {Promise<object>} - Thông tin phòng với default_service_fees
   */
  getRoomInfoForContract: async (roomId) => {
    return safeRequest(api.get(`/api/v1/contracts/room-info/${roomId}`));
  },

  create: async (contractData) => {
    return safeRequest(api.post("/api/v1/contracts/", contractData));
  },

  update: async (id, contractData) => {
    return safeRequest(api.put(`/api/v1/contracts/${id}`, contractData));
  },

  delete: async (id) => {
    return safeRequest(api.delete(`/api/v1/contracts/${id}`));
  },

  getById: async (id) => {
    return safeRequest(api.get(`/api/v1/contracts/${id}`));
  },

  // ========== Termination Operations ==========
  
  /**
   * Gửi yêu cầu chấm dứt hợp đồng
   * @param {string} id - ID của hợp đồng
   * @returns {Promise<object>} - Hợp đồng đã cập nhật
   */
  requestTermination: async (id) => {
    return safeRequest(api.post(`/api/v1/contracts/${id}/request-termination`));
  },

  /**
   * Phê duyệt yêu cầu chấm dứt hợp đồng
   * @param {string} id - ID của hợp đồng
   * @returns {Promise<object>} - Hợp đồng đã cập nhật
   */
  approveTermination: async (id) => {
    return safeRequest(api.post(`/api/v1/contracts/${id}/approve-termination`));
  },

  // ========== Contract Confirm/Reject (Tenant) ==========
  
  /**
   * Tenant xác nhận hợp đồng PENDING → ACTIVE
   * @param {string} id - ID của hợp đồng
   * @returns {Promise<object>} - Hợp đồng đã kích hoạt
   */
  confirmContract: async (id) => {
    return safeRequest(api.post(`/api/v1/contracts/${id}/confirm`));
  },

  /**
   * Tenant từ chối hợp đồng PENDING → Xóa
   * @param {string} id - ID của hợp đồng
   * @returns {Promise<object>} - Kết quả
   */
  rejectContract: async (id) => {
    return safeRequest(api.post(`/api/v1/contracts/${id}/reject`));
  },

  // ========== Pending Update Confirm/Reject ==========
  
  /**
   * Tenant xác nhận thay đổi hợp đồng
   * @param {string} id - ID của hợp đồng
   * @returns {Promise<object>} - Hợp đồng sau khi áp dụng thay đổi
   */
  confirmUpdate: async (id) => {
    return safeRequest(api.post(`/api/v1/contracts/${id}/confirm-update`));
  },

  /**
   * Tenant từ chối thay đổi hợp đồng
   * @param {string} id - ID của hợp đồng
   * @returns {Promise<object>} - Hợp đồng giữ nguyên
   */
  rejectUpdate: async (id) => {
    return safeRequest(api.post(`/api/v1/contracts/${id}/reject-update`));
  },

  /**
   * Lấy pending changes của hợp đồng
   * @param {string} id - ID của hợp đồng
   * @returns {Promise<object>} - Danh sách pending changes
   */
  getPendingChanges: async (id) => {
    return safeRequest(api.get(`/api/v1/contracts/${id}/pending-changes`));
  },

  // ========== Room Tenants Info ==========
  
  /**
   * Lấy thông tin người thuê của phòng (hỗ trợ ở ghép)
   * @param {string} roomId - ID của phòng
   * @returns {Promise<object>} - Thông tin người thuê
   */
  getRoomTenants: async (roomId) => {
    return safeRequest(api.get(`/api/v1/contracts/room/${roomId}/tenants`));
  },

  // ========== Helper APIs ==========
  
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