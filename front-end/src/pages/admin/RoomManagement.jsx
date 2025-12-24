import React, { useState, useEffect, useCallback } from "react";
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
import { invoiceService } from "@/services/invoiceService";
import { getCity, getWard } from "@/services/locationService";

// Components & Modals
import Pagination from "@/components/Pagination";
import RoomFormModal from "@/components/modals/room/RoomFormModal";
import RoomDetailModal from "@/components/modals/room/RoomDetailModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import RoomTypeManagerModal from "@/components/modals/room/RoomTypeManagerModal";

// Import FilterBar
import FilterBar from "@/components/FilterBar";

// Helper Functions (Giống InvoiceManagement)
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

const RoomManagement = () => {
  // --- STATES ---
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [cities, setCities] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRoomsStats, setTotalRoomsStats] = useState({
    total: 0,
    occupied: 0,
    available: 0,
    maintenance: 0,
  });

  // Pagination State (server-side)
  const [pagination, setPagination] = useState({
    totalItems: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });

  // Filter States (server-side)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterWard, setFilterWard] = useState("");
  const [filterMaxCapacity, setFilterMaxCapacity] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Modal States
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailRoomData, setDetailRoomData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);

  // --- FETCH DATA (Server-side filtering & pagination) ---
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build params cho API
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      
      // Thêm các filter nếu có giá trị
      if (searchTerm) params.search = searchTerm;
      
      // Building: tìm id từ name vì GenericCombobox trả về name
      if (filterBuilding) {
        const selectedBuilding = buildings.find(
          (b) => (b.building_name || b.name) === filterBuilding
        );
        if (selectedBuilding) {
          params.building_id = selectedBuilding.id;
        }
      }
      
      if (filterStatus) params.status = filterStatus;
      if (filterCity) params.city = filterCity;
      if (filterWard) params.ward = filterWard;
      if (filterMaxCapacity) params.max_capacity = parseInt(filterMaxCapacity);
      if (sortBy) params.sort_by = sortBy;

      const response = await roomService.getAll(params);
      
      if (response && response.success && response.data) {
        setRooms(response.data.items || []);
        setPagination((prev) => ({
          ...prev,
          totalItems: response.data.pagination?.totalItems || 0,
          totalPages: response.data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error("Lỗi tải danh sách phòng:", error);
      toast.error("Không thể tải danh sách phòng");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.pageSize,
    searchTerm,
    filterBuilding,
    buildings,
    filterStatus,
    filterCity,
    filterWard,
    filterMaxCapacity,
    sortBy,
  ]);

  // Fetch stats (tổng số phòng theo trạng thái - gọi API riêng cho mỗi status)
  const fetchRoomStats = async () => {
    try {
      // Gọi song song 4 API để lấy count theo từng status
      const [totalRes, occupiedRes, availableRes, maintenanceRes] = await Promise.all([
        roomService.getAll({ page: 1, pageSize: 1 }),
        roomService.getAll({ page: 1, pageSize: 1, status: "OCCUPIED" }),
        roomService.getAll({ page: 1, pageSize: 1, status: "AVAILABLE" }),
        roomService.getAll({ page: 1, pageSize: 1, status: "MAINTENANCE" }),
      ]);

      setTotalRoomsStats({
        total: totalRes?.data?.pagination?.totalItems || 0,
        occupied: occupiedRes?.data?.pagination?.totalItems || 0,
        available: availableRes?.data?.pagination?.totalItems || 0,
        maintenance: maintenanceRes?.data?.pagination?.totalItems || 0,
      });
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await invoiceService.getBuildingsDropdown();
      if (response) {
        setBuildings(response);
      }
    } catch (error) {
      console.error("Lỗi tải tòa nhà:", error);
    }
  };

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
    fetchBuildings();
    fetchCities();
    fetchRoomStats();
  }, []);

  // Fetch rooms khi filter/pagination thay đổi (debounce search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms();
    }, 300); // Debounce 300ms cho search

    return () => clearTimeout(timer);
  }, [fetchRooms]);

  // --- FILTER CONFIGURATION ---
  const buildingOptions = buildings.map((b) => ({
    id: b.id,
    name: b.building_name || b.name,
  }));

  const cityOptions = cities.map((c) => ({
    id: c.name,
    name: c.name,
  }));

  const wardOptions = wards.map((w) => ({
    id: w.name,
    name: w.name,
  }));

  const statusOptions = [
    { id: "AVAILABLE", name: "Còn trống" },
    { id: "OCCUPIED", name: "Đang thuê" },
    { id: "MAINTENANCE", name: "Bảo trì" },
  ];

  const capacityOptions = [
    { id: "1", name: "1 người" },
    { id: "2", name: "2 người" },
    { id: "3", name: "3 người" },
    { id: "4", name: "4 người" },
    { id: "5", name: "5 người" },
    { id: "6", name: "6+ người" },
  ];

  const sortOptions = [
    { id: "price_asc", name: "Giá tăng dần" },
    { id: "price_desc", name: "Giá giảm dần" },
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
      key: "building",
      type: "combobox",
      placeholder: "Tòa nhà",
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
    {
      key: "maxCapacity",
      type: "select",
      placeholder: "Số người tối đa",
      options: capacityOptions,
      value: filterMaxCapacity,
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
      case "building":
        setFilterBuilding(value);
        break;
      case "status":
        setFilterStatus(value);
        break;
      case "maxCapacity":
        setFilterMaxCapacity(value);
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
    setFilterBuilding("");
    setFilterStatus("");
    setFilterCity("");
    setFilterWard("");
    setFilterMaxCapacity("");
    setSortBy("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

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
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm theo số phòng, tên toà nhà..."
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { title: "Tổng số phòng", value: totalRoomsStats.total },
          { title: "Đang thuê", value: totalRoomsStats.occupied },
          { title: "Phòng trống", value: totalRoomsStats.available },
          { title: "Đang bảo trì", value: totalRoomsStats.maintenance },
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

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Danh sách phòng</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="hidden md:table-header-group bg-gray-50 text-xs font-bold border-b-2 border-gray-200 uppercase">
              <tr>
                <th className="p-3 lg:w-[80px] text-center">Phòng</th>
                <th className="p-3 lg:w-[200px]">Toà nhà</th>
                <th className="p-3 lg:w-[80px] text-center">Diện tích (m²)</th>
                <th className="p-3 lg:w-[100px] text-center">Tối đa (người)</th>
                <th className="p-3 lg:w-[50px] text-center">Hiện ở</th>
                <th className="p-3 lg:w-[80px] text-center">Trạng thái</th>
                <th className="p-3 lg:w-[80px] text-center">Giá thuê</th>
                <th className="p-3 lg:w-[100px]">Đại diện</th>
                <th className="p-3 lg:w-[100px] text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : rooms.length > 0 ? (
                rooms.map((room) => (
                  <tr
                    key={room.id}
                    className="block mb-4 rounded-lg shadow-md md:shadow-none md:table-row hover:bg-gray-50 transition-colors group border md:border-0"
                  >
                    <td className="p-3 flex justify-between items-center md:table-cell md:text-center md:font-bold md:text-gray-900 border-b md:border-b-0">
                      <span className="md:hidden font-bold uppercase text-xs text-gray-500">
                        Phòng
                      </span>
                      <span
                        className="cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => handleViewDetail(room.id)}
                      >
                        {room.room_number}
                      </span>
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell border-b md:border-b-0">
                      <span className="md:hidden font-bold uppercase text-xs text-gray-500">
                        Toà nhà
                      </span>
                      <div className="flex items-center gap-2 font-medium text-gray-800">
                        <FaBuilding className="text-gray-400 text-xs" />
                        <span
                          className="truncate max-w-[150px]"
                          title={room.building_name}
                        >
                          {room.building_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell md:text-center border-b md:border-b-0">
                      <span className="md:hidden font-bold uppercase text-xs text-gray-500">
                        Diện tích (m²)
                      </span>
                      {room.area}
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell md:text-center border-b md:border-b-0">
                      <span className="md:hidden font-bold uppercase text-xs text-gray-500">
                        Tối đa (người)
                      </span>
                      {room.capacity}
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell md:text-center font-bold text-gray-900 border-b md:border-b-0">
                      <span className="md:hidden font-bold uppercase text-xs text-gray-500">
                        Hiện ở
                      </span>
                      {room.current_occupants || 0}
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell md:text-center border-b md:border-b-0">
                      <span className="md:hidden font-bold uppercase text-xs text-gray-500">
                        Trạng thái
                      </span>
                      <span
                        className={`${getStatusColor(
                          room.status
                        )} px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap tracking-wide shadow-sm`}
                      >
                        {getStatusLabel(room.status)}
                      </span>
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell md:text-right font-medium text-gray-900 border-b md:border-b-0">
                      <span className="md:hidden font-bold uppercase text-xs text-gray-500">
                        Giá thuê
                      </span>
                      {formatCurrency(room.base_price)}
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell text-gray-600 border-b md:border-b-0">
                      <span className="md:hidden font-bold uppercase text-xs text-gray-500">
                        Đại diện
                      </span>
                      {room.representative || "-"}
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell">
                      <span className="md:hidden font-bold uppercase text-xs text-gray-500">
                        Thao tác
                      </span>
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

        {/* PAGINATION COMPONENT (Server-side) */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          onPageChange={handlePageChange}
          pageSize={pagination.pageSize}
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
