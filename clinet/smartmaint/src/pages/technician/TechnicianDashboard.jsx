import { useContext, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Droplet,
  Hammer,
  Settings2,
  Star,
  Wrench,
  Zap,
} from 'lucide-react';
import { getTechnicianStats, getMyAssignments } from '../../api/technician';
import TechnicianRequestDetailsModal from '../../components/TechnicianRequestDetailsModal';
import StatusTimeline from '../../components/StatusTimeline';
import { AuthContext } from '../../context/AuthContext';

const priorityBadgeStyles = {
  Low: { background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' },
  Medium: { background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' },
  High: { background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
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

function AssignmentCard({ request, onOpen }) {
  const dateString = request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Recent';
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
      onClick={() => onOpen(request)}
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
              {request.client?.fullName || 'Client'} · {request.category || 'General'}
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
        const [statsResponse, requestsResponse] = await Promise.all([
          getTechnicianStats(),
          getMyAssignments({ status: '' }),
        ]);
        setStats(statsResponse || {});
        setRequests(Array.isArray(requestsResponse.requests) ? requestsResponse.requests : []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [authLoading, user]);

  const previewRequests = useMemo(() => requests.slice(0, 5), [requests]);
  const ratingAboveThree = Number(stats.averageRating || 0) > 3;
  const statCards = [
    {
      label: 'Total Jobs',
      value: stats.totalAssigned || 0,
      icon: Wrench,
      color: '#FFFFFF',
      background: '#0B1330',
      labelColor: '#B8BFD6',
      numberColor: '#FFFFFF',
    },
    {
      label: 'Acknowledged',
      value: stats.acknowledgedCount || 0,
      icon: ClipboardCheck,
      color: '#D97706',
      background: '#FFFFFF',
      labelColor: '#6B7280',
      numberColor: '#D97706',
    },
    {
      label: 'In Progress',
      value: stats.inProgressCount || 0,
      icon: Settings2,
      color: '#0F172A',
      background: '#FFFFFF',
      labelColor: '#6B7280',
      numberColor: '#0F172A',
    },
    {
      label: 'Completed',
      value: stats.completedCount || 0,
      icon: CheckCircle2,
      color: '#16A34A',
      background: '#FFFFFF',
      labelColor: '#6B7280',
      numberColor: '#16A34A',
    },
    {
      label: 'Rating',
      value: formatRating(stats.averageRating),
      icon: Star,
      color: '#F59E0B',
      background: '#FFFFFF',
      labelColor: '#6B7280',
      numberColor: '#F59E0B',
      fill: ratingAboveThree ? '#FBBF24' : 'none',
    },
  ];

  const openDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeDetails = () => {
    setSelectedRequest(null);
    setIsModalOpen(false);
  };

  const displayName = (user?.fullName || 'Technician').trim();
  const greetingName = displayName ? displayName.toLowerCase() : 'technician';

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
              Manage your active maintenance assignments from one place.
            </p>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
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
                  <Icon size={20} color={card.color} fill={card.fill || 'none'} strokeWidth={2} />
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
            <h2 style={{ margin: 0, fontSize: '1.65rem', color: '#111111' }}>My Assignments</h2>
            <p style={{ margin: '0.6rem 0 0', color: '#6B7280' }}>Recent requests assigned to you.</p>
          </div>
        </section>

        <section>
          <div style={{ marginTop: '1rem' }}>
            {previewRequests.length === 0 ? (
              <div style={{ padding: '1.5rem', borderRadius: 12, background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#111111', textAlign: 'center' }}>
                No assignments yet.
              </div>
            ) : (
              previewRequests.map((request) => <AssignmentCard key={request._id} request={request} onOpen={openDetails} />)
            )}
          </div>
        </section>
      </div>

      {isModalOpen && <TechnicianRequestDetailsModal request={selectedRequest} onClose={closeDetails} />}
    </main>
  );
}
