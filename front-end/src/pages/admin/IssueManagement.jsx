import React, { useState, useMemo } from "react";
import { 
  FaSearch, 
  FaTrashAlt, 
  FaTools,           
  FaInfoCircle,     
  FaClipboardList, 
  FaCheckCircle , 
  FaEdit  
} from "react-icons/fa";
import { FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";

// 1. Import Sonner
import { Toaster, toast } from "sonner";

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
            Hành động này không thể hoàn tác. Sự cố <strong>{itemName}</strong> sẽ bị xóa vĩnh viễn khỏi hệ thống.
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
            Đồng ý xóa
          </button>
        </div>
      </div>
    </div>
  );
};

const IssueManagement = () => {
  // 1. Mock Data (Dựa trên hình ảnh)
  const mockIssues = [
    {
      id: 101,
      code: "101",
      room: "111",
      representative: "Phan Mạnh Quỳnh",
      date: "15/02/2025",
      content: "Bóng đèn cháy",
      building: "Chung cư Hoàng Anh Gia Lai",
      status: "Chưa xử lý",
    },
    {
      id: 110,
      code: "110",
      room: "118",
      representative: "Lâm Minh Phú",
      date: "14/09/2025",
      content: "Cúp điện",
      building: "Chung cư Hoàng Anh Gia Lai",
      status: "Đã xử lý",
    },
    {
      id: 220,
      code: "220",
      room: "200",
      representative: "Lý Thành Ân",
      date: "09/02/2025",
      content: "Nước không chảy",
      building: "Chung cư Hoàng Anh Gia Lai",
      status: "Đã xử lý",
    },
    {
      id: 430,
      code: "430",
      room: "202",
      representative: "Đinh Bảo Toàn",
      date: "23/07/2025",
      content: "Vệ sinh máy lạnh",
      building: "Chung cư Hoàng Anh Gia Lai",
      status: "Đang xử lý",
    },
    {
      id: 550,
      code: "550",
      room: "405",
      representative: "Nguyễn Việt Dũng",
      date: "23/07/2025",
      content: "Cửa bị khóa bên trong",
      building: "Chung cư Hoàng Anh Gia Lai",
      status: "Đã xử lý",
    },
    {
      id: 601,
      code: "601",
      room: "508",
      representative: "Bùi Phú Hùng",
      date: "20/05/2025",
      content: "Nước nhà vệ sinh rỉ nước",
      building: "Chung cư Hoàng Anh Gia Lai",
      status: "Đã xử lý",
    },
    {
      id: 602,
      code: "602",
      room: "608",
      representative: "Nguyễn Tấn Hoàng",
      date: "22/04/2025",
      content: "Nước vệ sinh yếu",
      building: "Chung cư Hoàng Anh Gia Lai",
      status: "Đã xử lý",
    },
  ];

  // 2. States
  const [issues, setIssues] = useState(mockIssues);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // --- STATES CHO XÓA (MỚI) ---
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState(null);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

  // 3. Logic Lọc dữ liệu & Thống kê
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Tìm kiếm theo tên khách hoặc nội dung
      const matchesSearch =
        issue.representative.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.room.includes(searchTerm);

      const matchesBuilding = filterBuilding
        ? issue.building === filterBuilding
        : true;

      const matchesStatus = filterStatus
        ? issue.status === filterStatus
        : true;

      return matchesSearch && matchesBuilding && matchesStatus;
    });
  }, [issues, searchTerm, filterBuilding, filterStatus]);

  // Logic phân trang
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const currentData = filteredIssues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- LOGIC XÓA (MỚI) ---
  const handleDeleteClick = (issue) => {
    setIssueToDelete(issue);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (issueToDelete) {
      setIssues((prev) => prev.filter((i) => i.id !== issueToDelete.id));
      toast.success(`Đã xóa sự cố mã: ${issueToDelete.code}`);
      setDeleteModalOpen(false);
      setIssueToDelete(null);
    }
  };

  const handleEditClick = (issue) => {
      // Vì chưa có Modal Edit, hiển thị toast tạm
      toast.info(`Chức năng sửa sự cố #${issue.code} đang phát triển`);
  }

  // Thống kê cho Cards (Tính toán động từ dữ liệu)
  const stats = {
    total: issues.length,
    processing: issues.filter(i => i.status === "Đang xử lý").length,
    pending: issues.filter(i => i.status === "Chưa xử lý").length,
    done: issues.filter(i => i.status === "Đã xử lý").length,
  };

  // 4. Helper: Màu sắc trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case "Chưa xử lý":
        return "bg-red-600 text-white"; 
      case "Đang xử lý":
        return "bg-yellow-400 text-gray-900"; 
      case "Đã xử lý":
        return "bg-green-500 text-white"; 
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      {/* 2. Thêm Toaster */}
      <Toaster position="top-right" richColors />

      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý sự cố</h1>
      </div>

      {/* --- KHU VỰC TÌM KIẾM & LỌC --- */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tìm kiếm và lọc</h3>
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          
          {/* Search Input */}
          <div className="relative w-full md:w-1/2 flex items-center gap-2">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50 transition-all"
                placeholder="Lọc theo tên khách thuê, nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-gray-900 text-white px-5 py-2 rounded-md text-sm hover:bg-gray-800 font-medium whitespace-nowrap transition-colors">
              Tìm
            </button>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-3 w-full md:w-auto justify-end">
            <div className="relative w-full md:w-48">
              <select
                className="w-full appearance-none border border-gray-200 px-3 py-2 pr-8 rounded-md bg-white hover:bg-gray-50 text-sm focus:outline-none cursor-pointer text-gray-700 transition-all"
                value={filterBuilding}
                onChange={(e) => setFilterBuilding(e.target.value)}
              >
                <option value="">Tòa nhà</option>
                <option value="Chung cư Hoàng Anh Gia Lai">Chung cư Hoàng Anh...</option>
                <option value="VinHome quận 7">VinHome quận 7</option>
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative w-full md:w-40">
              <select
                className="w-full appearance-none border border-gray-200 px-3 py-2 pr-8 rounded-md bg-white hover:bg-gray-50 text-sm focus:outline-none cursor-pointer text-gray-700 transition-all"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Trạng thái</option>
                <option value="Chưa xử lý">Chưa xử lý</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Đã xử lý">Đã xử lý</option>
              </select>
              <FiFilter className="absolute right-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { title: "Tổng sự cố", value: stats.total, icon: FaInfoCircle, color: "text-gray-600" },
          { title: "Đang xử lý", value: stats.processing, icon: FaTools, color: "text-gray-600" },
          { title: "Chưa xử lý", value: stats.pending, icon: FaClipboardList, color: "text-gray-600" },
          { title: "Đã xử lý", value: stats.done, icon: FaCheckCircle, color: "text-yellow-500" },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium mb-1">{stat.title}</h3>
              <stat.icon className={`w-4 h-4 ${stat.color} opacity-70`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* --- DANH SÁCH YÊU CẦU (Table) --- */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Danh sách yêu cầu xử lý</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-xs font-bold border-b border-gray-200 uppercase text-gray-600">
              <tr>
                <th className="p-4">Mã yêu cầu</th>
                <th className="p-4">Phòng</th>
                <th className="p-4">Đại diện</th>
                <th className="p-4 text-center">Ngày gửi yêu cầu</th>
                <th className="p-4">Nội dung yêu cầu</th>
                <th className="p-4">Tòa nhà</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {currentData.length > 0 ? (
                currentData.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="p-4 font-bold text-gray-900">{issue.code}</td>
                    <td className="p-4 font-bold text-gray-800">{issue.room}</td>
                    <td className="p-4 font-medium">{issue.representative}</td>
                    <td className="p-4 text-center text-gray-600">{issue.date}</td>
                    <td className="p-4 font-medium text-gray-800 max-w-[200px] truncate" title={issue.content}>
                        {issue.content}
                    </td>
                    <td className="p-4 text-gray-600 max-w-[150px] truncate" title={issue.building}>
                      {issue.building}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`${getStatusColor(
                          issue.status
                        )} px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap`}
                      >
                        {issue.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button 
                            onClick={() => handleEditClick(issue)}
                            className="p-2 border border-gray-200 rounded hover:bg-gray-900 hover:text-white text-gray-500 transition-all shadow-sm" 
                            title="Xem chi tiết / Sửa"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(issue)}
                            className="p-2 border border-red-100 rounded hover:bg-red-500 hover:text-white text-red-500 transition-all shadow-sm bg-red-50" 
                            title="Xóa"
                        >
                          <FaTrashAlt size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500 italic">
                    Không tìm thấy sự cố nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER & PAGINATION --- */}
        <div className="p-4 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium">
            Hiển thị {currentData.length} trên tổng số {filteredIssues.length} sự cố
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors 
                text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FiChevronLeft /> Previous
            </button>

            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-3 py-1 rounded text-sm transition-all ${
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
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 
                 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* --- RENDER DIALOG XÁC NHẬN --- */}
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={issueToDelete?.content}
      />
    </div>
  );
};

export default IssueManagement;