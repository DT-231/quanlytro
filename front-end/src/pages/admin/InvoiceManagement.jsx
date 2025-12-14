import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FaSearch,
  FaEdit,
  FaTrashAlt,
  FaPlus,
  FaEllipsisH,
  FaSync
} from "react-icons/fa";
import { FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import InvoiceDetailModal from "@/components/modals/invoice/InvoiceDetailModal";
import AddInvoiceModal from "@/components/modals/invoice/AddInvoiceModal";
import { Toaster, toast } from "sonner";
import { roomService } from "@/services/roomService";
import { buildingService } from "@/services/buildingService";
import { invoiceService } from "@/services/invoiceService"; // 1. Import Service

const InvoiceManagement = () => {
  // 2. States quản lý dữ liệu
  const [invoices, setInvoices] = useState([]); // Dữ liệu bảng
  const [loading, setLoading] = useState(true); 
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");     
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10; // Limit

  // Modal States
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- 3. HELPER: MAP STATUS UI <-> API ---
  const mapStatusToApi = (uiStatus) => {
    switch (uiStatus) {
      case "Chưa thanh toán": return "PENDING";
      case "Đã thanh toán": return "PAID";
      case "Đang xử lý": return "PROCESSING"; // Nếu có
      default: return null;
    }
  };

  const mapApiStatusToUi = (apiStatus) => {
    switch (apiStatus) {
      case "PENDING": return "Chưa thanh toán";
      case "PAID": return "Đã thanh toán";
      case "Overdue": return "Quá hạn";
      default: return apiStatus;
    }
  };

  // --- 4. CALL API: LẤY DANH SÁCH HÓA ĐƠN ---
  // Sử dụng useCallback để tránh tạo lại hàm khi render
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      // Chuẩn bị tham số cho API
      const params = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        status: mapStatusToApi(filterStatus),
        building_id: filterBuilding || null,
        // search: searchTerm // Nếu API hỗ trợ search text
      };

      // Gọi API
      const response = await invoiceService.getAll(params);

      // Hứng kết quả và kiểm tra
      if (response && response.data) {
        // API trả về { items: [], total: ... } (dựa vào schema Response_dict_)
        const { items, total } = response.data;
        
        setInvoices(items || []);
        setTotalItems(total || 0);
        setTotalPages(Math.ceil((total || 0) / itemsPerPage));
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error("Lỗi tải hóa đơn:", error);
      toast.error("Không thể tải danh sách hóa đơn.");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus, filterBuilding]);

  // --- 5. CALL API: LẤY RESOURCES (Buildings/Rooms cho Modal/Filter) ---
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [bRes, rRes] = await Promise.all([
            buildingService.getAll(),
            roomService.getAll()
        ]);

        // Xử lý Buildings (Chấp nhận nhiều format response)
        if (bRes?.data?.items) setBuildings(bRes.data.items);
        else if (Array.isArray(bRes?.data)) setBuildings(bRes.data);
        else if (Array.isArray(bRes)) setBuildings(bRes);

        // Xử lý Rooms
        if (rRes?.data?.items) setRooms(rRes.data.items);
        else if (Array.isArray(rRes?.data)) setRooms(rRes.data);
        else if (Array.isArray(rRes)) setRooms(rRes);

      } catch (error) {
        console.error("Lỗi lấy dữ liệu nguồn:", error);
      }
    };
    fetchResources();
  }, []);

  // Gọi fetchInvoices khi filter hoặc page thay đổi
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // --- 6. HANDLERS ---
  const handleAddSuccess = () => {
    fetchInvoices(); // Refresh lại bảng sau khi thêm
  };

  const handleViewDetail = async (invoiceId) => {
    try {
        // Gọi API chi tiết để lấy dữ liệu đầy đủ nhất
        const res = await invoiceService.getById(invoiceId);
        if (res && res.data) {
            setSelectedInvoice(res.data);
            setIsDetailModalOpen(true);
        }
    } catch (error) {
        toast.error("Không thể xem chi tiết hóa đơn.");
    }
  };

  // --- FORMATTERS ---
  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatDate = (dateString) => {
      if(!dateString) return "-";
      return new Date(dateString).toLocaleDateString('vi-VN');
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "bg-red-100 text-red-600 border border-red-200";
      case "PAID": return "bg-green-100 text-green-600 border border-green-200";
      case "PROCESSING": return "bg-yellow-100 text-yellow-600 border border-yellow-200";
      default: return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <Toaster position="top-right" richColors />
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý hóa đơn</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý thu chi điện nước và dịch vụ</p>
        </div>
        <div className="flex gap-2">
            <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
            <FaPlus size={12} /> Thêm hóa đơn
            </button>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          {/* Search (Client-side filtering tạm thời nếu API chưa support search text) */}
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
            </div>
            <input
                type="text"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50 transition-all"
                placeholder="Tìm kiếm (Local)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-end">
            {/* Lọc Tòa Nhà (API Supported) */}
            <div className="relative w-full md:w-48">
              <select
                className="w-full appearance-none border border-gray-200 px-3 py-2 pr-8 rounded-md bg-white hover:bg-gray-50 text-sm focus:outline-none cursor-pointer text-gray-700 transition-all"
                value={filterBuilding}
                onChange={(e) => {
                    setFilterBuilding(e.target.value);
                    setCurrentPage(1); // Reset về trang 1 khi lọc
                }}
              >
                <option value="">Tất cả tòa nhà</option>
                {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.building_name || b.name}</option>
                ))}
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400 w-3 h-3 pointer-events-none" />
            </div>

            {/* Lọc Trạng Thái (API Supported) */}
            <div className="relative w-full md:w-40">
              <select
                className="w-full appearance-none border border-gray-200 px-3 py-2 pr-8 rounded-md bg-white hover:bg-gray-50 text-sm focus:outline-none cursor-pointer text-gray-700 transition-all"
                value={filterStatus}
                onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Đã thanh toán">Đã thanh toán</option>
                <option value="Chưa thanh toán">Chưa thanh toán</option>
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400 w-3 h-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-xs font-bold border-b border-gray-200 uppercase text-gray-600">
              <tr>
                <th className="p-4">Phòng</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Ngày lập</th>
                <th className="p-4 text-right">Tổng tiền</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan="6" className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : invoices.length > 0 ? (
                invoices
                // Client-side search filter (nếu cần)
                .filter(i => 
                    !searchTerm || 
                    (i.tenant_name && i.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (i.room_number && i.room_number.includes(searchTerm))
                )
                .map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                        <div className="font-bold text-gray-900">{item.room_number || item.room_name}</div>
                        <div className="text-xs text-gray-500">{item.building_name}</div>
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                        {item.tenant_name || "Chưa cập nhật"}
                    </td>
                    <td className="p-4 text-gray-600">
                        {formatDate(item.invoice_date)}
                        {/* <div className="text-xs text-gray-400">Hạn: {formatDate(item.due_date)}</div> */}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900">
                       {formatCurrency(item.total_amount)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`${getStatusColor(item.status)} px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap`}>
                        {mapApiStatusToUi(item.status)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                            onClick={() => handleViewDetail(item.id)}
                            className="p-2 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                            title="Xem chi tiết"
                        >
                            <FaEllipsisH />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 italic">
                    Không tìm thấy hóa đơn nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium">
            Trang {currentPage} / {totalPages || 1} (Tổng {totalItems} hóa đơn)
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FiChevronLeft /> Prev
            </button>

            {/* Simple Pagination Logic */}
            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                let pageNum = idx + 1;
                // Logic hiển thị trang đơn giản (1 2 3 4 5) hoặc shift theo current page
                if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + idx;
                }
                if (pageNum > totalPages) return null;

                return (
                    <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded text-sm transition-all ${
                        currentPage === pageNum
                            ? "bg-gray-900 text-white font-medium shadow-sm"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                        {pageNum}
                    </button>
                );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <InvoiceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        invoice={selectedInvoice}
      />

      <AddInvoiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSuccess={handleAddSuccess}
        buildings={buildings}
        rooms={rooms}         
      />
    </div>
  );
};

export default InvoiceManagement;