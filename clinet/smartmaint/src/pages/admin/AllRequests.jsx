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

const getPriorityBadgeStyle = (priority) => {
  const normalized = String(priority || '').toLowerCase();
  if (normalized === 'high') return { background: '#FEE2E2', color: '#DC2626' };
  if (normalized === 'medium') return { background: '#FEF3C7', color: '#D97706' };
  return { background: '#DBEAFE', color: '#2563EB' };
};

const getStatusBadgeStyle = (value) => {
  const normalized = normalizeStatusValue(value);
  if (normalized === 'submitted' || normalized === 'acknowledged') return { background: '#DBEAFE', color: '#2563EB' };
  if (normalized === 'in-progress') return { background: '#FEF3C7', color: '#D97706' };
  if (normalized === 'completed') return { background: '#D1FAE5', color: '#059669' };
  return { background: '#F3F4F6', color: '#6B7280' };
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '1.2rem 1.3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: '#0B2818', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Admin workspace</p>
            <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.55rem', color: '#111111' }}>All Requests</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6B7280' }}>Search, review, and assign maintenance work with a calmer workflow.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              placeholder="Search title or client"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 240, border: '1px solid #E5E7EB', background: '#F7F7F5', borderRadius: 9999, padding: '0.7rem 0.95rem', color: '#111111' }}
            />
            <button onClick={applyFilters} style={{ border: 'none', background: '#0B2818', color: '#FFFFFF', borderRadius: 9999, padding: '0.7rem 1rem', fontWeight: 700, cursor: 'pointer' }}>Search</button>
          </div>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '1rem 1.2rem' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {['', 'submitted', 'in-progress', 'completed'].map((value) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, status: value }))}
              style={{ border: 'none', background: filters.status === value ? '#0B2818' : '#F7F7F5', color: filters.status === value ? '#FFFFFF' : '#4B5563', borderRadius: 9999, padding: '0.6rem 0.9rem', fontWeight: 700, cursor: 'pointer' }}
            >
              {value ? getStatusLabel(value) : 'All'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select value={filters.category} onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))} style={selectStyle}>
            <option value="">Category</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="HVAC">HVAC</option>
            <option value="Structural">Structural</option>
            <option value="Appliance">Appliance</option>
            <option value="General">General</option>
          </select>
          <select value={filters.priority} onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))} style={selectStyle}>
            <option value="">Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <button onClick={applyFilters} style={{ border: 'none', background: '#0B2818', color: '#FFFFFF', borderRadius: 9999, padding: '0.7rem 1rem', fontWeight: 700, cursor: 'pointer' }}>Apply filters</button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '1rem 1.2rem' }}>
        {loading ? (
          <div style={{ padding: '1.2rem', borderRadius: 16, background: '#F7F7F5', color: '#4B5563', textAlign: 'center' }}>Loading requests...</div>
        ) : error ? (
          <div style={{ padding: '1.2rem', borderRadius: 16, background: '#FEF2F2', color: '#B91C1C', textAlign: 'center' }}>{error}</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '1.2rem', borderRadius: 16, background: '#F7F7F5', color: '#6B7280', textAlign: 'center' }}>No requests found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={thStyle}>Request</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Priority</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Technician</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: '#111111' }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{r._id?.slice(-6) || 'N/A'}</div>
                    </td>
                    <td style={tdStyle}>{r.client?.fullName || r.clientName || 'Unknown'}</td>
                    <td style={tdStyle}>{r.category || 'General'}</td>
                    <td style={tdStyle}><span style={{ ...badgeBase, ...getPriorityBadgeStyle(r.priority) }}>{r.priority || 'Low'}</span></td>
                    <td style={tdStyle}><span style={{ ...badgeBase, ...getStatusBadgeStyle(r.status) }}>{getStatusLabel(r.status)}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <select value={selectedAssign[r._id] || ''} onChange={(e) => setSelectedAssign((s) => ({ ...s, [r._id]: e.target.value }))} style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', borderRadius: 9999, padding: '0.55rem 0.7rem', color: '#111111' }}>
                          <option value="">Unassigned</option>
                          {technicians.map((t) => (
                            <option key={t._id} value={t._id}>{t.fullName}</option>
                          ))}
                        </select>
                        <button onClick={() => confirmAssign(r._id)} style={{ border: 'none', background: '#0B2818', color: '#FFFFFF', borderRadius: 9999, padding: '0.55rem 0.8rem', fontWeight: 700, cursor: 'pointer' }}>Assign</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const selectStyle = {
  border: '1px solid #E5E7EB',
  background: '#FFFFFF',
  borderRadius: 9999,
  padding: '0.7rem 0.9rem',
  color: '#111111',
  minWidth: 140,
};

const thStyle = {
  textAlign: 'left',
  padding: '0.8rem 0.6rem',
  color: '#6B7280',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const tdStyle = {
  padding: '0.9rem 0.6rem',
  color: '#374151',
  fontSize: 14,
};

const badgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 9999,
  padding: '0.34rem 0.7rem',
  fontSize: 12,
  fontWeight: 700,
};
