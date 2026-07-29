import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAllRequests, getTechnicians, assignTechnician } from '../../api/admin';

const normalizeStatusValue = (value) => {
  if (!value) return '';

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'pending') return 'submitted';
  if (normalized === 'in progress' || normalized === 'in-progress') return 'in-progress';
  if (normalized === 'completed') return 'completed';
  return normalized;
};

const getStatusLabel = (value) => {
  const normalized = normalizeStatusValue(value);
  if (normalized === 'submitted') return 'Submitted';
  if (normalized === 'acknowledged') return 'Acknowledged';
  if (normalized === 'in-progress') return 'In Progress';
  if (normalized === 'completed') return 'Completed';
  return value || 'Unknown';
};

export default function AllRequests() {
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
  const [search, setSearch] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [selectedAssign, setSelectedAssign] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const t = await getTechnicians();
        setTechnicians(t.technicians || []);
        const res = await getAllRequests({});
        setRequests(res.requests || []);
      } catch (err) {
        console.error('Failed to load admin requests:', {
          message: err.message,
          responseStatus: err.response?.status,
          responseData: err.response?.data,
          stack: err.stack,
        });
        setError('Failed to load requests. Please try again.');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, user]);

  const applyFilters = async () => {
    try {
      setError('');
      const normalizedStatus = normalizeStatusValue(filters.status);
      const res = await getAllRequests({ ...filters, status: normalizedStatus, search });
      setRequests(res.requests || []);
    } catch (err) {
      console.error('Failed to load filtered requests:', {
        message: err.message,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
        stack: err.stack,
      });
      setError('Failed to load requests. Please try again.');
      setRequests([]);
    }
  };

  const confirmAssign = async (requestId) => {
    const techId = selectedAssign[requestId];
    if (!techId) return;
    try {
      const res = await assignTechnician(requestId, techId);
      setRequests((prev) => prev.map((r) => (r._id === requestId ? res.request : r)));
    } catch (err) {
      console.error('Failed to assign technician:', err);
    }
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>All Requests</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Search title or client" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button onClick={applyFilters}>Search</button>
        </div>
      </header>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ padding: 16, border: '1px solid #E5E7EB', borderRadius: 12 }}>Loading requests...</div>
        ) : error ? (
          <div style={{ padding: 16, border: '1px solid #FECACA', borderRadius: 12, color: '#B91C1C' }}>{error}</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 24, border: '1px solid #E5E7EB', borderRadius: 12, textAlign: 'center', color: '#6B7280' }}>
            No requests found
          </div>
        ) : (
          requests.map((r) => (
            <div key={r._id} style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>{r.client?.fullName} · {r.category}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ padding: '6px 10px', borderRadius: 9999, background: r.priority === 'High' ? '#FED7D7' : r.priority === 'Low' ? '#ECFCCB' : '#FDE68A' }}>{r.priority}</div>
                  <div style={{ padding: '6px 10px', borderRadius: 6 }}>{getStatusLabel(r.status)}</div>
                  <div>
                    <select value={selectedAssign[r._id] || ''} onChange={(e) => setSelectedAssign((s) => ({ ...s, [r._id]: e.target.value }))}>
                      <option value="">Unassigned</option>
                      {technicians.map((t) => (
                        <option key={t._id} value={t._id}>{t.fullName}</option>
                      ))}
                    </select>
                    <button onClick={() => confirmAssign(r._id)}>Assign</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
