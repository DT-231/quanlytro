import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = 0,
  pageSize = 20, 
  itemName = "kết quả",
}) => {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  let startPage = 1;
  if (totalPages > 5) {
    if (currentPage <= 3) {
      startPage = 1;
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - 4;
    } else {
      startPage = currentPage - 2;
    }
  }

  return (
    <div className="my-2 px-2 flex flex-col sm:flex-row justify-between items-center gap-4">
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

        {/* --- SỬA LOGIC 3: Render số trang --- */}
        {[...Array(Math.min(5, totalPages))].map((_, idx) => {
          const pageNum = startPage + idx; // Logic mới đơn giản và ổn định hơn

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
