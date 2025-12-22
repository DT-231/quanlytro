// src/pages/admin/InvoiceManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaPlus, FaEllipsisH } from "react-icons/fa";
import { Toaster, toast } from "sonner";

// Services
import { invoiceService } from "@/services/invoiceService";
import { buildingService } from "@/services/buildingService";

// Components & Modals
import InvoiceDetailModal from "@/components/modals/invoice/InvoiceDetailModal";
import AddInvoiceModal from "@/components/modals/invoice/AddInvoiceModal";
import Pagination from "@/components/Pagination";

// NEW: Import FilterBar
import FilterBar from "@/components/FilterBar";

const InvoiceManagement = () => {
  // --- STATES ---
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter Data
  const [buildings, setBuildings] = useState([]);
  
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

  // A. Fetch Invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: itemsPerPage,
        status: mapStatusToApi(filterStatus),
        building_id: filterBuilding || null,
        // search: searchTerm // Add search param if API supports it
      };

      const response = await invoiceService.getAll(params);

      if (response && response.data) {
        let items = [];
        const pagination = response.data.pagination || {};

        if (Array.isArray(response.data)) {
            items = response.data;
        } else {
            items = response.data.items || [];
        }
        
        setInvoices(items);
        setTotalItems(pagination.totalItems || 0);
        setTotalPages(pagination.totalPages || 1);
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

  // B. Fetch Buildings for Filter
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await buildingService.getAll();
        let buildingList = [];
        if (Array.isArray(res)) buildingList = res;
        else if (res?.data && Array.isArray(res.data)) buildingList = res.data;
        else if (res?.data?.items) buildingList = res.data.items;
        
        setBuildings(buildingList);
      } catch (error) {
        console.error("Lỗi tải tòa nhà:", error);
      }
    };
    fetchBuildings();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // --- 3. FILTER CONFIGURATION ---

  // Prepare Building Options
  const buildingOptions = useMemo(() => {
    return buildings.map(b => ({ id: b.id, name: b.building_name || b.name }));
  }, [buildings]);

  // Prepare Status Options
  const statusOptions = [
    { id: "Chưa thanh toán", name: "Chưa thanh toán" },
    { id: "Đã thanh toán", name: "Đã thanh toán" },
    { id: "Quá hạn", name: "Quá hạn" },
  ];

  // Filter Configuration Array
  const filterConfigs = [
    {
      key: "building",
      type: "combobox",
      placeholder: "Lọc theo tòa nhà",
      options: buildingOptions,
      value: filterBuilding,
    },
    {
      key: "status",
      type: "select",
      placeholder: "Trạng thái",
      options: statusOptions,
      value: filterStatus,
    },
  ];

  // Handle Filter Change
  const handleFilterChange = (key, value) => {
    if (key === "building") {
        setFilterBuilding(value);
    } else if (key === "status") {
        setFilterStatus(value);
    }
    setCurrentPage(1);
  };

  // Handle Clear Filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterBuilding("");
    setFilterStatus("");
    setCurrentPage(1);
  };

  // --- 4. EVENT HANDLERS ---
  
  const handleAddSuccess = () => {
    fetchInvoices(); 
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

      {/* FILTER BAR (REUSABLE COMPONENT) */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo phòng hoặc khách hàng..."
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

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
                // Client-side search logic if API doesn't support it directly yet
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