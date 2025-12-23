import React from "react";

const InvoiceElectricTab = ({ formData, setFormData, calculations }) => {
  // Styles
  const baseInputClass = "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:bg-gray-100 disabled:text-gray-500 transition-colors";
  const labelClass = "text-sm font-medium mb-2 block text-gray-700";
  
  // Hàm format tiền tệ
  const formatVND = (val) => new Intl.NumberFormat('vi-VN').format(val || 0);

  // Validate logic: Kiểm tra nếu số điện mới nhỏ hơn số cũ (và ô nhập không trống)
  const isInvalid = formData.elecNew !== "" && Number(formData.elecNew) < Number(formData.elecOld);
  
  // Class input động dựa trên trạng thái lỗi
  const inputNewClass = `${baseInputClass} ${isInvalid ? "border-red-500 focus-visible:ring-red-500 text-red-600" : "border-gray-300"}`;

  return (
    <div className="space-y-6 animate-in slide-in-from-left-2 duration-300">
      
      {/* --- PHẦN 1: ĐƠN GIÁ --- */}
      <div className="flex justify-between items-center border-b pb-2">
         <h3 className="text-sm font-semibold text-gray-900">Chi tiết điện năng</h3>
         <div className="text-xs text-gray-500 font-medium">
            Đơn giá áp dụng: <span className="text-blue-600 font-bold ml-1">{formatVND(calculations.priceElec)} đ/kWh</span>
         </div>
      </div>

      {/* --- PHẦN 2: NHẬP CHỈ SỐ --- */}
      <div className="grid grid-cols-2 gap-6">
        {/* Chỉ số cũ (Tự động lấy từ API, không cho sửa) */}
        <div className="space-y-2">
          <label className={labelClass}>Chỉ số cũ</label>
          <div className="relative">
             <input 
                className={`${baseInputClass} border-gray-300`}
                disabled 
                type="number"
                value={formData.elecOld} 
             />
             <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-medium">kWh</span>
          </div>
        </div>

        {/* Chỉ số mới (Người dùng nhập) */}
        <div className="space-y-2">
          <label className={labelClass}>Chỉ số mới</label>
          <div className="relative">
            <input 
              type="number" 
              className={inputNewClass}
              placeholder="Nhập số mới..."
              value={formData.elecNew} 
              onChange={e => setFormData({...formData, elecNew: e.target.value})}
              min={formData.elecOld}
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-medium">kWh</span>
          </div>
          {isInvalid && (
             <p className="text-xs text-red-500 mt-1">Chỉ số mới không được nhỏ hơn chỉ số cũ ({formData.elecOld})</p>
          )}
        </div>
      </div>

      {/* --- PHẦN 3: KẾT QUẢ TÍNH TOÁN (Lấy từ calculations) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
          
          {/* Số điện tiêu thụ */}
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Đã sử dụng</span>
            <div className="flex items-baseline mt-1">
                <span className="text-2xl font-bold text-gray-800">{calculations.elecUsage}</span>
                <span className="ml-1 text-sm text-gray-600">kWh</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
               = {formData.elecNew || 0} - {formData.elecOld}
            </div>
          </div>

          {/* Thành tiền */}
          <div className="text-right">
             <span className="text-xs text-gray-500 uppercase font-semibold">Thành tiền điện</span>
             <div className="flex items-baseline justify-end mt-1">
                <span className="text-2xl font-bold text-blue-700">{formatVND(calculations.elecTotal)}</span>
                <span className="ml-1 text-sm text-blue-600">đ</span>
             </div>
             <div className="text-xs text-gray-400 mt-1">
                = {calculations.elecUsage} kWh x {formatVND(calculations.priceElec)}
             </div>
          </div>
      </div>
    </div>
  );
};

export default InvoiceElectricTab;