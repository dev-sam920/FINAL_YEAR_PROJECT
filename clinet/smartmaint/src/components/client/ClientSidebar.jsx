import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClientSidebar.css';
import { AuthContext } from '../../context/AuthContext';

export default function ClientSidebar({ activeNav = 'dashboard', setActiveNav }) {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  const getInitials = () => {
    const name = user?.fullName || user?.email;
    if (name) {
      return name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return loading ? '..' : 'JD';
  };

  const profileAvatarContent = () => {
    if (user?.profilePicture) {
      return <img src={user.profilePicture} alt={user.fullName || 'Profile'} />;
    }
    return getInitials();
  };

  const getDisplayName = () => {
    if (loading) return 'Loading...';
    if (user?.fullName) return user.fullName;
    if (user?.email) return user.email;
    return 'John Doe';
  };

  const formatRole = (role) => {
    if (loading) return 'Loading...';
    if (!role) return 'Client';

    const normalized = role.toLowerCase();
    if (normalized === 'tenant') return 'Tenant';
    if (normalized === 'client') return 'Client';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const handleNavClick = (navItem, route = null) => {
    if (setActiveNav) {
      setActiveNav(navItem);
    }
    if (route) {
      navigate(route);
    }
  };

  return (
    <aside className="client-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">SM</div>
        <div className="sidebar-brand-copy">
          <div className="sidebar-brand-title"></div>
          <div className="sidebar-brand-subtitle"></div>
        </div>
      </div>

      <nav className="client-sidebar-nav">
        <button
          className={`client-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard', '/client-dashboard')}
        >
          <span className="client-nav-icon">🏠</span>
          <span className="client-nav-text">Dashboard</span>
        </button>
        <button
          className={`client-nav-item ${activeNav === 'requests' ? 'active' : ''}`}
          onClick={() => handleNavClick('requests', '/my-requests')}
        >
          <span className="client-nav-icon">📋</span>
          <span className="client-nav-text">My Requests</span>
        </button>
        <button
          className={`client-nav-item ${activeNav === 'submit' ? 'active' : ''}`}
          onClick={() => handleNavClick('submit', '/submit-request')}
        >
          <span className="client-nav-icon">➕</span>
          <span className="client-nav-text">Submit Request</span>
        </button>
        <button
          className={`client-nav-item ${activeNav === 'profile' ? 'active' : ''}`}
          onClick={() => handleNavClick('profile', '/profile')}
        >
          <span className="client-nav-icon">👤</span>
          <span className="client-nav-text">Profile</span>
        </button>
        <button
          className={`client-nav-item ${activeNav === 'support' ? 'active' : ''}`}
          onClick={() => handleNavClick('support', '/support')}
        >
          <span className="client-nav-icon">❓</span>
          <span className="client-nav-text">Support</span>
        </button>
      </nav>

      <div className="client-sidebar-footer">
        <div className="client-sidebar-user">
          <div className="client-user-avatar">{profileAvatarContent()}</div>
          <div className="client-user-info">
            <div className="client-user-name">{getDisplayName()}</div>
            <div className="client-user-role">{formatRole(user?.role)}</div>
          </div>
        </div>

        <button
          className="client-sidebar-logout"
          onClick={() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole');
            navigate('/login');
          }}
        >
          <span className="client-logout-icon">🚪</span>
          <span className="client-logout-text">Logout</span>
        </button>
      </div>
    </aside>
  );
}
