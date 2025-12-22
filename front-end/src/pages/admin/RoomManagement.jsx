import React, { useState, useEffect, useMemo } from "react";
import {
  FaEdit,
  FaTrashAlt,
  FaPlus,
  FaBuilding,
  FaLayerGroup,
} from "react-icons/fa";
import { Toaster, toast } from "sonner";

// Services
import { roomService } from "@/services/roomService";
import { buildingService } from "@/services/buildingService";

// Components & Modals
import Pagination from "@/components/Pagination";
import RoomFormModal from "@/components/modals/room/RoomFormModal";
import RoomDetailModal from "@/components/modals/room/RoomDetailModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import RoomTypeManagerModal from "@/components/modals/room/RoomTypeManagerModal";

// Import FilterBar
import FilterBar from "@/components/FilterBar";

const RoomManagement = () => {
  // --- STATES ---
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal States
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailRoomData, setDetailRoomData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- FETCH DATA ---
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getAll();
      if (response?.data?.items) {
        setRooms(response.data.items);
      } else if (Array.isArray(response?.data)) {
        setRooms(response.data);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách phòng:", error);
      toast.error("Không thể tải danh sách phòng");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await buildingService.getAll();
      if (response?.data?.items) {
        setBuildings(response.data.items);
      } else if (Array.isArray(response?.data)) {
        setBuildings(response.data);
      }
    } catch (error) {
      console.error("Lỗi tải tòa nhà:", error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchBuildings();
  }, []);

  // --- FILTER CONFIGURATION ---
  
  const buildingOptions = useMemo(() => {

    return buildings.map(b => ({ id: b.id, name: b.building_name }));
  }, [buildings]);

  // 2. Danh sách trạng thái
  const statusOptions = [
    { id: "AVAILABLE", name: "Còn trống" },
    { id: "OCCUPIED", name: "Đang thuê" },
    { id: "MAINTENANCE", name: "Bảo trì" },
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

  // --- FILTER LOGIC ---
  const filteredRooms = useMemo(() => {
    if (!Array.isArray(rooms)) return [];

    return rooms.filter((room) => {
      const roomNumber = room.room_number || "";
      const representative = room.representative || "";
      const buildingName = room.building_name || "";
      const status = room.status || "";

      // 1. Search
      const matchesSearch =
        roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        representative.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Filter Building (ĐÃ SỬA LOGIC)
      // Nếu filterBuilding có giá trị thì so sánh, nếu rỗng thì luôn đúng (hiện tất cả)
      const matchesBuilding = filterBuilding 
        ? (buildingName || "").toLowerCase() === filterBuilding.toLowerCase()
        : true;
        
      // 3. Filter Status
      const matchesStatus = filterStatus ? status === filterStatus : true;

      return matchesSearch && matchesBuilding && matchesStatus;
    });
  }, [rooms, searchTerm, filterBuilding, filterStatus]);

  const totalItems = filteredRooms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentData = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- HANDLERS ---
  const handleOpenAdd = () => {
    setEditingRoom(null);
    setIsRoomFormOpen(true);
  };

  const handleEditClick = (room) => {
    setEditingRoom(room);
    setIsRoomFormOpen(true);
  };

  const handleFormSuccess = async () => {
    await fetchRooms();
  };

  const handleDeleteClick = (room) => {
    setRoomToDelete(room);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;
    try {
      await roomService.delete(roomToDelete.id);
      setRooms((prev) => prev.filter((item) => item.id !== roomToDelete.id));
      toast.success(`Đã xóa phòng ${roomToDelete.room_number}`);
    } catch (error) {
      console.error("Lỗi xóa:", error);
      toast.error("Xóa thất bại!");
    } finally {
      setDeleteModalOpen(false);
      setRoomToDelete(null);
    }
  };

  const handleViewDetail = async (id) => {
    setIsDetailModalOpen(true);
    setLoadingDetail(true);
    setDetailRoomData(null);
    try {
      const response = await roomService.getById(id);
      if (response?.data) setDetailRoomData(response.data);
    } catch (error) {
      console.error("Lỗi lấy chi tiết:", error);
      toast.error("Không thể tải chi tiết phòng");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OCCUPIED": return "bg-blue-500 text-white";
      case "AVAILABLE": return "bg-green-500 text-white";
      case "MAINTENANCE": return "bg-yellow-400 text-gray-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "OCCUPIED": return "Đang thuê";
      case "AVAILABLE": return "Còn trống";
      case "MAINTENANCE": return "Bảo trì";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <Toaster position="top-right" richColors />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý phòng</h1>
        <div className="flex gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm transition-all shadow-sm"
          >
            <FaPlus size={10} /> Thêm phòng mới
          </button>
          
          <button
            onClick={() => setIsTypeManagerOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm transition-all shadow-sm font-medium"
          >
            <FaLayerGroup size={12} /> Loại phòng
          </button>
        </div>
      </div>

      {/* REUSABLE FILTER BAR */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo số phòng, người đại diện..."
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { title: "Tổng số phòng", value: rooms.length },
          { title: "Đang thuê", value: rooms.filter((r) => r.status === "OCCUPIED").length },
          { title: "Phòng trống", value: rooms.filter((r) => r.status === "AVAILABLE").length },
          { title: "Đang bảo trì", value: rooms.filter((r) => r.status === "MAINTENANCE").length },
        ].map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium mb-1 text-gray-500">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Danh sách phòng</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-xs font-bold border-b border-gray-200 uppercase">
              <tr>
                <th className="p-4">Phòng</th>
                <th className="p-4">Toà nhà</th>
                <th className="p-4 text-center">Diện tích (m²)</th>
                <th className="p-4 text-center">Tối đa (người)</th>
                <th className="p-4 text-center">Hiện ở</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Giá thuê</th>
                <th className="p-4">Đại diện</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="9" className="p-8 text-center">Đang tải dữ liệu...</td></tr>
              ) : currentData.length > 0 ? (
                currentData.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50 transition-colors group">
                    <td 
                      className="p-4 font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleViewDetail(room.id)}
                    >
                      {room.room_number}
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <FaBuilding className="text-gray-400 text-xs" />
                        <span className="truncate max-w-[150px]" title={room.building_name}>
                          {room.building_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">{room.area}</td>
                    <td className="p-4 text-center">{room.capacity}</td>
                    <td className="p-4 text-center font-bold text-gray-900">{room.current_occupants || 0}</td>
                    <td className="p-4 text-center">
                      <span className={`${getStatusColor(room.status)} px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap tracking-wide shadow-sm`}>
                        {getStatusLabel(room.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-gray-900">{formatCurrency(room.base_price)}</td>
                    <td className="p-4 text-gray-600">{room.representative || "-"}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(room)}
                          className="p-2 border border-gray-200 rounded hover:bg-gray-900 hover:text-white text-gray-500 transition-all shadow-sm"
                          title="Sửa phòng"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(room)}
                          className="p-2 border border-red-100 rounded hover:bg-red-500 hover:text-white text-red-500 transition-all shadow-sm bg-red-50"
                          title="Xóa phòng"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="9" className="p-8 text-center text-gray-500 italic">Không tìm thấy phòng nào phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          label="phòng"
        />
      </div>

      {/* --- MODALS --- */}
      <RoomFormModal
        isOpen={isRoomFormOpen}
        onClose={() => setIsRoomFormOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={editingRoom}
      />

      <RoomTypeManagerModal
        isOpen={isTypeManagerOpen}
        onClose={() => setIsTypeManagerOpen(false)}
      />

      <RoomDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        room={detailRoomData}
        loading={loadingDetail}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={roomToDelete?.room_number}
        itemType="Phòng"
      />
    </div>
  );
};

export default RoomManagement;