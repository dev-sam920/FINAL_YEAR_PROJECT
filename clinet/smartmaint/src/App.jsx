import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import ClientDashboard from './pages/ClientDashboard';
import SubmitRequest from './pages/client/SubmitRequest';
import Profile from './pages/client/Profile';
import CompleteProfile from './pages/client/CompleteProfile';
import Support from './pages/client/Support';
import MyRequests from './pages/client/MyRequests';
import PaymentCallback from './pages/client/PaymentCallback';
import Payments from './pages/client/Payments';
import ClientLayout from './layouts/ClientLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ClientProtectedRoute from './components/ClientProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider, useLoading } from './context/LoadingContext.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Analytics from './pages/admin/Analytics';
import AllRequests from './pages/admin/AllRequests';
import SupportTicketsAdmin from './pages/admin/SupportTickets';
import PaymentsAdmin from './pages/admin/Payments';
import Technicians from './pages/admin/Technicians';
import Clients from './pages/admin/Clients';
import TechnicianLayout from './layouts/TechnicianLayout';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import MyAssignments from './pages/technician/MyAssignments';
import TechnicianWithdraw from './pages/technician/TechnicianWithdraw';
import TechnicianProfile from './pages/technician/Profile';

const App = () => {
  return (
    <Router>
      <LoadingProvider>
        <AuthProvider>
          <SplashController />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/client-dashboard"
            element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <ClientDashboard />
                </ClientLayout>
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/submit-request"
            element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <SubmitRequest />
                </ClientLayout>
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/my-requests"
            element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <MyRequests />
                </ClientLayout>
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <Payments />
                </ClientLayout>
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <Profile />
                </ClientLayout>
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <Support />
                </ClientLayout>
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/client/complete-profile"
            element={
              <ClientProtectedRoute allowIncomplete>
                <CompleteProfile />
              </ClientProtectedRoute>
            }
          />
          <Route path="/payment-callback" element={<PaymentCallback />} />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician-dashboard"
            element={
              <ProtectedRoute roles={["technician"]}>
                <TechnicianLayout>
                  <TechnicianDashboard />
                </TechnicianLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-assignments"
            element={
              <ProtectedRoute roles={["technician"]}>
                <TechnicianLayout>
                  <MyAssignments />
                </TechnicianLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician/withdraw"
            element={
              <ProtectedRoute roles={["technician"]}>
                <TechnicianLayout>
                  <TechnicianWithdraw />
                </TechnicianLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician-profile"
            element={
              <ProtectedRoute roles={["technician"]}>
                <TechnicianLayout>
                  <TechnicianProfile />
                </TechnicianLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminLayout>
                  <AllRequests />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminLayout>
                  <Analytics />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/support-tickets"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminLayout>
                  <SupportTicketsAdmin />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminLayout>
                  <PaymentsAdmin />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/technicians"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminLayout>
                  <Technicians />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clients"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminLayout>
                  <Clients />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </AuthProvider>
      </LoadingProvider>
    </Router>
  );
};

export default App;

function SplashController() {
  const { showSplash } = useLoading();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // When `showSplash` becomes true, show the splash and ensure it hides after 3s.
    if (showSplash) {
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        timerRef.current = null;
      }, 3000);
    } else {
      // If navigation finished before the timeout, keep the timer to let
      // the 3s minimum elapse. If no timer exists, hide immediately.
      if (!timerRef.current) setVisible(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showSplash]);

  if (!visible) return null;
  return <SplashScreen />;
}
