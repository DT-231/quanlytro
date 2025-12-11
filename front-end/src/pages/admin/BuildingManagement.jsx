import React, { useState, useEffect, useMemo } from "react";
import {
  FaSearch,
  FaEdit,
  FaTrashAlt,
  FaPlus,
  FaBuilding,
} from "react-icons/fa";
import { FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";

// 1. Import Sonner
import { Toaster, toast } from "sonner";

// Import các Modal
import AddBuildingModal from "@/components/modals/building/AddBuildingModal";
import EditBuildingModal from "@/components/modals/building/EditBuildingModal";
import BuildingDetailModal from "@/components/modals/building/BuildingDetailModal";
import { buildingService } from "@/services/buildingService";

// --- COMPONENT: SHADCN STYLE ALERT DIALOG (Mô phỏng cho chức năng Xóa) ---
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg md:w-full">
        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Bạn có chắc chắn muốn xóa?
          </h2>
          <p className="text-sm text-gray-500">
            Hành động này không thể hoàn tác. Tòa nhà <strong>{itemName}</strong> sẽ bị xóa vĩnh viễn khỏi hệ thống.
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 hover:text-accent-foreground h-10 px-4 py-2"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2"
          >
            Đồng ý xóa
          </button>
        </div>
      </div>
    </div>
  );
};

const BuildingManagement = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // --- MODAL STATES ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // States cho Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // States cho Detail (Xem chi tiết)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailBuildingData, setDetailBuildingData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // States cho Xóa (Mới thêm)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- HELPER: CHUYỂN ĐỔI TRẠNG THÁI ---
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
      if (utilsList.length > 2) {
        return utilsList.slice(0, 2).join(", ").trim() + "..."; 
      }
      return match[1];
    }
    return "---";
  };

  // --- FETCH DATA ---
  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const response = await buildingService.getAll();
      if (response && response.data && Array.isArray(response.data.items)) {
        setBuildings(response.data.items);
      } else {
        setBuildings([]);
      }
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

  // --- LOGIC LỌC ---
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

  // --- HANDLERS (THÊM, SỬA, XÓA, CHI TIẾT) ---

  const handleAddBuilding = async (newBuildingData) => {
    try {
      await buildingService.create(newBuildingData);
      await fetchBuildings();
      // Thay alert bằng toast
      toast.success("Thêm toà nhà thành công!");
    } catch (error) {
      console.error("Lỗi thêm mới:", error);
      const msg = error.response?.data?.detail?.[0]?.msg || "Lỗi khi thêm tòa nhà!";
      // Thay alert bằng toast
      toast.error("Thêm thất bại: " + msg);
    }
  };

  // Mở modal sửa
  const handleEditClick = (building) => {
    setSelectedBuilding(building);
    setIsEditModalOpen(true);
  };

  // Thực hiện cập nhật
  const handleUpdateBuilding = async (id, updatedData) => {
    try {
      await buildingService.update(id, updatedData);
      await fetchBuildings();
      // Thay alert bằng toast
      toast.success("Cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      const msg = error.response?.data?.detail?.[0]?.msg || "Lỗi khi cập nhật!";
      // Thay alert bằng toast
      toast.error("Cập nhật thất bại: " + msg);
      throw error;
    }
  };

  const handleViewDetail = async (id) => {
    setIsDetailModalOpen(true);
    setLoadingDetail(true);
    setDetailBuildingData(null); 

    try {
        const response = await buildingService.getById(id);
        console.log(response)
        if (response && response.data) {
            setDetailBuildingData(response.data);
        }
    } catch (error) {
        console.error("Lỗi lấy chi tiết:", error);
        toast.error("Không thể tải chi tiết tòa nhà");
    } finally {
        setLoadingDetail(false);
    }
  };

  // --- LOGIC XÓA (Đã cập nhật dùng Modal + Sonner) ---
  const handleDeleteClick = (building) => {
    setBuildingToDelete(building);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!buildingToDelete) return;

    try {
      await buildingService.delete(buildingToDelete.id);
      setBuildings(buildings.filter((item) => item.id !== buildingToDelete.id));
      toast.success("Đã xóa tòa nhà thành công!");
    } catch (error) {
      console.error("Lỗi xóa:", error);
      const msg = error.response?.data?.detail || "Xóa thất bại!";
      toast.error(msg);
    } finally {
      setDeleteModalOpen(false);
      setBuildingToDelete(null);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredBuildings.length / itemsPerPage);
  const currentData = filteredBuildings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      {/* 2. Thêm Toaster */}
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

      {/* FILTER */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="relative w-full md:w-2/3 flex items-center">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50"
                placeholder="Nhập tên toà nhà, địa chỉ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="ml-2 bg-gray-900 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 font-medium">
              Tìm
            </button>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <div className="relative w-full md:w-48">
              <select
                className="w-full appearance-none border border-gray-200 px-3 py-2 pr-8 rounded-md bg-white hover:bg-gray-50 text-sm focus:outline-none cursor-pointer text-gray-700"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="SUSPENDED">Tạm dừng </option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

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
                        className="p-4 font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => handleViewDetail(item.id)}
                        title="Xem chi tiết"
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 p-2 rounded text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          <FaBuilding size={14} />
                        </div>
                        {item.building_name}
                      </div>
                    </td>

                    <td className="p-4 text-sm max-w-[200px] truncate" title={item.address_line}>
                      {item.address_line}
                    </td>
                    <td className="p-4 text-center font-medium">
                      {item.total_rooms}
                    </td>
                    <td className="p-4 text-center text-red-500 font-bold">
                      {item.available_rooms}
                    </td>
                    <td className="p-4 text-center text-green-600 font-bold">
                      {item.rented_rooms}
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
                          onClick={() => handleEditClick(item)}
                          className="p-2 border border-gray-200 rounded hover:bg-gray-900 hover:text-white text-gray-500 transition-all shadow-sm"
                        >
                          <FaEdit size={14} />
                        </button>

                        <button
                          // Thay đổi gọi hàm xóa trực tiếp bằng hàm mở Modal
                          onClick={() => handleDeleteClick(item)}
                          className="p-2 border border-red-100 rounded hover:bg-red-500 hover:text-white text-red-500 transition-all shadow-sm bg-red-50"
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
        <div className="p-4 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-xs text-gray-500 font-medium">
            Hiển thị {currentData.length} trên tổng số{" "}
            {filteredBuildings.length} tòa nhà
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors 
                 text-gray-600 hover:bg-gray-100 
                 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FiChevronLeft /> Prev
            </button>

            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === idx + 1
                    ? "bg-gray-100 text-black font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 
                 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* --- ADD MODAL --- */}
      <AddBuildingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSuccess={handleAddBuilding}
      />

      {/* --- EDIT MODAL --- */}
      <EditBuildingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        buildingData={selectedBuilding}
        onUpdateSuccess={handleUpdateBuilding}
      />

      {/* --- DETAIL MODAL --- */}
      <BuildingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        building={detailBuildingData}
        loading={loadingDetail}
      />

      {/* --- DELETE MODAL (MỚI) --- */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={buildingToDelete?.building_name}
      />
    </div>
  );
};

export default BuildingManagement;