import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

const PaymentModal = ({ invoice, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const totalAmount = parseFloat(invoice.amount.replace(/[^0-9]/g, ""));

  const details = [
    { name: "Tiền rác", quantity: "1 tháng", price: 30000, id: "garbage" },
    { name: "Tiền giữ xe", quantity: "2 xe", price: 200000, id: "parking" },
    { name: "Phí dịch vụ", quantity: 1, price: 50000, id: "service" },
    { name: "Phí tiện ích", quantity: 1, price: 20000, id: "utility" },
    { name: "Phí gửi đồ", quantity: 5, price: 30000, id: "storage" },
    { name: "Phí an ninh", quantity: 3, price: 10000, id: "security" },
    { name: "Phí phát sinh", quantity: 1, price: 100000, id: "incident" },
  ];

  const electricityUsage = parseFloat(
    invoice.electricity.replace(/[^0-9]/g, "")
  );
  const waterUsage = parseFloat(invoice.water.replace(/[^0-9]/g, ""));

  const electricityCost = electricityUsage * 3500;
  const waterCost = waterUsage * 15000;
  const fixedCosts = details.reduce((sum, item) => sum + item.price, 0);
  const rentCost = totalAmount - electricityCost - waterCost - fixedCosts;

  const finalDetails = [
    {
      name: "Tiền phòng",
      quantity: 1,
      price: rentCost > 0 ? rentCost : 0,
      id: "rent",
    },
    {
      name: "Tiền điện",
      quantity: invoice.electricity,
      price: electricityCost,
      id: "electricity",
    },
    {
      name: "Tiền nước",
      quantity: invoice.water,
      price: waterCost,
      id: "water",
    },
    ...details,
  ];

  const handlePayment = () => {
    alert(
      `Thanh toán thành công ${totalAmount.toLocaleString(
        "vi-VN"
      )}₫ cho hóa đơn #${invoice.id} bằng ${
        paymentMethod === "card" ? "Thẻ" : "Tiền mặt"
      }.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 p-4">
      <div className="relative w-full max-w-[1216px] flex flex-col md:flex-row gap-5 max-h-[95vh]">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 md:top-0 md:right-0 text-white bg-gray-800 rounded-full p-1 hover:bg-gray-700 z-50"
        >
          <FaTimes size={16} />
        </button>

        {/* === Left Column: Invoice Details === */}
        <div className="w-full md:w-[808px] bg-white rounded-xl shadow-lg p-6 flex flex-col border-l border-gray-200 overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-5">
            <h2 className="text-2xl font-semibold text-[#09090B]">
              Chi tiết hóa đơn
            </h2>
            <p className="text-sm text-[#09090B] mt-4">
              Kiểm tra kỹ các chi phí trước khi thanh toán.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Mã hóa đơn: #{invoice.id}
            </p>
          </div>

          {/* Customer & Invoice Info */}
          <div className="flex flex-col md:flex-row gap-4 mb-5 text-sm">
            {/* Customer Info */}
            <div className="flex-1 space-y-4">
              <h3 className="font-bold text-[#09090B]">Thông tin khách hàng</h3>
              <p>
                <span className="font-medium">Họ và tên:</span> {invoice.name}
              </p>
              <p>
                <span className="font-medium">Số điện thoại:</span> 0987654321
              </p>
              <p>
                <span className="font-medium">Địa chỉ:</span> {invoice.building}
              </p>
            </div>
            {/* Invoice Info */}
            <div className="flex-1 space-y-4">
              <h3 className="font-bold text-[#09090B]">Thông tin hóa đơn</h3>
              <p>
                <span className="font-medium">Mã hóa đơn:</span> #{invoice.id}
              </p>
              <p>
                <span className="font-medium">Ngày xuất:</span> {invoice.date}
              </p>
              <p>
                <span className="font-medium">Hạn thanh toán:</span>{" "}
                {invoice.due}
              </p>
            </div>
          </div>

          {/* Invoice Breakdown Table */}
          <div className="border rounded-md overflow-auto flex-grow p-1.5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black">
                  <th className="p-3 font-semibold text-center text-base">
                    STT
                  </th>
                  <th className="p-3 font-semibold text-center text-base">
                    Nội dung
                  </th>
                  <th className="p-3 font-semibold text-center text-base">
                    Số lượng
                  </th>
                  <th className="p-3 font-semibold text-center text-base">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {finalDetails.map((item, index) => (
                  <tr key={item.id}>
                    <td className="p-2.5 text-center font-semibold">
                      {index + 1}
                    </td>
                    <td className="p-2 text-center font-semibold">
                      {item.name}
                    </td>
                    <td className="p-2 text-center font-medium">
                      {item.quantity}
                    </td>
                    <td className="p-2.5 text-center font-medium">
                      {item.price.toLocaleString("vi-VN")}₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* === Right Column: Payment Method === */}
        <div className="w-full md:w-[341px] h-fit">
          <div className="border rounded-xl shadow-md p-6 h-full flex flex-col bg-white">
            <h2 className="text-xl font-bold text-center mb-6">
              Xác nhận thanh toán
            </h2>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền dịch vụ:</span>
                <span className="font-medium">
                  {totalAmount.toLocaleString("vi-VN")}₫
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí nền tảng:</span>
                <span className="font-medium">0₫</span>
              </div>
            </div>

            <div className="border-t border-b py-4 mb-6">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Tổng cộng:</span>
                <span className="text-red-600">{invoice.amount}</span>
              </div>
            </div>

            <div>
              <label className="font-medium mb-3 block text-sm">
                Phương thức thanh toán:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setPaymentMethod("card")}
                  className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-colors ${
                    paymentMethod === "card"
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                  <span className="text-sm font-medium">Thẻ</span>
                </div>
                <div
                  onClick={() => setPaymentMethod("cash")}
                  className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-colors ${
                    paymentMethod === "cash"
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" x2="12" y1="2" y2="22" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span className="text-sm font-medium">Tiền mặt</span>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-6">
              <button
                type="button"
                onClick={handlePayment}
                className="w-full px-6 py-3 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition-colors"
              >
                Thanh toán {invoice.amount}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full px-6 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
