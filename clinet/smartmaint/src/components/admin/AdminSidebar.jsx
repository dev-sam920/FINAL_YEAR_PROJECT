import { useNavigate } from 'react-router-dom';

export default function AdminSidebar({ activeNav, setActiveNav }) {
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin-dashboard' },
    { id: 'requests', label: 'All Requests', path: '/admin/requests' },
    { id: 'payments', label: 'Payments', path: '/admin/payments' },
    { id: 'technicians', label: 'Technicians', path: '/admin/technicians' },
    { id: 'clients', label: 'Clients', path: '/admin/clients' },
  ];

  const handleNavigate = (navItem) => {
    setActiveNav?.(navItem.id);
    navigate(navItem.path);
  };

  return (
    <aside className="admin-sidebar" style={{ width: 260, padding: 24, borderRight: '1px solid #E5E7EB', background: '#FFFFFF' }}>
      <div style={{ fontWeight: 800, color: '#111111', fontSize: 22, marginBottom: 24 }}>SmartMaint</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavigate(item)}
            style={{
              padding: 10,
              borderRadius: 8,
              background: activeNav === item.id ? '#F5A623' : 'transparent',
              color: '#111111',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
