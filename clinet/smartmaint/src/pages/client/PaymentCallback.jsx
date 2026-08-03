import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyPayment } from '../../api/payments';

export default function PaymentCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(location.search);
      const reference = params.get('reference');

      if (!reference) {
        setStatus('failure');
        setMessage('No payment reference was provided.');
        return;
      }

      try {
        const data = await verifyPayment(reference);
        setStatus('success');
        setMessage(data.message || 'Payment completed successfully.');
      } catch (error) {
        setStatus('failure');
        setMessage(error.message || 'Payment could not be verified.');
      }
    };

    verify();
  }, [location.search]);

  return (
    <main style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 24, boxShadow: '0 18px 36px rgba(0,0,0,0.08)', padding: '2rem', maxWidth: 500, width: '100%', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#0B2818', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Payment status</p>
        <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.6rem', color: '#111111' }}>{status === 'success' ? 'Payment successful' : 'Payment issue'}</h1>
        <p style={{ margin: '0.9rem 0 0', lineHeight: 1.7, color: '#4B5563' }}>{message}</p>
        <button
          type="button"
          onClick={() => navigate('/my-requests')}
          style={{ marginTop: 20, border: 'none', background: '#0B2818', color: '#FFFFFF', borderRadius: 9999, padding: '0.8rem 1rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Return to My Requests
        </button>
      </div>
    </main>
  );
}
