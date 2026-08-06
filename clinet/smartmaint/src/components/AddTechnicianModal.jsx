import { useState } from 'react';
import { createTechnician } from '../api/admin';

export default function AddTechnicianModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({ fullName: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await createTechnician({ fullName: formData.fullName, email: formData.email });
      setFormData({ fullName: '', email: '' });
      if (onCreated) {
        await onCreated(res);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create technician');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 17, 17, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 4000,
        isolation: 'isolate',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#FFFFFF',
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(17, 17, 17, 0.25)',
          padding: '1.35rem',
          position: 'relative',
          zIndex: 4001,
          pointerEvents: 'auto',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Add Technician</h2>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#111111' }}>
            ✕
          </button>
        </div>

        {errorMessage && (
          <div style={{ marginTop: 12, padding: '0.8rem 1rem', borderRadius: 12, background: '#FEF2F2', color: '#991B1B' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Full Name</label>
            <input
              required
              value={formData.fullName}
              onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#111111' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#111111' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#111111', padding: '0.7rem 1rem', borderRadius: 9999, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ border: 'none', background: '#4285F4', color: '#FFFFFF', padding: '0.7rem 1rem', borderRadius: 9999, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.8 : 1 }}
            >
              {loading ? 'Creating...' : 'Create Technician'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
