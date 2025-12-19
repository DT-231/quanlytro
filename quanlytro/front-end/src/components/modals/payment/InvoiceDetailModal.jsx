import React from "react";
import { FaTimes } from "react-icons/fa";

const InvoiceDetailModal = ({ invoice, onClose }) => {
  const details = [
    // Các chi phí cố định
    { name: "Tiền rác", quantity: "1 tháng", price: 30000 },
    { name: "Tiền giữ xe", quantity: "2 xe", price: 200000 },
    { name: "Phí dịch vụ", quantity: 1, price: 50000 },
  ];

  // Tính toán các chi phí động
  const totalAmount = parseFloat(invoice.amount.replace(/[^0-9]/g, ""));
  const electricityUsage = parseFloat(
    invoice.electricity.replace(/[^0-9]/g, "")
  );
  const waterUsage = parseFloat(invoice.water.replace(/[^0-9]/g, ""));

  const electricityCost = electricityUsage * 3500;
  const waterCost = waterUsage * 15000;
  const fixedCosts = details.reduce((sum, item) => sum + item.price, 0);
  const rentCost = totalAmount - electricityCost - waterCost - fixedCosts;

  const finalDetails = [
    { name: "Tiền phòng", quantity: 1, price: rentCost > 0 ? rentCost : 0 },
    {
      name: "Tiền điện",
      quantity: invoice.electricity,
      price: electricityCost,
    },
    { name: "Tiền nước", quantity: invoice.water, price: waterCost },
    ...details,
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <FaTimes size={20} />
        </button>

        <div className="text-center mb-5">
          <h2 className="text-2xl font-semibold">Chi tiết hóa đơn</h2>
          <p className="text-sm text-gray-500">Mã hóa đơn: {invoice.id}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 text-sm">
          <div>
            <strong>Khách hàng:</strong> {invoice.name}
          </div>
          <div>
            <strong>Ngày xuất:</strong> {invoice.date}
          </div>
          <div>
            <strong>Tòa nhà:</strong> {invoice.building}
          </div>
          <div>
            <strong>Hạn thanh toán:</strong> {invoice.due}
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="p-3 font-semibold">STT</th>
                <th className="p-3 font-semibold">Nội dung</th>
                <th className="p-3 font-semibold text-center">Số lượng</th>
                <th className="p-3 font-semibold text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {finalDetails.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-right">
                    {item.price.toLocaleString("vi-VN")}₫
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr className="border-t-2 border-gray-300 font-bold">
                <td colSpan="3" className="p-3 text-right">
                  Tổng cộng
                </td>
                <td className="p-3 text-right text-base">{invoice.amount}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal;
