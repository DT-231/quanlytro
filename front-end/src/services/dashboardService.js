/**
 * Dashboard Service - API client cho Dashboard Admin
 * 
 * Gọi API tổng hợp để lấy toàn bộ thống kê dashboard trong 1 request duy nhất
 */
import api from "@/lib/api";

export const dashboardService = {
  /**
   * Lấy toàn bộ thống kê cho Dashboard Admin
   * @param {Object} params - Tham số filter
   * @param {string} [params.building_id] - ID tòa nhà để filter
   * @returns {Promise<Object>} Dashboard data bao gồm:
   *   - room_stats: {total_rooms, empty_rooms, occupied_rooms, revenue}
   *   - maintenance_stats: {total, pending, in_progress, completed}
   *   - contract_stats: {total_contracts, active_contracts, expiring_soon}
   *   - recent_activities: Array of recent activities (payments, terminations, issues, contracts)
   *   - pending_appointments: Array of pending appointments
   */
  getStats: async (params = {}) => {
    try {
      const response = await api.get("/dashboard/stats", { params });
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy dashboard stats:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy thống kê phòng
   * @param {Object} params - Tham số filter
   * @param {string} [params.building_id] - ID tòa nhà để filter
   * @returns {Promise<Object>} Room stats
   */
  getRoomStats: async (params = {}) => {
    try {
      const response = await api.get("/dashboard/stats", { params });
      return response.data?.data?.room_stats || null;
    } catch (error) {
      console.error("Lỗi lấy room stats:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy thống kê sự cố/bảo trì
   * @param {Object} params - Tham số filter
   * @param {string} [params.building_id] - ID tòa nhà để filter
   * @returns {Promise<Object>} Maintenance stats
   */
  getMaintenanceStats: async (params = {}) => {
    try {
      const response = await api.get("/dashboard/stats", { params });
      return response.data?.data?.maintenance_stats || null;
    } catch (error) {
      console.error("Lỗi lấy maintenance stats:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy thống kê hợp đồng
   * @returns {Promise<Object>} Contract stats
   */
  getContractStats: async () => {
    try {
      const response = await api.get("/dashboard/stats");
      return response.data?.data?.contract_stats || null;
    } catch (error) {
      console.error("Lỗi lấy contract stats:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy danh sách hoạt động gần đây
   * @param {Object} params - Tham số filter
   * @param {string} [params.building_id] - ID tòa nhà để filter
   * @returns {Promise<Array>} Recent activities
   */
  getRecentActivities: async (params = {}) => {
    try {
      const response = await api.get("/dashboard/stats", { params });
      return response.data?.data?.recent_activities || [];
    } catch (error) {
      console.error("Lỗi lấy recent activities:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy danh sách lịch hẹn chờ xác nhận
   * @param {Object} params - Tham số filter
   * @param {string} [params.building_id] - ID tòa nhà để filter
   * @returns {Promise<Array>} Pending appointments
   */
  getPendingAppointments: async (params = {}) => {
    try {
      const response = await api.get("/dashboard/stats", { params });
      return response.data?.data?.pending_appointments || [];
    } catch (error) {
      console.error("Lỗi lấy pending appointments:", error);
      throw error.response?.data || error;
    }
  }
};
