import { useEffect, useState } from 'react';
import { getTechnicians } from '../../api/admin';
import AddTechnicianModal from '../../components/AddTechnicianModal';

const formatRating = (averageRating, totalRatedJobs) => {
  if (!totalRatedJobs || averageRating == null || averageRating === undefined) {
    return 'No ratings yet';
  }

  return `${Number(averageRating).toFixed(1)} ★`;
};

export default function Technicians() {
  const [techs, setTechs] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadTechs = async () => {
    try {
      const res = await getTechnicians();
      setTechs(res.technicians || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTechs();
  }, []);

  const handleCreated = async () => {
    setSuccessMessage('Technician added, login details sent to their email');
    setErrorMessage('');
    await loadTechs();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>Technicians</h1>
          <p style={{ margin: '0.4rem 0 0', color: '#6B7280' }}>Invite new technicians and manage their specialties.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setErrorMessage('');
            setSuccessMessage('');
            setIsAddModalOpen(true);
          }}
          style={{
            border: 'none',
            background: '#0B2818',
            color: '#FFFFFF',
            padding: '0.8rem 1.2rem',
            borderRadius: 9999,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Add Technician
        </button>
      </div>

      {errorMessage && (
        <div style={{ marginTop: 16, padding: '0.8rem 1rem', borderRadius: 12, background: '#FEF2F2', color: '#991B1B' }}>
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div style={{ marginTop: 16, padding: '0.8rem 1rem', borderRadius: 12, background: '#ECFDF3', color: '#166534' }}>
          {successMessage}
        </div>
      )}

      <div style={{ marginTop: 18, border: '1px solid #E5E7EB', borderRadius: 20, overflow: 'hidden', background: '#FFFFFF' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#F9FAFB' }}>
            <tr>
              <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Name</th>
              <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Email</th>
              <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Specialty</th>
              <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Assigned</th>
              <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Avg Rating</th>
              <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Rated Jobs</th>
            </tr>
          </thead>
          <tbody>
            {techs.map((t) => (
              <tr key={t._id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={{ padding: '0.95rem 1rem', fontWeight: 700 }}>{t.fullName}</td>
                <td style={{ padding: '0.95rem 1rem', color: '#4B5563' }}>{t.email}</td>
                <td style={{ padding: '0.95rem 1rem', color: '#4B5563' }}>{t.specialty || 'General'}</td>
                <td style={{ padding: '0.95rem 1rem', color: '#4B5563' }}>{t.assignedCount} assigned</td>
                <td style={{ padding: '0.95rem 1rem', color: '#111111', fontWeight: 700 }}>{formatRating(t.averageRating, t.totalRatedJobs)}</td>
                <td style={{ padding: '0.95rem 1rem', color: '#4B5563' }}>{t.totalRatedJobs || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddTechnicianModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
