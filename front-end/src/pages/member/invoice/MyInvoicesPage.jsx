import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaEye,
  FaSpinner,
} from "react-icons/fa";
import { invoiceService } from "@/services/invoiceService";
import { toast } from "sonner";

/**
 * Trang danh sách hoá đơn của người thuê (TENANT).
 * 
 * - Gọi API lấy hoá đơn theo user đang đăng nhập
 * - Hiển thị thống kê, bộ lọc, bảng danh sách
 * - Click xem chi tiết => /member/my-invoices/:id
 */
const MyInvoicesPage = () => {
  const navigate = useNavigate();

  // State
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
  });

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * Fetch danh sách hoá đơn từ API.
   */
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      };

      const res = await invoiceService.getAll(params);
      const data = res?.data || res;

      // Handle response
      const items = Array.isArray(data?.items) ? data.items : [];
      const total = data?.total || items.length;

      setInvoices(items);
      setTotalPages(Math.ceil(total / pageSize) || 1);

      // Calculate stats
      const paidCount = items.filter((inv) => inv.status === "PAID").length;
      const pendingCount = items.filter((inv) => inv.status === "PENDING").length;
      const overdueCount = items.filter((inv) => inv.status === "OVERDUE").length;

      setStats({
        total,
        paid: paidCount,
        pending: pendingCount,
        overdue: overdueCount,
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Không thể tải danh sách hoá đơn");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  /**
   * Lọc theo từ khoá search (client-side filter).
   */
  const filteredInvoices = invoices.filter((inv) => {
    if (!search) return true;
    const keyword = search.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(keyword) ||
      inv.room_number?.toLowerCase().includes(keyword) ||
      inv.building_name?.toLowerCase().includes(keyword) ||
      inv.tenant_name?.toLowerCase().includes(keyword)
    );
  });

  /**
   * Format VND currency.
   */
  const formatVND = (amount) => {
    const value = parseFloat(amount) || 0;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  /**
   * Format date to DD/MM/YYYY.
   */
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  /**
   * Get status badge config.
   */
  const getStatusBadge = (status) => {
    const statusMap = {
      PAID: {
        label: "Đã thanh toán",
        className: "bg-green-100 text-green-700 border-green-300",
      },
      PENDING: {
        label: "Chờ thanh toán",
        className: "bg-yellow-100 text-yellow-700 border-yellow-300",
      },
      PROCESSING: {
        label: "Đang xử lý",
        className: "bg-blue-100 text-blue-700 border-blue-300",
      },
      OVERDUE: {
        label: "Quá hạn",
        className: "bg-red-100 text-red-700 border-red-300",
      },
      CANCELLED: {
        label: "Đã huỷ",
        className: "bg-gray-100 text-gray-600 border-gray-300",
      },
    };
    return statusMap[status] || statusMap.PENDING;
  };

  /**
   * Navigate to invoice detail page.
   */
  const handleViewDetail = (invoiceId) => {
    navigate(`/member/my-invoices/${invoiceId}`);
  };

  /**
   * Handle page change.
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hoá đơn của tôi</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng hoá đơn"
          value={stats.total}
          icon={<FaFileInvoiceDollar className="text-blue-500" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Đã thanh toán"
          value={stats.paid}
          icon={<FaCheckCircle className="text-green-500" />}
          bgColor="bg-green-50"
        />
        <StatCard
          title="Chờ thanh toán"
          value={stats.pending}
          icon={<FaClock className="text-yellow-500" />}
          bgColor="bg-yellow-50"
        />
        <StatCard
          title="Quá hạn"
          value={stats.overdue}
          icon={<FaExclamationTriangle className="text-red-500" />}
          bgColor="bg-red-50"
        />
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo mã, phòng, toà nhà..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm"
            />
          </div>

          {/* Search Button */}
          <button
            onClick={() => setSearch(searchInput)}
            className="px-5 py-2.5 bg-black text-white font-medium text-sm rounded-lg hover:bg-gray-800 transition"
          >
            Tìm kiếm
          </button>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black text-sm min-w-[180px]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="OVERDUE">Quá hạn</option>
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Danh sách hoá đơn</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-3xl text-gray-400" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FaFileInvoiceDollar className="mx-auto text-5xl mb-4 text-gray-300" />
            <p>Không tìm thấy hoá đơn nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Mã hoá đơn</th>
                  <th className="px-4 py-3 text-left">Phòng</th>
                  <th className="px-4 py-3 text-left">Kỳ thu</th>
                  <th className="px-4 py-3 text-right">Tổng tiền</th>
                  <th className="px-4 py-3 text-left">Hạn thanh toán</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInvoices.map((invoice) => {
                  const statusBadge = getStatusBadge(invoice.status);
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{invoice.room_number}</div>
                        <div className="text-gray-500 text-xs">{invoice.building_name}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(invoice.billing_month)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatVND(invoice.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewDetail(invoice.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <FaEye />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t">
            <span className="text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 text-sm rounded-lg transition ${
                      page === pageNum
                        ? "bg-black text-white"
                        : "border hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="px-2">...</span>}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * StatCard component for displaying statistics.
 */
const StatCard = ({ title, value, icon, bgColor = "bg-white" }) => (
  <div className={`${bgColor} border rounded-xl p-5 shadow-sm`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  </div>
);

export default MyInvoicesPage;
