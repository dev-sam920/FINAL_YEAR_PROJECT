import { useState } from 'react';
import { changeTechnicianPassword } from '../api/technician';

export default function ForcePasswordChangeModal({ user, onUpdated, open = true }) {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!open || !user || user.role !== 'technician' || user.passwordChanged) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setErrorMessage('Please fill in all password fields');
      return;
    }

    if (formData.newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await changeTechnicianPassword(formData.currentPassword, formData.newPassword);
      if (onUpdated) {
        onUpdated({ ...user, passwordChanged: true, passwordChangedAt: new Date().toISOString() });
      }
      if (response?.message) {
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Current password incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 2000 }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 24, boxShadow: '0 24px 60px rgba(17,17,17,0.25)', padding: '1.35rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ margin: 0, color: '#4285F4', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Security notice</p>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111111' }}>Change your password</h2>
          <p style={{ margin: 0, color: '#6B7280', lineHeight: 1.5 }}>This is your first login, so you need to set a new password before continuing.</p>
        </div>

        {errorMessage && (
          <div style={{ marginTop: 12, padding: '0.8rem 1rem', borderRadius: 12, background: '#FEF2F2', color: '#991B1B' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Current Password</label>
            <input type="password" value={formData.currentPassword} onChange={(event) => setFormData({ ...formData, currentPassword: event.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #E5E7EB' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>New Password</label>
            <input type="password" value={formData.newPassword} onChange={(event) => setFormData({ ...formData, newPassword: event.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #E5E7EB' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Confirm New Password</label>
            <input type="password" value={formData.confirmPassword} onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #E5E7EB' }} />
          </div>

          <button type="submit" disabled={loading} style={{ border: 'none', background: '#4285F4', color: '#FFFFFF', padding: '0.8rem 1rem', borderRadius: 9999, fontWeight: 700, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.8 : 1 }}>
            {loading ? 'Updating password...' : 'Save new password'}
          </button>
        </form>
      </div>
    </div>
  );
}
