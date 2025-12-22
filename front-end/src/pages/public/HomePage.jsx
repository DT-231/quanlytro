import { useState, useEffect } from "react";
import RoomSearchForm from "../../components/RoomSearchForm";
import RoomList from "../../components/RoomList";
import RoomDetail from "../../components/RoomDetail";
import { getCity, getWard } from "@/services/locationService";
import { ComboboxLocation } from "./Room/Components/ComboxLocations";
import { roomService } from "@/services/roomService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useDebounce from "@/hooks/useDebounce";
import { X } from "lucide-react";
import Pagination from "@/components/Pagination";
import formatPrice from "@/Utils/formatPrice";
import { Link } from "react-router-dom";

const defaultCity = {
  id: null,
  name: "Chọn thành phố",
};
const defaultWard = {
  id: null,
  name: "Chọn quận",
};

const HomePage = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });

  const [searchValue, setSearchValue] = useState("");
  const debounceSearchValue = useDebounce(searchValue);

  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [selectedWard, setSelectedWard] = useState(defaultWard);
  const [capacity, setCapacity] = useState(null);

  const [listCitys, setListCitys] = useState([]);
  const [listWards, setListWards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await roomService.getAll({
        searchValue: debounceSearchValue.trim() || undefined,
        city: selectedCity.id ? selectedCity.name : undefined,
        ward: selectedWard.id ? selectedWard.name : undefined,
        capacity: capacity || undefined,
        page: currentPage || 1,
        pageSize: 20,
      });

      if (res?.success) {
        setRooms(res.data.items || res.data);

        // Cập nhật pagination với cấu trúc mới
        if (res.data.pagination) {
          setPagination(res.data.pagination);
          // setCurrentPage(pagination.page); // Dòng này có thể gây lỗi, xem lưu ý
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [debounceSearchValue, selectedCity, selectedWard, capacity, currentPage]);

  useEffect(() => {
    fetchCity();
  }, []);

  const fetchCity = async () => {
    let res = await getCity();
    setListCitys(res);
  };

  const fetchWard = async (provide_id) => {
    let res = await getWard(provide_id);
    setListWards(res);
  };

  const handleSelectedCity = (value) => {
    fetchWard(value.id);
    setSelectedCity(value);
    setSelectedWard(defaultWard);
  };

  const handleSelectedWard = (value) => {
    setSelectedWard(value);
  };

  const handleClearFilters = () => {
    setSearchValue("");
    setSelectedCity(defaultCity);
    setSelectedWard(defaultWard);
    setListWards([]);
    setCapacity(null);
  };

  const hasActiveFilters =
    searchValue.trim() !== "" ||
    selectedCity.id !== null ||
    selectedWard.id !== null ||
    capacity !== null;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <section className="bg-white p-4 md:p-5 rounded-[10px] border border-black/10 mb-6">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <h2 className="text-base md:text-lg font-semibold leading-5 text-black">
            Tìm kiếm
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
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              name="search"
              placeholder="Nhập tên phòng, tiện ích"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-10 flex-1 w-md rounded-md border border-zinc-200 bg-gray-50 px-4 py-2 text-sm md:text-base"
            />
            <button
              className="h-10 sm:h-9 flex-none items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-gray-50 hover:bg-zinc-800 transition-colors"
              onClick={() => {}}
            >
              Tìm
            </button>
          </div>

          <div className="flex flex-row gap-2">
            <Select
              value={capacity?.toString() || ""}
              onValueChange={(v) => setCapacity(v ? Number(v) : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Số người ở" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 người</SelectItem>
                <SelectItem value="2">2 người</SelectItem>
                <SelectItem value="3">3 người</SelectItem>
                <SelectItem value="4">4+ người</SelectItem>
              </SelectContent>
            </Select>
            <ComboboxLocation
              datas={listCitys}
              onSelected={handleSelectedCity}
              value={selectedCity}
            />
            <ComboboxLocation
              datas={listWards}
              onSelected={handleSelectedWard}
              value={selectedWard}
            />
          </div>
        </div>
      </section>

      <section className="">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2">
          <h1 className="text-2xl md:text-4xl font-bold">
            Danh sách phòng trọ
          </h1>
          {!isLoading && pagination.totalItems > 0 && (
            <p className="text-sm md:text-base text-gray-600">
              Kết quả:
              <span className="font-semibold text-zinc-900">
                {pagination.totalItems}
              </span>{" "}
              phòng
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
            </div>
          ) : rooms.length > 0 ? (
            rooms.map((room) => (
              <Link
                to={`/room/${room.id}`}
                key={room.id}
                className="flex w-full h-auto max-h-80 bg-white rounded-lg p-2.5 gap-2.5 shadow-md border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow duration-300"
              >
                <img
                  src={(() => {
                    const photoToShow = room.primary_photo;
                    if (photoToShow && photoToShow) {
                      return photoToShow.startsWith("data:image/")
                        ? photoToShow
                        : `data:image/png;base64,${photoToShow}`;
                    }
                    return "https://placehold.net/400x400.png";
                  })()}
                  alt={`${room.room_name} ${room.full_address}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.net/400x400.png";
                  }}
                  className="w-3xs h-64 object-cover rounded-md flex-none self-stretch"
                />

                <div className="flex flex-col justify-between  w-full py-2">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-lg leading-[22px] tracking-wide text-black">
                      {room.room_name}
                    </h3>
                    <p className="text-base text-black">
                      {room.full_address || room.address}
                    </p>
                    <div className="flex items-center gap-2 text-base text-black">
                      <span>{room.area}m²</span>
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                      <span>{room.capacity} người</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {room.description ||
                        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."}
                    </p>
                  </div>

                  <div className="flex flex-col items-end mt-2">
                    <p className="font-semibold text-base tracking-wide text-green-500">
                      {/* {(room.base_price || room.price)?.toLocaleString("vi-VN")}{" "} */}
                      {formatPrice(room.base_price)} VNĐ
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-lg font-medium">Không tìm thấy phòng nào</p>
              <p className="text-sm mt-2">
                Vui lòng thử thay đổi bộ lọc tìm kiếm
              </p>
            </div>
          )}
        </div>
      </section>
      <Pagination
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
        totalItems={pagination.totalItems}
        itemName="Phòng"
      />
    </div>
  );
};

export default HomePage;
