import { useEffect, useState } from 'react';
import { getPendingTechnicians, getTechnicians, reviewTechnicianApplication } from '../../api/admin';
import AddTechnicianModal from '../../components/AddTechnicianModal';

const formatRating = (averageRating, totalRatedJobs) => {
  if (!totalRatedJobs || averageRating == null || averageRating === undefined) {
    return 'No ratings yet';
  }

  return `${Number(averageRating).toFixed(1)} ★`;
};

export default function Technicians() {
  const [techs, setTechs] = useState([]);
  const [pendingTechs, setPendingTechs] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadTechs = async () => {
    try {
      const [approvedRes, pendingRes] = await Promise.all([
        getTechnicians(),
        getPendingTechnicians(),
      ]);
      setTechs(approvedRes.technicians || []);
      setPendingTechs(pendingRes.technicians || []);
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

  const handleReview = async (technicianId, action) => {
    try {
      const res = await reviewTechnicianApplication(technicianId, action);
      setSuccessMessage(res.message || 'Update completed');
      setErrorMessage('');
      await loadTechs();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update technician application');
      setSuccessMessage('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '1.2rem 1.3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: '#4285F4', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Talent & onboarding</p>
            <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.55rem', color: '#111111' }}>Technicians</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6B7280' }}>Invite new technicians and review incoming applications with clarity.</p>
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
              background: '#4285F4',
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
      </div>

      {errorMessage && (
        <div style={{ padding: '0.8rem 1rem', borderRadius: 14, background: '#FEF2F2', color: '#991B1B' }}>
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div style={{ padding: '0.8rem 1rem', borderRadius: 14, background: '#ECFDF3', color: '#166534' }}>
          {successMessage}
        </div>
      )}

      {pendingTechs.length > 0 && (
        <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#111111' }}>Pending applications</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>New technician sign-ups waiting for review.</div>
            </div>
            <span style={{ background: '#F7F7F5', color: '#4285F4', borderRadius: 9999, padding: '0.35rem 0.7rem', fontSize: 13, fontWeight: 700 }}>{pendingTechs.length}</span>
          </div>
          <div style={{ padding: '1rem 1.2rem', display: 'grid', gap: 12 }}>
            {pendingTechs.map((tech) => (
              <div key={tech._id} style={{ background: '#F7F7F5', borderRadius: 18, padding: '1rem', display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#4285F4', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {tech.profilePicture ? (
                      <img src={tech.profilePicture} alt={tech.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      (tech.fullName || 'T').split(' ').map((name) => name[0]).slice(0, 2).join('').toUpperCase()
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#111111', fontSize: 17 }}>{tech.fullName}</div>
                    <div style={{ color: '#6B7280', fontSize: 14 }}>{tech.email}</div>
                    <div style={{ color: '#6B7280', fontSize: 14 }}>{tech.phone || 'No phone provided'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', fontSize: 14, color: '#374151' }}>
                  <div><strong>Location:</strong> {tech.state || '—'} {tech.lga ? `• ${tech.lga}` : ''}</div>
                  <div><strong>Specialty:</strong> {tech.specialty || 'General'}</div>
                  <div><strong>Experience:</strong> {tech.yearsOfExperience != null ? `${tech.yearsOfExperience} yrs` : '—'}</div>
                  <div><strong>Applied:</strong> {tech.dateApplied ? new Date(tech.dateApplied).toLocaleDateString() : '—'}</div>
                </div>

                {tech.bio ? <div style={{ color: '#4B5563', lineHeight: 1.6 }}>{tech.bio}</div> : null}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    {tech.idDocument ? (
                      <a href={tech.idDocument} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#4285F4', borderRadius: 9999, padding: '0.55rem 0.85rem', fontWeight: 700, textDecoration: 'none' }}>View certificate/ID</a>
                    ) : (
                      <span style={{ color: '#6B7280' }}>No document uploaded</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => handleReview(tech._id, 'approve')} style={{ border: 'none', background: '#4285F4', color: '#FFFFFF', padding: '0.6rem 0.9rem', borderRadius: 9999, cursor: 'pointer', fontWeight: 700 }}>Approve</button>
                    <button type="button" onClick={() => handleReview(tech._id, 'decline')} style={{ border: '1px solid #D1D5DB', background: '#FFFFFF', color: '#6B7280', padding: '0.6rem 0.9rem', borderRadius: 9999, cursor: 'pointer', fontWeight: 700 }}>Decline</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid #F3F4F6', fontWeight: 700, color: '#111111' }}>Approved technicians</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead style={{ background: '#F7F7F5' }}>
              <tr>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Name</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Email</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Specialty</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Assigned</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Avg Rating</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#6B7280', fontSize: 13 }}>Profile</th>
              </tr>
            </thead>
            <tbody>
              {techs.map((t) => (
                <tr key={t._id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '0.95rem 1rem', fontWeight: 700 }}>{t.fullName}</td>
                  <td style={{ padding: '0.95rem 1rem', color: '#4B5563' }}>{t.email}</td>
                  <td style={{ padding: '0.95rem 1rem', color: '#4B5563' }}>{t.specialty || 'General'}</td>
                  <td style={{ padding: '0.95rem 1rem', color: '#4B5563' }}>{t.assignedCount} assigned</td>
                  <td style={{ padding: '0.95rem 1rem', color: '#111111', fontWeight: 700 }}>{formatRating(t.averageRating, t.totalRatedJobs)}</td>
                  <td style={{ padding: '0.95rem 1rem', color: '#4B5563' }}>
                    {t.idDocument ? (
                      <a href={t.idDocument} target="_blank" rel="noreferrer" style={{ color: '#4285F4', fontWeight: 700 }}>View document</a>
                    ) : (
                      '—'
                    )}
                    {t.yearsOfExperience != null && <div style={{ fontSize: 12, marginTop: 4 }}>Exp: {t.yearsOfExperience} yrs</div>}
                    {t.bio ? <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{t.bio}</div> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddTechnicianModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
