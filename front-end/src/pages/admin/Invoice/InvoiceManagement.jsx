import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaPlus, FaEllipsisH, FaSearch } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Services
import { invoiceService } from "@/services/invoiceService";
import { buildingService } from "@/services/buildingService";

// Components & Modals
import AddInvoiceModal from "@/components/modals/invoice/AddInvoiceModal";
import Pagination from "@/components/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useDebounce from "@/hooks/useDebounce";
import { X } from "lucide-react";

// --- HELPER FUNCTIONS ---
const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
const formatDate = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString('vi-VN');
}

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

const InvoiceManagement = () => {
  const navigate = useNavigate();

  // --- STATES ---
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination State
  const [pagination, setPagination] = useState({
    totalItems: 0,
    page: 1,
    pageSize: 5,
    totalPages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Data
  const [buildings, setBuildings] = useState([]);
  
  // Filter States
  const [searchValue, setSearchValue] = useState("");
  const debounceSearchValue = useDebounce(searchValue, 500);

  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- API CALLS ---
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: 1,      
        size: 1000,  
        status: selectedStatus ? mapStatusToApi(selectedStatus) : undefined,
        building_id: selectedBuildingId || undefined,
      };

      const response = await invoiceService.getAll(params);

      if (response && response.data) {
        let items = [];
        if (Array.isArray(response.data)) {
            items = response.data;
        } else {
            items = response.data.items || [];
        }
        const totalItems = items.length;
        
        setInvoices(items);
        setPagination(prev => ({
            ...prev,
            totalItems: totalItems,
            totalPages: Math.ceil(totalItems / prev.pageSize), 
        }));

      } else {
        setInvoices([]);
        setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 0 }));
      }
    } catch (error) {
      console.error("Lỗi tải hóa đơn:", error);
      toast.error("Không thể tải danh sách hóa đơn.");
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageSize, selectedStatus, selectedBuildingId, debounceSearchValue]);

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


  // --- HANDLERS ---
  const handleClearFilters = () => {
    setSearchValue("");
    setSelectedBuildingId(null);
    setSelectedStatus(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    searchValue.trim() !== "" || 
    selectedBuildingId !== null || 
    selectedStatus !== null;

  const handleAddSuccess = () => {
    setCurrentPage(1);
    fetchInvoices(); 
  };

  const handleViewDetail = (invoiceId) => {
     navigate(`/admin/invoices/${invoiceId}`);
  };

  // 1. Logic lọc tìm kiếm 
  const filteredInvoices = useMemo(() => {
      if (!debounceSearchValue) return invoices;
      return invoices.filter(i => 
        (i.tenant_name && i.tenant_name.toLowerCase().includes(debounceSearchValue.toLowerCase())) ||
        (i.room_number && i.room_number.toLowerCase().includes(debounceSearchValue.toLowerCase()))
      );
  }, [invoices, debounceSearchValue]);

  // 2. LOGIC CẮT TRANG 
  const paginatedInvoices = useMemo(() => {
      const startIndex = (currentPage - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      return invoices.slice(startIndex, endIndex); 
  }, [invoices, currentPage, pagination.pageSize]);


  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Toaster position="top-right" richColors />
      
      {/* HEADER */}
       <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Quản lý hóa đơn</h1>
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

      {/* FILTER SECTION */}
      <section className="bg-white p-4 md:p-5 rounded-[10px] border border-black/10 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <h2 className="text-base md:text-lg font-semibold leading-5 text-black">
            Tìm kiếm & Bộ lọc
          </h2>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa bộ lọc</span>
              <span className="sm:hidden">Xóa</span>
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1">
                 <input
                  type="text"
                  placeholder="Nhập tên phòng, khách thuê..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="h-10 w-full rounded-md border border-zinc-200 bg-gray-50 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={selectedBuildingId || ""}
              onValueChange={(v) => {
                  setSelectedBuildingId(v === "all" ? null : v);
                  setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px] h-10">
                <SelectValue placeholder="Chọn tòa nhà" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tòa nhà</SelectItem>
                {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                        {b.building_name || b.name}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>

             <Select
              value={selectedStatus || ""}
              onValueChange={(v) => {
                  setSelectedStatus(v === "all" ? null : v);
                  setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Chưa thanh toán">Chưa thanh toán</SelectItem>
                <SelectItem value="Đã thanh toán">Đã thanh toán</SelectItem>
                <SelectItem value="Quá hạn">Quá hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* TABLE SECTION */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <h3 className="font-semibold text-gray-700">Danh sách hóa đơn</h3>
             {!isLoading && pagination.totalItems > 0 && (
                <span className="text-sm text-gray-500">
                    Tổng: <span className="font-semibold text-gray-900">{pagination.totalItems}</span> hóa đơn
                </span>
             )}
         </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs font-bold border-b border-gray-200 uppercase text-gray-600">
              <tr>
                <th className="p-4 whitespace-nowrap">Thông tin phòng</th>
                <th className="p-4 whitespace-nowrap">Khách hàng</th>
                <th className="p-4 whitespace-nowrap">Kỳ hóa đơn</th>
                <th className="p-4 text-right whitespace-nowrap">Tổng tiền</th>
                <th className="p-4 text-center whitespace-nowrap">Trạng thái</th>
                <th className="p-4 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {isLoading ? (
                 <tr>
                    <td colSpan="6" className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mb-2"></div>
                            <span className="text-gray-500">Đang tải dữ liệu...</span>
                        </div>
                    </td>
                 </tr>
              ) : paginatedInvoices.length > 0 ? ( 
                /* SỬ DỤNG paginatedInvoices THAY VÌ filteredInvoices */
                paginatedInvoices.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                    onClick={() => handleViewDetail(item.id)}
                  >
                    <td className="p-4">
                        <div className="font-bold text-gray-900 text-base">{item.room_number || "Phòng ?"}</div>
                        <div className="text-xs text-gray-500">{item.building_name}</div>
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                        {item.tenant_name || "Chưa có khách"}
                    </td>
                    <td className="p-4 text-gray-600 whitespace-nowrap">
                        {formatDate(item.invoice_date)}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900 text-base whitespace-nowrap">
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
                            onClick={(e) => {
                                e.stopPropagation(); 
                                handleViewDetail(item.id);
                            }}
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
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-lg font-medium">Không tìm thấy hóa đơn nào</p>
                        <p className="text-sm">Vui lòng thử thay đổi bộ lọc tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* PAGINATION SECTION */}
      <Pagination 
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        itemName="hóa đơn"
      />

      <AddInvoiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSuccess={handleAddSuccess}
        buildings={buildings}
      />
    </div>
  );
};

export default InvoiceManagement;