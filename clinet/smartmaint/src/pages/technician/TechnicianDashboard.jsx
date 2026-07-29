import { useContext, useEffect, useMemo, useState } from 'react';
import { getTechnicianStats, getMyAssignments } from '../../api/technician';
import TechnicianRequestDetailsModal from '../../components/TechnicianRequestDetailsModal';
import StatusTimeline from '../../components/StatusTimeline';
import { AuthContext } from '../../context/AuthContext';

const priorityBadgeStyles = {
  Low: { background: '#ECFCCB', color: '#166534' },
  Medium: { background: '#FDE68A', color: '#92400E' },
  High: { background: '#FED7D7', color: '#991B1B' },
};

const statusBadgeStyles = {
  submitted: { background: '#0B2818', color: '#FFFFFF' },
  acknowledged: { background: '#E5E7EB', color: '#111111' },
  'in-progress': { background: '#E5E7EB', color: '#111111' },
  completed: { background: '#111111', color: '#FFFFFF' },
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'submitted': return 'Submitted';
    case 'acknowledged': return 'Acknowledged';
    case 'in-progress': return 'In Progress';
    case 'completed': return 'Completed';
    default: return status;
  }
};

function AssignmentCard({ request, onOpen }) {
  const dateString = request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Recent';
  return (
    <div onClick={() => onOpen(request)} style={{ borderRadius: 20, background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 12px 28px rgba(17,17,17,0.08)', padding: '1.15rem', cursor: 'pointer', marginBottom: '0.9rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{request.title || 'Maintenance Request'}</div>
          <div style={{ marginTop: 6, color: '#6B7280', fontSize: 13 }}>{request.client?.fullName || 'Client'} · {request.category || 'General'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ padding: '0.35rem 0.8rem', borderRadius: 9999, fontSize: 12, fontWeight: 700, ...priorityBadgeStyles[request.priority || 'Medium'] }}>{request.priority || 'Medium'}</span>
          <span style={{ padding: '0.35rem 0.8rem', borderRadius: 9999, fontSize: 12, fontWeight: 700, ...statusBadgeStyles[request.status || 'submitted'] }}>{getStatusLabel(request.status)}</span>
        </div>
      </div>
      <div style={{ marginTop: 16 }}><StatusTimeline currentStatus={request.status || 'submitted'} /></div>
      <div style={{ marginTop: 12, color: '#6B7280', fontSize: 13 }}>Assigned {dateString}</div>
    </div>
  );
}

const formatRating = (averageRating) => {
  if (averageRating == null || averageRating === undefined) {
    return 'No ratings yet';
  }

  return `${Number(averageRating).toFixed(1)} ★`;
};

export default function TechnicianDashboard() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [stats, setStats] = useState({ totalAssigned: 0, acknowledgedCount: 0, inProgressCount: 0, completedCount: 0, averageRating: null, totalRatedJobs: 0 });
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const load = async () => {
      try {
        const [statsResponse, requestsResponse] = await Promise.all([getTechnicianStats(), getMyAssignments({ status: '' })]);
        setStats(statsResponse || {});
        setRequests(Array.isArray(requestsResponse.requests) ? requestsResponse.requests : []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [authLoading, user]);

  const previewRequests = useMemo(() => requests.slice(0, 5), [requests]);

  const openDetails = (request) => { setSelectedRequest(request); setIsModalOpen(true); };
  const closeDetails = () => { setSelectedRequest(null); setIsModalOpen(false); };

  return (
    <main style={{ minHeight: '100vh', background: '#FFFFFF', color: '#111111', padding: '2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Technician Dashboard</p>
          <h1 style={{ margin: '0.75rem 0 0', fontSize: '2.3rem' }}>Welcome, {user?.fullName || 'Technician'}</h1>
          <p style={{ margin: '0.85rem 0 0', color: '#6B7280' }}>Manage your active maintenance assignments from one place.</p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Total Assigned', value: stats.totalAssigned || 0 },
            { label: 'Acknowledged', value: stats.acknowledgedCount || 0 },
            { label: 'In Progress', value: stats.inProgressCount || 0 },
            { label: 'Completed', value: stats.completedCount || 0 },
            { label: 'Average Rating', value: formatRating(stats.averageRating) },
          ].map((card) => (
            <div key={card.label} style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid #E5E7EB', padding: '1.5rem', boxShadow: '0 10px 24px rgba(17,17,17,0.06)' }}>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{card.label}</p>
              <p style={{ margin: '0.8rem 0 0', fontSize: '2rem', fontWeight: 700 }}>{card.value}</p>
            </div>
          ))}
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>My Assignments</h2>
              <p style={{ margin: '0.4rem 0 0', color: '#6B7280' }}>Recent requests assigned to you.</p>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {previewRequests.length === 0 ? <div style={{ padding: '1.5rem', borderRadius: 20, background: '#F8FAFC', color: '#111111', textAlign: 'center' }}>No assignments yet.</div> : previewRequests.map((request) => <AssignmentCard key={request._id} request={request} onOpen={openDetails} />)}
          </div>
        </section>
      </div>

      {isModalOpen && <TechnicianRequestDetailsModal request={selectedRequest} onClose={closeDetails} />}
    </main>
  );
}
