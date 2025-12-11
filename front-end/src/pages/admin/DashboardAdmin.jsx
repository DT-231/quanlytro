import React, { useState, useEffect, useMemo } from "react";
import { 
  FaDollarSign, 
  FaBuilding, 
  FaExclamationCircle, 
  FaDoorOpen,
  FaFileContract, 
  FaUserFriends, 
  FaFileInvoiceDollar, 
  FaFileSignature, 
  FaWrench,
  FaCalendarAlt 
} from "react-icons/fa";
import { FiChevronDown, FiCalendar } from "react-icons/fi";

// --- 1. IMPORT SERVICE (Lấy dữ liệu thật) ---
import { roomService } from "@/services/roomService"; 
import { buildingService } from "@/services/buildingService"; // SỬA: Import thêm buildingService

const Dashboard = () => {
  // ==================================================================================
  // 1. STATE QUẢN LÝ DỮ LIỆU
  // ==================================================================================
  
  const [rooms, setRooms] = useState([]); 
  const [buildings, setBuildings] = useState([]); // SỬA: State lưu danh sách tòa nhà
  const [loading, setLoading] = useState(true);

  // SỬA: State lọc theo TÊN tòa nhà (Khớp logic trang Quản lý phòng)
  const [selectedBuildingName, setSelectedBuildingName] = useState("Tất cả toà nhà");
  const [isBuildingMenuOpen, setIsBuildingMenuOpen] = useState(false);

  // Dữ liệu Sự cố (Mock)
  const [issues, setIssues] = useState([
    { id: 101, status: "Chưa xử lý" },
    { id: 110, status: "Đã xử lý" },
    { id: 430, status: "Đang xử lý" },
    { id: 603, status: "Chưa xử lý" }, 
  ]);

  // State dropdown tháng
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("Tháng 10");
  const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  // ==================================================================================
  // 2. FETCH DATA TỪ API
  // ==================================================================================
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // SỬA: Gọi song song API Room và Building
        const [roomRes, buildRes] = await Promise.all([
          roomService.getAll(),
          buildingService.getAll()
        ]);

        if (roomRes?.data?.items) setRooms(roomRes.data.items);
        if (buildRes?.data?.items) setBuildings(buildRes.data.items);

      } catch (error) {
        console.error("Lỗi tải dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ==================================================================================
  // 3. LOGIC LỌC & TÍNH TOÁN (ĐÃ SỬA LỖI HIỂN THỊ SỐ 0)
  // ==================================================================================

  // Bước 1: Lọc danh sách phòng theo TÊN TÒA NHÀ
  const filteredRooms = useMemo(() => {
    if (selectedBuildingName === "Tất cả toà nhà") return rooms;
    return rooms.filter(r => r.building_name === selectedBuildingName);
  }, [rooms, selectedBuildingName]);
  const stats = useMemo(() => {
    const totalRooms = filteredRooms.length;
    const emptyRooms = filteredRooms.filter(r => 
      r.status === "AVAILABLE" || r.status === "Trống" || r.status === "Còn trống"
    ).length;

    const totalIssues = issues.length;
    const occupiedRooms = filteredRooms.filter(r => 
      r.status === "OCCUPIED" || r.status === "Đang thuê" || r.status === "Đã thuê"
    );

    const revenue = occupiedRooms.reduce((sum, room) => {
      let price = room.base_price || 0;
      if (typeof price === 'string') {
         price = parseFloat(price.replace(/[^0-9.-]+/g,"")); 
      }
      return sum + Number(price);
    }, 0);

    return {
      revenue,
      revenueTrend: 12.5, 
      totalRooms,
      emptyRooms,
      emptyTrend: -5,
      totalIssues,
      expiringContracts: 0, 
      unregisteredTemp: 0,
    };
  }, [filteredRooms, issues]);

  // Helper format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const handleSelectMonth = (month) => {
    setSelectedMonth(month);
    setIsMonthOpen(false);
  };

  const handleSelectBuilding = (name) => {
    setSelectedBuildingName(name);
    setIsBuildingMenuOpen(false);
  };

  const dateRangeLabel = useMemo(() => {
    const today = new Date();
    const nextMonthDate = new Date(today);
    nextMonthDate.setMonth(today.getMonth() + 1);
    const format = (d) => `${d.getMonth() + 1}/${d.getFullYear()}`;
    return `${format(today)} - ${format(nextMonthDate)}`;
  }, []);

  // --- Mock Data ---
  const recentActivities = [
    { id: 1, type: "payment", title: "Thanh toán hóa đơn", desc: "Nguyễn Văn A - Phòng 101 - 5,000,000đ", time: "5 phút trước" },
    { id: 2, type: "contract", title: "Hợp đồng mới", desc: "Trần Thị B ký hợp đồng Phòng 205", time: "10 phút trước" },
    { id: 3, type: "issue", title: "Yêu cầu sửa chữa", desc: "Lê Văn C - Phòng 303 - Điều hòa hỏng", time: "30 phút trước" },
  ];

  const appointments = [
    { id: 1, name: "Nguyễn thanh tú", phone: "0934970856", time: "14:00 05/11/2025", room: "Phòng 101" },
    { id: 2, name: "Nguyễn Toàn chung", phone: "0934970856", time: "14:00 05/11/2025", room: "Phòng 205" },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "payment": return <div className="p-3 rounded-lg bg-green-100 text-green-600"><FaFileInvoiceDollar size={20} /></div>;
      case "contract": return <div className="p-3 rounded-lg bg-blue-100 text-blue-600"><FaFileSignature size={20} /></div>;
      case "issue": return <div className="p-3 rounded-lg bg-orange-100 text-orange-600"><FaWrench size={20} /></div>;
      default: return null;
    }
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
                  onClick={() => handleSelectBuilding("Tất cả toà nhà")} 
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors ${selectedBuildingName === 'Tất cả toà nhà' ? 'font-bold bg-gray-50' : 'text-gray-700'}`}
                >
                  Tất cả toà nhà
                </div>
                {buildings.map((b) => (
                  <div 
                    key={b.id} 
                    onClick={() => handleSelectBuilding(b.building_name)} 
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
                {stats.totalIssues}
             </div>
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
            {stats.expiringContracts}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-600">Chưa đăng ký tạm trú</span>
            <FaUserFriends className="text-gray-400" size={16} />
          </div>
          <div className="text-2xl font-bold text-green-500">
            {stats.unregisteredTemp}
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
            {recentActivities.map((item) => (
              <div key={item.id} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-md transition-colors -mx-2">
                <div className="flex items-center gap-4">
                  {getActivityIcon(item.type)}
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Hẹn xem phòng</h3>
            <FaCalendarAlt className="text-gray-400" />
          </div>
          <div className="p-5 flex flex-col gap-3">
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-blue-50/50 p-3 rounded-r-md border-l-4 border-blue-500 flex justify-between items-start hover:bg-blue-100/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-0.5">{apt.name}</p>
                  <p className="text-xs text-gray-500">{apt.phone}</p>
                  <p className="text-xs text-gray-400 mt-1">{apt.time}</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {apt.room}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;