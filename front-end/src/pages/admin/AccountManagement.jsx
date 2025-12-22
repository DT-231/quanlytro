// src/pages/admin/AccountManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaEdit, FaTrashAlt, FaPlus } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import { userService } from "@/services/userService";

// Components
import AddTenantModal from "@/components/modals/tenant/AddTenantModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import Pagination from "@/components/Pagination";
// NEW: Import FilterBar
import FilterBar from "@/components/FilterBar";

const AccountManagement = () => {
  // --- STATES ---
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FILTERS & PAGINATION ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGender, setFilterGender] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- MODALS ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tenantToEdit, setTenantToEdit] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);

  // --- TÍNH TOÁN THỐNG KÊ (useMemo) ---
  const stats = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter(t => t.status === "ACTIVE" || t.status === "Đang thuê").length;
    const inactive = tenants.filter(t => t.status === "INACTIVE" || t.status === "Chưa thuê").length;
    const returned = tenants.filter(t => t.status === "RETURNED").length;

    return {
      total_tenants: total,
      active_tenants: active,
      not_rented: inactive,
      returned_rooms: returned,
    };
  }, [tenants]);

  // --- 1. LẤY DANH SÁCH & SẮP XẾP ---
  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm || null,
        status: filterStatus === "Đang thuê" ? "ACTIVE" 
              : filterStatus === "Chưa thuê" ? "INACTIVE" 
              : null,
        gender: filterGender || null,
        role_code: "TENANT",
      };

      const res = await userService.getAll(params);
      const dataSource = res && res.data ? res.data : res;

      let items = [];
      if (dataSource && Array.isArray(dataSource.items)) {
        items = dataSource.items;
      } else if (Array.isArray(dataSource)) {
        items = dataSource;
      }
      
      const sortedItems = items.sort((a, b) => {
        const codeA = Number(a.code) || 0;
        const codeB = Number(b.code) || 0;
        if (codeB !== codeA) {
            return codeB - codeA; 
        }
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      });
      
      setTenants(sortedItems);

    } catch (error) {
      console.error("Lỗi lấy danh sách:", error);
      toast.error("Không thể tải danh sách khách thuê");
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus, filterGender]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // --- FILTER CONFIGURATION ---
  
  // 1. Status Options
  const statusOptions = [
    { id: "Đang thuê", name: "Đang thuê" },
    { id: "Chưa thuê", name: "Chưa thuê" },
  ];

  // 2. Gender Options
  const genderOptions = [
    { id: "Nam", name: "Nam" },
    { id: "Nữ", name: "Nữ" },
  ];

  // 3. Filter Configs
  const filterConfigs = [
    {
      key: "status",
      type: "select",
      placeholder: "Trạng thái",
      options: statusOptions,
      value: filterStatus,
    },
    {
      key: "gender",
      type: "select",
      placeholder: "Giới tính",
      options: genderOptions,
      value: filterGender,
    },
  ];

  // 4. Handle Filter Change
  const handleFilterChange = (key, value) => {
    if (key === "status") {
      setFilterStatus(value);
    } else if (key === "gender") {
      setFilterGender(value);
    }
    setCurrentPage(1);
  };

  // 5. Handle Clear Filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterGender("");
    setCurrentPage(1);
    // REMOVED: toast.info("Đã xóa bộ lọc"); as requested
  };

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTenants = useMemo(() => {
    return tenants.slice(indexOfFirstItem, indexOfLastItem);
  }, [tenants, currentPage]);
  const totalPages = Math.ceil(tenants.length / itemsPerPage);

  // --- HELPER ---
  const renderFullName = (tenant) => {
    if (tenant.full_name) return tenant.full_name;
    return [tenant.last_name, tenant.first_name].filter(Boolean).join(" ");
  };

  // --- HANDLERS ---
  const handleSuccess = () => {
    fetchTenants(); 
    setCurrentPage(1); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleOpenAdd = () => {
    setTenantToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (tenant) => {
    setTenantToEdit(tenant);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (tenant) => {
    setTenantToDelete(tenant);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (tenantToDelete) {
      try {
        await userService.delete(tenantToDelete.id);
        toast.success(`Đã xóa thành công khách thuê`);
        fetchTenants(); 
        if (currentTenants.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
      } catch (error) {
        console.error("Lỗi xóa:", error);
        toast.error("Không thể xóa khách thuê này.");
      } finally {
        setDeleteModalOpen(false);
        setTenantToDelete(null);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500 text-white";
      case "INACTIVE": return "bg-gray-200 text-gray-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    if (status === "ACTIVE") return "Đang thuê";
    if (status === "INACTIVE") return "Chưa thuê";
    return status || "Chưa xác định";
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative pb-10">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý tài khoản</h1>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm transition-all"
        >
          <FaPlus size={10} /> Thêm khách thuê
        </button>
      </div>

      {/* REUSABLE FILTER BAR */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Lọc theo tên, SĐT, Email..."
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { title: "Tổng người thuê", value: stats.total_tenants },
          { title: "Đang Thuê", value: stats.active_tenants },
          { title: "Đã trả phòng", value: stats.returned_rooms },
          { title: "Chưa thuê", value: stats.not_rented },
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
                <th className="p-3">Họ và tên</th>
                <th className="p-3">Liên hệ</th>
                <th className="p-3">Gmail</th>
                <th className="p-3">Giới tính</th>
                <th className="p-3">Quê quán</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                          <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : currentTenants.length > 0 ? (
                currentTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-semibold text-gray-900">
                      {renderFullName(tenant)}
                      <div className="text-xs text-gray-400 font-normal">
                        {tenant.code ? `#${tenant.code}` : "---"}
                      </div>
                    </td>
                    <td className="p-3">{tenant.phone || "---"}</td>
                    <td className="p-3 text-gray-500">{tenant.email || "---"}</td>
                    <td className="p-3">{tenant.gender || "---"}</td>
                    <td className="p-3">{tenant.district || tenant.address || "---"}</td>
                    <td className="p-3 text-center">
                      <span className={`${getStatusColor(tenant.status)} px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap`}>
                        {getStatusLabel(tenant.status)}
                      </span>
                    </td>
                    <td className="p-3 flex justify-center gap-2">
                      <button onClick={() => handleOpenEdit(tenant)} className="p-1.5 border rounded hover:bg-gray-100 text-gray-600">
                        <FaEdit size={12} />
                      </button>
                      <button onClick={() => handleDeleteClick(tenant)} className="p-1.5 border rounded hover:bg-red-50 text-red-500 transition-colors">
                        <FaTrashAlt size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500">
                    Không tìm thấy dữ liệu phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={tenants.length}
          itemName="khách thuê"
        />
      </div>

      <AddTenantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSuccess={handleSuccess}
        tenantToEdit={tenantToEdit}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={renderFullName(tenantToDelete || {})}
        itemType="Khách thuê"
      />
    </div>
  );
};

export default AccountManagement;