import React from "react";
import { FaUserFriends, FaInfoCircle } from "react-icons/fa";

const InvoiceWaterTab = ({ formData, setFormData, calculations }) => {
  const formatVND = (val) => new Intl.NumberFormat('vi-VN').format(val || 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-left-2 duration-300">
      
      {/* Thông báo cách tính */}
      <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-start gap-3">
        <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          Tiền nước được tính cố định dựa trên số người đang ở trong phòng.
        </div>
      </div>

      {/* Hiển thị thông tin tính toán */}
      <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
            <div>
                <p className="text-sm font-medium text-gray-900">Số người đang ở</p>
                <p className="text-xs text-gray-500 mt-1">Lấy từ dữ liệu phòng</p>
            </div>
            <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <FaUserFriends className="text-gray-400" size={20}/>
                {calculations.numPeople} <span className="text-sm font-normal text-gray-500">người</span>
            </div>
        </div>

        <div className="flex justify-between items-center">
            <div>
                <p className="text-sm font-medium text-gray-900">Đơn giá nước / người</p>
            </div>
            <div className="text-lg font-semibold text-gray-900">
                {formatVND(calculations.priceWaterPerson)} đ
            </div>
        </div>
      </div>

      {/* Tổng tiền nước */}
      <div className="bg-cyan-50 border border-cyan-100 rounded-md p-4">
        <p className="text-sm text-cyan-900 flex justify-between items-center">
          <span>Thành tiền:</span>
          <span>
            <strong>{calculations.numPeople} người</strong> x {formatVND(calculations.priceWaterPerson)}đ = <strong className="text-xl ml-2 text-cyan-700">{formatVND(calculations.waterTotal)} đ</strong>
          </span>
        </p>
      </div>

    </div>
  );
};

export default InvoiceWaterTab;