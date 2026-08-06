import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const getFallbackPath = (role) => {
  if (role === 'admin') return '/admin-dashboard';
  if (role === 'technician') return '/technician-dashboard';
  return '/login';
};

export default function ClientProtectedRoute({ children, allowIncomplete = false }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: '#F5F5F5',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: 'var(--sm-accent)', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
          <p style={{ margin: 0, color: '#4B5563' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'client') {
    return <Navigate to={getFallbackPath(user.role)} replace />;
  }

  if (!allowIncomplete && !user.profileCompleted) {
    return <Navigate to="/client/complete-profile" replace />;
  }

  return children;
}
