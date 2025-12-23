import api from "@/lib/api";

/**
 * Gửi yêu cầu đặt lịch hẹn mới
 * @param {object} appointmentData - Dữ liệu lịch hẹn
 * @param {string} appointmentData.room_id - ID của phòng
 * @param {string} appointmentData.full_name - Họ và tên người đặt
 * @param {string} appointmentData.phone - Số điện thoại
 * @param {string|null} appointmentData.email - Email (không bắt buộc)
 * @param {string} appointmentData.appointment_datetime - Ngày giờ hẹn (ISO string)
 * @param {string|null} appointmentData.notes - Ghi chú (không bắt buộc)
 * @returns {Promise<object>} - Dữ liệu trả về từ API
 */
export const bookAppointment = async (appointmentData) => {
  try {
    const response = await api.post("/appointments", appointmentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Lấy danh sách lịch hẹn (cho admin)
 * @param {object} [params] - Tham số query
 * @param {string} [params.status] - Lọc theo trạng thái
 * @returns {Promise<object>} - Dữ liệu trả về từ API
 */
export const getAppointments = async (params) => {
  try {
    const response = await api.get("/appointments", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Lấy chi tiết một lịch hẹn bằng ID
 * @param {string} appointmentId - ID của lịch hẹn
 * @returns {Promise<object>} - Dữ liệu trả về từ API
 */
export const getAppointmentById = async (appointmentId) => {
  try {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Cập nhật trạng thái và ghi chú của lịch hẹn
 * @param {string} appointmentId - ID của lịch hẹn
 * @param {object} updateData - Dữ liệu cập nhật
 * @param {string} updateData.status - Trạng thái mới
 * @param {string} [updateData.admin_notes] - Ghi chú của admin
 * @returns {Promise<object>} - Dữ liệu trả về từ API
 */
export const updateAppointmentStatus = async (appointmentId, updateData) => {
  try {
    const response = await api.patch(
      `/appointments/${appointmentId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};