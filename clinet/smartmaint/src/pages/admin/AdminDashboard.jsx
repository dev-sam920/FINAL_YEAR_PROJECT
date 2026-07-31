import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance.js';
import { AuthContext } from '../../context/AuthContext';
import './AdminDashboard.css';

const normalizeStatusValue = (value) => {
  if (!value) return '';

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'pending') return 'submitted';
  if (normalized === 'in progress' || normalized === 'in-progress') return 'in-progress';
  if (normalized === 'completed') return 'completed';
  return normalized;
};

const getStatusLabel = (value) => {
  const normalized = normalizeStatusValue(value);
  if (normalized === 'submitted') return 'Submitted';
  if (normalized === 'acknowledged') return 'Acknowledged';
  if (normalized === 'in-progress') return 'In Progress';
  if (normalized === 'completed') return 'Completed';
  return value || 'Unknown';
};

const getStatusBadgeClass = (value) => {
  const normalized = normalizeStatusValue(value);
  if (normalized === 'submitted') return 'pending';
  if (normalized === 'acknowledged') return 'pending';
  if (normalized === 'in-progress') return 'in-progress';
  if (normalized === 'completed') return 'completed';
  return 'pending';
};

// Assign Technician Modal Component
function AssignTechnicianModal({ isOpen, onClose, requestId, requestTitle, onAssignSuccess }) {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(null);
  const [error, setError] = useState(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTechnicians();
      setSelectedTechnicianId(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/admin/technicians');
      const techData = response.data?.technicians || response.data?.data || response.data || [];
      setTechnicians(Array.isArray(techData) ? techData : []);
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
      setError('Failed to load technicians. Please try again.');
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTechnicianId) {
      setError('Please select a technician');
      return;
    }

    try {
      setAssigning(true);
      setError(null);
      await axiosInstance.patch(`/admin/requests/${requestId}/assign`, {
        technicianId: selectedTechnicianId
      });
      onAssignSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to assign technician:', err);
      setError(err.response?.data?.message || 'Failed to assign technician. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  const availableTechnicians = technicians.filter(t => t.status === 'available' || t.status === 'Available');

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Assign Technician</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-request-info">
            <p className="modal-label">Request ID: {requestId}</p>
            <p className="modal-label">Issue: {requestTitle}</p>
          </div>

          {error && <div className="modal-error">{error}</div>}

          {loading ? (
            <div className="modal-loading">Loading technicians...</div>
          ) : availableTechnicians.length === 0 ? (
            <div className="modal-empty">No available technicians</div>
          ) : (
            <div className="technician-cards">
              {availableTechnicians.map(tech => (
                <div
                  key={tech._id}
                  className={`technician-card ${selectedTechnicianId === tech._id ? 'selected' : ''}`}
                  onClick={() => setSelectedTechnicianId(tech._id)}
                >
                  <div className="tech-avatar">{tech.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TH'}</div>
                  <div className="tech-info">
                    <div className="tech-name">{tech.name}</div>
                    <div className="tech-specialty">{tech.specialty || 'General'}</div>
                    <div className="tech-status">
                      <span className={`status-badge ${tech.status?.toLowerCase() === 'available' ? 'available' : 'busy'}`}>
                        {tech.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="btn-assign"
            onClick={handleAssign}
            disabled={!selectedTechnicianId || assigning}
          >
            {assigning ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // State management
  const [activeNav, setActiveNav] = useState('dashboard');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Data state
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    const name = localStorage.getItem('userName') || '';
    setUserEmail(email);
    setUserName(name);
  }, []);

  const { user, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    fetchStats();
    fetchRequests();
  }, [authLoading, user]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axiosInstance.get('/admin/stats');
      const statsData = response.data?.data || response.data || {};
      setStats({
        totalRequests: statsData.totalRequests || 0,
        pendingRequests: statsData.pendingRequests || 0,
        inProgressRequests: statsData.inProgressRequests || 0,
        completedRequests: statsData.completedRequests || 0
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/admin/requests');
      const requestsData = response.data?.requests || response.data?.data || response.data || [];
      setRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Failed to load requests. Please try again.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (userName) {
      return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (userEmail) {
      return userEmail.split('@')[0].slice(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const getDisplayName = () => {
    if (userName) return userName;
    if (userEmail) return userEmail;
    return 'Admin User';
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const normalizedStatus = normalizeStatusValue(req.status);
    const normalizedActiveTab = activeTab === 'all' ? 'all' : normalizeStatusValue(activeTab);
    const matchesTab = normalizedActiveTab === 'all' || normalizedStatus === normalizedActiveTab;
    const matchesSearch = 
      req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIdx, startIdx + itemsPerPage);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAssignClick = (request) => {
    setSelectedRequest(request);
    setIsAssignModalOpen(true);
  };

  const handleAssignSuccess = () => {
    fetchRequests();
    fetchStats();
  };

  const handleMenuAction = (action, request) => {
    switch(action) {
      case 'view':
        navigate(`/admin/requests/${request._id}`);
        break;
      case 'assign':
        handleAssignClick(request);
        break;
      case 'complete':
        markRequestComplete(request._id);
        break;
      case 'delete':
        deleteRequest(request._id);
        break;
      default:
        break;
    }
  };

  const markRequestComplete = async (requestId) => {
    if (!window.confirm('Mark this request as complete?')) return;
    try {
      await axiosInstance.patch(`/admin/requests/${requestId}`, { status: 'completed' });
      fetchRequests();
      fetchStats();
    } catch (err) {
      console.error('Failed to complete request:', err);
    }
  };

  const deleteRequest = async (requestId) => {
    if (!window.confirm('Delete this request? This action cannot be undone.')) return;
    try {
      await axiosInstance.delete(`/admin/requests/${requestId}`);
      fetchRequests();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete request:', err);
    }
  };

  return (
    <>
      {/* KPI Cards */}
      <div className="admin-kpi-section">
        <div className="admin-kpi-card">
          <div className="admin-kpi-border total"></div>
          <div className="admin-kpi-content">
            <div className="admin-kpi-value">{stats.totalRequests}</div>
            <div className="admin-kpi-label">Total Requests</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-border pending"></div>
          <div className="admin-kpi-content">
            <div className="admin-kpi-value">{stats.pendingRequests}</div>
            <div className="admin-kpi-label">Pending</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-border inprogress"></div>
          <div className="admin-kpi-content">
            <div className="admin-kpi-value">{stats.inProgressRequests}</div>
            <div className="admin-kpi-label">In Progress</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-border completed"></div>
          <div className="admin-kpi-content">
            <div className="admin-kpi-value">{stats.completedRequests}</div>
            <div className="admin-kpi-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">All Requests</h1>
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs-row">
        <div className="admin-filter-tabs">
          <button
            className={`admin-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
          >
            All
            <span className="admin-tab-count">{requests.length}</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'submitted' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('submitted');
              setCurrentPage(1);
            }}
          >
            Pending
            <span className="admin-tab-count">{requests.filter(r => normalizeStatusValue(r.status) === 'submitted').length}</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'in-progress' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('in-progress');
              setCurrentPage(1);
            }}
          >
            In Progress
            <span className="admin-tab-count">{requests.filter(r => normalizeStatusValue(r.status) === 'in-progress').length}</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('completed');
              setCurrentPage(1);
            }}
          >
            Completed
            <span className="admin-tab-count">{requests.filter(r => normalizeStatusValue(r.status) === 'completed').length}</span>
          </button>
        </div>
      </div>

      {/* Search and Results Info */}
      <div className="admin-table-header">
        <div className="admin-search-table">
          <span className="admin-search-icon-small">🔍</span>
          <input
            type="text"
            placeholder="Search by request ID, client, or issue..."
            className="admin-search-input-small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="admin-results-info">
          Showing {paginatedRequests.length} of {filteredRequests.length} results
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-table-empty-state">
            <div className="admin-loading-spinner">⏳</div>
            <p>Loading requests...</p>
          </div>
        ) : error ? (
          <div className="admin-table-error-state">
            <p style={{ color: '#e74c3c' }}>{error}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="admin-table-empty-state">
            <div className="admin-empty-icon">📋</div>
            <h3>No requests found</h3>
            <p>No maintenance requests in the system yet</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Client Name</th>
                <th>Issue Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.map(request => (
                <tr key={request._id}>
                  <td className="request-id">{request._id?.slice(-6) || 'N/A'}</td>
                  <td>{request.clientName || 'Unknown'}</td>
                  <td>{request.title}</td>
                  <td>{request.category}</td>
                  <td>
                    <span className={`priority-badge ${request.priority?.toLowerCase()}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-menu">
                      <button
                        className="action-btn"
                        onClick={() => {
                          const menu = event.currentTarget.nextElementSibling;
                          menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                        }}
                      >
                        ⋮
                      </button>
                      <div className="action-dropdown" style={{ display: 'none' }}>
                        <button onClick={() => handleMenuAction('view', request)}>View Details</button>
                        <button onClick={() => handleMenuAction('assign', request)}>Assign Technician</button>
                        <button onClick={() => handleMenuAction('complete', request)}>Mark Complete</button>
                        <button className="delete-action" onClick={() => handleMenuAction('delete', request)}>Delete</button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={currentPage === page ? 'active' : ''}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            &gt;
          </button>
        </div>
      )}

      {/* Assign Technician Modal */}
      <AssignTechnicianModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedRequest(null);
        }}
        requestId={selectedRequest?._id}
        requestTitle={selectedRequest?.title}
        onAssignSuccess={handleAssignSuccess}
      />
    </>
  );
}
