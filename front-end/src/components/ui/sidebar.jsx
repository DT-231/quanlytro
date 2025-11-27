import {
  Home,
  Users,
  Building2,
  BedDouble,
  FileText,
  ScrollText,
  AlertTriangle,
  UserCircle // Thêm icon cho profile người thuê
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

// 1. Cấu hình Menu cho ADMIN (Quản lý toàn bộ)
const adminMenu = [
  { name: "Trang chủ", icon: Home, href: "/" },
  { name: "Quản lý tài khoản", icon: Users, href: "/account" },
  { name: "Toà nhà", icon: Building2, href: "/building" },
  { name: "Phòng", icon: BedDouble, href: "/rooms" },
  { name: "Hoá đơn", icon: FileText, href: "/invoice" },
  { name: "Hợp đồng", icon: ScrollText, href: "/contract" },
  { name: "Xử lý sự cố", icon: AlertTriangle, href: "/incident" },
];

// 2. Cấu hình Menu cho NGƯỜI THUÊ (Chỉ xem cái của họ)
const tenantMenu = [
  { name: "Trang chủ", icon: Home, href: "/" },
  { name: "Hồ sơ của tôi", icon: UserCircle, href: "/profile" }, // VD: Route mới
  { name: "Hợp đồng của tôi", icon: ScrollText, href: "/my-contract" },
  { name: "Hoá đơn cần đóng", icon: FileText, href: "/my-invoice" },
  { name: "Báo cáo sự cố", icon: AlertTriangle, href: "/report-incident" },
];

// 3. Component Sidebar nhận prop 'role'
export default function Sidebar({ role = "admin" }) { // Mặc định là admin nếu không truyền
  const location = useLocation();

  // Logic chọn menu dựa trên role
  const menuItems = role === "admin" ? adminMenu : tenantMenu;

  return (
    <div className="w-[220px] h-screen border-r bg-white py-4 flex flex-col transition-all duration-300">
      
      {/* Label hiển thị vai trò hiện tại (Optional - để dễ debug) */}
      <div className="px-5 mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {role === "admin" ? "Quản trị viên" : "Người dùng"}
      </div>

      {/* MENU */}
      <nav className="flex flex-col gap-1 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition font-medium",
                active
                  ? "bg-black text-white shadow-sm" // Shadcn style active
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}