import {
  Home, Users, Building2, BedDouble, FileText, ScrollText, AlertTriangle, UserCircle,
  Search
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const adminMenu = [
  { name: "Trang chủ", icon: Home, href: "/admin/dashboard" },
  { name: "Quản lý tài khoản", icon: Users, href: "/admin/users" },
  { name: "Toà nhà", icon: Building2, href: "/admin/buildings" },
  { name: "Phòng", icon: BedDouble, href: "/admin/rooms" },
  { name: "Hoá đơn", icon: FileText, href: "/admin/invoices" },
  { name: "Hợp đồng", icon: ScrollText, href: "/admin/contracts" },
  { name: "Xử lý sự cố", icon: AlertTriangle, href: "/admin/incidents" },
];

const tenantMenu = [
  { name: "Trang chủ", icon: Home, href: "/" },
  { name: "Hồ sơ của tôi", icon: UserCircle, href: "/member/profile" },
  { name: "Hợp đồng của tôi", icon: ScrollText, href: "/member/my-contracts" },
  { name: "Hoá đơn cần đóng", icon: FileText, href: "/member/my-invoices" },
  { name: "Báo cáo sự cố", icon: AlertTriangle, href: "/member/incidents" },
];

const guestMenu = [
    { name: "Trang chủ", icon: Home, href: "/" },
]

export default function Sidebar({ role }) {
  const location = useLocation();
  
  let menuItems = guestMenu;
  if (role === 'admin') menuItems = adminMenu;
  if (role === 'user') menuItems = tenantMenu;

  return (
    <div className="w-[250px] h-full border-r bg-white py-4 flex flex-col shrink-0">
      
      {/* Label vai trò */}
      <div className="px-5 mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {role === "admin" ? "Quản trị viên" : (role === "user" ? "Người dùng" : "Khách vãng lai")}
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
                  ? "bg-black text-white shadow-sm" 
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