// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, refreshUser } = useAuth();

  // Refresh user info khi vào protected route để đồng bộ role nếu có thay đổi
  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, []);

  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-10 text-center text-red-500">Bạn không có quyền truy cập trang này!</div>;
  }

  return children;
};

export default ProtectedRoute;