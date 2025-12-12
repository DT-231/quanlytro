import React, { useState } from "react";
import {
  FaSearch,
  FaEllipsisH,
  FaDollarSign,
  FaBuilding,
  FaExclamationCircle,
} from "react-icons/fa";

const MyInvoicesPage = () => {
  const invoices = [
    {
      id: 1,
      name: "Phan Mạnh Quỳnh",
      date: "15/02/2025",
      amount: "9.000.000₫",
      building: "VinHome Đà Nẵng",
      electricity: "120 kWh",
      water: "15 m³",
      due: "15/12/2025",
      status: "Chưa thanh toán",
    },
    {
      id: 2,
      name: "Phan Mạnh Quỳnh",
      date: "14/09/2025",
      amount: "8.000.000₫",
      building: "VinHome Đà Nẵng",
      electricity: "135 kWh",
      water: "18 m³",
      due: "14/12/2025",
      status: "Đã thanh toán",
    },
    {
      id: 3,
      name: "Phan Mạnh Quỳnh",
      date: "09/02/2025",
      amount: "7.510.000₫",
      building: "VinHome Đà Nẵng",
      electricity: "142 kWh",
      water: "20 m³",
      due: "09/12/2025",
      status: "Đã thanh toán",
    },
    {
      id: 4,
      name: "Phan Mạnh Quỳnh",
      date: "23/07/2025",
      amount: "6.000.000₫",
      building: "VinHome Đà Nẵng",
      electricity: "155 kWh",
      water: "20 m³",
      due: "23/12/2025",
      status: "Đang xử lý",
    },
    {
      id: 5,
      name: "Phan Mạnh Quỳnh",
      date: "23/07/2025",
      amount: "4.700.000₫",
      building: "VinHome Đà Nẵng",
      electricity: "167 kWh",
      water: "16 m³",
      due: "23/12/2025",
      status: "Đã thanh toán",
    },
    {
      id: 6,
      name: "Phan Mạnh Quỳnh",
      date: "18/06/2025",
      amount: "5.200.000₫",
      building: "VinHome Đà Nẵng",
      electricity: "110 kWh",
      water: "14 m³",
      due: "18/11/2025",
      status: "Đã thanh toán",
    },
    {
      id: 7,
      name: "Phan Mạnh Quỳnh",
      date: "10/05/2025",
      amount: "7.800.000₫",
      building: "VinHome Đà Nẵng",
      electricity: "140 kWh",
      water: "19 m³",
      due: "10/10/2025",
      status: "Chưa thanh toán",
    },
  ];

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [invoiceFilter, setInvoiceFilter] = useState("Tất cả");

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch = search
      ? inv.name.toLowerCase().includes(search.toLowerCase()) ||
        inv.date.includes(search) ||
        inv.amount.includes(search)
      : true;

    const matchStatus =
      statusFilter === "Tất cả" ? true : inv.status === statusFilter;

    const matchInvoice =
      invoiceFilter === "Tất cả" ? true : inv.building === invoiceFilter;
    return matchSearch && matchStatus && matchInvoice;
  });

  return (
    <div className="p-5 bg-gray-50 text-gray-900 min-h-screen">
      <h1 className="text-[26px] font-bold mb-5">Lịch sử thanh toán</h1>

      {/* Khối Tìm kiếm, Lọc và Thống kê */}
      <div className="bg-white border border-gray-300 rounded-xl p-5 mb-5 space-y-5">
        <h2 className="text-lg font-semibold">Tìm kiếm và lọc</h2>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-grow w-full md:w-auto">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Lọc theo mã hóa đơn, ngày...vv"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (e.target.value === "") {
                  setSearch("");
                }
              }}
              className="bg-gray-50 border border-gray-300 rounded-md px-10 py-2 w-full focus:ring-2 focus:ring-black focus:border-black transition"
            />
          </div>
          <button
            onClick={() => setSearch(searchInput)}
            className="px-4 py-2 bg-black text-white font-medium text-sm rounded-md hover:bg-gray-800 transition w-full md:w-auto"
          >
            Tìm
          </button>
          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={invoiceFilter}
              onChange={(e) => setInvoiceFilter(e.target.value)}
              className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-black focus:border-black transition text-sm"
            >
              <option value="Tất cả">Hóa đơn: Tất cả</option>
              <option value="VinHome Đà Nẵng">VinHome Đà Nẵng</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-black focus:border-black transition text-sm"
            >
              <option value="Tất cả">Trạng thái: Tất cả</option>
              <option value="Đã thanh toán">Đã thanh toán</option>
              <option value="Chưa thanh toán">Chưa thanh toán</option>
              <option value="Đang xử lý">Đang xử lý</option>
            </select>
          </div>
        </div>

        {/* Thống kê */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <StatCard
            title="Tổng hóa đơn của bạn"
            value="50"
            icon={<FaDollarSign />}
          />
          <StatCard title="Đã thanh toán" value="20" icon={<FaBuilding />} />
          <StatCard
            title="Chưa thanh toán"
            value="10"
            icon={<FaExclamationCircle className="text-red-500" />}
          />
          <StatCard
            title="Đang xử lý"
            value="10"
            icon={<FaExclamationCircle className="text-yellow-500" />}
          />
        </div>
      </div>

      {/* Bảng hóa đơn */}
      <div className="bg-white rounded-lg p-5 space-y-4">
        <h3 className="text-[26px] font-semibold">
          Danh sách hóa đơn thanh toán
        </h3>
        <div className="border border-black rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-900">
                <tr className="border-b border-black">
                  {[
                    "STT",
                    "Tên khách hàng",
                    "Ngày xuất hóa đơn",
                    "Tổng tiền",
                    "Tòa nhà",
                    "Chỉ số điện nước",
                    "Hạn thanh toán",
                    "Trạng thái",
                    "Thao tác",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-4 text-left font-semibold text-lg whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((inv, idx) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50 text-lg font-medium"
                  >
                    <td className="px-4 py-5 text-center">{idx + 1}</td>
                    <td className="px-4 py-5">{inv.name}</td>
                    <td className="px-4 py-5">{inv.date}</td>
                    <td className="px-4 py-5">{inv.amount}</td>
                    <td className="px-4 py-5 font-semibold">{inv.building}</td>
                    <td className="px-4 py-5">
                      <div>Điện: {inv.electricity}</div>
                      <div>Nước: {inv.water}</div>
                    </td>
                    <td className="px-4 py-5">{inv.due}</td>
                    <td className="px-4 py-5 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          inv.status === "Đã thanh toán"
                            ? "bg-green-500 text-white"
                            : inv.status === "Chưa thanh toán"
                            ? "bg-red-500 text-white"
                            : "bg-yellow-400 text-gray-800"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <button className="text-gray-500 hover:text-black">
                        <FaEllipsisH />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phân trang */}
        <div className="flex justify-between items-center pt-4 text-base font-medium">
          <span>7 / 10 trang</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-2 border rounded-md hover:bg-gray-100">
              « Previous
            </button>
            <button className="px-4 py-2 border rounded-md bg-black text-white">
              1
            </button>
            <button className="px-4 py-2 border rounded-md hover:bg-gray-100">
              2
            </button>
            <button className="px-4 py-2 border rounded-md hover:bg-gray-100">
              3
            </button>
            <span className="px-2">...</span>
            <button className="px-3 py-2 border rounded-md hover:bg-gray-100">
              Next »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      <div className="text-gray-500">{icon}</div>
    </div>
    <p className="text-xl font-semibold tracking-wide">{value}</p>
  </div>
);

export default MyInvoicesPage;
