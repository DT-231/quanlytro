import { useEffect } from "react";
import { ComboboxDemo } from "./comboboxDemo";
const RoomSearchForm = ({ filters, setFilters }) => {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  useEffect
  

  return (
    <div className="bg-white p-5 rounded-[10px] border border-black/10 mb-6 flex flex-col gap-5">
      <h2 className="text-lg font-semibold leading-5 text-black">
        Tìm kiếm và lọc
      </h2>

      <div className="flex flex-wrap items-center gap-2">

        <input
          type="text"
          name="priceRange"
          placeholder="Nhập tên phòng , tiện ích"
          value={filters.search}
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
        {/* <select
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
        </select> */}

        {/* <div class="relative group">
          <button
            id="dropdown-button"
            class="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
          >
            <span class="mr-2">Open Dropdown</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5 ml-2 -mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <div
            id="dropdown-menu"
            class="hidden absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-1 space-y-1"
          >
            <input
              id="search-input"
              class="block w-full px-4 py-2 text-gray-800 border rounded-md  border-gray-300 focus:outline-none"
              type="text"
              placeholder="Search items"
              autocomplete="off"
            />
            <a
              href="#"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100 active:bg-blue-100 cursor-pointer rounded-md"
            >
              Uppercase
            </a>
            <a
              href="#"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100 active:bg-blue-100 cursor-pointer rounded-md"
            >
              Lowercase
            </a>
            <a
              href="#"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100 active:bg-blue-100 cursor-pointer rounded-md"
            >
              Camel Case
            </a>
            <a
              href="#"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100 active:bg-blue-100 cursor-pointer rounded-md"
            >
              Kebab Case
            </a>
          </div>
        </div> */}
        <ComboboxDemo />
      </div>
    </div>
  );
};

export default RoomSearchForm;
