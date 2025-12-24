import { createBrowserRouter, Outlet } from "react-router-dom";
import App from "./App";
import ProtectedRoute from "./components/ProtectedRoute";

// ================== Public Pages ==================
import HomePage from "./pages/public/HomePage";
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";
import RoomDetailPage from "./pages/public/Room/RoomDetailPage";

// ================== Admin Pages ==================
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

// ================== Member Pages ==================
import ProfilePage from "./pages/member/ProfilePage";
import ContractListPage from "./pages/member/contract/ContractListPage";
import IssueReport from "./pages/member/IssueReport";
import MyInvoicesPage from "./pages/member/invoice/MyInvoicesPage";
import MyInvoiceDetailPage from "./pages/member/invoice/MyInvoiceDetailPage";
import ContractDetailPage from "./pages/member/contract/ContractDetailPage";
import MyAppointmentPage from "./pages/member/MyAppointmentPage";

// ================== Account Pages ==================
import AccountProfile from "./pages/member/account/AccountProfile";
import AccountChangePassword from "./pages/member/account/AccountChangePassword";
import AccountChangePhone from "./pages/member/account/AccountChangePhone";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: (
      <div className="p-20 text-center text-red-500 font-bold text-2xl">
        404 - Trang không tồn tại
      </div>
    ),
    children: [
      // ================== PUBLIC ROUTES ==================
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "/room/:id", element: <RoomDetailPage /> },
      // ================== MEMBER ROUTES ==================
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
          { path: "account/profile", element: <AccountProfile /> },
          {
            path: "account/change-password",
            element: <AccountChangePassword />,
          },
          { path: "account/change-phone", element: <AccountChangePhone /> },
        ],
      },
      // ================== ADMIN ROUTES ==================
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
