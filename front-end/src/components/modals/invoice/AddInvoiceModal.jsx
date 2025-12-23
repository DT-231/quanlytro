import React, { useState } from "react";
import { FaTimes, FaInfoCircle, FaBolt, FaTint, FaConciergeBell } from "react-icons/fa";

// Import Hook
import { useInvoiceForm } from "./hooks/useInvoiceForm";

// Import Các Tab Con
import InvoiceInfoTab from "./components/InvoiceInfoTab";
import InvoiceElectricTab from "./components/InvoiceElectricTab";
import InvoiceWaterTab from "./components/InvoiceWaterTab";
import InvoiceServiceTab from "./components/InvoiceServiceTab";

const AddInvoiceModal = ({ isOpen, onClose, onAddSuccess, buildings = [] }) => {
  // 1. Gọi Hook xử lý logic
  const { 
    formData, setFormData, rooms, loading, calculations,
    handleRoomChange, handleServiceChange, addService, removeService, handleSubmit 
  } = useInvoiceForm({ isOpen, buildings, onSuccess: onAddSuccess, onClose });

  // 2. State quản lý Tab đang active
  const [activeTab, setActiveTab] = useState("info");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50  p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-start p-6 pb-4 border-b border-gray-100">
           <div>
              <h3 className="font-bold tracking-tight text-xl text-gray-900">Thêm hóa đơn</h3>
              <p className="text-sm text-gray-500 mt-1">Nhập thông tin chi tiết cho hóa đơn tháng này.</p>
           </div>
           <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition-colors text-gray-400 hover:text-red-500">
             <FaTimes size={18} />
           </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="px-6 bg-gray-50/80 border-b border-gray-200">
           <div className="flex space-x-6">
              {[
                { id: "info", label: "Thông tin", icon: <FaInfoCircle /> },
                { id: "electric", label: "Điện", icon: <FaBolt /> },
                { id: "water", label: "Nước", icon: <FaTint /> },
                { id: "service", label: "Dịch vụ", icon: <FaConciergeBell /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-all
                    ${activeTab === tab.id 
                      ? "border-gray-900 text-gray-900" 
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
                  `}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
           </div>
        </div>

        {/* BODY CONTENT (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1">

          {activeTab === "info" && (
            <InvoiceInfoTab 
              buildings={buildings}
              rooms={rooms}
              formData={formData}
              setFormData={setFormData}
              handleRoomChange={handleRoomChange}
              calculations={calculations}
            />
          )}

          {activeTab === "electric" && (
            <InvoiceElectricTab 
              formData={formData}
              setFormData={setFormData}
              calculations={calculations}
            />
          )}

          {activeTab === "water" && (
            <InvoiceWaterTab 
              formData={formData}
              setFormData={setFormData}
              calculations={calculations}
            />
          )}

          {activeTab === "service" && (
            <InvoiceServiceTab 
              formData={formData}
              handleServiceChange={handleServiceChange}
              addService={addService}
              removeService={removeService}
            />
          )}

        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
            <button 
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
                Hủy
            </button>
            <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
            >
                {loading ? "Đang xử lý..." : "Thêm hóa đơn"}
            </button>
        </div>

      </div>
    </div>
  );
};

export default AddInvoiceModal;