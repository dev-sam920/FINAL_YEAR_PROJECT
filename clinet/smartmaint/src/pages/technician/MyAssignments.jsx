import { useContext, useEffect, useMemo, useState } from 'react';
import { getMyAssignments, updateRequestStatus } from '../../api/technician';
import TechnicianRequestDetailsModal from '../../components/TechnicianRequestDetailsModal';
import { AuthContext } from '../../context/AuthContext';

const statusTabs = ['All', 'Acknowledged', 'In Progress', 'Completed'];

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
    case 'submitted': return 'Submitted';
    case 'acknowledged': return 'Acknowledged';
    case 'in-progress': return 'In Progress';
    case 'completed': return 'Completed';
    default: return status;
  }
};

export default function MyAssignments() {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [note, setNote] = useState('');
  const [jobCost, setJobCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadRequests = async () => {
    try {
      const response = await getMyAssignments();
      setRequests(Array.isArray(response.requests) ? response.requests : []);
    } catch (err) {
      console.error(err);
    }
  };

  const { user, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    loadRequests();
  }, [authLoading, user]);

  const filtered = useMemo(() => requests.filter((request) => {
    if (activeTab === 'All') return true;
    const apiStatus = request.status || 'submitted';
    const tabKey = activeTab === 'In Progress' ? 'in-progress' : activeTab.toLowerCase();
    return apiStatus === tabKey;
  }), [requests, activeTab]);

  const openDetails = (request) => { setSelectedRequest(request); setIsModalOpen(true); };
  const closeDetails = () => { setSelectedRequest(null); setIsModalOpen(false); };

  const handleStatusUpdate = async (requestId, status) => {
    if (status === 'completed') {
      setPendingRequestId(requestId);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await updateRequestStatus(requestId, status, '', '');
      setSuccessMessage('Status updated');
      await loadRequests();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const confirmCompletion = async () => {
    if (!pendingRequestId) return;
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (!jobCost || Number(jobCost) <= 0) {
        setErrorMessage('Please enter a valid job cost before completing the request');
        return;
      }

      await updateRequestStatus(pendingRequestId, 'completed', note, jobCost);
      setSuccessMessage('Request marked as completed');
      setPendingRequestId(null);
      setNote('');
      setJobCost('');
      await loadRequests();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to complete request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: '#FFFFFF', color: '#111111', padding: '2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>My Assignments</h1>
          <p style={{ margin: '0.55rem 0 0', color: '#6B7280' }}>Track every request assigned to you and update its progress.</p>
        </section>

        <section style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {statusTabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{ padding: '0.55rem 0.85rem', borderRadius: 9999, border: activeTab === tab ? '1px solid #0B2818' : '1px solid #E5E7EB', background: activeTab === tab ? '#ECFDF3' : '#FFFFFF', cursor: 'pointer', fontWeight: 700 }}>
              {tab}
            </button>
          ))}
        </section>

        {errorMessage && <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: '#FEF2F2', color: '#991B1B' }}>{errorMessage}</div>}
        {successMessage && <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: '#ECFDF3', color: '#166534' }}>{successMessage}</div>}

        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          {filtered.map((request) => {
            const status = request.status || 'submitted';
            return (
              <div key={request._id} onClick={() => openDetails(request)} style={{ borderRadius: 20, background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 12px 28px rgba(17,17,17,0.08)', padding: '1.2rem', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{request.title || 'Maintenance Request'}</div>
                    <div style={{ marginTop: 6, color: '#6B7280', fontSize: 13 }}>{request.client?.fullName || 'Client'} · {request.client?.email || 'No email'} · {request.client?.phone || 'No phone'}</div>
                    <div style={{ marginTop: 6, color: '#6B7280', fontSize: 13 }}>{request.category || 'General'} · {request.location || 'Location not provided'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ padding: '0.35rem 0.8rem', borderRadius: 9999, fontSize: 12, fontWeight: 700, ...priorityBadgeStyles[request.priority || 'Medium'] }}>{request.priority || 'Medium'}</span>
                    <span style={{ padding: '0.35rem 0.8rem', borderRadius: 9999, fontSize: 12, fontWeight: 700, ...statusBadgeStyles[status] }}>{getStatusLabel(status)}</span>
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ color: '#6B7280', fontSize: 13 }}>
                    {status === 'completed' ? 'Work completed' : status === 'in-progress' ? 'Assigned for active work' : 'Awaiting technician action'}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }} onClick={(event) => event.stopPropagation()}>
                    {status === 'acknowledged' && <button type="button" onClick={() => handleStatusUpdate(request._id, 'in-progress')} style={{ border: 'none', background: '#0B2818', color: '#FFFFFF', padding: '0.7rem 1rem', borderRadius: 9999, cursor: 'pointer' }}>Start Work</button>}
                    {status === 'in-progress' && <button type="button" onClick={() => setPendingRequestId(request._id)} style={{ border: 'none', background: '#F5A623', color: '#111111', padding: '0.7rem 1rem', borderRadius: 9999, cursor: 'pointer' }}>Mark Complete</button>}
                    {status === 'completed' && <span style={{ color: '#166534', fontWeight: 700 }}>Completed</span>}
                  </div>
                </div>

                {pendingRequestId === request._id && (
                  <div style={{ marginTop: 12, padding: '0.9rem', borderRadius: 16, background: '#F9FAFB', border: '1px solid #E5E7EB' }} onClick={(event) => event.stopPropagation()}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Job Cost (₦)</label>
                    <input type="number" min="0" value={jobCost} onChange={(event) => setJobCost(event.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #E5E7EB', marginBottom: 10 }} />
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Completion note (optional)</label>
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} style={{ width: '100%', minHeight: 90, padding: '0.75rem', borderRadius: 10, border: '1px solid #E5E7EB' }} />
                    <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                      <button type="button" onClick={() => { setPendingRequestId(null); setNote(''); setJobCost(''); }} style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#111111', padding: '0.7rem 1rem', borderRadius: 9999, cursor: 'pointer' }}>Cancel</button>
                      <button type="button" onClick={confirmCompletion} disabled={loading} style={{ border: 'none', background: '#0B2818', color: '#FFFFFF', padding: '0.7rem 1rem', borderRadius: 9999, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.8 : 1 }}>Finish Request</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
      {isModalOpen && <TechnicianRequestDetailsModal request={selectedRequest} onClose={closeDetails} />}
    </main>
  );
}
