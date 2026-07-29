import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getMyRequests, rateRequest } from '../../api/requests';
import StatusTimeline from '../../components/StatusTimeline';
import RequestDetailsModal from '../../components/RequestDetailsModal';
import './MyRequests.css';

const statusLabelMap = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

const getStatusLabel = (status) => statusLabelMap[status] || status || 'Submitted';
const getStatusSlug = (status) => (status || 'submitted').toLowerCase().replace(/\s+/g, '-');
const getPrioritySlug = (priority) => (priority || 'medium').toLowerCase();

const RequestCard = ({ request, onOpenDetails }) => {
  const dateString = new Date(request.createdAt).toLocaleDateString();
  const prioritySlug = getPrioritySlug(request.priority);
  const statusSlug = getStatusSlug(request.status);

  return (
    <button type="button" className="request-card" onClick={() => onOpenDetails(request)}>
      <div className="request-card-header">
        <div>
          <p className="request-card-title">{request.title || request.category || 'Maintenance Request'}</p>
          <p className="request-card-meta">{request.category || 'General'} · {dateString}</p>
        </div>
        <div className="request-card-badges">
          <span className={`request-badge priority-${prioritySlug}`}>{request.priority || 'Medium'}</span>
          <span className={`request-badge status-${statusSlug}`}>{getStatusLabel(statusSlug)}</span>
        </div>
      </div>

      <div className="request-card-body">
        <StatusTimeline currentStatus={statusSlug} />
      </div>
    </button>
  );
};

export default function MyRequests() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getMyRequests();
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      } catch (err) {
        setError(err.message || 'Unable to load your requests');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const currentStatus = (r.status || '').toLowerCase();
      if (statusFilter !== 'All' && currentStatus !== statusFilter.toLowerCase()) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (r.title || '').toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q);
    });
  }, [requests, statusFilter, query]);

  const openDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeDetails = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleRating = async (request, rating) => {
    try {
      const data = await rateRequest(request._id, rating);
      setRequests((prev) => prev.map((item) => (item._id === request._id ? data.request : item)));
      setSelectedRequest((prev) => (prev && prev._id === request._id ? data.request : prev));
    } catch (err) {
      console.error('Failed to save rating', err);
    }
  };

  return (
    <main className="my-requests-page">
      <div className="my-requests-container">
        <section className="page-header">
          <div className="page-meta">
            <span className="page-badge">My Requests</span>
            <h1 className="page-title">All your requests</h1>
            <p className="page-subtitle">{user?.email || 'No email available'}</p>
          </div>
          <button className="btn-submit-new" type="button" onClick={() => navigate('/submit-request')}>
            + Submit New Request
          </button>
        </section>

        <section className="requests-toolbar">
          <div className="status-filter">
            {['All', 'Submitted', 'Acknowledged', 'In Progress', 'Completed'].map((status) => (
              <button
                key={status}
                type="button"
                className={`status-pill ${statusFilter === status ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter(status);
                  setQuery('');
                }}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search by title or category"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </section>

        {loading ? (
          <div className="request-loading">Loading your requests...</div>
        ) : error ? (
          <div className="request-error">{error}</div>
        ) : requests.length === 0 ? (
          <div className="request-empty-state">
            <p className="no-requests-title">No requests yet</p>
            <p className="no-requests-copy">Submit your first request to get started.</p>
          </div>
        ) : (
          <div className="request-list">
            {filtered.map((request) => (
              <RequestCard key={request._id} request={request} onOpenDetails={openDetails} />
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <RequestDetailsModal request={selectedRequest} onClose={closeDetails} onRate={handleRating} />
      )}
    </main>
  );
}
