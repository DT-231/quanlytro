import React from "react";

const InvoiceInfoTab = ({ 
  buildings, rooms, formData, setFormData, handleRoomChange, calculations 
}) => {
  // Style chung
  const inputClass = "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50";
  const labelClass = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block text-gray-700";
  
  // Hàm format tiền tệ (có fallback 0 để tránh lỗi NaN)
  const formatVND = (val) => new Intl.NumberFormat('vi-VN').format(Math.round(val || 0));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-left-2 duration-300">
      {/* CỘT TRÁI */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>Tòa nhà <span className="text-red-500">*</span></label>
            <select 
              className={inputClass}
              value={formData.buildingId}
              onChange={(e) => setFormData({...formData, buildingId: e.target.value})}
            >
              <option value="">-- Chọn tòa --</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name || b.building_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Phòng <span className="text-red-500">*</span></label>
            <select 
              className={inputClass}
              value={formData.roomId}
              onChange={(e) => handleRoomChange(e.target.value)}
              disabled={!formData.buildingId}
            >
              <option value="">-- Chọn phòng --</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.room_number}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Tên khách hàng</label>
          <input className={`${inputClass} font-medium text-gray-800`} disabled value={formData.tenantName} />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Tháng lập hóa đơn <span className="text-red-500">*</span></label>
          <input 
            type="month" className={inputClass} 
            value={formData.billingMonth} 
            onChange={e => setFormData({...formData, billingMonth: e.target.value})} 
          />
        </div>
      </div>

      {/* CỘT PHẢI */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className={labelClass}>Hạn thanh toán <span className="text-red-500">*</span></label>
          <input 
            type="date" className={inputClass} 
            value={formData.dueDate} 
            onChange={e => setFormData({...formData, dueDate: e.target.value})} 
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Số người ở</label>
          <input 
            type="number" className={inputClass} min="1"
            value={formData.numberOfPeople} 
            onChange={e => setFormData({...formData, numberOfPeople: parseInt(e.target.value) || 1})} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>Tổng tiền</label>
            <div className="relative">
              {/* Hiển thị tiền dạng text input nhưng readOnly để copy được */}
              <input 
                className={`${inputClass} font-bold text-gray-900 pr-8 bg-gray-50`} 
                readOnly 
                value={formatVND(calculations.totalAmount)} 
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-medium">đ</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Ghi chú</label>
            <input 
              className={inputClass} 
              placeholder="Ghi chú thêm (nếu có)" 
              value={formData.notes || ''} 
              onChange={e => setFormData({...formData, notes: e.target.value})} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceInfoTab;