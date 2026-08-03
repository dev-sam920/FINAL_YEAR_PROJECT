import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import ClientDashboard from './pages/ClientDashboard';
import SubmitRequest from './pages/client/SubmitRequest';
import Profile from './pages/client/Profile';
import Support from './pages/client/Support';
import MyRequests from './pages/client/MyRequests';
import PaymentCallback from './pages/client/PaymentCallback';
import ClientLayout from './layouts/ClientLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AllRequests from './pages/admin/AllRequests';
import Technicians from './pages/admin/Technicians';
import Clients from './pages/admin/Clients';
import TechnicianLayout from './layouts/TechnicianLayout';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import MyAssignments from './pages/technician/MyAssignments';
import TechnicianProfile from './pages/technician/Profile';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/client-dashboard"
            element={
              <ProtectedRoute>
                <ClientLayout>
                  <ClientDashboard />
                </ClientLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-request"
            element={
              <ProtectedRoute>
                <ClientLayout>
                  <SubmitRequest />
                </ClientLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute>
                <ClientLayout>
                  <MyRequests />
                </ClientLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ClientLayout>
                  <Profile />
                </ClientLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <ClientLayout>
                  <Support />
                </ClientLayout>
              </ProtectedRoute>
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
    </Router>
  );
};

export default App;
