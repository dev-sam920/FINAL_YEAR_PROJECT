import { useEffect, useMemo } from 'react';
import { Camera, CheckCircle2, Droplet, Hammer, MapPin, Star, Wrench, Zap } from 'lucide-react';
import RequestLocationMap from './RequestLocationMap.jsx';
import StatusTimeline from './StatusTimeline';

const sectionCardStyle = {
  background: '#F8FAFC',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: '14px 16px',
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

  if (normalized.includes('plumb') || normalized.includes('pipe') || normalized.includes('sink') || normalized.includes('toilet')) {
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
  const CategoryIcon = getCategoryIcon(request.category);
  const rating = Number(request.rating || 0);

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

        <div style={{ padding: '0.25rem 2.5rem 1rem 0', borderBottom: '1px solid #E5E7EB', margin: '0 -1.5rem 1rem -1.5rem', paddingLeft: '1.5rem' }}>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Assignment details</p>
          <h2 style={{ margin: '0.6rem 0 0', fontSize: '1.7rem' }}>{request.title || 'Maintenance Request'}</h2>

          <div style={{ marginTop: '1rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className={`request-badge priority-${(request.priority || 'Medium').toLowerCase()}`}>{request.priority || 'Medium'}</span>
            <span className={`request-badge status-${status}`}>{getStatusLabel(status)}</span>
          </div>

          <div style={{ marginTop: '1.25rem' }}><StatusTimeline currentStatus={status} /></div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={sectionCardStyle}>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Client</p>
            <p style={{ margin: '0.5rem 0 0', fontWeight: 700 }}>{client.fullName || 'Client'}</p>
            <p style={{ margin: '0.2rem 0 0', color: '#4B5563' }}>{client.email || 'No email available'}</p>
            <p style={{ margin: '0.2rem 0 0', color: '#4B5563' }}>{client.phone || 'No phone available'}</p>
          </div>

          <div style={sectionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 10, background: '#E0F2FE', color: '#0F172A' }}>
                <CategoryIcon size={16} />
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Category</p>
            </div>
            <p style={{ margin: 0, fontWeight: 700 }}>{request.category || 'General'}</p>
            <p style={{ margin: '0.6rem 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.65, color: '#374151' }}>{request.description || 'No description provided.'}</p>
          </div>

          <div style={sectionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MapPin size={16} color="#6B7280" />
              <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Location</p>
            </div>
            <p style={{ margin: 0, fontWeight: 700 }}>{request.location || 'Not provided'}</p>
            {(request.latitude !== null && request.longitude !== null) && (
              <div style={{ marginTop: 12 }}>
                <RequestLocationMap latitude={request.latitude} longitude={request.longitude} address={request.location} />
              </div>
            )}
          </div>

          <div style={sectionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Camera size={16} color="#6B7280" />
              <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Photo</p>
            </div>
            {photoUrl ? <img src={photoUrl} alt="Maintenance request" style={{ width: '100%', maxHeight: 220, borderRadius: 12, objectFit: 'cover', border: '1px solid #E5E7EB' }} /> : <p style={{ margin: 0, color: '#6B7280' }}>No photo attached</p>}
          </div>

          {request.completionNote ? (
            <div style={sectionCardStyle}>
              <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Completion note</p>
              <p style={{ margin: '0.5rem 0 0', whiteSpace: 'pre-wrap', color: '#374151' }}>{request.completionNote}</p>
            </div>
          ) : null}

          {Number.isFinite(rating) && rating > 0 && (
            <div style={sectionCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <CheckCircle2 size={16} color="#6B7280" />
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Service Rating</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <Star
                    key={starValue}
                    size={18}
                    fill={starValue <= rating ? '#FBBF24' : 'none'}
                    color={starValue <= rating ? '#FBBF24' : '#9CA3AF'}
                    strokeWidth={1.8}
                  />
                ))}
                <span style={{ marginLeft: 4, color: '#6B7280', fontSize: 13, fontWeight: 600 }}>{rating}/5 rated</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
