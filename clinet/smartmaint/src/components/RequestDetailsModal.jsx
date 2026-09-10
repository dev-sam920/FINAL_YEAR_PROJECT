import { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  CreditCard,
  Droplet,
  Hammer,
  MapPin,
  Star,
  Wrench,
  Zap,
} from 'lucide-react';
import { initializePayment } from '../api/payments';
import { setRequestEmojiFeedback } from '../api/requests';
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

  const candidates = [
    request.photo,
    request.imageUrl,
    request.image,
    request.photoUrl,
    Array.isArray(request.photos) ? request.photos[0] : null,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return null;
};

export default function RequestDetailsModal({ request, onClose, onRate, onEmojiFeedback }) {
  const [submittingRating, setSubmittingRating] = useState(false);
  const [emojiSubmitting, setEmojiSubmitting] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(request?.emojiFeedback || null);
  const [emojiSaved, setEmojiSaved] = useState(Boolean(request?.emojiFeedback));
  const [paying, setPaying] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    setSelectedEmoji(request?.emojiFeedback || null);
    setEmojiSaved(Boolean(request?.emojiFeedback));
  }, [request?.emojiFeedback]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const photoUrl = useMemo(() => getPhotoUrl(request), [request]);

  if (!request) return null;

  const dateSubmitted = request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Not available';
  const status = request.status || 'submitted';
  const isPaymentStage = status === 'acknowledged' || status === 'completed';
  const isCompleted = status === 'completed';
  const hasRating = typeof request.rating === 'number' && request.rating >= 1;
  const CategoryIcon = getCategoryIcon(request.category);

  const handleRate = async (rating) => {
    if (!onRate) return;
    setSubmittingRating(true);
    try {
      await onRate(request, rating);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleEmojiSelect = async (emoji) => {
    if (emojiSaved) return;
    setEmojiSubmitting(true);

    try {
      const data = await setRequestEmojiFeedback(request._id, emoji);
      setSelectedEmoji(data.request.emojiFeedback);
      setEmojiSaved(true);
      if (typeof onEmojiFeedback === 'function') {
        onEmojiFeedback(request, data.request);
      }
    } catch (error) {
      console.error('Failed to save emoji feedback', error);
    } finally {
      setEmojiSubmitting(false);
    }
  };

  const handlePayNow = async () => {
    setPaying(true);
    try {
      const data = await initializePayment(request._id);
      if (data?.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 17, 17, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(17, 17, 17, 0.25)',
          padding: '1.5rem',
          position: 'relative',
          color: '#111111',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            border: 'none',
            background: '#F3F4F6',
            color: '#111111',
            width: 38,
            height: 38,
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: 18,
            fontWeight: 700,
          }}
          aria-label="Close request details"
        >
          ✕
        </button>

        <div style={{ padding: '0.25rem 2.5rem 1rem 0', borderBottom: '1px solid #E5E7EB', margin: '0 -1.5rem 1rem -1.5rem', paddingLeft: '1.5rem' }}>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Request details
          </p>
          <h2 style={{ margin: '0.6rem 0 0', fontSize: '1.7rem', lineHeight: 1.2 }}>
            {request.title || request.issue || 'Maintenance Request'}
          </h2>

          <div style={{ marginTop: '1.15rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className={`request-badge priority-${(request.priority || 'Medium').toLowerCase()}`}>{request.priority || 'Medium'}</span>
            <span className={`request-badge status-${status}`}>{getStatusLabel(status)}</span>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <StatusTimeline currentStatus={status} />
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={sectionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 10, background: '#E0F2FE', color: '#0F172A' }}>
                <CategoryIcon size={16} />
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Category</p>
            </div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{request.category || 'General'}</p>
            <p style={{ margin: '0.55rem 0 0', lineHeight: 1.65, whiteSpace: 'pre-wrap', color: '#374151' }}>
              {request.description || 'No description provided.'}
            </p>
          </div>

          <div style={sectionCardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Assigned Technician</p>
                {request.assignedTechnician && request.status && request.status !== 'submitted' ? (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 700, color: '#111111' }}>{request.assignedTechnician.fullName || 'Technician'}</div>
                    {request.assignedTechnician.phoneNumber && (
                      <a href={`tel:${request.assignedTechnician.phoneNumber}`} style={{ color: '#4285F4', fontSize: 13 }}>{request.assignedTechnician.phoneNumber}</a>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: '0.5rem 0 0', color: '#6B7280', fontSize: 14 }}>Not assigned yet</p>
                )}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Date Submitted</p>
                <p style={{ margin: '0.5rem 0 0', fontWeight: 700, color: '#111111', lineHeight: 1.5 }}>{dateSubmitted}</p>
              </div>
            </div>
          </div>

          <div style={sectionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MapPin size={16} color="#6B7280" />
              <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Location</p>
            </div>
            <p style={{ margin: 0, fontWeight: 700, color: '#111111' }}>{request.location || request.area || 'Not provided'}</p>
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
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Maintenance request"
                style={{ width: '100%', maxHeight: 220, borderRadius: 12, objectFit: 'cover', border: '1px solid #E5E7EB' }}
              />
            ) : (
              <p style={{ margin: 0, color: '#6B7280' }}>No photo attached</p>
            )}
          </div>

          {isPaymentStage && (
            <div style={sectionCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={16} color="#6B7280" />
                  <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Payment</p>
                </div>
                {request.paymentStatus === 'paid' ? (
                  <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.35rem 0.75rem', borderRadius: 9999, fontSize: 12, fontWeight: 700 }}>
                    Paid
                  </span>
                ) : null}
              </div>

              {typeof request.totalAmount === 'number' && request.totalAmount > 0 ? (
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#374151', fontWeight: 700 }}>Total due</span>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>₦{Number(request.totalAmount || 0).toLocaleString()}</span>
                </div>
              ) : (
                <p style={{ margin: '0.7rem 0 0', color: '#6B7280' }}>Technician is still preparing your quote. Please check back once the price has been set.</p>
              )}

              {request.paymentStatus === 'paid' && (
                <button
                  type="button"
                  onClick={() => setShowReceipt((prev) => !prev)}
                  style={{ marginTop: 10, border: 'none', background: 'transparent', color: '#2563EB', padding: 0, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                >
                  {showReceipt ? 'Hide Receipt' : 'View Receipt'}
                </button>
              )}
            </div>
          )}

          {showReceipt && request.paymentStatus === 'paid' && (
            <div style={{ ...sectionCardStyle, background: '#F9FAFB' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Receipt summary</p>
              <div style={{ marginTop: '0.7rem', display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: '#6B7280' }}>Amount</span>
                  <span style={{ fontWeight: 700, color: '#111111' }}>₦{Number(request.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: '#6B7280' }}>Date paid</span>
                  <span style={{ fontWeight: 700, color: '#111111' }}>{request.paidAt ? new Date(request.paidAt).toLocaleString() : 'Pending'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: '#6B7280' }}>Reference</span>
                  <span style={{ fontWeight: 700, color: '#111111' }}>{request.paymentReference || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {isCompleted && (
            <div style={sectionCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircle2 size={16} color="#6B7280" />
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Service Rating</p>
              </div>

              {hasRating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <Star
                      key={starValue}
                      size={18}
                      fill={starValue <= Number(request.rating) ? '#FBBF24' : 'none'}
                      color={starValue <= Number(request.rating) ? '#FBBF24' : '#9CA3AF'}
                      strokeWidth={1.8}
                    />
                  ))}
                  <span style={{ marginLeft: 4, color: '#6B7280', fontSize: 13, fontWeight: 600 }}>{request.rating}/5 rated</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: '#111111', fontWeight: 700 }}>Rate this service</span>
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => handleRate(starValue)}
                      disabled={submittingRating}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: submittingRating ? 'default' : 'pointer',
                        padding: 0,
                        color: '#FBBF24',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Star size={18} fill="none" color="#FBBF24" strokeWidth={1.8} />
                    </button>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 18 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>How did it feel?</p>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { emoji: '😡', value: 'angry' },
                    { emoji: '😕', value: 'confused' },
                    { emoji: '😐', value: 'neutral' },
                    { emoji: '🙂', value: 'happy' },
                    { emoji: '😍', value: 'love' },
                  ].map((option) => {
                    const isSelected = selectedEmoji === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleEmojiSelect(option.value)}
                        disabled={emojiSaved || emojiSubmitting}
                        aria-label={option.value}
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 18,
                          border: isSelected ? '2px solid #4285F4' : '1px solid #E5E7EB',
                          background: isSelected ? '#DCFCE7' : '#F8FAFC',
                          cursor: emojiSaved ? 'not-allowed' : 'pointer',
                          fontSize: 24,
                          transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {option.emoji}
                      </button>
                    );
                  })}
                </div>
                {selectedEmoji && (
                  <p style={{ margin: '0.75rem 0 0', color: '#4285F4', fontSize: 13, fontWeight: 700 }}>
                    Selected: {selectedEmoji === 'angry' ? 'Angry' : selectedEmoji === 'confused' ? 'Confused' : selectedEmoji === 'neutral' ? 'Neutral' : selectedEmoji === 'happy' ? 'Happy' : 'Love'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
