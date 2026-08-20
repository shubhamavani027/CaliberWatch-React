import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import WatchesPage from './pages/WatchesPage';
import OrderPage from './pages/OrderPage';
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { AuthProvider } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import './admin-shell.css';

function AdminApp() {
  useEffect(() => {
    document.body.classList.add('dark-mode');
    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, []);

  return (
    <AuthProvider>
      <ScrollToTop />
      <div className="admin-shell">
        <Navigation />
        <main className="admin-main-content">
          <Routes>
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/watches" element={<WatchesPage />} />
            <Route path="/admin/order" element={<OrderPage />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default AdminApp;
