import React, { useState, useMemo } from 'react';
import { FaSearch, FaEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';
import { FiFilter } from 'react-icons/fi';

// Import Component Modal
import AddTenantModal from '@/components/modals/AddTenantModal';

const AccountManagement = () => {
  // 1. Mock Data
  const mockTenants = [
    { id: 101, name: 'Phan Mạnh Quỳnh', phone: '0256662848', email: 'nguyen@gmail.com', gender: 'Nam', hometown: 'Lâm Đồng', status: 'Chưa thuê' },
    { id: 110, name: 'Lâm Minh Phú', phone: '0575998517', email: 'lehoanganh@gmail.com', gender: 'Nữ', hometown: 'Đà Nẵng', status: 'Đang thuê' },
    { id: 220, name: 'Lý Thành Ân', phone: '0258551415', email: 'tranducminh@gmail.com', gender: 'Nữ', hometown: 'Hà Nội', status: 'Đang thuê' },
    { id: 430, name: 'Đinh Bảo Toàn', phone: '0585542584', email: 'kimphuong97@gmail.com', gender: 'Nam', hometown: 'Quảng Nam', status: 'Chưa có giấy tờ' },
    { id: 550, name: 'Nguyễn Việt Dũng', phone: '0845228547', email: 'hoanglong@gmail.com', gender: 'Nam', hometown: 'Phú Yên', status: 'Đang thuê' },
  ];

  // 2. States
  const [tenants, setTenants] = useState(mockTenants);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // --- STATES CHO TÌM KIẾM & LỌC ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // "" = Tất cả
  const [filterGender, setFilterGender] = useState(""); // "" = Tất cả

  // 3. Logic Lọc dữ liệu (Sử dụng useMemo để tối ưu hiệu năng)
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      // a. Lọc theo từ khóa (Tên, SĐT, Quê quán)
      const matchesSearch = 
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.phone.includes(searchTerm) ||
        tenant.hometown.toLowerCase().includes(searchTerm.toLowerCase());

      // b. Lọc theo Trạng thái
      const matchesStatus = filterStatus ? tenant.status === filterStatus : true;

      // c. Lọc theo Giới tính
      const matchesGender = filterGender ? tenant.gender === filterGender : true;

      return matchesSearch && matchesStatus && matchesGender;
    });
  }, [tenants, searchTerm, filterStatus, filterGender]);

  // 4. Hàm xử lý thêm khách mới
  const handleAddTenant = (newTenant) => {
    const newId = Math.floor(Math.random() * 1000) + 1000;
    const tenantToAdd = {
        id: newId,
        name: newTenant.fullName,
        phone: newTenant.phone,
        email: newTenant.email || 'Chưa cập nhật',
        gender: newTenant.gender || 'Khác',
        hometown: newTenant.hometown || 'Chưa cập nhật',
        status: 'Chưa thuê' 
    };
    setTenants([...tenants, tenantToAdd]);
    alert("Thêm khách thuê thành công!");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Chưa thuê': return 'bg-red-500 text-white';
      case 'Đang thuê': return 'bg-green-500 text-white';
      case 'Chưa có giấy tờ': return 'bg-yellow-400 text-gray-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
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
            
            {/* Search Input */}
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
                {/* Nút Tìm (Thực ra ko cần vì input onChange đã lọc realtime rồi) */}
                <button className="ml-2 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-800">Tìm</button>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex gap-2 w-full md:w-auto justify-end">
                {/* Lọc Trạng Thái */}
                <div className="relative">
                    <select 
                        className="appearance-none border px-2 py-1.5 pr-8 rounded-md bg-white hover:bg-gray-50 text-xs focus:outline-none cursor-pointer"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">Trạng thái</option>
                        <option value="Đang thuê">Đang thuê</option>
                        <option value="Chưa thuê">Chưa thuê</option>
                        <option value="Chưa có giấy tờ">Chưa có giấy tờ</option>
                    </select>
                    <FiFilter className="absolute right-2 top-2 text-gray-400 w-3 h-3 pointer-events-none" />
                </div>

                {/* Lọc Giới Tính */}
                <div className="relative">
                    <select 
                        className="appearance-none border px-3 py-1.5 pr-8 rounded-md bg-white hover:bg-gray-50 text-xs focus:outline-none cursor-pointer"
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                    >
                        <option value="">Giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                    </select>
                    <FiFilter className="absolute right-2 top-2 text-gray-400 w-3 h-3 pointer-events-none" />
                </div>
            </div>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { title: 'Tổng người thuê', value: tenants.length },
          { title: 'Đang Thuê', value: tenants.filter(t => t.status === 'Đang thuê').length },
          { title: 'Đã trả phòng', value: tenants.filter(t => t.status === 'Đã trả phòng').length }, 
          { title: 'Chưa thuê', value: tenants.filter(t => t.status === 'Chưa thuê').length },
        ].map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table (Hiển thị danh sách ĐÃ LỌC - filteredTenants) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800">Danh sách khách thuê</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white  text-xs font-bold border-b border-gray-200 uppercase">
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
              {/* SỬ DỤNG filteredTenants THAY VÌ tenants */}
              {filteredTenants.length > 0 ? (
                filteredTenants.map((tenant) => (
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
                        <button className="p-1.5 border rounded hover:bg-gray-100 text-gray-600"><FaEdit size={12} /></button>
                        <button className="p-1.5 border rounded hover:bg-red-50 text-red-500"><FaTrashAlt size={12} /></button>
                    </td>
                    </tr>
                ))
              ) : (
                  <tr>
                      <td colSpan="8" className="p-6 text-center text-gray-500">Không tìm thấy kết quả phù hợp</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 flex justify-end gap-2 text-xs border-t text-gray-500">
           <span>Hiển thị {filteredTenants.length} kết quả</span>
        </div>
      </div>

      <AddTenantModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAddSuccess={handleAddTenant}
      />

    </div>
  );
};

export default AccountManagement;