import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (!storedUser || !storedToken) {
        setLoading(false);
        return; 
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        const parsedToken = JSON.parse(storedToken);
        if (parsedUser && parsedToken) {
          setUser(parsedUser);
          setToken(parsedToken);
        }
      } catch (error) {
        console.warn('Phát hiện dữ liệu đăng nhập lỗi, tiến hành reset session.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []); 

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', JSON.stringify(tokenData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/'; 
  };

  const getAccessToken = () => token?.access_token || null;
  const getRefreshToken = () => token?.refresh_token || null;

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