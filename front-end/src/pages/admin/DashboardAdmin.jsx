/**
 * Dashboard Admin - Trang tổng quan dành cho Admin
 *
 * Hiển thị:
 * - Thống kê doanh thu, số phòng, phòng trống, sự cố
 * - Filter theo tòa nhà và khoảng thời gian
 * - Hoạt động gần đây: thanh toán, yêu cầu hủy HĐ, sự cố, HĐ mới
 * - Lịch hẹn xem phòng
 * 
 * Sử dụng API tổng hợp /dashboard/stats để tối ưu hiệu năng
 */
import React, { useState, useEffect, useMemo } from "react";
import { 
  FaDollarSign, 
  FaBuilding, 
  FaExclamationCircle, 
  FaDoorOpen,
  FaFileContract, 
  FaFileInvoiceDollar, 
  FaFileSignature, 
  FaWrench,
  FaCalendarAlt,
  FaEye,
  FaBan 
} from "react-icons/fa";
import { FiChevronDown, FiCalendar } from "react-icons/fi";

// Services - API calls
import { buildingService } from "@/services/buildingService";
import { dashboardService } from "@/services/dashboardService";

const Dashboard = () => {
  // ==================================================================================
  // STATE MANAGEMENT
  // ==================================================================================
  
  // Data từ API
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedBuildingName, setSelectedBuildingName] = useState("Tất cả toà nhà");
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [isBuildingMenuOpen, setIsBuildingMenuOpen] = useState(false);

  // Dữ liệu Dashboard từ API tổng hợp
  const [dashboardData, setDashboardData] = useState({
    room_stats: {
      total_rooms: 0,
      empty_rooms: 0,
      occupied_rooms: 0,
      revenue: 0
    },
    maintenance_stats: {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0
    },
    contract_stats: {
      total_contracts: 0,
      active_contracts: 0,
      expiring_soon: 0,
      expired_contracts: 0
    },
    recent_activities: [],
    pending_appointments: []
  });

  // State dropdown tháng - TODO: Implement filter theo tháng
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState(`Tháng ${currentMonth}`);
  const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  // ==================================================================================
  // DATA FETCHING
  // ==================================================================================
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Gọi API tổng hợp dashboard - CHỈ 1 REQUEST thay vì nhiều
        const [buildRes, dashRes] = await Promise.all([
          buildingService.getAll(),
          dashboardService.getStats({ building_id: selectedBuildingId })
        ]);

        if (buildRes?.data?.items) {
          setBuildings(buildRes.data.items);
        }
        
        // Cập nhật toàn bộ dashboard data từ API
        if (dashRes?.data) {
          setDashboardData(dashRes.data);
        }

      } catch (error) {
        console.error("Lỗi tải dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedBuildingId]);

  // Helper format thời gian tương đối
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // ==================================================================================
  // COMPUTED VALUES (useMemo cho performance)
  // ==================================================================================

  /**
   * Tính toán thống kê từ dashboard data
   */
  const stats = useMemo(() => {
    const { room_stats, maintenance_stats, contract_stats, pending_appointments } = dashboardData;
    
    return {
      revenue: room_stats.revenue || 0,
      totalRooms: room_stats.total_rooms || 0,
      emptyRooms: room_stats.empty_rooms || 0,
      occupiedRooms: room_stats.occupied_rooms || 0,
      totalIssues: maintenance_stats.total || 0,
      pendingIssues: maintenance_stats.pending || 0,
      inProgressIssues: maintenance_stats.in_progress || 0,
      expiringContracts: contract_stats.expiring_soon || 0,
      activeContracts: contract_stats.active_contracts || 0,
      totalContracts: contract_stats.total_contracts || 0,
      pendingAppointments: pending_appointments?.length || 0
    };
  }, [dashboardData]);

  // Helper format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const handleSelectMonth = (month) => {
    setSelectedMonth(month);
    setIsMonthOpen(false);
  };

  const handleSelectBuilding = (building) => {
    if (building === "all") {
      setSelectedBuildingName("Tất cả toà nhà");
      setSelectedBuildingId(null);
    } else {
      setSelectedBuildingName(building.building_name);
      setSelectedBuildingId(building.id);
    }
    setIsBuildingMenuOpen(false);
  };

  // Format datetime cho lịch hẹn
  const formatAppointmentTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const dateRangeLabel = useMemo(() => {
    const today = new Date();
    const nextMonthDate = new Date(today);
    nextMonthDate.setMonth(today.getMonth() + 1);
    const format = (d) => `${d.getMonth() + 1}/${d.getFullYear()}`;
    return `${format(today)} - ${format(nextMonthDate)}`;
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case "payment": return <div className="p-3 rounded-lg bg-green-100 text-green-600"><FaFileInvoiceDollar size={20} /></div>;
      case "contract": return <div className="p-3 rounded-lg bg-blue-100 text-blue-600"><FaFileSignature size={20} /></div>;
      case "issue": return <div className="p-3 rounded-lg bg-orange-100 text-orange-600"><FaWrench size={20} /></div>;
      case "appointment": return <div className="p-3 rounded-lg bg-purple-100 text-purple-600"><FaEye size={20} /></div>;
      case "termination": return <div className="p-3 rounded-lg bg-red-100 text-red-600"><FaBan size={20} /></div>;
      default: return null;
    }
  };

  // Format activity description with amount
  const formatActivityDesc = (activity) => {
    let desc = activity.description;
    if (activity.amount && activity.amount > 0) {
      desc += ` - ${formatCurrency(activity.amount)}`;
    }
    return desc;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Trang chủ</h1>
        
        <div className="flex flex-wrap gap-3">
          
          <div className="relative">
            <button 
              onClick={() => setIsBuildingMenuOpen(!isBuildingMenuOpen)}
              className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all min-w-[160px] justify-between"
            >
              <span className="truncate max-w-[140px]">{selectedBuildingName}</span> 
              <FiChevronDown className={`transition-transform ${isBuildingMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isBuildingMenuOpen && (
              <div className="absolute top-full mt-1 left-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                <div 
                  onClick={() => handleSelectBuilding("all")} 
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors ${selectedBuildingName === 'Tất cả toà nhà' ? 'font-bold bg-gray-50' : 'text-gray-700'}`}
                >
                  Tất cả toà nhà
                </div>
                {buildings.map((b) => (
                  <div 
                    key={b.id} 
                    onClick={() => handleSelectBuilding(b)} 
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors ${selectedBuildingName === b.building_name ? 'font-bold bg-gray-50' : 'text-gray-700'}`}
                  >
                    {b.building_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
              <FiCalendar /> {dateRangeLabel}
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsMonthOpen(!isMonthOpen)}
              className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all min-w-[120px] justify-between"
            >
              {selectedMonth} <FiChevronDown className={`transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMonthOpen && (
              <div className="absolute top-full mt-1 right-0 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {months.map((m) => (
                  <div key={m} onClick={() => handleSelectMonth(m)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="bg-gray-900 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-800 shadow-sm transition-all">
            Báo cáo
          </button>
        </div>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        
        {/* Card 1: Doanh thu */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-600">Doanh thu tạm tính</span>
            <FaDollarSign className="text-gray-400" size={14} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {loading ? "..." : formatCurrency(stats.revenue)}
          </div>
          <div className="text-xs font-medium text-green-500">
            {selectedBuildingName === "Tất cả toà nhà" ? "" : `(Tại ${selectedBuildingName})`}
          </div>
        </div>

        {/* Card 2: Tổng phòng */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-600">Tổng phòng</span>
            <FaBuilding className="text-gray-400" size={14} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {loading ? "..." : stats.totalRooms}
          </div>
        </div>

        {/* Card 3: Phòng trống */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-600">Phòng trống</span>
            <FaDoorOpen className="text-gray-400" size={14} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {loading ? "..." : stats.emptyRooms}
          </div>
          <div className="text-xs font-medium text-gray-400">
             {stats.totalRooms > 0 
                ? `Chiếm ${((stats.emptyRooms / stats.totalRooms) * 100).toFixed(0)}%`
                : "0%"}
          </div>
        </div>

        {/* Card 4: Sự cố */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-600">Tổng sự cố</span>
            <FaExclamationCircle className="text-yellow-500" size={16} />
          </div>
          <div className="flex items-baseline gap-2">
             <div className="text-2xl font-bold text-gray-900 mb-1">
                {loading ? "..." : stats.totalIssues}
             </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.pendingIssues > 0 && (
              <span className="text-orange-500 mr-2">Chờ xử lý: {stats.pendingIssues}</span>
            )}
            {stats.inProgressIssues > 0 && (
              <span className="text-blue-500">Đang xử lý: {stats.inProgressIssues}</span>
            )}
          </div>
        </div>
      </div>

      {/* --- STATS ROW 2 --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 mb-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-600">Hợp đồng sắp hết hạn</span>
            <FaFileContract className="text-gray-400" size={14} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {loading ? "..." : stats.expiringContracts}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Tổng HĐ đang hoạt động: {stats.activeContracts}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-600">Lịch hẹn chờ xác nhận</span>
            <FaCalendarAlt className="text-gray-400" size={16} />
          </div>
          <div className="text-2xl font-bold text-blue-500">
            {loading ? "..." : stats.pendingAppointments}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Các lịch hẹn đang chờ duyệt
          </div>
        </div>
      </div>

      {/* --- ACTIVITY & APPOINTMENT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">Hoạt động gần đây</h3>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {loading ? (
              <div className="text-gray-500 text-center py-4">Đang tải...</div>
            ) : dashboardData.recent_activities.length === 0 ? (
              <div className="text-gray-500 text-center py-4">Chưa có hoạt động nào</div>
            ) : (
              dashboardData.recent_activities.map((item) => (
                <div key={item.id} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-md transition-colors -mx-2">
                  <div className="flex items-center gap-4">
                    {getActivityIcon(item.type)}
                    <div>
                      <p className="text-sm font-bold text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatActivityDesc(item)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(item.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Appointment */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Hẹn xem phòng</h3>
            <FaCalendarAlt className="text-gray-400" />
          </div>
          <div className="p-5 flex flex-col gap-3">
            {loading ? (
              <div className="text-gray-500 text-center py-4">Đang tải...</div>
            ) : dashboardData.pending_appointments.length === 0 ? (
              <div className="text-gray-500 text-center py-4">Không có lịch hẹn nào</div>
            ) : (
              dashboardData.pending_appointments.map((apt) => (
                <div key={apt.id} className="bg-blue-50/50 p-3 rounded-r-md border-l-4 border-blue-500 flex justify-between items-start hover:bg-blue-100/50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-gray-800 mb-0.5">{apt.full_name}</p>
                    <p className="text-xs text-gray-500">{apt.phone}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatAppointmentTime(apt.appointment_datetime)}</p>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {apt.room_number ? `Phòng ${apt.room_number}` : 'N/A'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;