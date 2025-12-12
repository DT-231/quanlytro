import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./context/AuthContext";

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

function App() {
  const { user, logout } = useAuth();

  const currentRole = user?.role || 'CUSTOMER';

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden">
      {/* ========== HEADER ========== */}
      <div className="h-14 border-b bg-white shrink-0 z-50">
        <Header user={user} onLogout={logout} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* ========== SIDEBAR ========== */}
        <Sidebar role={role} />

        {/* ========== MAIN CONTENT ========== */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <div className="mx-auto max-w-7xl pb-10">
              <Routes>
                {/* ===== PUBLIC ROUTES ===== */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route
                  path="/search-rooms"
                  element={<div>Tìm kiếm phòng</div>}
                />

                {/* ===== ADMIN ROUTES ===== */}
                {role === "admin" && (
                  <>
                    <Route
                      path="/admin/dashboard"
                      element={<DashboardAdmin />}
                    />
                    <Route
                      path="/admin/users"
                      element={<AccountManagement />}
                    />
                    <Route
                      path="/admin/buildings"
                      element={<BuildingManagement />}
                    />
                    <Route path="/admin/rooms" element={<RoomManagement />} />
                    <Route
                      path="/admin/invoices"
                      element={<InvoiceManagement />}
                    />
                    <Route
                      path="/admin/contracts"
                      element={<ContractManagement />}
                    />
                    <Route
                      path="/admin/incidents"
                      element={<IssueManagement />}
                    />
                  </>
                )}

                {/* ===== MEMBER ROUTES ===== */}
                {role === "user" && (
                  <>
                    <Route path="/member/profile" element={<ProfilePage />} />
                    <Route
                      path="/member/my-contracts"
                      element={<MyContractsPage />}
                    />

                    {/* Quản lý tài khoản */}
                    <Route
                      path="/member/account/profile"
                      element={<AccountProfile />}
                    />
                    <Route
                      path="/member/account/change-password"
                      element={<AccountChangePassword />}
                    />
                    <Route
                      path="/member/account/change-phone"
                      element={<AccountChangePhone />}
                    />

                    {/* Báo cáo sự cố */}
                    <Route path="/member/incidents" element={<IssueReport />} />

                    {/* Hóa đơn */}
                    <Route
                      path="/member/my-invoices"
                      element={<MyInvoicesPage />}
                    />
                  </>
                )}

                {/* ===== 404 ===== */}
                <Route
                  path="*"
                  element={<div>404 - Trang không tồn tại</div>}
                />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
