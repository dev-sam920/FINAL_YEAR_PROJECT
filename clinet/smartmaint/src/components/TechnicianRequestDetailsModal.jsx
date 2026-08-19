import { useEffect, useMemo } from 'react';
import RequestLocationMap from './RequestLocationMap.jsx';
import StatusTimeline from './StatusTimeline';

const priorityBadgeStyles = {
  Low: { background: '#ECFCCB', color: '#166534' },
  Medium: { background: '#FDE68A', color: '#92400E' },
  High: { background: '#FED7D7', color: '#991B1B' },
};

const statusBadgeStyles = {
  submitted: { background: '#4285F4', color: '#FFFFFF' },
  assigned: { background: '#FEF3C7', color: '#B45309' },
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

const getPhotoUrl = (request) => {
  if (!request) return null;
  const candidates = [request.photo, request.imageUrl, request.image, request.photoUrl, Array.isArray(request.photos) ? request.photos[0] : null];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return null;
};

export default function TechnicianRequestDetailsModal({ request, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const photoUrl = useMemo(() => getPhotoUrl(request), [request]);
  if (!request) return null;

  const status = request.status || 'submitted';
  const client = request.client || {};

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: 24, boxShadow: '0 24px 60px rgba(17,17,17,0.25)', padding: '1.5rem', position: 'relative', color: '#111111' }}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: '#F3F4F6', color: '#111111', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>
          ✕
        </button>

        <p style={{ margin: 0, color: '#6B7280', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Assignment details</p>
        <h2 style={{ margin: '0.6rem 0 0', fontSize: '1.7rem' }}>{request.title || 'Maintenance Request'}</h2>

        <div style={{ marginTop: '1rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className={`request-badge priority-${(request.priority || 'Medium').toLowerCase()}`}>{request.priority || 'Medium'}</span>
          <span className={`request-badge status-${status}`}>{getStatusLabel(status)}</span>
        </div>

        <div style={{ marginTop: '1.25rem' }}><StatusTimeline currentStatus={status} /></div>

        <div style={{ marginTop: '1.6rem', display: 'grid', gap: '1rem' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Client</p>
            <p style={{ margin: '0.35rem 0 0', fontWeight: 700 }}>{client.fullName || 'Client'}</p>
            <p style={{ margin: '0.2rem 0 0', color: '#4B5563' }}>{client.email || 'No email available'}</p>
            <p style={{ margin: '0.2rem 0 0', color: '#4B5563' }}>{client.phone || 'No phone available'}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Category</p>
            <p style={{ margin: '0.35rem 0 0', fontWeight: 700 }}>{request.category || 'General'}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Description</p>
            <p style={{ margin: '0.35rem 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{request.description || 'No description provided.'}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Location / Area</p>
            <p style={{ margin: '0.35rem 0 0', fontWeight: 700 }}>{request.location || 'Not provided'}</p>
          </div>
          {(request.latitude !== null && request.longitude !== null) && (
            <RequestLocationMap latitude={request.latitude} longitude={request.longitude} address={request.location} />
          )}
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Photo</p>
            {photoUrl ? <img src={photoUrl} alt="Maintenance request" style={{ marginTop: '0.65rem', maxWidth: '100%', maxHeight: 260, borderRadius: 16, objectFit: 'cover', border: '1px solid #E5E7EB' }} /> : <p style={{ margin: '0.65rem 0 0', color: '#6B7280' }}>No photo attached</p>}
          </div>
          {request.completionNote ? <div><p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Completion note</p><p style={{ margin: '0.35rem 0 0', whiteSpace: 'pre-wrap' }}>{request.completionNote}</p></div> : null}
        </div>
      </div>
    </div>
  );
}
