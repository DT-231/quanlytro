import React, { useState, useEffect, useCallback } from "react";
import {
  FaSearch,
  FaPlus,
  FaEllipsisH,
  FaSync
} from "react-icons/fa";
import { FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import InvoiceDetailModal from "@/components/modals/invoice/InvoiceDetailModal";
import AddInvoiceModal from "@/components/modals/invoice/AddInvoiceModal";
import { Toaster, toast } from "sonner";
import Pagination from "@/components/Pagination";
// Import Services
import { invoiceService } from "@/services/invoiceService";
import { buildingService } from "@/services/buildingService"; 

const InvoiceManagement = () => {
  // --- STATES QUẢN LÝ DỮ LIỆU ---
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dữ liệu cho bộ lọc (Filter)
  const [buildingsForFilter, setBuildingsForFilter] = useState([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuilding, setFilterBuilding] = useState(""); 
  const [filterStatus, setFilterStatus] = useState("");     
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Modal States
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- 1. HELPER FUNCTIONS ---
  const mapStatusToApi = (uiStatus) => {
    switch (uiStatus) {
      case "Chưa thanh toán": return "PENDING";
      case "Đã thanh toán": return "PAID";
      case "Quá hạn": return "OVERDUE";
      default: return null;
    }
  };

  const mapApiStatusToUi = (apiStatus) => {
    switch (apiStatus) {
      case "PENDING": return "Chưa thanh toán";
      case "PAID": return "Đã thanh toán";
      case "OVERDUE": return "Quá hạn";
      default: return apiStatus;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "PAID": return "bg-green-100 text-green-700 border border-green-200";
      case "OVERDUE": return "bg-red-100 text-red-700 border border-red-200";
      default: return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  
  const formatDate = (dateString) => {
      if(!dateString) return "-";
      return new Date(dateString).toLocaleDateString('vi-VN');
  }

  // --- 2. API CALLS ---

  // A. Lấy danh sách hóa đơn
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        status: mapStatusToApi(filterStatus),
        building_id: filterBuilding || null,
        // search: searchTerm // Bỏ comment nếu API hỗ trợ search
      };

      const response = await invoiceService.getAll(params);

      if (response && response.data) {
        // Xử lý dữ liệu trả về linh hoạt (Array hoặc Object có items)
        let items = [];
        let total = 0;

        if (Array.isArray(response.data)) {
            items = response.data;
            total = items.length;
        } else {
            items = response.data.items || [];
            total = response.data.total || 0;
        }
        
        setInvoices(items);
        setTotalItems(total);
        setTotalPages(Math.ceil(total / itemsPerPage) || 1);
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

  // B. Lấy danh sách tòa nhà cho bộ lọc (Chỉ chạy 1 lần)
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await buildingService.getAll();
        // Xử lý response linh hoạt
        let buildingList = [];
        if (Array.isArray(res)) buildingList = res;
        else if (res?.data && Array.isArray(res.data)) buildingList = res.data;
        else if (res?.data?.items) buildingList = res.data.items;
        
        setBuildingsForFilter(buildingList);
      } catch (error) {
        console.error("Lỗi tải tòa nhà:", error);
      }
    };
    fetchBuildings();
  }, []);

  // Gọi fetchInvoices khi filter thay đổi
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // --- 3. EVENT HANDLERS ---
  
  const handleAddSuccess = () => {
    fetchInvoices(); // Refresh bảng
  };

  const handleViewDetail = async (invoiceId) => {
    try {
        const res = await invoiceService.getById(invoiceId);
        if (res && res.data) {
            setSelectedInvoice(res.data);
            setIsDetailModalOpen(true);
        }
    } catch (error) {
        toast.error("Không thể xem chi tiết.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <Toaster position="top-right" richColors />
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý hóa đơn</h1>
            <p className="text-sm text-gray-500 mt-1">Theo dõi thu chi điện nước hàng tháng</p>
        </div>
        <div className="flex gap-2">
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md"
            >
                <FaPlus size={12} /> Thêm hóa đơn
            </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          {/* Search */}
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
            </div>
            <input
                type="text"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50 transition-all"
                placeholder="Tìm theo phòng hoặc khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-end">
            {/* Filter Building */}
            <div className="relative w-full md:w-48">
              <select
                className="w-full appearance-none border border-gray-200 px-3 py-2 pr-8 rounded-md bg-white hover:bg-gray-50 text-sm focus:outline-none cursor-pointer text-gray-700 transition-all"
                value={filterBuilding}
                onChange={(e) => {
                    setFilterBuilding(e.target.value);
                    setCurrentPage(1);
                }}
              >
                <option value="">Tất cả tòa nhà</option>
                {buildingsForFilter.map(b => (
                    <option key={b.id} value={b.id}>{b.building_name || b.name}</option>
                ))}
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400 w-3 h-3 pointer-events-none" />
            </div>

            {/* Filter Status */}
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
                <option value="Chưa thanh toán">Chưa thanh toán</option>
                <option value="Đã thanh toán">Đã thanh toán</option>
                <option value="Quá hạn">Quá hạn</option>
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400 w-3 h-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-xs font-bold border-b border-gray-200 uppercase text-gray-600">
              <tr>
                <th className="p-4">Thông tin phòng</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Kỳ hóa đơn</th>
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
                // Client-side search (nếu API chưa hỗ trợ search)
                .filter(i => 
                    !searchTerm || 
                    (i.tenant_name && i.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (i.room_number && i.room_number.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                        <div className="font-bold text-gray-900 text-base">{item.room_number || "Phòng ?"}</div>
                        <div className="text-xs text-gray-500">{item.building_name}</div>
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                        {item.tenant_name || "Chưa có khách"}
                    </td>
                    <td className="p-4 text-gray-600">
                        {formatDate(item.invoice_date)}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900 text-base">
                       {formatCurrency(item.total_amount)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`${getStatusColor(item.status)} px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap`}>
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
                  <td colSpan="6" className="p-12 text-center text-gray-500 italic">
                    <div className="flex flex-col items-center gap-2">
                        <span>Chưa có hóa đơn nào được tạo.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination 
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  onPageChange={setCurrentPage} 
  label="hóa đơn"              
/>
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
      />
    </div>
  );
};

export default InvoiceManagement;