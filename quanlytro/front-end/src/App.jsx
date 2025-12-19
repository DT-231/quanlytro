import { Outlet, useLocation } from "react-router-dom";
import { Toaster, toast } from "sonner";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const hideSidebarPaths = ["login", "register", "forgot-password"];
  const shouldShowSidebar = !hideSidebarPaths.includes(location.pathname);

  const isGuest = !user || !user.role;
  const sidebarRoleDisplay = isGuest ? 'TENANT' : user.role;

  const handleSidebarClick = (e) => {e
    if (!isGuest) return;
    const link = e.target.closest('a');
    
    if (link) {
      const href = link.getAttribute('href');
      if (href !== '/') {
        e.preventDefault();
        e.stopPropagation(); 
        toast.warning("Yêu cầu đăng nhập", {
          description: "Vui lòng đăng nhập để sử dụng tính năng này!",
          duration: 1000,
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden">
      <Toaster position="top-right" richColors />

      <div className="h-14 border-b bg-white shrink-0 z-50">
        <Header user={user} onLogout={logout} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {shouldShowSidebar && (
          <div onClickCapture={handleSidebarClick} className="h-full">
            <Sidebar role={sidebarRoleDisplay} isGuest={isGuest} />
          </div>
        )}
        
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <div className="mx-auto max-w-7xl pb-10">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;