import { useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Droplet, Hammer, Settings2, Wrench, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyRequests, rateRequest } from '../api/requests';
import StatusTimeline from '../components/StatusTimeline';
import RequestDetailsModal from '../components/RequestDetailsModal';

const priorityBadgeStyles = {
  Low: { background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' },
  Medium: { background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' },
  High: { background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
};

const statusBadgeStyles = {
  submitted: { background: '#0F1642', color: '#FFFFFF' },
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

const getCategoryIcon = (category) => {
  const normalized = String(category || '').toLowerCase();

  if (normalized.includes('plumb') || normalized.includes('pipe') || normalized.includes('sink')) {
    return Droplet;
  }
  if (normalized.includes('elect') || normalized.includes('power') || normalized.includes('light') || normalized.includes('fan')) {
    return Zap;
  }
  if (normalized.includes('carp') || normalized.includes('wood') || normalized.includes('door') || normalized.includes('cabinet')) {
    return Hammer;
  }

  return Wrench;
};

const getCategoryStyle = (category) => {
  const normalized = String(category || '').toLowerCase();

  if (normalized.includes('plumb') || normalized.includes('pipe') || normalized.includes('sink')) {
    return { background: '#E0F2FE', color: '#0369A1' };
  }
  if (normalized.includes('elect') || normalized.includes('power') || normalized.includes('light') || normalized.includes('fan')) {
    return { background: '#FEF3C7', color: '#B45309' };
  }
  if (normalized.includes('carp') || normalized.includes('wood') || normalized.includes('door') || normalized.includes('cabinet')) {
    return { background: '#FDE68A', color: '#92400E' };
  }

  return { background: '#EDE9FE', color: '#6D28D9' };
};

const RequestCard = ({ request, onRate, onOpenDetails }) => {
  const dateString = new Date(request.createdAt).toLocaleDateString();
  const priority = request.priority || 'Medium';
  const status = request.status || 'submitted';
  const statusLabel = getStatusLabel(status);
  const CategoryIcon = getCategoryIcon(request.category);
  const categoryStyle = getCategoryStyle(request.category);
  const leftBorderColor = priority === 'High' ? '#EF4444' : '#D1D5DB';

  const metaText =
    status === 'completed'
      ? typeof request.rating === 'number'
        ? `${statusLabel} · ${request.rating}/5 ★`
        : `${statusLabel} · Rate now`
      : statusLabel;

  return (
    <div
      style={{
        borderRadius: 12,
        background: '#FFFFFF',
        padding: '1.1rem 1rem 1.1rem 1rem',
        border: '0.5px solid #E5E7EB',
        marginBottom: '1rem',
        borderLeft: `3px solid ${leftBorderColor}`,
        boxShadow: '0 6px 18px rgba(17, 17, 17, 0.04)',
        cursor: 'pointer',
      }}
      onClick={() => onOpenDetails(request)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: categoryStyle.background,
            color: categoryStyle.color,
            flexShrink: 0,
          }}
        >
          <CategoryIcon size={16} />
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111111' }}>
              {request.title || request.category || 'Maintenance Request'}
            </p>
            <p style={{ margin: '0.45rem 0 0', fontSize: 13, color: '#6B7280' }}>
              {request.category || 'General'} · {dateString}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <span
              style={{
                padding: '0.32rem 0.7rem',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                ...priorityBadgeStyles[priority],
              }}
            >
              {priority}
            </span>
            <span style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4, textAlign: 'right' }}>
              {metaText}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <StatusTimeline currentStatus={status} compact />
      </div>
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

  const statCards = [
    {
      label: 'Total Requests',
      value: stats.total,
      icon: Wrench,
      color: '#FFFFFF',
      background: '#0B1330',
      labelColor: '#B8BFD6',
      numberColor: '#FFFFFF',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: ClipboardCheck,
      color: '#D97706',
      background: '#FFFFFF',
      labelColor: '#6B7280',
      numberColor: '#D97706',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: Settings2,
      color: '#0F172A',
      background: '#FFFFFF',
      labelColor: '#6B7280',
      numberColor: '#0F172A',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: '#16A34A',
      background: '#FFFFFF',
      labelColor: '#6B7280',
      numberColor: '#16A34A',
    },
  ];

  const handleRating = async (request, rating) => {
    try {
      const data = await rateRequest(request._id, rating);
      setRequests((prev) => prev.map((item) => (item._id === request._id ? data.request : item)));
      setSelectedRequest((prev) => (prev && prev._id === request._id ? data.request : prev));
    } catch (err) {
      console.error('Failed to save rating', err);
    }
  };

  const handleEmojiFeedback = async (request, updatedRequest) => {
    setRequests((prev) => prev.map((item) => (item._id === request._id ? updatedRequest : item)));
    setSelectedRequest((prev) => (prev && prev._id === request._id ? updatedRequest : prev));
  };

  const openDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeDetails = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSubmitNewRequest = () => {
    try {
      navigate('/submit-request');
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  };

  const displayName = (user?.fullName || 'Client').trim();
  const greetingName = displayName ? displayName.toLowerCase() : 'client';

  return (
    <main style={{ minHeight: '100vh', background: '#F4F7FB', color: '#111111', padding: '2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            background: '#FFFFFF',
            border: '0.5px solid #E5E7EB',
            borderRadius: 12,
            padding: '1.25rem 1.4rem',
            boxShadow: '0 8px 22px rgba(17, 17, 17, 0.04)',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 19, lineHeight: 1.2, fontWeight: 500, color: '#111111' }}>
              Welcome back, {greetingName}
            </h1>
            <p style={{ margin: '0.3rem 0 0', color: '#6B7280', fontSize: 13 }}>
              Here&apos;s what&apos;s happening with your requests
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                style={{
                  background: card.background,
                  borderRadius: 12,
                  border: '0.5px solid #E5E7EB',
                  padding: '1.2rem',
                  boxShadow: '0 8px 22px rgba(17, 17, 17, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  ...(card.background === '#0B1330' ? { color: '#FFFFFF' } : {}),
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: card.background === '#0B1330' ? 'rgba(255,255,255,0.08)' : `${card.color}22`,
                    color: card.color,
                    padding: '0.5rem',
                  }}
                >
                  <Icon size={20} color={card.color} fill="none" strokeWidth={2} />
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: card.labelColor,
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {card.label}
                  </p>
                  <p
                    style={{
                      margin: '0.55rem 0 0',
                      fontSize: '1.6rem',
                      fontWeight: 700,
                      color: card.numberColor,
                    }}
                  >
                    {card.value}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.65rem', color: '#111111' }}>Recent Requests</h2>
            <p style={{ margin: '0.6rem 0 0', color: '#6B7280' }}>Track your latest requests and status updates in one place.</p>
          </div>
        </section>

        <section>
          {loading ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: '#6B7280' }}>Loading your requests...</div>
          ) : error ? (
            <div style={{ padding: '1.5rem', borderRadius: 20, background: '#E8F1FF', color: '#2563EB' }}>{error}</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: '2.5rem', borderRadius: 20, background: '#FFFFFF', color: '#111111', textAlign: 'center', border: '1px solid #E5E7EB' }}>
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
        <RequestDetailsModal request={selectedRequest} onClose={closeDetails} onRate={handleRating} onEmojiFeedback={handleEmojiFeedback} />
      )}
    </main>
  );
}
