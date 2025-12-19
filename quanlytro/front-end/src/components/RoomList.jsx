const RoomList = ({ rooms, onSelectRoom }) => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-6">Danh sách phòng trọ</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-8">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex w-full max-w-[580px] h-auto bg-white rounded-lg p-2.5 gap-2.5 shadow-md border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow duration-300"
            onClick={() => onSelectRoom(room)}
          >
            {/* Phần hình ảnh */}
            <img
              src={room.image}
              alt={room.name}
              className="w-[200px] h-full object-cover rounded-md flex-none self-stretch"
            />

            {/* Phần thông tin chi tiết */}
            <div className="flex flex-col justify-between flex-grow self-stretch py-2.5">
              <div className="flex flex-col gap-2.5">
                <h3 className="h-auto md:h-12 font-semibold text-lg leading-[22px] tracking-wide text-black">
                  {room.name}
                </h3>
                <p className="text-base text-black">{room.address}</p>
                <div className="flex items-center gap-2.5 text-base text-black">
                  <span>{room.area}m²</span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                  <span>{room.capacity} người</span>
                </div>
                <p className="h-auto text-sm text-gray-500">
                  {room.description}
                </p>
              </div>

              {/* Giá tiền */}
              <div className="flex flex-col items-end mt-2 md:mt-0">
                <p className="font-semibold text-base tracking-wide text-green-500">
                  {room.price.toLocaleString("vi-VN")} VNĐ / Tháng
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomList;
