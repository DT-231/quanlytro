import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

const MemberLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <div className="h-14 border-b bg-white shrink-0 z-50">
         <Header user={user} onLogout={logout} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="user" />

        <main className="flex-1 overflow-y-auto p-6">
           <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MemberLayout;