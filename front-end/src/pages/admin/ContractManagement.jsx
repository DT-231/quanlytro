import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaTrashAlt,
  FaPlus,
  FaFileContract,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimesCircle,
  FaEdit
} from "react-icons/fa";
import { Toaster, toast } from "sonner";

// Services
import { contractService } from "@/services/contractService";
import { buildingService } from "@/services/buildingService";

// Components & Modals
import AddContractModal from "@/components/modals/contract/AddContractModal";
import EditContractModal from "@/components/modals/contract/EditContractModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import Pagination from "@/components/Pagination";

// NEW: Import FilterBar
import FilterBar from "@/components/FilterBar";

const ContractManagement = () => {
  // --- 1. STATES QUẢN LÝ DỮ LIỆU ---
  const [contracts, setContracts] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [statsData, setStatsData] = useState({
    total_contracts: 0,
    active_contracts: 0,
    expiring_soon: 0,
    expired_contracts: 0
  });
  const [loading, setLoading] = useState(true);

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState(null);


  const mapStatusToApi = (uiStatus) => {
    switch (uiStatus) {
      case "Đang hoạt động": return "ACTIVE";
      case "Đã hết hạn": return "EXPIRED";
      case "Chờ ký": return "PENDING";
      default: return null;
    }
  };

  // --- 3. API CALLS ---

  // A. Lấy danh sách hợp đồng
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        size: itemsPerPage,
        search: searchTerm || null,
        building: filterBuilding || null,
        status: mapStatusToApi(filterStatus),
      };

      const response = await contractService.getAll(params);
      const data = response?.data || response; 
      
      if (data && (data.items || Array.isArray(data))) {
        const items = data.items || (Array.isArray(data) ? data : []);
        setContracts(items);
        
        const pagination = data.pagination || {};
        setTotalPages(pagination.totalPages || 1);
        setTotalItems(pagination.totalItems || 0);
      } else {
        setContracts([]);
        setTotalPages(1);
      }

    } catch (error) {
      console.error("Failed to fetch contracts:", error);
      toast.error("Không thể tải danh sách hợp đồng.");
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterBuilding, filterStatus]);

  // B. Lấy thống kê
  const fetchStats = async () => {
    try {
      const response = await contractService.getStats();
      const data = response?.data || response;
      if (data) {
        setStatsData({
            total_contracts: data.total_contracts || 0,
            active_contracts: data.active_contracts || 0,
            expiring_soon: data.expiring_soon || 0,
            expired_contracts: data.expired_contracts || 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // C. Lấy danh sách tòa nhà
  const fetchBuildings = async () => {
    try {
      const response = await buildingService.getAll({ size: 100 });
      const data = response?.data || response;
      if (data?.items) {
        setBuildings(data.items);
      }
    } catch (error) {
      console.error("Lỗi tải tòa nhà:", error);
    }
  };

  // --- 4. USE EFFECT ---
  useEffect(() => {
    fetchStats();
    fetchBuildings();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContracts();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchContracts]);

  // --- FILTER CONFIGURATION ---
  
  const buildingOptions = useMemo(() => {
    return buildings.map(b => ({ id: b.id, name: b.building_name }));
  }, [buildings]);

  // 2. Danh sách trạng thái
  const statusOptions = [
    { id: "Đang hoạt động", name: "Đang hoạt động" },
    { id: "Chờ ký", name: "Chờ ký" },
    { id: "Đã hết hạn", name: "Đã hết hạn" },
  ];

  // 3. Cấu hình FilterBar
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

  // 4. Xử lý thay đổi bộ lọc
  const handleFilterChange = (key, value) => {
    if (key === "building") {
       setFilterBuilding(value);
    } else if (key === "status") {
      setFilterStatus(value);
    }
    setCurrentPage(1); 
  };

  // 5. Xóa bộ lọc
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterBuilding("");
    setFilterStatus("");
    setCurrentPage(1);

  };

  // --- 5. HANDLERS (Modal & Actions) ---

  const handleAddNewContract = (createdContract) => {
    setIsAddModalOpen(false);
    setCurrentPage(1);
    fetchContracts();
    fetchStats();
  };

  const handleUpdateSuccess = () => {
    setIsEditModalOpen(false);
    fetchContracts();
    fetchStats();
  };

  const handleDeleteClick = (contract) => {
    setContractToDelete(contract);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!contractToDelete) return;
    try {
      await contractService.delete(contractToDelete.id);
      toast.success(`Đã xóa hợp đồng: ${contractToDelete.contract_number}`);
      fetchContracts();
      fetchStats();
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast.error("Xóa hợp đồng thất bại.");
    } finally {
      setDeleteModalOpen(false);
      setContractToDelete(null);
    }
  };

  const handleEditClick = (contract) => {
    setContractToEdit(contract);
    setIsEditModalOpen(true);
  };

  // --- 6. FORMATTERS & UI HELPERS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500 text-white";
      case "PENDING": return "bg-gray-200 text-gray-800";
      case "EXPIRED": return "bg-red-600 text-white";
      case "TERMINATED": return "bg-gray-500 text-white";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ACTIVE": return "Đang hoạt động";
      case "EXPIRED": return "Đã hết hạn";
      case "TERMINATED": return "Đã kết thúc";
      case "PENDING": return "Chờ ký";
      default: return status || "---";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <Toaster position="top-right" richColors />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý hợp đồng</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <FaPlus size={12} /> Thêm hợp đồng
        </button>
      </div>

      {/* FILTER BAR (REUSABLE COMPONENT) */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Mã hợp đồng, tên khách hàng..."
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          {
            title: "Tổng hợp đồng",
            value: statsData.total_contracts,
            icon: FaFileContract,
            color: "text-gray-600",
          },
          {
            title: "Đang hoạt động",
            value: statsData.active_contracts,
            icon: FaCheckCircle,
            color: "text-green-500",
          },
          {
            title: "Sắp hết hạn (30 ngày)",
            value: statsData.expiring_soon,
            icon: FaExclamationCircle,
            color: "text-yellow-500",
          },
          {
            title: "Đã hết hạn",
            value: statsData.expired_contracts,
            icon: FaTimesCircle,
            color: "text-red-500",
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium mb-1">{stat.title}</h3>
              <stat.icon className={`w-4 h-4 ${stat.color} opacity-80`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Danh sách hợp đồng</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-xs font-bold border-b border-gray-200 uppercase text-gray-600">
              <tr>
                <th className="p-4">Mã hợp đồng</th>
                <th className="p-4">Phòng</th>
                <th className="p-4">Tên khách hàng</th>
                <th className="p-4">Tòa nhà</th>
                <th className="p-4">Thời hạn</th>
                <th className="p-4">Giá thuê</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : contracts.length > 0 ? (
                contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 font-bold text-gray-900">{contract.contract_number}</td>
                    <td className="p-4 font-bold text-gray-800">{contract.room_number}</td>
                    <td className="p-4 font-medium">{contract.tenant_name}</td>
                    <td className="p-4 text-gray-600 max-w-[150px] truncate" title={contract.building_name}>
                      {contract.building_name}
                    </td>
                    <td className="p-4 text-sm font-medium">
                      <div>Từ: <span className="text-gray-900">{formatDate(contract.start_date)}</span></div>
                      <div>Đến: <span className="text-gray-900">{formatDate(contract.end_date)}</span></div>
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {formatCurrency(contract.rental_price)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`${getStatusColor(contract.status)} px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap`}>
                        {getStatusLabel(contract.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(contract)}
                          className="p-2 border border-gray-200 rounded hover:bg-gray-900 hover:text-white text-gray-500 transition-all shadow-sm"
                          title="Xem chi tiết"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(contract)}
                          className="p-2 border border-red-100 rounded hover:bg-red-500 hover:text-white text-red-500 transition-all shadow-sm bg-red-50"
                          title="Xóa"
                        >
                          <FaTrashAlt size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500 italic">
                    Không tìm thấy hợp đồng nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemName="hợp đồng"
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* --- MODALS --- */}
      <AddContractModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSuccess={handleAddNewContract}
      />

      <EditContractModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        contractData={contractToEdit}
        onUpdateSuccess={handleUpdateSuccess}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={contractToDelete?.contract_number}
        itemType="Hợp đồng"
      />
    </div>
  );
};

export default ContractManagement;