import { createBrowserRouter } from "react-router-dom";


import App from "./App";
import AdminLayout from "./components/layouts/AdminLayout";
import MemberLayout from "./components/layouts/MemberLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// ================== Public Pages ==================
import HomePage from "./pages/public/HomePage";
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";

// ================== Admin Pages ==================
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import AccountManagement from "./pages/admin/AccountManagement";
import InvoiceManagement from "./pages/admin/InvoiceManagement";
import BuildingManagement from "./pages/admin/BuildingManagement";
import RoomManagement from "./pages/admin/RoomManagement";
import ContractManagement from "./pages/admin/ContractManagement";
import IssueManagement from "./pages/admin/IssueManagement";

// ================== Member Pages ==================
import ProfilePage from "./pages/member/ProfilePage";
import MyContractsPage from "./pages/member/MyContractsPage";
import IssueReport from "./pages/member/IssueReport";
import MyInvoicesPage from "./pages/member/MyInvoicesPage"; // ✅ mới thêm

// ================== Account Pages ==================
import AccountProfile from "./pages/member/account/AccountProfile";
import AccountChangePassword from "./pages/member/account/AccountChangePassword";
import AccountChangePhone from "./pages/member/account/AccountChangePhone";

// ================== Router Config ==================
const router = createBrowserRouter([
  // ----- PUBLIC ROUTES -----
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      {
        path: "search-rooms",
        element: (
          <div className="p-10 text-center">
            Trang Tìm kiếm phòng (Đang phát triển)
          </div>
        ),
      },
    ],
  },

  // ----- MEMBER ROUTES -----
  {
    path: "/member",
    element: (
      <ProtectedRoute allowedRoles={["user"]}>
        <MemberLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <ProfilePage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "my-contracts", element: <MyContractsPage /> },

      // Quản lý tài khoản
      { path: "account/profile", element: <AccountProfile /> },
      { path: "account/change-password", element: <AccountChangePassword /> },
      { path: "account/change-phone", element: <AccountChangePhone /> },

      // Hóa đơn & sự cố
      { path: "my-invoices", element: <MyInvoicesPage /> }, // ✅ thay div bằng component
      { path: "incidents", element: <IssueReport /> },
    ],
  },

  // ----- ADMIN ROUTES -----
  {
    path: "/admin",
    element: <ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardAdmin /> },
      { path: "dashboard", element: <DashboardAdmin /> },
      { path: "users", element: <AccountManagement /> },
      { path: "buildings", element: <BuildingManagement /> },
      { path: "rooms", element: <RoomManagement /> },
      { path: "invoices", element: <InvoiceManagement /> },
      { path: "contracts", element: <ContractManagement /> },
      { path: "incidents", element: <IssueManagement /> },
    ]
  },

  // ----- 404 -----
  {
    path: "*",
    element: (
      <div className="p-20 text-center text-red-500 font-bold text-2xl">
        404 - Trang không tồn tại
      </div>
    ),
  },
]);

export default router;
