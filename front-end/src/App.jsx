import { Outlet } from "react-router-dom"; 
import Header from "./components/Header";
import Sidebar from "./components/Sidebar"; 
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, logout } = useAuth();
  const currentRole = user ? user.role : 'guest';

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden">
      <div className="h-14 border-b bg-white shrink-0 z-50">
         <Header user={user} onLogout={logout} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={currentRole} />
        <main className="flex-1 flex flex-col relative overflow-hidden">
           <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              <div className="mx-auto max-w-7xl pb-10">
                 <Outlet /> 
              </div>
           </div>
        </main>
      </div>
    </div>
  )
}

export default App;