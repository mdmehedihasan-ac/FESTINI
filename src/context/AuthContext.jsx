import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('festini_admin_token') || null);
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem('festini_admin_email') || null);

  const isAuthenticated = Boolean(token);

  function login(newToken, email) {
    setToken(newToken);
    setAdminEmail(email);
    localStorage.setItem('festini_admin_token', newToken);
    localStorage.setItem('festini_admin_email', email);
  }

  function logout() {
    setToken(null);
    setAdminEmail(null);
    localStorage.removeItem('festini_admin_token');
    localStorage.removeItem('festini_admin_email');
  }

  return (
    <AuthContext.Provider value={{ token, adminEmail, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
