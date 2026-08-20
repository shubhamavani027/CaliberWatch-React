import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from sessionStorage on mount (clears on browser close)
  useEffect(() => {
    // Clean up legacy persistent auth keys (previously stored in localStorage)
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    const userData = sessionStorage.getItem('user');

    if (userData) setUser(JSON.parse(userData));
    setLoading(false);
  }, []);

  const loginUser = (userData, token) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    localStorage.removeItem('cart');
    localStorage.setItem('cartCount', '0');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(patch || {}) };
      sessionStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
