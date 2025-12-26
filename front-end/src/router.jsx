/**
 * Router Configuration - Cấu hình routing cho ứng dụng
 *
 * Cấu trúc routes:
 * - PUBLIC: Trang công khai (HomePage, Login, Register, Room Detail)
 * - MEMBER: Trang cho user đã đăng nhập (Profile, Contracts, Invoices)
 * - ADMIN: Trang quản trị (Dashboard, Users, Buildings, Rooms, etc.)
 *
 * Sử dụng ProtectedRoute để kiểm tra quyền truy cập
 */
import { createBrowserRouter, Outlet } from "react-router-dom";
import App from "./App";
import ProtectedRoute from "./components/ProtectedRoute";

// ==================================================================================
// PUBLIC PAGES - Trang công khai, không cần đăng nhập
// ==================================================================================
import HomePage from "./pages/public/HomePage";
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";
import RoomDetailPage from "./pages/public/Room/RoomDetailPage";
import MyAppointmentsPage from "./pages/public/MyAppointmentsPage";

// ==================================================================================
// ADMIN PAGES - Trang quản trị, yêu cầu role ADMIN
// ==================================================================================
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import AccountManagement from "./pages/admin/AccountManagement";
import InvoiceManagement from "./pages/admin/Invoice/InvoiceManagement";
import BuildingManagement from "./pages/admin/BuildingManagement";
import RoomManagement from "./pages/admin/RoomManagement";
import ContractManagement from "./pages/admin/ContractManagement";
import ContractDetailPageAdmin from "./pages/admin/ContractDetailPage";
import IssueManagement from "./pages/admin/IssueManagement";
import InvoiceDetailPage from "./pages/admin/Invoice/InvoiceDetailPage";
import AppointmentManagementPage from "./pages/admin/AppointmentManagementPage";

// ==================================================================================
// MEMBER PAGES - Trang cho user đã đăng nhập (TENANT, CUSTOMER)
// ==================================================================================
import ProfilePage from "./pages/member/ProfilePage";
import ContractListPage from "./pages/member/contract/ContractListPage";
import IssueReport from "./pages/member/IssueReport";
import MyInvoicesPage from "./pages/member/invoice/MyInvoicesPage";
import MyInvoiceDetailPage from "./pages/member/invoice/MyInvoiceDetailPage";
import ContractDetailPage from "./pages/member/contract/ContractDetailPage";
import MyAppointmentPage from "./pages/member/MyAppointmentPage";

// Payment Pages
import PaymentSuccessPage from "./pages/payment/PaymentSuccessPage";

// Account Settings
import AccountProfile from "./pages/member/account/AccountProfile";
import AccountChangePassword from "./pages/member/account/AccountChangePassword";
import AccountChangePhone from "./pages/member/account/AccountChangePhone";

// ==================================================================================
// ROUTER CONFIGURATION
// ==================================================================================

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    // Error boundary cho 404 và các lỗi khác
    errorElement: (
      <div className="p-20 text-center text-red-500 font-bold text-2xl">
        404 - Trang không tồn tại
      </div>
    ),
    children: [
      // --- PUBLIC ROUTES: Không cần đăng nhập ---
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "/room/:id", element: <RoomDetailPage /> },
      { path: "my-appointments", element: <MyAppointmentsPage /> },
      
      // Payment callback
      { path: "payment/success", element: <PaymentSuccessPage /> },
      
      // --- MEMBER ROUTES: Yêu cầu đăng nhập (TENANT, CUSTOMER) ---
      {
        path: "member",
        element: (
          <ProtectedRoute allowedRoles={["user", "TENANT", "CUSTOMER"]}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ProfilePage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "my-contracts", element: <ContractListPage /> },
          { path: "my-contracts/:id", element: <ContractDetailPage /> },
          { path: "my-invoices", element: <MyInvoicesPage /> },
          { path: "my-invoices/:id", element: <MyInvoiceDetailPage /> },
          { path: "my-appointments", element: <MyAppointmentPage /> },
          { path: "incidents", element: <IssueReport /> },
          // Account settings
          { path: "account/profile", element: <AccountProfile /> },
          { path: "account/change-password", element: <AccountChangePassword /> },
          { path: "account/change-phone", element: <AccountChangePhone /> },
        ],
      },
      
      // --- ADMIN ROUTES: Yêu cầu role ADMIN ---
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <DashboardAdmin /> },
          { path: "dashboard", element: <DashboardAdmin /> },
          { path: "users", element: <AccountManagement /> },
          { path: "buildings", element: <BuildingManagement /> },
          { path: "rooms", element: <RoomManagement /> },
          { path: "invoices", element: <InvoiceManagement /> },
          { path: "invoices/:id", element: <InvoiceDetailPage /> },
          { path: "contracts", element: <ContractManagement /> },
          { path: "contracts/:id", element: <ContractDetailPageAdmin /> },
          { path: "incidents", element: <IssueManagement /> },
          { path: "appointments", element: <AppointmentManagementPage /> },
        ],
      },
    ],
  },
]);

export default router;
