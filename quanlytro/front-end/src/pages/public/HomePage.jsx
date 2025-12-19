import { useState, useEffect } from "react";
import RoomSearchForm from "../../components/RoomSearchForm";
import RoomList from "../../components/RoomList";
import RoomDetail from "../../components/RoomDetail";

const mockRooms = [
  {
    id: 1,
    name: "Phòng đơn giá rẻ, Hải Châu",
    address: "Gần cầu Rồng, Q. Hải Châu, Đà Nẵng",
    area: 18,
    capacity: 1,
    price: 2000000,
    image: "/img/room1.jpg",
    type: "Phòng đơn",
    description:
      "Phòng nhỏ gọn, phù hợp sinh viên, có WC riêng, wifi miễn phí, khu vực yên tĩnh.",
  },
  {
    id: 2,
    name: "Phòng chung cư mini, Thanh Khê",
    address: "Đường Điện Biên Phủ, Q. Thanh Khê, Đà Nẵng",
    area: 25,
    capacity: 2,
    price: 2500000,
    image: "/img/room2.jpg",
    type: "Chung cư mini",
    description:
      "Phòng thoáng mát, có máy lạnh, bếp riêng, gần chợ và trạm xe buýt.",
  },
  {
    id: 3,
    name: "Phòng có gác, Liên Chiểu",
    address: "Gần Đại học Bách Khoa, Q. Liên Chiểu, Đà Nẵng",
    area: 30,
    capacity: 3,
    price: 2800000,
    image: "/img/room3.jpg",
    type: "Phòng có gác",
    description:
      "Phòng rộng rãi, có gác lửng, WC riêng, wifi mạnh, gần trường học.",
  },
  {
    id: 4,
    name: "Phòng full nội thất, Ngũ Hành Sơn",
    address: "Gần biển Mỹ Khê, Q. Ngũ Hành Sơn, Đà Nẵng",
    area: 28,
    capacity: 2,
    price: 3500000,
    image: "/img/room4.jpg",
    type: "Phòng full nội thất",
    description:
      "Trang bị đầy đủ nội thất: giường, tủ, máy lạnh, máy giặt, bếp, WC riêng.",
  },
  {
    id: 5,
    name: "Phòng tập thể, Sơn Trà",
    address: "Gần chợ Mân Thái, Q. Sơn Trà, Đà Nẵng",
    area: 40,
    capacity: 4,
    price: 2800000,
    image: "/img/room5.jpg",
    type: "Phòng tập thể",
    description:
      "Phòng lớn, phù hợp nhóm bạn hoặc gia đình, có bếp chung, WC riêng, gần biển.",
  },
  {
    id: 6,
    name: "Phòng cao cấp, Hải Châu",
    address: "Trung tâm Q. Hải Châu, Đà Nẵng",
    area: 35,
    capacity: 2,
    price: 5000000,
    image: "/img/room6.jpg",
    type: "Phòng cao cấp",
    description:
      "Phòng hiện đại, nội thất cao cấp, thang máy, bảo vệ 24/7, gần trung tâm thương mại.",
  },
];

const HomePage = () => {
  const [rooms, setRooms] = useState(mockRooms);
  const [filters, setFilters] = useState({
    priceRange: "",
    capacity: "",
    location: "",
    roomType: "",
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

    if (filters.roomType) {
      filtered = filtered.filter((r) =>
        r.type.toLowerCase().includes(filters.roomType.toLowerCase())
      );
    }

    setRooms(filtered);
  }, [filters]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-6">
        Tìm kiếm phòng trọ
      </h1>
      <RoomSearchForm filters={filters} setFilters={setFilters} />
      <RoomList rooms={rooms} onSelectRoom={setSelectedRoom} />
      {selectedRoom && (
        <RoomDetail room={selectedRoom} onClose={() => setSelectedRoom(null)} />
      )}
    </div>
  );
};

export default HomePage;
