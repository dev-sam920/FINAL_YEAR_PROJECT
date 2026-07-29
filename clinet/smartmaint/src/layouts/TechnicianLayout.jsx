import { useContext, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ForcePasswordChangeModal from '../components/ForcePasswordChangeModal';
import NotificationBell from '../components/NotificationBell';
import './admin.css';

export default function TechnicianLayout({ children }) {
  const { user, logout, setUser } = useContext(AuthContext);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/technician-dashboard' },
    { label: 'My Assignments', path: '/my-assignments' },
    { label: 'Profile', path: '/technician-profile' },
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="admin-wrapper">
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
        <div style={{ fontWeight: 800, color: '#111111', fontSize: 22, marginBottom: 24 }}>SmartMaint</div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={`admin-nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {item.label}
            </NavLink>
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
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              color: '#111111',
              padding: '0.7rem 0.9rem',
              borderRadius: 9999,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Logout
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 9999, background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9999 }} />
              ) : (
                user?.fullName?.split(' ').map((name) => name[0]).slice(0, 2).join('').toUpperCase()
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{user?.fullName || 'Technician'}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{user?.email}</div>
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
