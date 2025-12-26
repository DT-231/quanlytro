/**
 * Invoice Service - API client cho quản lý hóa đơn
 *
 * Các chức năng:
 * - Lấy danh sách tòa nhà/phòng cho dropdown
 * - CRUD hóa đơn
 * - Cập nhật trạng thái thanh toán
 */
import api from "@/lib/api"; 

/**
 * Helper: Chuẩn hóa response API thành mảng
 * Xử lý các trường hợp: { data: [...] }, { items: [...] }, hoặc [...]
 * @param {Object|Array} response - Response từ API
 * @returns {Array} Mảng dữ liệu đã chuẩn hóa
 */
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
  /**
   * Lấy danh sách tòa nhà cho dropdown tạo hóa đơn
   * @returns {Promise<Array>} Danh sách tòa nhà [{id, building_name}]
   */
  getBuildingsDropdown: async () => {
    try {
      const response = await api.get("/invoices/buildings");
      return normalizeData(response); 
    } catch (error) {
      console.error("Lỗi lấy tòa nhà:", error);
      try {
         const fb = await api.get("/invoices/buildings");
         return normalizeData(fb);
      } catch {
        // Fallback silently
        return [];
      }
    }
  },

  /**
   * Lấy danh sách phòng theo tòa nhà (chỉ phòng có hợp đồng active)
   * @param {string} buildingId - UUID của tòa nhà
   * @returns {Promise<Array>} Danh sách phòng [{id, room_number, tenant_name, contract_id}]
   */
  getRoomsByBuilding: async (buildingId) => {
    if (!buildingId) return [];
    try {
      const response = await api.get(`/invoices/rooms/${buildingId}`);
      return normalizeData(response);
    } catch (error) {
      console.error("Lỗi lấy phòng:", error);
      return [];
    }
  },

  /**
   * Lấy danh sách hóa đơn với filter và pagination
   * @param {Object} params - {page, pageSize, building_id, status, ...}
   * @returns {Promise<Object>} {items: [], pagination: {}}
   */
  getAll: async (params) => {
    try {
      // Xóa params rỗng/null để tránh gửi query string thừa
      const cleanParams = { ...params };
      if (!cleanParams.building_id) delete cleanParams.building_id;
      
      const response = await api.get("/invoices", { params: cleanParams });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy hóa đơn:", error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Tạo hóa đơn mới
   * @param {Object} data - Dữ liệu hóa đơn
   * @returns {Promise<Object>} Hóa đơn vừa tạo
   */
  create: async (data) => {
    const response = await api.post("/invoices", data);
    return response.data;
  },

  /**
   * Lấy chi tiết hóa đơn theo ID
   * @param {string} id - UUID hóa đơn
   * @returns {Promise<Object>} Chi tiết hóa đơn
   */
  getById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  /**
   * Cập nhật hóa đơn
   * @param {string} id - UUID hóa đơn
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Hóa đơn sau cập nhật
   */
  update: async (id, data) => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  },

  /**
   * Cập nhật trạng thái thanh toán (Admin xác nhận COD)
   * @param {string} id - UUID hóa đơn
   * @param {string} status - Trạng thái mới (PAID, PENDING, etc.)
   * @returns {Promise<Object>} Hóa đơn sau cập nhật
   */
  updateStatus: async (id, status) => {
    const response = await api.put(`/invoices/${id}`, { status });
    return response.data;
  }
};