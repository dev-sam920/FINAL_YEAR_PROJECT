import { NavLink, useLocation } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import './admin.css';

const pathToNav = {
  '/admin-dashboard': 'dashboard',
  '/admin/requests': 'requests',
  '/admin/technicians': 'technicians',
  '/admin/clients': 'clients',
};

export default function AdminLayout({ children }) {
  const { pathname } = useLocation();
  const { user } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const normalized = pathname.replace(/\/+$/, '');
  const active = pathToNav[normalized] || 'dashboard';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
          <NavLink className={`admin-nav-link ${active === 'dashboard' ? 'active' : ''}`} to="/admin-dashboard" onClick={closeMenu}>Dashboard</NavLink>
          <NavLink className={`admin-nav-link ${active === 'requests' ? 'active' : ''}`} to="/admin/requests" onClick={closeMenu}>All Requests</NavLink>
          <NavLink className={`admin-nav-link ${active === 'technicians' ? 'active' : ''}`} to="/admin/technicians" onClick={closeMenu}>Technicians</NavLink>
          <NavLink className={`admin-nav-link ${active === 'clients' ? 'active' : ''}`} to="/admin/clients" onClick={closeMenu}>Clients</NavLink>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 9999, background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.profilePicture ? <img src={user.profilePicture} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9999 }} /> : user?.fullName?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{user?.fullName}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{user?.email}</div>
          </div>
        </div>
      </aside>
      <main className="admin-main-content">
        <div className="admin-page-shell">{children}</div>
      </main>
    </div>
  );
}
