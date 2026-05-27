import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import CustomerMenu from './pages/CustomerMenu';
import CashierDashboard from './pages/CashierDashboard';
import AdminPanel from './pages/AdminPanel';
import Cart from './pages/Cart';
import Login from './pages/Login';
import { CartProvider } from './context/CartContext';
import { authClient } from './api/client';
import { Loader2 } from 'lucide-react';
import Topbar from './components/Topbar';

const ProtectedRoute = ({ children, requireRole: _requireRole }: { children: React.ReactNode, requireRole?: 'admin' | 'kasir' }) => {
  const [authState, setAuthState] = useState<{ status: 'loading' | 'unauth' | 'auth', user?: any }>({ status: 'loading' });
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authClient.get('/get-session');
        if (response.data && response.data.session && response.data.user) {
          setAuthState({ status: 'auth', user: response.data.user });
        } else {
          setAuthState({ status: 'unauth' });
        }
      } catch (error) {
        setAuthState({ status: 'unauth' });
      }
    };
    checkAuth();
  }, [location.pathname]);

  if (authState.status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#fff4f4]"><Loader2 className="w-8 h-8 animate-spin text-[#b7120d]" /></div>;
  }

  if (authState.status === 'unauth') {
    return <Navigate to="/login" replace />;
  }

  // Allowed access to both pages for ease of use
  // if (requireRole === 'admin' && isKasir) {
  //   return <Navigate to="/kasir" replace />;
  // }
  // 
  // if (requireRole === 'kasir' && !isKasir) {
  //   return <Navigate to="/admin" replace />;
  // }

  return <>{children}</>;
};

function AppContent() {
  const location = useLocation();
  const isStaffPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/kasir');
  const isCustomerMenuPage = location.pathname.startsWith('/menu') || location.pathname.startsWith('/meja');
  const isCartPage = location.pathname === '/keranjang';
  
  return (
    <>
      {/* Staff topbar */}
      {isStaffPage && <Topbar variant="staff" />}

      {/* Slim customer topbar for menu & cart */}
      {(isCustomerMenuPage || isCartPage) && <Topbar variant="customer" />}

      <div className={isStaffPage ? 'pt-16' : (isCustomerMenuPage || isCartPage) ? 'pt-14' : ''}>
        <Routes>
          {/* Customer Routes — no table picker; goes directly to menu */}
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/menu" element={<CustomerMenu />} />
          <Route path="/meja/:id" element={<CustomerMenu />} />
          <Route path="/keranjang" element={<Cart />} />
          
          {/* Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/kasir" element={
            <ProtectedRoute requireRole="kasir">
              <CashierDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </Router>
  );
}

export default App;


