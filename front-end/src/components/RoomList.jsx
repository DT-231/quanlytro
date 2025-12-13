const RoomList = ({ rooms, onSelectRoom }) => {
  if (!rooms || rooms.length === 0) {
    return (
      <p className="text-center text-gray-500">Không có phòng nào phù hợp.</p>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Danh sách phòng trọ</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="border rounded-lg shadow hover:shadow-xl transition bg-white cursor-pointer"
            onClick={() => onSelectRoom(room)}
          >
            <img
              src={room.image}
              alt={room.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <div className="p-4 space-y-2">
              <h3 className="text-base font-bold text-blue-700">{room.name}</h3>
              <p className="text-sm text-gray-600">{room.address}</p>
              <p className="text-sm">
                {room.area}m² - {room.capacity} người
              </p>
              <p className="text-base font-semibold text-red-600">
                {room.price.toLocaleString()} VNĐ / Tháng
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomList;
