import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clean up legacy persistent auth keys (previously stored in localStorage)
    localStorage.removeItem('admin');
    localStorage.removeItem('adminToken');

    const adminData = sessionStorage.getItem('admin');
    const adminToken = sessionStorage.getItem('adminToken');

    if (adminData && adminToken) {
      try {
        setAdmin(JSON.parse(adminData));
      } catch {
        sessionStorage.removeItem('admin');
        sessionStorage.removeItem('adminToken');
      }
    }
    setLoading(false);
  }, []);

  const loginAdmin = (adminData, token) => {
    setAdmin(adminData);
    sessionStorage.setItem('admin', JSON.stringify(adminData));
    sessionStorage.setItem('adminToken', token);
  };

  const logout = () => {
    setAdmin(null);
    sessionStorage.removeItem('admin');
    sessionStorage.removeItem('adminToken');
  };

  return (
    <AuthContext.Provider value={{ admin, loginAdmin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
