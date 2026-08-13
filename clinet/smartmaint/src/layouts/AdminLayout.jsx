import { NavLink, useLocation } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import './admin.css';

const pathToNav = {
  '/admin-dashboard': 'dashboard',
  '/admin/requests': 'requests',
  '/admin/support-tickets': 'support',
  '/admin/payments': 'payments',
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

  const navSections = [
    {
      title: 'General',
      items: [
        { id: 'dashboard', label: 'Dashboard', path: '/admin-dashboard' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { id: 'requests', label: 'All Requests', path: '/admin/requests' },
        { id: 'support', label: 'Support Tickets', path: '/admin/support-tickets' },
        { id: 'payments', label: 'Payments', path: '/admin/payments' },
      ],
    },
    {
      title: 'People',
      items: [
        { id: 'technicians', label: 'Technicians', path: '/admin/technicians' },
        { id: 'clients', label: 'Clients', path: '/admin/clients' },
      ],
    },
  ];

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
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark">SM</div>
          <div>
            <div className="admin-brand-title">SmartMaint</div>
            <div className="admin-brand-subtitle">Operations hub</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navSections.map((section) => (
            <div key={section.title} className="admin-nav-section">
              <div className="admin-nav-section-title">{section.title}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  className={`admin-nav-link ${active === item.id ? 'active' : ''}`}
                  to={item.path}
                  onClick={closeMenu}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-user">
          <div className="admin-avatar">
            {user?.profilePicture ? <img src={user.profilePicture} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9999 }} /> : user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <div className="admin-user-name">{user?.fullName || 'Admin'}</div>
            <div className="admin-user-email">{user?.email}</div>
          </div>
        </div>
      </aside>

      <main className="admin-main-content">
        <div className="admin-page-shell">{children}</div>
      </main>
    </div>
  );
}
