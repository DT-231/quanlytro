const RoomSearchForm = ({ filters, setFilters }) => {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white p-5 rounded-[10px] border border-black/10 mb-6 flex flex-col gap-5">
      <h2 className="text-lg font-semibold leading-5 text-black">
        Tìm kiếm và lọc
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        {/* Ô nhập số tiền */}
        <input
          type="text"
          name="priceRange"
          placeholder="Số tiền"
          value={filters.priceRange}
          onChange={handleChange}
          className="h-10 w-[465px] rounded-md border border-zinc-200 bg-gray-50 px-4 py-2"
        />

        {/* Nút tìm */}
        <button
          className="mr-2 h-9 flex-none items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-gray-50"
          onClick={() => {}}
        >
          Tìm
        </button>

        {/* Dropdown số người */}
        <select
          name="capacity"
          value={filters.capacity}
          onChange={handleChange}
          className="h-10 w-[160px] rounded-md border border-zinc-200 bg-gray-50 px-2.5 py-2 text-sm"
        >
          <option value="">Lọc theo số người</option>
          <option value="1">1 người</option>
          <option value="2">2 người</option>
          <option value="3">3 người</option>
          <option value="4">4 người</option>
          <option value="5">5 người</option>
          <option value="6">6 người</option>
        </select>

        {/* Dropdown quận */}
        <select
          name="location"
          value={filters.location}
          onChange={handleChange}
          className="h-10 w-[160px] rounded-md border border-zinc-200 bg-gray-50 px-2.5 py-2 text-sm"
        >
          <option value="">Lọc theo quận</option>
          <option value="Hải Châu">Hải Châu</option>
          <option value="Thanh Khê">Thanh Khê</option>
          <option value="Liên Chiểu">Liên Chiểu</option>
          <option value="Ngũ Hành Sơn">Ngũ Hành Sơn</option>
          <option value="Sơn Trà">Sơn Trà</option>
        </select>

        {/* Dropdown loại phòng */}
        <select
          name="roomType"
          value={filters.roomType || ""}
          onChange={handleChange}
          className="h-10 w-[180px] rounded-md border border-zinc-200 bg-gray-50 px-2.5 py-2 text-sm"
        >
          <option value="">Lọc theo loại phòng</option>
          <option value="Chung cư mini">Chung cư mini</option>
          <option value="Phòng đơn">Phòng đơn</option>
          <option value="Phòng có gác">Phòng có gác</option>
          <option value="Phòng full nội thất">Phòng full nội thất</option>
        </select>
      </div>
    </div>
  );
};

export default RoomSearchForm;
