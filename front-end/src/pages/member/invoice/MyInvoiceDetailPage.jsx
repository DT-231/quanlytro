import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCreditCard,
  FaMoneyBillWave,
  FaCheckCircle,
  FaSpinner,
  FaBuilding,
  FaUser,
  FaCalendarAlt,
  FaBolt,
  FaTint,
} from "react-icons/fa";
import { toast } from "sonner";
import { invoiceService } from "@/services/invoiceService";
import { paymentService } from "@/services/paymentService";
import { Button } from "@/components/ui/button";

/**
 * Trang chi tiết hoá đơn cho người thuê (TENANT).
 * 
 * Features:
 * - Hiển thị đầy đủ thông tin hoá đơn
 * - Thanh toán qua Banking (PayOS) => cập nhật trạng thái ngay
 * - Thanh toán COD (tiền mặt) => cập nhật trạng thái thành PAID
 */
const MyInvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'banking' | 'cod'
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // COD note (tuỳ chọn)
  const [codNote, setCodNote] = useState("");

  /**
   * Fetch invoice detail.
   */
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await invoiceService.getById(id);
        const data = res?.data || res;
        
        if (!data) {
          throw new Error("Không tìm thấy hoá đơn");
        }
        
        setInvoice(data);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast.error("Không tìm thấy hoá đơn");
        navigate("/member/my-invoices");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvoice();
  }, [id, navigate]);

  /**
   * Format VND currency.
   */
  const formatVND = (amount) => {
    const value = parseFloat(amount) || 0;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  /**
   * Format date to DD/MM/YYYY.
   */
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  /**
   * Get status info.
   */
  const getStatusInfo = (status) => {
    const statusMap = {
      PAID: {
        label: "Đã thanh toán",
        className: "bg-green-100 text-green-700 border-green-300",
        icon: <FaCheckCircle className="text-green-500" />,
      },
      PENDING: {
        label: "Chờ thanh toán",
        className: "bg-yellow-100 text-yellow-700 border-yellow-300",
        icon: <FaMoneyBillWave className="text-yellow-500" />,
      },
      OVERDUE: {
        label: "Quá hạn",
        className: "bg-red-100 text-red-700 border-red-300",
        icon: <FaCalendarAlt className="text-red-500" />,
      },
      PROCESSING: {
        label: "Đang xử lý",
        className: "bg-blue-100 text-blue-700 border-blue-300",
        icon: <FaSpinner className="text-blue-500 animate-spin" />,
      },
      CANCELLED: {
        label: "Đã huỷ",
        className: "bg-gray-100 text-gray-600 border-gray-300",
        icon: null,
      },
    };
    return statusMap[status] || statusMap.PENDING;
  };

  /**
   * Handle Banking payment (PayOS).
   * Thanh toán thành công => cập nhật trạng thái ngay.
   */
  const handleBankingPayment = async () => {
    if (!invoice) return;

    setProcessing(true);
    try {
      const response = await paymentService.createPayOSPayment({
        invoice_id: invoice.id,
      });

      // Mở link thanh toán PayOS
      if (response.checkout_url) {
        window.open(response.checkout_url, "_blank");
        toast.success("Đang chuyển đến trang thanh toán PayOS...");
        
        // Sau khi thanh toán xong, webhook sẽ cập nhật trạng thái
        // Refresh invoice sau vài giây
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error("Banking payment error:", error);
      toast.error(error.response?.data?.detail || "Lỗi khi tạo thanh toán");
    } finally {
      setProcessing(false);
      setShowPaymentModal(false);
    }
  };

  /**
   * Handle COD payment.
   * Thanh toán COD (tiền mặt) => tạo payment record với status pending,
   * hoá đơn chuyển sang PROCESSING, chờ chủ nhà xác nhận.
   */
  const handleCODPayment = async () => {
    if (!invoice) return;

    setProcessing(true);
    try {
      // Tạo COD payment record, backend sẽ update invoice status = PROCESSING
      await paymentService.createCODPayment({
        invoice_id: invoice.id,
        notes: codNote.trim() || "Thanh toán tiền mặt"
      });

      toast.success("Đã gửi yêu cầu thanh toán tiền mặt! Vui lòng chờ chủ nhà xác nhận.");
      
      // Cập nhật UI - chuyển sang PROCESSING
      setInvoice((prev) => ({
        ...prev,
        status: "PROCESSING",
      }));
      
      setShowPaymentModal(false);
      setCodNote("");
      setPaymentMethod(null);
    } catch (error) {
      console.error("COD payment error:", error);
      toast.error(error.response?.data?.detail || "Lỗi khi tạo yêu cầu thanh toán");
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Build invoice items list.
   */
  const buildInvoiceItems = () => {
    if (!invoice) return [];

    const items = [
      {
        name: "Tiền phòng",
        quantity: "1 tháng",
        amount: invoice.room_price,
      },
      {
        name: "Tiền điện",
        quantity: `${invoice.electricity_old_index ?? "---"} → ${invoice.electricity_new_index ?? "---"} (${invoice.electricity_usage ?? 0} kWh)`,
        amount: invoice.electricity_cost,
      },
      {
        name: "Tiền nước",
        quantity: invoice.number_of_people ? `${invoice.number_of_people} người` : "---",
        amount: invoice.water_cost,
      },
    ];

    // Add extra fees if > 0
    if (parseFloat(invoice.service_fee) > 0) {
      items.push({ name: "Phí dịch vụ", quantity: "1", amount: invoice.service_fee });
    }
    if (parseFloat(invoice.internet_fee) > 0) {
      items.push({ name: "Internet", quantity: "1", amount: invoice.internet_fee });
    }
    if (parseFloat(invoice.parking_fee) > 0) {
      items.push({ name: "Gửi xe", quantity: "1", amount: invoice.parking_fee });
    }
    if (parseFloat(invoice.other_fees) > 0) {
      items.push({
        name: invoice.other_fees_description || "Phí khác",
        quantity: "1",
        amount: invoice.other_fees,
      });
    }

    return items;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-4xl text-gray-400" />
      </div>
    );
  }

  if (!invoice) return null;

  const statusInfo = getStatusInfo(invoice.status);
  const invoiceItems = buildInvoiceItems();
  const totalAmount = parseFloat(invoice.total_amount) || 0;
  const canPay = invoice.status === "PENDING" || invoice.status === "OVERDUE";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/member/my-invoices")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <FaArrowLeft />
        <span>Quay lại danh sách</span>
      </button>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Hoá đơn #{invoice.invoice_number}
                </h1>
                <p className="text-gray-500">Kỳ thu: {formatDate(invoice.billing_month)}</p>
              </div>
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${statusInfo.className}`}
              >
                {statusInfo.icon}
                {statusInfo.label}
              </span>
            </div>

            {/* Room & Building Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaBuilding className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Toà nhà</p>
                  <p className="font-medium">{invoice.building_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaUser className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phòng</p>
                  <p className="font-medium">{invoice.room_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaCalendarAlt className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày tạo</p>
                  <p className="font-medium">{formatDate(invoice.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaCalendarAlt className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hạn thanh toán</p>
                  <p className="font-medium text-red-600">{formatDate(invoice.due_date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Chi tiết hoá đơn</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left">STT</th>
                    <th className="px-6 py-3 text-left">Nội dung</th>
                    <th className="px-6 py-3 text-center">Số lượng / Chỉ số</th>
                    <th className="px-6 py-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoiceItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatVND(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right">Tổng cộng:</td>
                    <td className="px-6 py-4 text-right text-lg text-gray-900">
                      {formatVND(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="px-6 py-4 border-t bg-gray-50">
                <p className="text-sm text-gray-600">
                  <strong>Ghi chú:</strong> {invoice.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary Card */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin thanh toán</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-bold text-xl text-gray-900">{formatVND(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <span className={`font-medium ${invoice.status === "PAID" ? "text-green-600" : "text-yellow-600"}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>

            {/* Payment Buttons */}
            {canPay && (
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setPaymentMethod("banking");
                    setShowPaymentModal(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <FaCreditCard className="mr-2" />
                  Thanh toán Online (Banking)
                </Button>

                <Button
                  onClick={() => {
                    setPaymentMethod("cod");
                    setShowPaymentModal(true);
                  }}
                  variant="outline"
                  className="w-full border-2"
                  size="lg"
                >
                  <FaMoneyBillWave className="mr-2" />
                  Thanh toán tiền mặt (COD)
                </Button>

                <p className="text-xs text-gray-500 text-center mt-2">
                  Banking: Cập nhật trạng thái ngay sau khi thanh toán<br />
                  COD: Chờ chủ nhà xác nhận đã nhận tiền
                </p>
              </div>
            )}

            {invoice.status === "PROCESSING" && (
              <div className="flex flex-col items-center justify-center gap-2 text-blue-600 py-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FaSpinner className="text-xl animate-spin" />
                  <span className="font-medium">Đang chờ xác nhận</span>
                </div>
                <p className="text-sm text-blue-500 text-center">
                  Bạn đã yêu cầu thanh toán tiền mặt.<br />
                  Vui lòng chờ chủ nhà xác nhận đã nhận tiền.
                </p>
              </div>
            )}

            {invoice.status === "PAID" && (
              <div className="flex items-center justify-center gap-2 text-green-600 py-4">
                <FaCheckCircle className="text-xl" />
                <span className="font-medium">Đã thanh toán thành công</span>
              </div>
            )}
          </div>

          {/* Utility Usage Card */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Chỉ số tiện ích</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <FaBolt className="text-yellow-500 text-xl" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Điện</p>
                  <p className="font-medium">
                    {invoice.electricity_old_index ?? "---"} → {invoice.electricity_new_index ?? "---"} kWh
                  </p>
                  <p className="text-sm text-gray-500">
                    Tiêu thụ: {invoice.electricity_usage ?? 0} kWh
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <FaTint className="text-blue-500 text-xl" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Nước</p>
                  <p className="font-medium">{invoice.number_of_people ?? 0} người</p>
                  <p className="text-sm text-gray-500">
                    Đơn giá: {formatVND(invoice.water_unit_price)}/người
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {paymentMethod === "banking" ? "Thanh toán Online (Banking)" : "Thanh toán tiền mặt (COD)"}
            </h2>

            {paymentMethod === "banking" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Bạn sẽ được chuyển đến trang thanh toán PayOS. 
                    Sau khi thanh toán thành công, hoá đơn sẽ được cập nhật trạng thái tự động.
                  </p>
                </div>

                <div className="flex justify-between py-3 border-t">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-bold text-xl">{formatVND(totalAmount)}</span>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentMethod(null);
                    }}
                    className="flex-1"
                    disabled={processing}
                  >
                    Huỷ
                  </Button>
                  <Button
                    onClick={handleBankingPayment}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <FaCreditCard className="mr-2" />
                        Thanh toán ngay
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {paymentMethod === "cod" && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Xác nhận bạn đã thanh toán tiền mặt trực tiếp cho chủ trọ.
                    Hoá đơn sẽ được cập nhật thành "Đã thanh toán" ngay lập tức.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú (tuỳ chọn)
                  </label>
                  <textarea
                    value={codNote}
                    onChange={(e) => setCodNote(e.target.value)}
                    placeholder="Ghi chú thêm..."
                    rows={2}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="flex justify-between py-3 border-t">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-bold text-xl">{formatVND(totalAmount)}</span>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setCodNote("");
                      setPaymentMethod(null);
                    }}
                    className="flex-1"
                    disabled={processing}
                  >
                    Huỷ
                  </Button>
                  <Button
                    onClick={handleCODPayment}
                    className="flex-1 bg-black hover:bg-gray-800"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="mr-2" />
                        Xác nhận đã thanh toán
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInvoiceDetailPage;
