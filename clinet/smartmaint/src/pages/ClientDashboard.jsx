import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyRequests, rateRequest } from '../api/requests';
import StatusTimeline from '../components/StatusTimeline';
import RequestDetailsModal from '../components/RequestDetailsModal';

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
    case 'submitted':
      return 'Submitted';
    case 'acknowledged':
      return 'Acknowledged';
    case 'in-progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

const RequestCard = ({ request, onRate, onOpenDetails }) => {
  const dateString = new Date(request.createdAt).toLocaleDateString();

  return (
    <div
      style={{
        borderRadius: 20,
        background: '#FFFFFF',
        padding: '1.375rem',
        boxShadow: '0 12px 28px rgba(17, 17, 17, 0.08)',
        border: '1px solid #E5E7EB',
        marginBottom: '1rem',
        cursor: 'pointer',
      }}
      onClick={() => onOpenDetails(request)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111111' }}>
            {request.title || request.category || 'Maintenance Request'}
          </p>
          <p style={{ margin: '0.55rem 0 0', fontSize: 13, color: '#6B7280' }}>
            {request.category || 'General'} · {dateString}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              ...priorityBadgeStyles[request.priority || 'Medium'],
            }}
          >
            {request.priority || 'Medium'}
          </span>
          <span
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              ...statusBadgeStyles[request.status || 'submitted'],
            }}
          >
            {getStatusLabel(request.status)}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <StatusTimeline currentStatus={request.status || 'submitted'} />
      </div>

      {request.status === 'completed' && (
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {request.rating == null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#111111', fontWeight: 700 }}>Rate this service</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRate(request, star);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#0B2818',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} style={{ color: star <= request.rating ? '#0B2818' : '#E5E7EB', fontSize: 18 }}>
                  ★
                </span>
              ))}
              <span style={{ color: '#6B7280', fontSize: 13 }}>{request.rating}/5 rated</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getMyRequests();
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      } catch (err) {
        setError(err.message || 'Unable to load your requests');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((item) => item.status === 'submitted').length,
      acknowledged: requests.filter((item) => item.status === 'acknowledged').length,
      inProgress: requests.filter((item) => item.status === 'in-progress').length,
      completed: requests.filter((item) => item.status === 'completed').length,
    }),
    [requests]
  );

  const handleRating = async (request, rating) => {
    try {
      const data = await rateRequest(request._id, rating);
      setRequests((prev) => prev.map((item) => (item._id === request._id ? data.request : item)));
      setSelectedRequest((prev) => (prev && prev._id === request._id ? data.request : prev));
    } catch (err) {
      console.error('Failed to save rating', err);
    }
  };

  const openDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeDetails = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#FFFFFF', color: '#111111', padding: '2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: '#6B7280', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Client Dashboard
            </p>
            <h1 style={{ margin: '0.75rem 0 0', fontSize: '2.5rem', lineHeight: 1.05 }}>
              Welcome, {user?.fullName || 'Client'}
            </h1>
            <p style={{ margin: '0.85rem 0 0', color: '#6B7280' }}>{user?.email || 'No email available'}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            style={{
              background: '#111111',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 9999,
              padding: '0.95rem 1.6rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
          {[
            { label: 'Total Requests', value: stats.total },
            { label: 'Pending', value: stats.pending },
            { label: 'In Progress', value: stats.inProgress },
            { label: 'Completed', value: stats.completed },
          ].map((card) => (
            <div key={card.label} style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid #E5E7EB', padding: '1.5rem', boxShadow: '0 10px 24px rgba(17, 17, 17, 0.06)' }}>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {card.label}
              </p>
              <p style={{ margin: '0.85rem 0 0', fontSize: '2rem', fontWeight: 700, color: '#111111' }}>{card.value}</p>
            </div>
          ))}
        </section>

        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.65rem' }}>Recent Requests</h2>
            <p style={{ margin: '0.6rem 0 0', color: '#6B7280' }}>Track your latest requests and status updates in one place.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/submit-request')}
            style={{
              background: '#0B2818',
              color: '#ffffff',
              border: 'none',
              borderRadius: 9999,
              padding: '0.95rem 1.6rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Submit New Request
          </button>
        </section>

        <section>
          {loading ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: '#6B7280' }}>Loading your requests...</div>
          ) : error ? (
            <div style={{ padding: '1.5rem', borderRadius: 20, background: '#FEF3C7', color: '#92400E' }}>{error}</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: '2.5rem', borderRadius: 20, background: '#F8FAFC', color: '#111111', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>No requests yet</p>
              <p style={{ margin: '0.75rem 0 0', color: '#6B7280' }}>Submit your first request to get started.</p>
            </div>
          ) : (
            <div>
              {requests.slice(0, 10).map((request) => (
                <RequestCard key={request._id} request={request} onRate={handleRating} onOpenDetails={openDetails} />
              ))}
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <RequestDetailsModal request={selectedRequest} onClose={closeDetails} onRate={handleRating} />
      )}
    </main>
  );
}
