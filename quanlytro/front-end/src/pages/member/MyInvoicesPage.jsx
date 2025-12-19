import React, { useState } from "react";
import {
  FaSearch,
  FaDollarSign,
  FaBuilding,
  FaBook,
  FaExclamationCircle,
  FaMoneyBillWave,
  FaClipboardList,
  FaTimes,
} from "react-icons/fa";
import InvoiceDetailModal from "../../components/modals/payment/InvoiceDetailModal";
import PaymentModal from "../../components/modals/payment/PaymentModal";

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
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const filteredInvoices = invoices
    .filter((inv) => {
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
    })
    .sort((a, b) => {
      const statusOrder = {
        "Chưa thanh toán": 1,
        "Đang xử lý": 2,
        "Đã thanh toán": 3,
      };

      const orderA = statusOrder[a.status] || 4;
      const orderB = statusOrder[b.status] || 4;

      if (orderA < orderB) return -1;
      if (orderA > orderB) return 1;
      return 0;
    });

  const handleOpenDetailModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleOpenPaymentModal = (invoice) => {
    if (invoice.status === "Chưa thanh toán") {
      setSelectedInvoice(invoice);
      setIsPaymentModalOpen(true);
    } else {
      alert(
        `Hóa đơn này có trạng thái "${invoice.status}" và không thể thanh toán.`
      );
    }
  };

  const closeModal = () => {
    setIsDetailModalOpen(false);
    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="p-5 bg-gray-50 text-black min-h-screen space-y-5">
      <h1 className="text-[26px] font-bold leading-5">Lịch sử thanh toán</h1>

      {/* Khối Tìm kiếm, Lọc và Thống kê */}
      <div className="bg-white border-[0.1px] border-black rounded-[10px] p-[18px] space-y-5">
        <h2 className="text-lg font-semibold">Tìm kiếm và lọc</h2>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-grow w-full md:w-auto">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Lọc theo mã hóa đơn, ngày...vv"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-md px-10 py-2 w-full focus:ring-2 focus:ring-black focus:border-black transition text-sm"
            />
          </div>
          <button
            onClick={() => setSearch(searchInput)}
            className="px-4 py-2 bg-[#18181B] text-[#FAFAFA] font-medium text-sm rounded-md hover:bg-gray-800 transition w-full md:w-auto"
          >
            Tìm
          </button>
          <div className="flex gap-4 w-full md:w-auto flex-grow">
            <select
              value={invoiceFilter}
              onChange={(e) => setInvoiceFilter(e.target.value)}
              className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-md px-2.5 py-2 w-full focus:ring-2 focus:ring-black focus:border-black transition text-sm text-[#09090B]"
            >
              <option value="Tất cả">Hóa đơn: Tất cả</option>
              <option value="VinHome Đà Nẵng">VinHome Đà Nẵng</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-md px-2.5 py-2 w-full focus:ring-2 focus:ring-black focus:border-black transition text-sm text-[#09090B]"
            >
              <option value="Tất cả">Trạng thái: Tất cả</option>
              <option value="Đã thanh toán">Đã thanh toán</option>
              <option value="Chưa thanh toán">Chưa thanh toán</option>
              <option value="Đang xử lý">Đang xử lý</option>
            </select>
            <div className="w-[27px] h-4"></div>
          </div>
        </div>

        {/* Thống kê */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Tổng hóa đơn của bạn"
            value="50"
            icon={<FaDollarSign size={16} />}
          />
          <StatCard
            title="Đã thanh toán"
            value="20"
            icon={<FaBuilding size={16} className="text-muted-foreground" />}
          />
          <StatCard
            title="Chưa thanh toán"
            value="10"
            icon={<FaBook size={16} className="text-muted-foreground" />}
          />
          <StatCard
            title="Đang xử lý"
            value="10"
            icon={<FaExclamationCircle size={20} className="text-[#BBC40A]" />}
          />
        </div>
      </div>

      {/* Bảng hóa đơn */}
      <div className="bg-white rounded-md p-4 space-y-4">
        <h3 className="text-[26px] font-semibold leading-5">
          Danh sách hóa đơn thanh toán
        </h3>
        <div className="border border-black rounded-md overflow-hidden p-1.5">
          <div className="overflow-hidden">
            <table className="w-full table-fixed">
              <thead className="bg-white text-black">
                <tr className="border-b border-black ">
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
                      className={`p-4 text-center font-semibold text-base whitespace-nowrap ${
                        col === "STT" ? "w-16" : ""
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {filteredInvoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-gray-50 text-sm">
                    <td className="p-2.5 text-center font-semibold">
                      {idx + 1}
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-medium">
                      {inv.name}
                    </td>
                    <td className="p-2.5 text-center font-medium">
                      {inv.date}
                    </td>
                    <td className="p-2.5 text-center font-medium whitespace-nowrap">
                      {inv.amount}
                    </td>
                    <td className="p-2.5 font-semibold text-center">
                      {inv.building}
                    </td>
                    <td className="p-2.5 text-center font-semibold whitespace-nowrap">
                      <div>Điện: {inv.electricity}</div>
                      <div>Nước: {inv.water}</div>
                    </td>
                    <td className="p-2.5 text-center font-medium">{inv.due}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-flex justify-center items-center h-6 px-2.5 rounded-full text-xs font-semibold leading-5 whitespace-nowrap ${
                          inv.status === "Đã thanh toán"
                            ? "bg-[#10FF4B] text-[#09090B]"
                            : inv.status === "Chưa thanh toán"
                            ? "bg-[#FF1010] text-[#09090B]"
                            : "bg-[#FCC911] text-[#4F5044]"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex justify-center items-center gap-2.5">
                        <button
                          onClick={() => handleOpenPaymentModal(inv)}
                          className={`text-gray-600 hover:text-black ${
                            inv.status !== "Chưa thanh toán" &&
                            "opacity-50 cursor-not-allowed"
                          }`}
                          title={
                            inv.status === "Chưa thanh toán"
                              ? "Thanh toán"
                              : `Không thể thanh toán (${inv.status})`
                          }
                          disabled={inv.status !== "Chưa thanh toán"}
                        >
                          <FaMoneyBillWave size={22} />
                        </button>
                        <button
                          onClick={() => handleOpenDetailModal(inv)}
                          className="text-gray-600 hover:text-black"
                          title="Xem chi tiết"
                        >
                          <FaClipboardList size={22} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center p-5">
                      Không tìm thấy hóa đơn nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phân trang */}
        <div className="flex justify-between items-center pt-4 text-base font-medium px-5">
          <span className="text-sm font-medium">7 / 10 trang</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1.5 rounded hover:bg-gray-100 flex items-center gap-1 text-sm font-medium">
              « Previous
            </button>
            <button className="w-10 h-10 border border-gray-200 rounded-md bg-black text-white text-sm font-medium">
              1
            </button>
            <button className="w-10 h-10 border border-gray-200 rounded-md hover:bg-gray-100 text-sm font-medium">
              2
            </button>
            <button className="w-10 h-10 border border-gray-200 rounded-md hover:bg-gray-100 text-sm font-medium">
              3
            </button>
            <span className="px-2">...</span>
            <button className="px-2 py-1.5 rounded hover:bg-gray-100 flex items-center gap-1 text-sm font-medium">
              Next »
            </button>
          </div>
        </div>
      </div>

      {isDetailModalOpen && selectedInvoice && (
        <InvoiceDetailModal invoice={selectedInvoice} onClose={closeModal} />
      )}

      {isPaymentModalOpen && selectedInvoice && (
        <PaymentModal invoice={selectedInvoice} onClose={closeModal} />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white border border-[#E4E4E7] rounded-xl shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_rgba(0,0,0,0.1)]">
    <div className="flex items-center justify-between p-6 pb-2">
      <h3 className="text-xl font-bold text-[#09090B]">{title}</h3>
      <div className="text-muted-foreground">{icon}</div>
    </div>
    <div className="p-6 pt-0">
      <p className="text-xl font-semibold tracking-[0.4px] text-[#09090B]">
        {value}
      </p>
    </div>
  </div>
);

export default MyInvoicesPage;
