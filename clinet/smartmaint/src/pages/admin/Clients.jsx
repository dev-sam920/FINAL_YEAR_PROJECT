import { useEffect, useState } from 'react';
import { getClients } from '../../api/admin';

export default function Clients() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getClients();
        setClients(res.clients || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '1.2rem 1.3rem' }}>
        <p style={{ margin: 0, color: '#4285F4', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Client directory</p>
        <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.55rem', color: '#111111' }}>Clients</h1>
        <p style={{ margin: '0.25rem 0 0', color: '#6B7280' }}>A calm view of client accounts and contact details.</p>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid #F3F4F6', fontWeight: 700, color: '#111111' }}>Registered clients</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead style={{ background: '#F7F7F5' }}>
              <tr>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Name</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Email</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Phone</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Address</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c._id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '0.95rem 1rem', fontWeight: 700 }}>{c.fullName}</td>
                  <td style={{ padding: '0.95rem 1rem', color: '#4B5563' }}>{c.email}</td>
                  <td style={{ padding: '0.95rem 1rem', color: '#4B5563' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '0.95rem 1rem', color: '#4B5563' }}>{c.unitAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
