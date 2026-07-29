import { useLocation } from 'react-router-dom';
import ClientSidebar from '../components/client/ClientSidebar.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import './ClientLayout.css';

const pathToNav = {
  '/client-dashboard': 'dashboard',
  '/profile': 'profile',
  '/settings': 'settings',
  '/support': 'support',
  '/submit-request': 'submit',
  '/my-requests': 'requests',
};

export default function ClientLayout({ children }) {
  const { pathname } = useLocation();
  const normalizedPath = pathname.replace(/\/+$/, '');
  const activeNav = pathToNav[normalizedPath] || 'dashboard';

  return (
    <div className="client-layout">
      <ClientSidebar activeNav={activeNav} />
      <div className="client-main">
        <header className="client-topbar">
          <div className="client-topbar-search">
            <span className="topbar-search-icon">🔍</span>
            <input
              type="search"
              className="topbar-search-input"
              placeholder="Search requests, tickets, or messages"
              aria-label="Search"
            />
          </div>
          <div className="client-topbar-actions">
            <NotificationBell />
          </div>
        </header>
        <main className="client-content">{children}</main>
      </div>
    </div>
  );
}
