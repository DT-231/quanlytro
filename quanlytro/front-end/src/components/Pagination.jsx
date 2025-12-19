import React from 'react';
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems = 0, 
  itemName = "kết quả" 
}) => {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };
  const itemsPerPage = totalPages > 0 && totalItems > 0 ? Math.ceil(totalItems / totalPages) : 0;
const startItem = itemsPerPage > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
const endItem = itemsPerPage > 0 ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  return (
    <div className="p-4 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100">
      <span className="text-xs text-gray-500 font-medium">
        Trang {currentPage} / {totalPages || 1}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <FiChevronLeft /> Trước
        </button>
        {[...Array(Math.min(5, totalPages))].map((_, idx) => {
          let pageNum = idx + 1;
          if (totalPages > 5 && currentPage > 3) {
            pageNum = currentPage - 2 + idx;
          }
          if (pageNum > totalPages) return null;

          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-3 py-1 rounded text-sm ${
                currentPage === pageNum
                  ? "bg-gray-100 text-black font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          Sau <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Pagination;