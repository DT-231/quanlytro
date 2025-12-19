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

// Import Modals và Service
import AddRoomModal from "@/components/modals/room/AddRoomModal";
import EditRoomModal from "@/components/modals/room/EditRoomModal";
import RoomDetailModal from "@/components/modals/room/RoomDetailModal";
import { roomService } from "@/services/roomService";
import { buildingService } from "@/services/buildingService";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import Pagination from "@/components/Pagination";
const RoomManagement = () => {
  // 1. States
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [detailRoomData, setDetailRoomData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // --- STATES CHO XÓA
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- 2. FETCH DATA ---
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getAll();
      if (response && response.data && Array.isArray(response.data.items)) {
        setRooms(response.data.items);
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
      }
    } catch (error) {
      console.error("Lỗi tải tòa nhà:", error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchBuildings();
  }, []);

  // --- 3. FILTER LOGIC ---
  const filteredRooms = useMemo(() => {
    if (!Array.isArray(rooms)) return [];

    return rooms.filter((room) => {
      // Map các trường dữ liệu từ API
      const roomNumber = room.room_number || "";
      const representative = room.representative || "";
      const buildingName = room.building_name || "";
      const status = room.status || "";

      // a. Tìm kiếm
      const matchesSearch =
        roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        representative.toLowerCase().includes(searchTerm.toLowerCase());

      // b. Lọc theo Toà nhà
      const matchesBuilding = filterBuilding
        ? buildingName === filterBuilding
        : true;

      // c. Lọc theo Trạng thái
      const matchesStatus = filterStatus ? status === filterStatus : true;

      return matchesSearch && matchesBuilding && matchesStatus;
    });
  }, [rooms, searchTerm, filterBuilding, filterStatus]);

  // --- 4. PAGINATION LOGIC ---
  const totalItems = filteredRooms.length; 
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const currentData = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- 5. HANDLERS ---

  // Thêm phòng
  const handleAddNewRoom = async (newRoomData) => {
    try {
      await roomService.create(newRoomData);
      await fetchRooms(); // Refresh lại danh sách
      toast.success("Thêm phòng thành công!");
    } catch (error) {
      console.error("Lỗi thêm phòng:", error);
      const msg =
        error.response?.data?.detail?.[0]?.msg || "Lỗi khi thêm phòng!";
      toast.error("Thêm thất bại");
    }
  };

  // Sửa phòng (Mở modal)
  const handleEditClick = (room) => {
    setSelectedRoom(room);
    setIsEditModalOpen(true);
  };

  // Sửa phòng (Gọi API)
  const handleUpdateRoom = async (id, updatedData) => {
    try {
      await roomService.update(id, updatedData);
      await fetchRooms();
      toast.success("Cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      const msg = error.response?.data?.detail || "Lỗi khi cập nhật!";
      toast.error("Cập nhật thất bại: " + msg);
    }
  };

  // --- LOGIC XÓA ---
  const handleDeleteClick = (room) => {
    setRoomToDelete(room);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      await roomService.delete(roomToDelete.id);
      setRooms(rooms.filter((item) => item.id !== roomToDelete.id));
      toast.success(`Đã xóa phòng ${roomToDelete.room_number}`);
    } catch (error) {
      console.error("Lỗi xóa:", error);
      toast.error("Xóa thất bại!");
    } finally {
      setDeleteModalOpen(false);
      setRoomToDelete(null);
    }
  };
  // Xem chi tiết
  const handleViewDetail = async (id) => {
    setIsDetailModalOpen(true);
    setLoadingDetail(true);
    setDetailRoomData(null);

    try {
      const response = await roomService.getById(id);
      if (response && response.data) {
        setDetailRoomData(response.data);
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết:", error);
      toast.error("Không thể tải chi tiết phòng");
    } finally {
      setLoadingDetail(false);
    }
  };

  // --- HELPER FORMAT ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OCCUPIED":
        return "bg-blue-500 text-white";
      case "AVAILABLE":
        return "bg-green-500 text-white";
      case "MAINTENANCE":
        return "bg-yellow-400 text-gray-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "OCCUPIED":
        return "Đang thuê";
      case "AVAILABLE":
        return "Còn trống";
      case "MAINTENANCE":
        return "Bảo trì";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      {/* 2. Thêm Toaster */}
      <Toaster position="top-right" richColors />

      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý phòng</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm transition-all shadow-sm"
        >
          <FaPlus size={10} /> Thêm phòng
        </button>
      </div>

      {/* --- FILTER --- */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Tìm kiếm và lọc
        </h3>
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          {/* Search */}
          <div className="relative w-full md:w-1/3 flex items-center">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50"
                placeholder="Tìm theo số phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="ml-2 bg-gray-900 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 font-medium">
              Tìm
            </button>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-2 w-full md:w-auto justify-end">
            {/* Filter Toà Nhà (Dynamic from API) */}
            <div className="relative w-full md:w-48">
              <select
                className="w-full appearance-none border border-gray-200 px-3 py-2 pr-8 rounded-md bg-white hover:bg-gray-50 text-sm focus:outline-none cursor-pointer text-gray-700"
                value={filterBuilding}
                onChange={(e) => setFilterBuilding(e.target.value)}
              >
                <option value="">Tất cả toà nhà</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.building_name}>
                    {b.building_name}
                  </option>
                ))}
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Filter Trạng Thái */}
            <div className="relative w-full md:w-40">
              <select
                className="w-full appearance-none border border-gray-200 px-3 py-2 pr-8 rounded-md bg-white hover:bg-gray-50 text-sm focus:outline-none cursor-pointer text-gray-700"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="OCCUPIED">Đang thuê</option>
                <option value="AVAILABLE">Còn trống</option>
                <option value="MAINTENANCE">Bảo trì</option>
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* --- STATS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { title: "Tổng số phòng", value: rooms.length },
          {
            title: "Đang thuê",
            value: rooms.filter((r) => r.status === "OCCUPIED").length,
          },
          {
            title: "Phòng trống",
            value: rooms.filter((r) => r.status === "AVAILABLE").length,
          },
          {
            title: "Đang bảo trì",
            value: rooms.filter((r) => r.status === "MAINTENANCE").length,
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
          >
            <h3 className="text-sm font-medium mb-1 text-gray-500">
              {stat.title}
            </h3>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* --- TABLE --- */}
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
                <tr>
                  <td colSpan="9" className="p-8 text-center">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : currentData.length > 0 ? (
                currentData.map((room) => (
                  <tr
                    key={room.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td
                      className="p-4 font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleViewDetail(room.id)}
                    >
                      {room.room_number}
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <FaBuilding className="text-gray-400 text-xs" />
                        <span
                          className="truncate max-w-[150px]"
                          title={room.building_name}
                        >
                          {room.building_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">{room.area}</td>
                    <td className="p-4 text-center">{room.capacity}</td>
                    <td className="p-4 text-center font-bold text-gray-900">
                      {room.current_occupants || 0}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`${getStatusColor(
                          room.status
                        )} px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap tracking-wide shadow-sm`}
                      >
                        {getStatusLabel(room.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-gray-900">
                      {formatCurrency(room.base_price)}
                    </td>
                    <td className="p-4 text-gray-600">
                      {room.representative || "-"}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(room)}
                          className="p-2 border border-gray-200 rounded hover:bg-gray-900 hover:text-white text-gray-500 transition-all shadow-sm"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          // Gọi hàm mở Modal Xóa
                          onClick={() => handleDeleteClick(room)}
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
                  <td
                    colSpan="9"
                    className="p-8 text-center text-gray-500 italic"
                  >
                    Không tìm thấy phòng nào phù hợp.
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
           label="phòng"                 
        />
      </div>

      {/* --- MODALS --- */}
      <AddRoomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSuccess={handleAddNewRoom}
      />

      <EditRoomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        roomData={selectedRoom}
        onUpdateSuccess={handleUpdateRoom}
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
