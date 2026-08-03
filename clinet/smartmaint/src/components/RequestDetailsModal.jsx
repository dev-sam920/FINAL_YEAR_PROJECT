import { useEffect, useMemo, useState } from 'react';
import { initializePayment } from '../api/payments';
import StatusTimeline from './StatusTimeline';

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

export default function RequestDetailsModal({ request, onClose, onRate }) {
  const [submittingRating, setSubmittingRating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

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
  const isCompleted = status === 'completed';
  const hasRating = typeof request.rating === 'number' && request.rating >= 1;

  const handleRate = async (rating) => {
    if (!onRate) return;
    setSubmittingRating(true);
    try {
      await onRate(request, rating);
    } finally {
      setSubmittingRating(false);
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

        <div style={{ paddingRight: '2.5rem' }}>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Request details
          </p>
          <h2 style={{ margin: '0.6rem 0 0', fontSize: '1.7rem', lineHeight: 1.2 }}>
            {request.title || request.issue || 'Maintenance Request'}
          </h2>
        </div>

        <div style={{ marginTop: '1.15rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
              ...statusBadgeStyles[status],
            }}
          >
            {getStatusLabel(status)}
          </span>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <StatusTimeline currentStatus={status} />
        </div>

        <div style={{ marginTop: '1.6rem', display: 'grid', gap: '1rem' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Category</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: 15, fontWeight: 600 }}>{request.category || 'General'}</p>
          </div>

          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Description</p>
            <p style={{ margin: '0.35rem 0 0', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {request.description || 'No description provided.'}
            </p>
          </div>

          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Location / Area</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: 15, fontWeight: 600 }}>
              {request.location || request.area || 'Not provided'}
            </p>
          </div>

          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Photo</p>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Maintenance request"
                style={{ marginTop: '0.65rem', maxWidth: '100%', maxHeight: 260, borderRadius: 16, objectFit: 'cover', border: '1px solid #E5E7EB' }}
              />
            ) : (
              <p style={{ margin: '0.65rem 0 0', color: '#6B7280' }}>No photo attached</p>
            )}
          </div>

          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Date submitted</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: 15, fontWeight: 600 }}>{dateSubmitted}</p>
          </div>

          {isCompleted && (
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Payment</p>
              {typeof request.totalAmount === 'number' && request.totalAmount > 0 ? (
                <div style={{ marginTop: '0.65rem', display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ color: '#6B7280' }}>Service Cost</span>
                    <span style={{ fontWeight: 700, color: '#0B2818' }}>₦{Number(request.jobCost || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ color: '#6B7280' }}>Platform Fee (10%)</span>
                    <span style={{ fontWeight: 700, color: '#0B2818' }}>₦{Number(request.platformFee || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderTop: '1px solid #E5E7EB', paddingTop: 8 }}>
                    <span style={{ color: '#111111', fontWeight: 700 }}>Total</span>
                    <span style={{ fontWeight: 700, color: '#0B2818' }}>₦{Number(request.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                    {request.paymentStatus === 'paid' ? (
                      <>
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '0.35rem 0.75rem', borderRadius: 9999, fontSize: 12, fontWeight: 700 }}>
                          Paid on {request.paidAt ? new Date(request.paidAt).toLocaleDateString() : 'recently'}
                        </span>
                        <button type="button" onClick={() => setShowReceipt((prev) => !prev)} style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#0B2818', borderRadius: 9999, padding: '0.55rem 0.8rem', cursor: 'pointer', fontWeight: 700 }}>
                          {showReceipt ? 'Hide Receipt' : 'View Receipt'}
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={handlePayNow} disabled={paying} style={{ border: 'none', background: '#0B2818', color: '#FFFFFF', borderRadius: 9999, padding: '0.6rem 0.9rem', cursor: 'pointer', fontWeight: 700 }}>
                        {paying ? 'Redirecting...' : 'Pay Now'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ margin: '0.65rem 0 0', color: '#6B7280' }}>No service fee has been set yet.</p>
              )}
            </div>
          )}

          {showReceipt && request.paymentStatus === 'paid' && (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 18, padding: '1rem', background: '#F9FAFB' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Receipt summary</p>
              <div style={{ marginTop: '0.6rem', display: 'grid', gap: 6 }}>
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
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Service rating</p>
              {hasRating ? (
                <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} style={{ color: star <= request.rating ? '#0B2818' : '#E5E7EB', fontSize: 22 }}>
                      ★
                    </span>
                  ))}
                  <span style={{ color: '#6B7280', fontSize: 13, marginLeft: 6 }}>{request.rating}/5 rated</span>
                </div>
              ) : (
                <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: '#111111', fontWeight: 700 }}>Rate this service</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRate(star)}
                      disabled={submittingRating}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: submittingRating ? 'default' : 'pointer',
                        fontSize: 22,
                        color: '#0B2818',
                        padding: 0,
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
