import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaPrint,
  FaEdit,
  FaCheckCircle,
  FaFilePdf,
  FaShareAlt,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "sonner";
// 1. Import Button từ Shadcn (đảm bảo bạn đã cài component này)
import { Button } from "@/components/ui/button";
import { invoiceService } from "@/services/invoiceService";
import { buildingService } from "@/services/buildingService";

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [buildingAddress, setBuildingAddress] = useState("Đang tải địa chỉ...");
  const [loading, setLoading] = useState(true);

  // State để hiển thị loading khi đang nhấn nút xác nhận
  const [updating, setUpdating] = useState(false);

  // --- API CALL ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const invoiceRes = await invoiceService.getById(id);
        const invoiceData = invoiceRes?.data || invoiceRes;

        if (!invoiceData) throw new Error("Không tải được dữ liệu hóa đơn");
        setInvoice(invoiceData);

        // Logic lấy địa chỉ tòa nhà (Giữ nguyên của bạn)
        if (invoiceData.building_name) {
          try {
            const buildingRes = await buildingService.getAll();
            const rawData = buildingRes?.data || buildingRes;
            let buildings = Array.isArray(rawData?.items)
              ? rawData.items
              : Array.isArray(rawData)
              ? rawData
              : [];

            if (buildings.length > 0) {
              const foundBuilding = buildings.find(
                (b) =>
                  b.name === invoiceData.building_name ||
                  b.building_name === invoiceData.building_name
              );

              if (foundBuilding) {
                let rawAddress =
                  foundBuilding.address_line || "Chưa cập nhật địa chỉ";
                const cleanAddress = rawAddress.replace(
                  /,?\s*(Vietnam|Việt Nam)$/i,
                  ""
                );
                setBuildingAddress(cleanAddress);
              } else {
                setBuildingAddress(`Tòa nhà ${invoiceData.building_name}`);
              }
            } else {
              setBuildingAddress(`Tòa nhà ${invoiceData.building_name}`);
            }
          } catch (err) {
            console.error("Lỗi lấy tòa nhà:", err);
            setBuildingAddress(`Tòa nhà ${invoiceData.building_name}`);
          }
        }
      } catch (error) {
        console.error("Lỗi chung:", error);
        toast.error("Không tìm thấy hóa đơn.");
        navigate("/admin/invoices");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, navigate]);

  // --- ACTION: XÁC NHẬN THANH TOÁN ---
  const handleConfirmPayment = async () => {
    if (!invoice) return;

    // Xác nhận trước khi thực hiện
    const isConfirmed = window.confirm(
      "Bạn có chắc chắn muốn xác nhận hóa đơn này đã được thanh toán?"
    );
    if (!isConfirmed) return;

    setUpdating(true);
    try {
      // 1. Tạo payload cập nhật (Giả định Backend nhận object này)
      const payload = {
        ...invoice,
        status: "PAID",
        paid_amount: invoice.total_amount, // Gán số tiền đã trả = tổng tiền
      };

      // 2. Gọi API update
      // Lưu ý: Đảm bảo invoiceService có hàm update(id, data)
      await invoiceService.update(id, payload);

      // 3. Cập nhật UI ngay lập tức (Optimistic UI)
      setInvoice((prev) => ({
        ...prev,
        status: "PAID",
        paid_amount: prev.total_amount,
      }));

      toast.success("Xác nhận thanh toán thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      const msg =
        error.response?.data?.message || "Lỗi khi cập nhật trạng thái.";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  // --- HELPER FUNCTIONS ---
  const formatVND = (amount) => {
    const value = parseFloat(amount) || 0;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  if (!invoice) return null;

  // --- DATA PROCESSING ---
  const invoiceItems = [
    {
      type: "MAIN",
      name: "Tiền phòng",
      quantity: "1 tháng",
      amount: invoice.room_price,
    },
    {
      type: "MAIN",
      name: "Tiền điện",
      quantity: `${invoice.electricity_old_index ?? "--"} -> ${
        invoice.electricity_new_index ?? "--"
      } (${invoice.electricity_usage ?? 0} kWh)`,
      amount: invoice.electricity_cost,
    },
    {
      type: "MAIN",
      name: "Tiền nước",
      quantity: invoice.number_of_people
        ? `${invoice.number_of_people} người`
        : `${invoice.water_old_index ?? "--"} -> ${
            invoice.water_new_index ?? "--"
          } (${invoice.water_usage ?? 0} m³)`,
      amount: invoice.water_cost,
    },
    {
      type: "EXTRA",
      name: "Phí dịch vụ",
      quantity: "1",
      amount: invoice.service_fee,
    },
    {
      type: "EXTRA",
      name: "Internet",
      quantity: "1",
      amount: invoice.internet_fee,
    },
    {
      type: "EXTRA",
      name: "Giữ xe",
      quantity: "1",
      amount: invoice.parking_fee,
    },
    {
      type: "EXTRA",
      name: invoice.other_fees_description || "Phí khác",
      quantity: "1",
      amount: invoice.other_fees,
    },
  ].filter((item) => {
    if (item.type === "MAIN") return true;
    return parseFloat(item.amount) > 0;
  });

  const totalAmount = parseFloat(invoice.total_amount) || 0;
  // Nếu status là PAID thì coi như đã trả hết, ngược lại lấy từ DB
  const paidAmount =
    invoice.status === "PAID"
      ? totalAmount
      : parseFloat(invoice.paid_amount) || 0;
  const remainingAmount = totalAmount - paidAmount;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans flex justify-center items-start gap-6">
      {/* -------------------- INVOICE PAPER (BÊN TRÁI) -------------------- */}
      <div className="bg-white w-full max-w-4xl p-10 shadow-md border border-gray-100 rounded-lg text-gray-900">
        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-2 text-slate-800">
            Hóa đơn tiền nhà
          </h1>
          <p className="text-sm text-gray-500">Địa chỉ: {buildingAddress}</p>
          <p className="text-xs text-gray-400 mt-2 tracking-wider">
            MÃ:{" "}
            <span className="font-mono font-medium text-gray-600">
              {invoice.invoice_number}
            </span>
          </p>
        </div>

        {/* INFO */}
        <div className="flex justify-between mb-8 text-sm">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 border-b pb-1 mb-2 inline-block">
              Thông tin phòng
            </h3>
            <p>
              <span className="w-24 inline-block text-gray-500">Phòng:</span>{" "}
              <span className="font-medium">{invoice.room_number}</span>
            </p>
            <p>
              <span className="w-24 inline-block text-gray-500">
                Khách thuê:
              </span>{" "}
              <span className="font-medium">{invoice.tenant_name}</span>
            </p>
            <p>
              <span className="w-24 inline-block text-gray-500">Tòa nhà:</span>{" "}
              {invoice.building_name}
            </p>
          </div>
          <div className="text-right space-y-2">
            <h3 className="font-semibold text-slate-900 border-b pb-1 mb-2 inline-block">
              Thanh toán
            </h3>
            <p>
              <span className="text-gray-500">Ngày lập:</span>{" "}
              <span className="font-medium ml-2">
                {formatDate(invoice.created_at)}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Hạn đóng:</span>{" "}
              <span className="font-medium ml-2">
                {formatDate(invoice.due_date)}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Kỳ thu:</span>{" "}
              <span className="font-medium ml-2">{invoice.billing_month}</span>
            </p>
          </div>
        </div>

        {/* TABLE */}
        <div className="mb-8 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-center w-16 font-semibold text-gray-600">
                  STT
                </th>
                <th className="py-3 px-4 text-left font-semibold text-gray-600">
                  Nội dung
                </th>
                <th className="py-3 px-4 text-center font-semibold text-gray-600">
                  Số lượng / Chỉ số
                </th>
                <th className="py-3 px-4 text-right font-semibold text-gray-600">
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoiceItems.map((item, index) => (
                <tr key={index}>
                  <td className="py-3 px-4 text-center text-gray-500">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-700">
                    {item.name}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {formatVND(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-bold text-gray-800">Tổng tiền</span>
              <span className="font-bold text-lg text-gray-900">{formatVND(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Đã thanh toán</span>
            <span>
              {formatVND(paidAmount)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-bold text-gray-900 text-base">Còn lại</span>
            <span className="font-bold text-xl text-gray-900">
              {formatVND(remainingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* -------------------- ACTIONS SIDEBAR  -------------------- */}
      <div className="w-72 shrink-0 space-y-4 sticky top-6 h-fit">
        {/* Status Badge */}
        <div
          className={`py-4 px-4 rounded-lg font-bold text-center border shadow-sm transition-colors ${
            invoice.status === "PAID"
              ? "bg-green-50 text-green-700 border-green-200"
              : invoice.status === "OVERDUE"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-orange-50 text-orange-600 border-orange-200"
          }`}
        >
          <span className="block text-xs font-normal opacity-70 mb-1">
            TRẠNG THÁI
          </span>
          <span className="text-xl tracking-tight">
            {invoice.status === "PAID"
              ? "ĐÃ THANH TOÁN"
              : invoice.status === "OVERDUE"
              ? "QUÁ HẠN"
              : "CHƯA THANH TOÁN"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            size="lg"
          >
            <FaPrint className="mr-2 h-4 w-4" /> In hoá đơn
          </Button>

          {invoice.status !== "PAID" && (
            <>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                size="lg"
              >
                <FaEdit className="mr-2 h-4 w-4" /> Sửa hoá đơn
              </Button>

              <Button
                onClick={handleConfirmPayment}
                disabled={updating}
                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
                size="lg"
              >
                {updating ? (
                  // Spinner khi đang loading
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <FaCheckCircle className="mr-2 h-4 w-4" />
                )}
                {updating ? "Đang xử lý..." : "Xác nhận thanh toán"}
              </Button>
            </>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" className="w-full border-gray-300">
              <FaFilePdf className="mr-2 h-4 w-4 text-red-500" /> PDF
            </Button>
            <Button variant="outline" className="w-full border-gray-300">
              <FaShareAlt className="mr-2 h-4 w-4 text-blue-500" /> Chia sẻ
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="mr-2 h-3 w-3" /> Quay lại danh sách
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;
