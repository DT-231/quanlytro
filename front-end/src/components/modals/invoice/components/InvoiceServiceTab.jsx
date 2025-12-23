import React from "react";
import { FaTrash, FaPlus } from "react-icons/fa";

const InvoiceServiceTab = ({ formData, handleServiceChange, addService, removeService }) => {
  const inputClass = "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950";
  const labelClass = "text-sm font-medium mb-2 block";

  return (
    <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
      {formData.services.length === 0 && (
        <div className="text-center text-gray-500 py-8 border border-dashed rounded-md">
          Chưa có dịch vụ nào
        </div>
      )}
      
      {formData.services.map((service, idx) => (
        <div key={idx} className="flex gap-4 items-end group">
          <div className="flex-1 space-y-2">
            <label className={labelClass}>Tên dịch vụ</label>
            <input 
              className={inputClass} 
              value={service.name} 
              onChange={(e) => handleServiceChange(idx, 'name', e.target.value)}
              placeholder="Ví dụ: Rác, Wifi..." 
            />
          </div>
          <div className="w-1/3 space-y-2">
            <label className={labelClass}>Số tiền (VNĐ)</label>
            <input 
              type="number" className={inputClass} 
              value={service.price} 
              onChange={(e) => handleServiceChange(idx, 'price', e.target.value)} 
            />
          </div>
          <button 
            onClick={() => removeService(idx)} 
            className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-transparent hover:border-red-100 transition-all mb-[1px]"
            title="Xóa dịch vụ"
          >
            <FaTrash size={14} />
          </button>
        </div>
      ))}
      
      <button 
        onClick={addService} 
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 mt-4 font-medium"
      >
        <FaPlus /> Thêm dịch vụ khác
      </button>
    </div>
  );
};

export default InvoiceServiceTab; 