import React, { useState, useEffect, useCallback } from "react";
import {
  FaEdit,
  FaTrashAlt,
  FaPlus,
  FaBuilding,
} from "react-icons/fa";
import { Toaster, toast } from "sonner";

// Services
import { buildingService } from "@/services/buildingService";
import { getCity, getWard } from "@/services/locationService";

// Components & Modals
import AddBuildingModal from "@/components/modals/building/AddBuildingModal";
import EditBuildingModal from "@/components/modals/building/EditBuildingModal";
import BuildingDetailModal from "@/components/modals/building/BuildingDetailModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import Pagination from "@/components/Pagination";

// NEW: Import FilterBar
import FilterBar from "@/components/FilterBar";

const BuildingManagement = () => {
  // --- STATES ---
  const [buildings, setBuildings] = useState([]);
  const [cities, setCities] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State (Server-side)
  const [pagination, setPagination] = useState({
    totalItems: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });

  // Filter states (Server-side)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterWard, setFilterWard] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Selected Items
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [detailBuildingData, setDetailBuildingData] = useState(null);
  const [buildingToDelete, setBuildingToDelete] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // --- API HANDLERS (Server-side filtering & pagination) ---
  const fetchBuildings = useCallback(async () => {
    try {
      setLoading(true);

      // Build params cho API
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };

      // Thêm các filter nếu có giá trị
      if (searchTerm) params.search = searchTerm;
      if (filterStatus) params.status = filterStatus;
      if (filterCity) params.city = filterCity;
      if (filterWard) params.ward = filterWard;
      if (sortBy) params.sort_by = sortBy;

      const response = await buildingService.getAll(params);

      let listData = [];
      let paginationData = null;

      if (response?.data?.items && Array.isArray(response.data.items)) {
        listData = response.data.items;
        paginationData = response.data.pagination;
      } else if (response?.items && Array.isArray(response.items)) {
        listData = response.items;
        paginationData = response.pagination;
      }

      setBuildings(listData);

      // Cập nhật pagination từ server
      if (paginationData) {
        setPagination((prev) => ({
          ...prev,
          totalItems: paginationData.totalItems || 0,
          totalPages: paginationData.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      toast.error("Không thể tải danh sách tòa nhà");
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.pageSize,
    searchTerm,
    filterStatus,
    filterCity,
    filterWard,
    sortBy,
  ]);

  const fetchCities = async () => {
    try {
      const res = await getCity();
      if (res) {
        setCities(res);
      }
    } catch (error) {
      console.error("Lỗi tải thành phố:", error);
    }
  };

  // Fetch wards khi city thay đổi
  useEffect(() => {
    const fetchWardsData = async () => {
      if (filterCity) {
        const selectedCity = cities.find((c) => c.name === filterCity);
        if (selectedCity) {
          try {
            const res = await getWard(selectedCity.id);
            if (res) {
              setWards(res);
            }
          } catch (error) {
            console.error("Lỗi tải quận/huyện:", error);
          }
        }
      } else {
        setWards([]);
        setFilterWard("");
      }
    };
    fetchWardsData();
  }, [filterCity, cities]);

  // Initial fetch
  useEffect(() => {
    fetchCities();
  }, []);

  // Fetch buildings khi filter/pagination thay đổi (debounce search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBuildings();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchBuildings]);


  // --- FILTER CONFIGURATION ---
  const cityOptions = cities.map((c) => ({
    id: c.name,
    name: c.name,
  }));

  const wardOptions = wards.map((w) => ({
    id: w.name,
    name: w.name,
  }));

  const statusOptions = [
    { id: "ACTIVE", name: "Hoạt động" },
    { id: "SUSPENDED", name: "Tạm dừng" },
    { id: "INACTIVE", name: "Ngừng hoạt động" },
  ];

  const sortOptions = [
    { id: "name_asc", name: "Tên A-Z" },
    { id: "name_desc", name: "Tên Z-A" },
    { id: "created_asc", name: "Cũ nhất" },
    { id: "created_desc", name: "Mới nhất" },
  ];

  const filterConfigs = [
    {
      key: "city",
      type: "combobox",
      placeholder: "Thành phố",
      options: cityOptions,
      value: filterCity,
    },
    {
      key: "ward",
      type: "combobox",
      placeholder: "Quận/Huyện",
      options: wardOptions,
      value: filterWard,
    },
    {
      key: "status",
      type: "select",
      placeholder: "Trạng thái",
      options: statusOptions,
      value: filterStatus,
    },
    {
      key: "sortBy",
      type: "select",
      placeholder: "Sắp xếp",
      options: sortOptions,
      value: sortBy,
    },
  ];

  // --- HANDLERS ---
  const handleFilterChange = (key, value) => {
    // Reset về trang 1 khi filter thay đổi
    setPagination((prev) => ({ ...prev, page: 1 }));

    switch (key) {
      case "city":
        setFilterCity(value);
        setFilterWard(""); // Reset ward khi đổi city
        break;
      case "ward":
        setFilterWard(value);
        break;
      case "status":
        setFilterStatus(value);
        break;
      case "sortBy":
        setSortBy(value);
        break;
      default:
        break;
    }
  };

  const handleSearchChange = (value) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchTerm(value);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterCity("");
    setFilterWard("");
    setSortBy("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleAddBuilding = async (newBuildingData) => {
    try {
      const response = await buildingService.create(newBuildingData);
      if (response && (response.code === 200 || response.code === 201 || response.message)) {
        toast.success("Thêm toà nhà thành công!");
        await fetchBuildings(); // Refresh toàn bộ list
        setIsAddModalOpen(false);
        setPagination((prev) => ({ ...prev, page: 1 })); // Reset về trang 1 để thấy item mới nhất
      } else {
        toast.error("Thêm thất bại: Phản hồi không hợp lệ");
      }
    } catch (error) {
      console.error("Lỗi thêm mới:", error);
      const msg = error.response?.data?.detail?.[0]?.msg || error.response?.data?.message || "Lỗi khi thêm tòa nhà!";
      toast.error(msg);
    }
  };

  const handleEditClick = (building) => {
    if (!building) return;
    setSelectedBuilding(building); 
    setIsEditModalOpen(true);      
  };

  const handleUpdateBuilding = async (id, updatedData) => {
    try {
      const response = await buildingService.update(id, updatedData);
      if (response && (response.code === 200 || response.data)) {
        toast.success("Cập nhật thành công!");
        
        // Cập nhật state trực tiếp để đỡ gọi lại API toàn bộ
        setBuildings(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } : b));
        
        setIsEditModalOpen(false);
      } else {
        toast.error("Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      const msg = error.response?.data?.detail?.[0]?.msg || error.response?.data?.message || "Lỗi khi cập nhật!";
      toast.error(msg);
    }
  };

  const handleDeleteClick = (building) => {
    setBuildingToDelete(building);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!buildingToDelete) return;
    try {
      const response = await buildingService.delete(buildingToDelete.id);
      if (response && (response.code === 200 || !response.code)) {
        toast.success(`Đã xóa tòa nhà: ${buildingToDelete.building_name}`);
        setBuildings((prev) => prev.filter((item) => item.id !== buildingToDelete.id));
      } else {
        toast.error("Xóa thất bại!");
      }
    } catch (error) {
      console.error("Lỗi xóa:", error);
      const msg = error.response?.data?.detail || "Xóa thất bại!";
      toast.error(msg);
    } finally {
      setDeleteModalOpen(false);
      setBuildingToDelete(null);
    }
  };

  const handleViewDetail = async (id) => {
    setIsDetailModalOpen(true);
    setLoadingDetail(true);
    setDetailBuildingData(null);
    try {
      const response = await buildingService.getById(id);
      if (response && response.data) {
        setDetailBuildingData(response.data);
      } else {
        toast.error("Không tìm thấy thông tin chi tiết");
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết:", error);
      toast.error("Không thể tải chi tiết tòa nhà");
    } finally {
      setLoadingDetail(false);
    }
  };

  // --- HELPER UI ---
  const getStatusLabel = (status) => {
    switch (status) {
      case "ACTIVE": return "Hoạt động";
      case "INACTIVE": return "Ngừng hoạt động";
      case "SUSPENDED": return "Tạm dừng";
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE": return "text-green-600 bg-green-100";
      case "SUSPENDED": return "text-yellow-600 bg-yellow-100";
      case "INACTIVE": return "text-gray-600 bg-gray-300";
      default: return "text-gray-600 bg-gray-300";
    }
  };

  const extractUtilities = (description) => {
    if (!description) return "---";
    const match = description.match(/\[Tiện ích: (.*?)\]/);
    if (match && match[1]) {
      const utilsList = match[1].split(",");
      if (utilsList.length > 2)
        return utilsList.slice(0, 2).join(", ").trim() + "...";
      return match[1];
    }
    return "---";
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <Toaster position="top-right" richColors />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý toà nhà</h1>
        <button
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm transition-all shadow-sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <FaPlus size={10} /> Thêm toà nhà
        </button>
      </div>

      {/* REUSABLE FILTER BAR */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Nhập tên toà nhà, địa chỉ..."
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Danh sách toà nhà</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-xs font-bold border-b border-gray-200 uppercase">
              <tr>
                <th className="p-4">Tên toà nhà</th>
                <th className="p-4">Địa chỉ toà nhà</th>
                <th className="p-4 text-center">Tổng phòng</th>
                <th className="p-4 text-center">Phòng trống</th>
                <th className="p-4 text-center">Đang thuê</th>
                <th className="p-4 text-left">Tiện ích</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4">Ngày tạo</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : buildings.length > 0 ? (
                buildings.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td
                      className="p-4 font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => handleViewDetail(item.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 p-2 rounded text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600">
                          <FaBuilding size={14} />
                        </div>
                        {item.building_name}
                      </div>
                    </td>
                    <td
                      className="p-4 text-sm max-w-[200px] truncate"
                      title={item.address_line}
                    >
                      {item.address_line}
                    </td>
                    <td className="p-4 text-center font-medium">
                      {item.total_rooms || 0}
                    </td>
                    <td className="p-4 text-center text-red-500 font-bold">
                      {item.available_rooms || 0}
                    </td>
                    <td className="p-4 text-center text-green-600 font-bold">
                      {item.rented_rooms || 0}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      <span className="truncate block max-w-[150px]">
                        {extractUtilities(item.description)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("vi-VN")
                        : "-"}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(item);
                          }}
                          className="p-2 border border-gray-200 rounded hover:bg-gray-900 hover:text-white text-gray-500 transition-all shadow-sm"
                          title="Sửa toà nhà"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(item);
                          }}
                          className="p-2 border border-red-100 rounded hover:bg-red-500 hover:text-white text-red-500 transition-all shadow-sm bg-red-50"
                          title="Xóa toà nhà"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-500">
                    Không tìm thấy toà nhà nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          onPageChange={handlePageChange}
          pageSize={pagination.pageSize}
          label="tòa nhà"
        />
      </div>

      {/* --- MODALS --- */}
      <AddBuildingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSuccess={handleAddBuilding}
      />

      {isEditModalOpen && selectedBuilding && (
        <EditBuildingModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedBuilding(null);
          }}
          buildingData={selectedBuilding}
          onUpdateSuccess={handleUpdateBuilding}
        />
      )}

      <BuildingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        building={detailBuildingData}
        loading={loadingDetail}
      />
      
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={buildingToDelete?.building_name}
        itemType="Tòa nhà"
      />
    </div>
  );
};

export default BuildingManagement;