import { useContext, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, CreditCard, User, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ForcePasswordChangeModal from '../components/ForcePasswordChangeModal';
import NotificationBell from '../components/NotificationBell';
import './admin.css';

export default function TechnicianLayout({ children }) {
  const { user, logout, setUser } = useContext(AuthContext);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navSections = [
    {
      title: 'General',
      items: [
        { label: 'Dashboard', path: '/technician-dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'My Assignments', path: '/my-assignments', icon: <ClipboardList size={18} /> },
      ],
    },
    {
      title: 'Payments',
      items: [
        { label: 'Withdraw', path: '/technician/withdraw', icon: <CreditCard size={18} /> },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Profile', path: '/technician-profile', icon: <User size={18} /> },
      ],
    },
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="admin-wrapper technician-layout">
      <div className="admin-topbar">
        <div className="admin-topbar-title">SmartMaint</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NotificationBell />
          <button type="button" className="admin-hamburger" onClick={() => setMobileMenuOpen((prev) => !prev)} aria-label="Toggle navigation">
            ☰
          </button>
        </div>
      </div>

      {mobileMenuOpen && <div className="admin-mobile-backdrop" onClick={closeMenu} />}

      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark">SM</div>
          <div>
            <div className="admin-brand-title">SmartMaint</div>
            <div className="admin-brand-subtitle">Technician portal</div>
          </div>
        </div>
        <nav className="admin-nav">
          {navSections.map((section) => (
            <div key={section.title} className="admin-nav-section">
              <div className="admin-nav-section-title">{section.title}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`admin-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', color: 'inherit' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              closeMenu();
              logout();
            }}
            style={{
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              padding: '0.7rem 0.9rem',
              borderRadius: 9999,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Logout
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 9999, background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9999 }} />
              ) : (
                user?.fullName?.split(' ').map((name) => name[0]).slice(0, 2).join('').toUpperCase()
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff' }}>{user?.fullName || 'Technician'}</div>
              <div style={{ fontSize: 12, color: '#9fb0d8' }}>{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>
      <main className="admin-main-content">
        <div className="admin-page-shell">{children}</div>
      </main>
      <ForcePasswordChangeModal user={user} onUpdated={(updatedUser) => setUser(updatedUser)} />
    </div>
  );
}
