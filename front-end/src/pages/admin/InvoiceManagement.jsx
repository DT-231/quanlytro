import React, { useState, useMemo } from "react";
import {
  FaSearch,
  FaEdit,
  FaTrashAlt,
  FaPlus,
  FaEllipsisH,
} from "react-icons/fa";
import { FiFilter } from "react-icons/fi";
import InvoiceDetailModal from "@/components/modals/InvoiceDetailModal";
const InvoiceManagement = () => {
  // 1. Mock Data (Giả lập dữ liệu hóa đơn)
  const mockInvoices = [
    {
      id: 101,
      room: "111",
      tenant: "Phan Mạnh Quỳnh",
      date: "15/02/2025",
      electricity: 120,
      water: 15,
      deadline: "15/12/2025",
      status: "Chưa thanh toán",
    },
    {
      id: 110,
      room: "118",
      tenant: "Lâm Minh Phú",
      date: "14/09/2025",
      electricity: 135,
      water: 18,
      deadline: "14/12/2025",
      status: "Đã thanh toán",
    },
    {
      id: 220,
      room: "200",
      tenant: "Lý Thành Ân",
      date: "09/02/2025",
      electricity: 142,
      water: 12,
      deadline: "09/12/2025",
      status: "Đã thanh toán",
    },
    {
      id: 430,
      room: "202",
      tenant: "Đinh Bảo Toàn",
      date: "23/07/2025",
      electricity: 155,
      water: 20,
      deadline: "23/12/2025",
      status: "Đang xử lý",
    },
    {
      id: 550,
      room: "405",
      tenant: "Nguyễn Việt Dũng",
      date: "23/07/2025",
      electricity: 167,
      water: 16,
      deadline: "23/12/2025",
      status: "Đã thanh toán",
    },
  ];

  // 2. States
  const [invoices, setInvoices] = useState(mockInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null); // Lưu hóa đơn đang chọn
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 3. Hàm mở Modal
  const handleViewDetail = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  // 3. Logic Lọc dữ liệu
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // a. Tìm kiếm theo tên khách
      const matchesSearch = invoice.tenant
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      // b. Lọc theo Phòng
      const matchesRoom = filterRoom ? invoice.room === filterRoom : true;
      // c. Lọc theo Trạng thái
      const matchesStatus = filterStatus
        ? invoice.status === filterStatus
        : true;

      return matchesSearch && matchesRoom && matchesStatus;
    });
  }, [invoices, searchTerm, filterRoom, filterStatus]);

  // 4. Helper function màu sắc trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case "Chưa thanh toán":
        return "bg-red-500 text-white";
      case "Đã thanh toán":
        return "bg-green-500 text-white";
      case "Đang xử lý":
        return "bg-yellow-400 text-gray-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50  font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý hóa đơn</h1>
        <button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm transition-all">
          <FaPlus size={10} /> Thêm hóa đơn
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-1/2 flex items-center">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                placeholder="Lọc theo tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="ml-2 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-800">
              Tìm
            </button>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-2 w-full md:w-auto justify-end">
            {/* Lọc Phòng */}
            <div className="relative">
              <select
                className="appearance-none border px-3 py-1.5 pr-8 rounded-md bg-white hover:bg-gray-50 text-xs focus:outline-none cursor-pointer"
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
              >
                <option value="">Tất cả phòng</option>
                {/* Thêm các phòng khác nếu cần */}
              </select>
              <FiFilter className="absolute right-2 top-2 text-gray-400 w-3 h-3 pointer-events-none" />
            </div>

            {/* Lọc Trạng Thái */}
            <div className="relative">
              <select
                className="appearance-none border px-3 py-1.5 pr-8 rounded-md bg-white hover:bg-gray-50 text-xs focus:outline-none cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Trạng thái</option>
                <option value="Đã thanh toán">Đã thanh toán</option>
                <option value="Chưa thanh toán">Chưa thanh toán</option>
                <option value="Đang xử lý">Đang xử lý</option>
              </select>
              <FiFilter className="absolute right-2 top-2 text-gray-400 w-3 h-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          {
            title: "Tổng Hóa đơn",
            value: invoices.length, 
          },
          {
            title: "Đã thanh toán",
            value: invoices.filter((i) => i.status === "Đã thanh toán").length, 
          },
          {
            title: "Chưa thanh toán",
            value: invoices.filter((i) => i.status === "Chưa thanh toán")
              .length, // Đếm số chưa thanh toán
          },
          {
            title: "Đang xử lý",
            value: invoices.filter((i) => i.status === "Đang xử lý").length,
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className=" text-sm font-medium mb-1">{stat.title} </h3>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">
            Danh sách hóa đơn
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-xs font-bold border-b border-gray-200 uppercase">
              <tr>
                <th className="p-3">Hóa đơn</th>
                <th className="p-3">Phòng</th>
                <th className="p-3">Tên khách hàng</th>
                <th className="p-3">Ngày xuất</th>
                <th className="p-3">Chỉ số điện/nước</th>
                <th className="p-3">Hạn thanh toán</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3 font-semibold text-gray-900">
                      {item.id}
                    </td>
                    <td className="p-3 font-bold text-gray-800">{item.room}</td>
                    <td className="p-3 font-medium">{item.tenant}</td>
                    <td className="p-3 text-gray-800">{item.date}</td>
                    <td className="p-3 text-sm text-gray-800">
                      <div>Điện: {item.electricity} kWh</div>
                      <div>Nước: {item.water} m³</div>
                    </td>
                    <td className="p-3 text-gray-800">{item.deadline}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`${getStatusColor(
                          item.status
                        )} px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                        <div
                          onClick={() => handleViewDetail(item)}
                          className="flex justify-center items-center text-gray-400 cursor-pointer hover:text-black"
                        >
                          <FaEllipsisH />
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500">
                    Không tìm thấy hóa đơn nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <InvoiceDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          invoice={selectedInvoice}
        />
        {/* Pagination */}
      </div>
    </div>
  );
};

export default InvoiceManagement;
