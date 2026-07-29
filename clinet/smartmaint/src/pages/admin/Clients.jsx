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
    <div>
      <h1></h1>
      <div style={{ marginTop: 12 }}>
        {clients.map((c) => (
          <div key={c._id} style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{c.fullName}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{c.email}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{c.phone} · {c.unitAddress}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
