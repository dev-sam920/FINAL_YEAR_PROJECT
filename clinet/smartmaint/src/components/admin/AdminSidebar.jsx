import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart2, ClipboardList, CreditCard, Users, FileText, Cpu, User, LogOut } from 'lucide-react';

export default function AdminSidebar({ activeNav, setActiveNav }) {
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin-dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'analytics', label: 'Analytics', path: '/admin/analytics', icon: <BarChart2 size={18} /> },
    { id: 'requests', label: 'All Requests', path: '/admin/requests', icon: <ClipboardList size={18} /> },
    { id: 'payments', label: 'Payments', path: '/admin/payments', icon: <CreditCard size={18} /> },
    { id: 'technicians', label: 'Technicians', path: '/admin/technicians', icon: <Users size={18} /> },
    { id: 'clients', label: 'Clients', path: '/admin/clients', icon: <User size={18} /> },
    { id: 'support', label: 'Support Tickets', path: '/admin/support', icon: <FileText size={18} /> },
    { id: 'systems', label: 'Systems', path: '/admin/systems', icon: <Cpu size={18} /> },
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
              background: activeNav === item.id ? '#4285F4' : 'transparent',
              color: '#111111',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
            >
            <span style={{ display: 'inline-flex', alignItems: 'center', color: activeNav === item.id ? '#FFFFFF' : '#111111', gap: 10 }}>{item.icon}<span>{item.label}</span></span>
          </button>
        ))}
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => {
              // navigate to logout via location change to preserve existing behavior
              navigate('/logout');
            }}
            style={{
              padding: 10,
              borderRadius: 8,
              background: 'transparent',
              color: '#111111',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#111111' }}><LogOut size={18} /></span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
