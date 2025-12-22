// src/pages/admin/IssueManagement.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  FaTools,
  FaInfoCircle,
  FaClipboardList,
  FaCheckCircle,
  FaEdit,
  FaTrashAlt,
} from "react-icons/fa";
import { Toaster, toast } from "sonner";

// Services
import { maintenanceService } from "@/services/maintenanceService";
import { buildingService } from "@/services/buildingService";

// Components
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import Pagination from "@/components/Pagination";

// NEW: Import FilterBar
import FilterBar from "@/components/FilterBar";

const IssueManagement = () => {
  // --- STATES ---
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({
    total_requests: 0,
    pending: 0,
    not_processed: 0,
    processed: 0
  });
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState(null);

  // --- FETCH DATA ---

  // 1. Fetch Buildings for Filter
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await buildingService.getAll();
        if (res?.data?.items) {
          setBuildings(res.data.items);
        } else if (Array.isArray(res?.data)) { // Handle different response structure if any
            setBuildings(res.data);
        }
      } catch (error) {
        console.error("Lỗi lấy tòa nhà:", error);
      }
    };
    fetchBuildings();
  }, []);

  // 2. Fetch Stats
  const fetchStats = async () => {
    try {
      // Find building ID if a name is selected in filter (since API might need ID)
      // Or pass name if API supports name filtering. Assuming API needs ID for stats filtering:
      const selectedBuildingObj = buildings.find(b => b.building_name === filterBuilding);
      const buildingId = selectedBuildingObj ? selectedBuildingObj.id : null;

      const res = await maintenanceService.getStats({ building_id: buildingId });
      if (res?.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Lỗi lấy thống kê:", error);
    }
  };

  // 3. Fetch Issues List
  const fetchIssues = async () => {
    setLoading(true);
    try {
      // Map UI Status to API Status if needed, or pass directly
      // API expects: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
      // Filter values are: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
      
      // Find building ID if needed for filtering
      const selectedBuildingObj = buildings.find(b => b.building_name === filterBuilding);
      const buildingId = selectedBuildingObj ? selectedBuildingObj.id : null;

      const params = {
        page: currentPage,
        pageSize: itemsPerPage,
        search: searchTerm || null,
        building_id: buildingId, // Passing ID is safer for API
        status: filterStatus || null,
      };

      const res = await maintenanceService.getAll(params);
      
      if (res?.data) {
        setIssues(res.data.items || []);
        if (res.data.pagination) {
            setTotalPages(res.data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error("Lỗi tải danh sách sự cố:", error);
      toast.error("Không thể tải danh sách sự cố");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when filters change
  useEffect(() => {
    fetchIssues();
    fetchStats(); 
  }, [currentPage, searchTerm, filterBuilding, filterStatus]); // Dependencies trigger re-fetch

  // --- FILTER CONFIGURATION ---

  // 1. Building Options
  const buildingOptions = useMemo(() => {
    return buildings.map(b => ({ id: b.id, name: b.building_name }));
  }, [buildings]);

  // 2. Status Options (Based on API Enum)
  const statusOptions = [
    { id: "PENDING", name: "Chưa xử lý" },
    { id: "IN_PROGRESS", name: "Đang xử lý" },
    { id: "COMPLETED", name: "Hoàn thành" },
    { id: "CANCELLED", name: "Đã hủy" },
  ];

  // 3. Filter Configs
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
      value: filterStatus, // Ensure this matches ID in statusOptions
    },
  ];

  // 4. Handle Filter Change
  const handleFilterChange = (key, value) => {
    if (key === "building") {
        setFilterBuilding(value); // Value is building NAME from GenericCombobox
    } else if (key === "status") {
        setFilterStatus(value); // Value is status ID (e.g., PENDING)
    }
    setCurrentPage(1);
  };

  // 5. Handle Clear Filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterBuilding("");
    setFilterStatus("");
    setCurrentPage(1);
    // Removed toast notification
  };

  // --- HANDLERS ---

  const handleDeleteClick = (issue) => {
    setIssueToDelete(issue);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!issueToDelete) return;
    try {
      await maintenanceService.delete(issueToDelete.id);
      toast.success(`Đã xóa sự cố #${issueToDelete.request_code}`);
      fetchIssues(); 
      fetchStats(); 
    } catch (error) {
      console.error("Lỗi xóa:", error);
      toast.error("Xóa thất bại (Có thể do trạng thái không hợp lệ)");
    } finally {
      setDeleteModalOpen(false);
      setIssueToDelete(null);
    }
  };

  const handleEditClick = (issue) => {
    toast.info(`Chức năng sửa sự cố #${issue.request_code} đang phát triển`);
  };

  // --- HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-red-100 text-red-700 border border-red-200"; 
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"; 
      case "COMPLETED":
        return "bg-green-100 text-green-700 border border-green-200"; 
      case "CANCELLED":
        return "bg-gray-100 text-gray-600 border border-gray-200"; 
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING": return "Chưa xử lý";
      case "IN_PROGRESS": return "Đang xử lý";
      case "COMPLETED": return "Hoàn thành";
      case "CANCELLED": return "Đã hủy";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <Toaster position="top-right" richColors />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý sự cố</h1>
      </div>

      {/* REUSABLE FILTER BAR */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo mã yêu cầu, phòng, người gửi..."
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium mb-1 text-gray-600">Tổng sự cố</h3>
                <FaInfoCircle className="w-4 h-4 text-blue-500 opacity-70" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.total_requests || 0}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium mb-1 text-gray-600">Chưa xử lý</h3>
                <FaClipboardList className="w-4 h-4 text-red-500 opacity-70" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.not_processed || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium mb-1 text-gray-600">Đang xử lý</h3>
                <FaTools className="w-4 h-4 text-yellow-500 opacity-70" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.pending || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium mb-1 text-gray-600">Hoàn thành</h3>
                <FaCheckCircle className="w-4 h-4 text-green-500 opacity-70" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.processed || 0}</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Danh sách yêu cầu xử lý</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs font-bold border-b border-gray-200 uppercase text-gray-600">
              <tr>
                <th className="p-4">Mã</th>
                <th className="p-4">Phòng</th>
                <th className="p-4">Người gửi</th>
                <th className="p-4 text-center">Ngày tạo</th>
                <th className="p-4">Nội dung</th>
                <th className="p-4">Tòa nhà</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan="8" className="p-8 text-center">Đang tải dữ liệu...</td></tr>
              ) : issues.length > 0 ? (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 font-bold text-gray-900">#{issue.request_code}</td>
                    <td className="p-4 font-bold text-gray-800">{issue.room_code}</td>
                    <td className="p-4 font-medium">{issue.tenant_name}</td>
                    <td className="p-4 text-center text-gray-600">{formatDate(issue.request_date)}</td>
                    <td className="p-4 font-medium text-gray-800 max-w-[200px] truncate" title={issue.content}>
                      {issue.content}
                    </td>
                    <td className="p-4 text-gray-600 max-w-[150px] truncate" title={issue.building_name}>
                      {issue.building_name}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`${getStatusColor(issue.status)} px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap`}>
                        {getStatusLabel(issue.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(issue)}
                          className="p-2 border border-gray-200 rounded hover:bg-gray-900 hover:text-white text-gray-500 transition-all shadow-sm"
                          title="Xem chi tiết / Sửa"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(issue)}
                          className="p-2 border border-red-100 rounded hover:bg-red-500 hover:text-white text-red-500 transition-all shadow-sm bg-red-50"
                          title="Xóa"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500 italic">
                    Không tìm thấy sự cố nào.
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
            label="sự cố"
         />
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={issueToDelete ? `#${issueToDelete.request_code} - ${issueToDelete.content}` : ""}
        itemType="Sự cố"
      />
    </div>
  );
};

export default IssueManagement;