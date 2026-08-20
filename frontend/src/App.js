import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Category from './pages/Category';
import WatchDetail from './pages/WatchDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import About from './pages/About';
import Watches from './pages/Watches';
import Brands from './pages/Brands';
import Contact from './pages/Contact';
import Placeholder from './pages/Placeholder';
import Wishlist from './pages/Wishlist';
import Shipping from './pages/Shipping';
import AdminApp from './admin/AdminApp';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import ChatWidget from './components/ChatWidget';
import './App.css';

function StoreApp() {
  useEffect(() => {
    document.documentElement.classList.add('store-site');
    document.body.classList.add('store-site');

    return () => {
      document.documentElement.classList.remove('store-site');
      document.body.classList.remove('store-site');
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ScrollToTop />
        <div className="App">
          <Navigation />
          <main className="main-content" style={{ minHeight: '80vh' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/watches" element={<Watches />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/category/:categoryName" element={<Category />} />
              <Route path="/watch/:id" element={<WatchDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/faq" element={<Placeholder title="FAQ" />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>
          <Footer />
          <ChatWidget />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) {
    return <AdminApp />;
  }

  return <StoreApp />;
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
