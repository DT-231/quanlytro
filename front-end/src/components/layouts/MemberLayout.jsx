import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

const MemberLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
           <Outlet />
        </main>
      </div>
  );
};

export default MemberLayout;