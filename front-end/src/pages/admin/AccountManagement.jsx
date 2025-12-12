import React, { useState, useMemo } from "react";
import { FaSearch, FaEdit, FaTrashAlt, FaPlus } from "react-icons/fa";
import { FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { Toaster, toast } from "sonner";

// Import Component Modal
import AddTenantModal from "@/components/modals/tenant/AddTenantModal";

// --- COMPONENT: SHADCN STYLE ALERT DIALOG ---
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg md:w-full">
        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Bạn có chắc chắn muốn xóa?
          </h2>
          <p className="text-sm text-gray-500">
            Hành động này không thể hoàn tác. Khách thuê <strong>{itemName}</strong> sẽ bị xóa vĩnh viễn khỏi hệ thống.
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 hover:text-accent-foreground h-10 px-4 py-2"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountManagement = () => {
  // Mock Data
  const mockTenants = [
    { id: 101, name: "Phan Mạnh Quỳnh", phone: "0256662848", email: "nguyen@gmail.com", gender: "Nam", hometown: "Lâm Đồng", status: "Chưa thuê" },
    { id: 110, name: "Lâm Minh Phú", phone: "0575998517", email: "lehoanganh@gmail.com", gender: "Nữ", hometown: "Đà Nẵng", status: "Đang thuê" },
    { id: 220, name: "Lý Thành Ân", phone: "0258551415", email: "tranducminh@gmail.com", gender: "Nữ", hometown: "Hà Nội", status: "Đang thuê" },
    { id: 430, name: "Đinh Bảo Toàn", phone: "0585542584", email: "kimphuong97@gmail.com", gender: "Nam", hometown: "Quảng Nam", status: "Chưa có giấy tờ" },
    { id: 550, name: "Nguyễn Việt Dũng", phone: "0845228547", email: "hoanglong@gmail.com", gender: "Nam", hometown: "Phú Yên", status: "Đang thuê" },
  ];

  // States
  const [tenants, setTenants] = useState(mockTenants);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- STATES CHO XÓA ---
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);

  // --- STATES CHO TÌM KIẾM & LỌC ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Logic Lọc
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.phone.includes(searchTerm) ||
        tenant.hometown.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus ? tenant.status === filterStatus : true;
      const matchesGender = filterGender ? tenant.gender === filterGender : true;
      return matchesSearch && matchesStatus && matchesGender;
    });
  }, [tenants, searchTerm, filterStatus, filterGender]);

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const currentData = filteredTenants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Hàm thêm khách mới
  const handleAddTenant = (newTenant) => {
    const newId = Math.floor(Math.random() * 1000) + 1000;
    const tenantToAdd = {
      id: newId,
      name: newTenant.fullName,
      phone: newTenant.phone,
      email: newTenant.email || "Chưa cập nhật",
      gender: newTenant.gender || "Khác",
      hometown: newTenant.hometown || "Chưa cập nhật",
      status: "Chưa thuê",
    };
    setTenants([...tenants, tenantToAdd]);
    
    // 2. Sử dụng Sonner toast
    toast.success("Thêm khách thuê thành công!");
  };

  // --- LOGIC XÓA ---
  const handleDeleteClick = (tenant) => {
    setTenantToDelete(tenant);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (tenantToDelete) {
      setTenants((prev) => prev.filter((t) => t.id !== tenantToDelete.id));
      
      // 2. Sử dụng Sonner toast
      toast.success(`Đã xóa khách thuê: ${tenantToDelete.name}`);
      
      setDeleteModalOpen(false);
      setTenantToDelete(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Chưa thuê": return "bg-red-500 text-white";
      case "Đang thuê": return "bg-green-500 text-white";
      case "Chưa có giấy tờ": return "bg-yellow-400 text-gray-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý tài khoản</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm transition-all"
        >
          <FaPlus size={10} /> Thêm khách thuê
        </button>
      </div>

      {/* --- KHU VỰC TÌM KIẾM & LỌC --- */}
      <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="relative w-full md:w-1/2 flex items-center">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                placeholder="Lọc theo tên, SĐT, Quê quán..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <div className="relative">
              <select
                className="w-full appearance-none border border-gray-200 px-3 py-1 pr-8 rounded-md bg-white hover:bg-gray-50 text-sm focus:outline-none cursor-pointer text-gray-700"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Trạng thái</option>
                <option value="Đang thuê">Đang thuê</option>
                <option value="Chưa thuê">Chưa thuê</option>
                <option value="Chưa có giấy tờ">Chưa có giấy tờ</option>
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400 w-3 h-3 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                className="w-full appearance-none border border-gray-200 px-3 py-1 pr-8 rounded-md bg-white hover:bg-gray-50 text-sm focus:outline-none cursor-pointer text-gray-700"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <option value="">Giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400 w-3 h-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { title: "Tổng người thuê", value: tenants.length },
          { title: "Đang Thuê", value: tenants.filter((t) => t.status === "Đang thuê").length },
          { title: "Đã trả phòng", value: tenants.filter((t) => t.status === "Đã trả phòng").length },
          { title: "Chưa thuê", value: tenants.filter((t) => t.status === "Chưa thuê").length },
        ].map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">Danh sách khách thuê</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-xs font-bold border-b border-gray-200 uppercase">
              <tr>
                <th className="p-3">Mã</th>
                <th className="p-3">Tên khách hàng</th>
                <th className="p-3">Số điện thoại</th>
                <th className="p-3">Gmail</th>
                <th className="p-3">Giới tính</th>
                <th className="p-3">Quê quán</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {currentData.length > 0 ? (
                currentData.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-semibold text-gray-900">{tenant.id}</td>
                    <td className="p-3 font-medium">{tenant.name}</td>
                    <td className="p-3">{tenant.phone}</td>
                    <td className="p-3 text-gray-500">{tenant.email}</td>
                    <td className="p-3">{tenant.gender}</td>
                    <td className="p-3">{tenant.hometown}</td>
                    <td className="p-3 text-center">
                      <span className={`${getStatusColor(tenant.status)} px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="p-3 flex justify-center gap-2">
                      <button className="p-1.5 border rounded hover:bg-gray-100 text-gray-600">
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(tenant)}
                        className="p-1.5 border rounded hover:bg-red-50 text-red-500 transition-colors"
                      >
                        <FaTrashAlt size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500">
                    Không tìm thấy kết quả phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-xs text-gray-500 font-medium">
            Hiển thị {currentData.length} trên tổng số {filteredTenants.length} khách thuê
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FiChevronLeft /> Prev
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === idx + 1
                    ? "bg-gray-100 text-black font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      <AddTenantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSuccess={handleAddTenant}
      />

      {/* --- RENDER DIALOG XÁC NHẬN --- */}
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={tenantToDelete?.name}
      />
    </div>
  );
};

export default AccountManagement;