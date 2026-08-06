import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClientSidebar.css';
import { AuthContext } from '../../context/AuthContext';

export default function ClientSidebar({ activeNav = 'dashboard', setActiveNav }) {
  const navigate = useNavigate();
  const { user, loading, logout } = useContext(AuthContext);

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

  const navSections = [
    {
      title: '',
      items: [
        { id: 'dashboard', label: 'Dashboard', route: '/client-dashboard', icon: '🏠' },
      ],
    },
    {
      title: 'Requests',
      items: [
        { id: 'requests', label: 'My Requests', route: '/my-requests', icon: '📋' },
        { id: 'submit', label: 'Submit Request', route: '/submit-request', icon: '➕' },
      ],
    },
    {
      title: 'Payments',
      items: [
        { id: 'payments', label: 'Payments', route: '/payments', icon: '💳' },
      ],
    },
    {
      title: 'Account',
      items: [
        { id: 'profile', label: 'Profile', route: '/profile', icon: '👤' },
        { id: 'support', label: 'Support', route: '/support', icon: '❓' },
      ],
    },
  ];

  return (
    <aside className="client-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">SM</div>
        <div className="sidebar-brand-copy">
          <div className="sidebar-brand-title">SmartMaint</div>
          <div className="sidebar-brand-subtitle">  </div>
        </div>
      </div>

      <nav className="client-sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title} className="client-nav-section">
            <div className="client-nav-section-title">{section.title}</div>
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`client-nav-item ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id, item.route)}
              >
                <span className="client-nav-icon">{item.icon}</span>
                <span className="client-nav-text">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
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
            logout();
          }}
        >
          <span className="client-logout-icon">🚪</span>
          <span className="client-logout-text">Logout</span>
        </button>
      </div>
    </aside>
  );
}
