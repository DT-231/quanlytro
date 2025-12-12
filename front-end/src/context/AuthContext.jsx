// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Chỉ load từ localStorage 1 lần khi app khởi động
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedToken) {
        setToken(JSON.parse(storedToken));
      }
    } catch (error) {
      console.error('Error loading auth data from localStorage:', error);
      // Xóa dữ liệu lỗi
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []); // Chỉ chạy 1 lần khi mount

  const login = (userData, tokenData) => {
    // Set state ngay lập tức - không cần đợi useEffect
    setUser(JSON.parse(userData));
    setToken(JSON.parse(tokenData));
    // Lưu vào localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', JSON.stringify(tokenData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Helper function để lấy access token
  const getAccessToken = () => {
    return token?.access_token || null;
  };

  // Helper function để lấy refresh token
  const getRefreshToken = () => {
    return token?.refresh_token || null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      loading, 
      getAccessToken, 
      getRefreshToken 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}