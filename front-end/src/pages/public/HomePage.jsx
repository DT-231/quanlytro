import { useState, useEffect } from "react";
import RoomSearchForm from "../../components/RoomSearchForm";
import RoomList from "../../components/RoomList";
import RoomDetail from "../../components/RoomDetail";

const mockRooms = [
  {
    id: 1,
    name: "Phòng trọ sạch sẽ dạng chung cư mini máy lạnh, Hải Châu Đà Nẵng",
    address: "Gần cầu Rồng, Q. Hải Châu, Đà Nẵng",
    area: 25,
    capacity: 3,
    price: 2000000,
    image: "https://via.placeholder.com/300x200?text=Room+1",
  },
  {
    id: 2,
    name: "Phòng trọ thoáng mát dạng chung cư mini, full tiện nghi, Hải Châu – Đà Nẵng",
    address: "Gần cầu Rồng, Q. Hải Châu, Đà Nẵng",
    area: 25,
    capacity: 3,
    price: 2000000,
    image: "https://via.placeholder.com/300x200?text=Room+2",
  },
  {
    id: 3,
    name: "Phòng trọ chung cư mini sạch sẽ, có máy lạnh, vị trí thuận tiện di chuyển.",
    address: "Gần cầu Rồng, Q. Hải Châu, Đà Nẵng",
    area: 25,
    capacity: 3,
    price: 2000000,
    image: "https://via.placeholder.com/300x200?text=Room+3",
  },
  {
    id: 4,
    name: "Cho thuê phòng mini thoáng mát, đầy đủ tiện nghi, gần trung tâm.",
    address: "Gần cầu Rồng, Q. Hải Châu, Đà Nẵng",
    area: 25,
    capacity: 3,
    price: 2000000,
    image: "https://via.placeholder.com/300x200?text=Room+4",
  },
  {
    id: 5,
    name: "Phòng trọ sạch đẹp, máy lạnh sẵn, khu vực an ninh – yên tĩnh.",
    address: "Gần cầu Rồng, Q. Hải Châu, Đà Nẵng",
    area: 25,
    capacity: 3,
    price: 2000000,
    image: "https://via.placeholder.com/300x200?text=Room+5",
  },
  {
    id: 6,
    name: "Phòng chung cư mini mới, gọn gàng, có bếp và máy lạnh, tiện sinh hoạt.",
    address: "Gần cầu Rồng, Q. Hải Châu, Đà Nẵng",
    area: 25,
    capacity: 3,
    price: 2000000,
    image: "https://via.placeholder.com/300x200?text=Room+6",
  },
];

const HomePage = () => {
  const [rooms, setRooms] = useState(mockRooms);
  const [filters, setFilters] = useState({
    priceRange: "",
    capacity: "",
    location: "",
  });
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    let filtered = mockRooms;

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-").map(Number);
      filtered = filtered.filter((r) => r.price >= min && r.price <= max);
    }

    if (filters.capacity) {
      filtered = filtered.filter(
        (r) => r.capacity === parseInt(filters.capacity)
      );
    }

    if (filters.location) {
      filtered = filtered.filter((r) =>
        r.address.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    setRooms(filtered);
  }, [filters]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Tìm kiếm phòng trọ</h1>
      <RoomSearchForm filters={filters} setFilters={setFilters} />
      <RoomList rooms={rooms} onSelectRoom={setSelectedRoom} />
      {selectedRoom && (
        <RoomDetail room={selectedRoom} onClose={() => setSelectedRoom(null)} />
      )}
    </div>
  );
};

export default HomePage;
