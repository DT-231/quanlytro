
import { createBrowserRouter, Outlet } from "react-router-dom"
import App from "./App";
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
import MyInvoicesPage from "./pages/member/MyInvoicesPage";

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
          { path: "my-contracts", element: <MyContractsPage /> },
          { path: "my-invoices", element: <MyInvoicesPage /> },
          { path: "incidents", element: <IssueReport /> },
          { path: "account/profile", element: <AccountProfile /> },
          { path: "account/change-password", element: <AccountChangePassword /> },
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
          { path: "contracts", element: <ContractManagement /> },
          { path: "incidents", element: <IssueManagement /> },
        ],
      },
    ],
  },
]);

export default router;