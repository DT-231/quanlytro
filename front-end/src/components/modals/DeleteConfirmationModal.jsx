import React from "react";

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20  fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[400px] p-5 animate-in zoom-in-95 duration-200 mx-4">
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Xác nhận xóa
        </h3>

        {/* Content */}
        <p className="text-sm text-gray-600 mb-6">
          Bạn có chắc chắn muốn xóa <strong>{itemName}</strong> không?
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Xóa
          </button>
        </div>

      </div>
    </div>
  );
};

export default DeleteConfirmationModal;