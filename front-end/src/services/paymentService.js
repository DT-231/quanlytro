import api from "@/lib/api";

/**
 * Payment Service - Xử lý thanh toán hoá đơn.
 * 
 * Hỗ trợ 2 phương thức:
 * - Banking (PayOS): Thanh toán online, cập nhật trạng thái ngay
 * - COD: Thanh toán tiền mặt, chờ chủ nhà xác nhận
 */
export const paymentService = {
  /**
   * Tạo thanh toán qua PayOS (Banking).
   * 
   * @param {Object} data - { invoice_id: string }
   * @returns {Promise<Object>} - { checkout_url, qr_code, payment_id, ... }
   */
  createPayOSPayment: async (data) => {
    const response = await api.post("/payments/create-payos", data);
    return response.data?.data || response.data;
  },

  /**
   * Tạo thanh toán COD (tiền mặt).
   * 
   * @param {Object} data - { invoice_id, cod_receiver_name, cod_receiver_phone, note? }
   * @returns {Promise<Object>} - Payment record với status = pending
   */
  createCODPayment: async (data) => {
    const response = await api.post("/payments/create-cod", data);
    return response.data?.data || response.data;
  },

  /**
   * Xác nhận thanh toán COD (dành cho chủ nhà).
   * 
   * @param {Object} data - { payment_id: string, note?: string }
   * @returns {Promise<Object>} - Payment record với status = completed
   */
  confirmCODPayment: async (data) => {
    const response = await api.post("/payments/confirm-cod", data);
    return response.data?.data || response.data;
  },

  /**
   * Lấy thông tin payment theo ID.
   * 
   * @param {string} paymentId - UUID của payment
   * @returns {Promise<Object>} - Payment detail
   */
  getPaymentById: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data?.data || response.data;
  },

  /**
   * Lấy danh sách payments theo invoice.
   * 
   * @param {string} invoiceId - UUID của invoice
   * @returns {Promise<Object>} - { payments: [], total: number }
   */
  getPaymentsByInvoice: async (invoiceId) => {
    const response = await api.get(`/payments/invoice/${invoiceId}`);
    return response.data?.data || response.data;
  },
};

export default paymentService;
