// src/pages/admin/BuildingManagement.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  FaEdit,
  FaTrashAlt,
  FaPlus,
  FaBuilding,
} from "react-icons/fa";
import { Toaster, toast } from "sonner";

// Services
import { buildingService } from "@/services/buildingService";

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
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- API HANDLERS ---

  // 1. Fetch List
  const fetchBuildings = async (priorityId = null) => {
    try {
      setLoading(true);
      const response = await buildingService.getAll();

      let listData = [];
      if (response?.data?.data && Array.isArray(response.data.data.items)) {
        listData = response.data.data.items;
      } else if (response?.data?.items && Array.isArray(response.data.items)) {
        listData = response.data.items;
      } else if (response?.items && Array.isArray(response.items)) {
        listData = response.items;
      } else if (Array.isArray(response)) {
        listData = response;
      }

      // Sort by creation date (newest first)
      listData.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      // Move priority item to top (e.g. newly created/edited)
      if (priorityId) {
        const index = listData.findIndex((item) => item.id === priorityId);
        if (index > -1) {
          const [item] = listData.splice(index, 1);
          listData.unshift(item);
        }
      }

      setBuildings(listData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      toast.error("Không thể tải danh sách tòa nhà");
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  // --- FILTER CONFIGURATION ---
  
  // 1. Danh sách trạng thái cho FilterBar
  const statusOptions = [
    { id: "Hoạt động", name: "Hoạt động" },
    { id: "SUSPENDED", name: "Tạm dừng" },
    { id: "INACTIVE", name: "Ngừng hoạt động" },
  ];

  // 2. Cấu hình FilterBar
  const filterConfigs = [
    {
      key: "status",
      type: "select",
      placeholder: "Trạng thái",
      options: statusOptions,
      value: filterStatus,
    },
  ];

  // 3. Xử lý thay đổi filter
  const handleFilterChange = (key, value) => {
    if (key === "status") {
      setFilterStatus(value);
    }
    setCurrentPage(1);
  };

  // 4. Xóa bộ lọc
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setCurrentPage(1);
  };

  // --- CRUD HANDLERS ---

  const handleAddBuilding = async (newBuildingData) => {
    try {
      const response = await buildingService.create(newBuildingData);
      if (response && (response.code === 200 || response.code === 201 || response.message)) {
        toast.success("Thêm toà nhà thành công!");
        await fetchBuildings();
        setIsAddModalOpen(false);
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
        await fetchBuildings(id);
        setIsEditModalOpen(false);
        setCurrentPage(1);
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

  // --- FILTER LOGIC ---
  const filteredBuildings = useMemo(() => {
    if (!Array.isArray(buildings)) return [];
    
    return buildings.filter((building) => {
      const name = building.building_name || "";
      const address = building.address_line || "";
      const status = building.status || "";
      
      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.toLowerCase().includes(searchTerm.toLowerCase());
        
      let matchesStatus = true;
      if (filterStatus) {
        if (filterStatus === "Hoạt động") matchesStatus = status === "ACTIVE";
        else matchesStatus = status === filterStatus;
      }
      return matchesSearch && matchesStatus;
    });
  }, [buildings, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredBuildings.length / itemsPerPage);
  const totalItems = filteredBuildings.length;
  
  const currentData = filteredBuildings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        onSearchChange={setSearchTerm}
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
              ) : currentData.length > 0 ? (
                currentData.map((item) => (
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
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
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