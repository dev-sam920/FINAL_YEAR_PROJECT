import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getMyRequests } from '../api/requests';
import './ClientDashboard.css';

export default function ClientDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // State management
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Fetch requests on component mount
  useEffect(() => {
    // Get user info from localStorage
    const email = localStorage.getItem('userEmail') || '';
    const name = localStorage.getItem('userName') || '';
    setUserEmail(email);
    setUserName(name);

    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getMyRequests();
        const requestsData = response.requests || [];
        setRequests(Array.isArray(requestsData) ? requestsData : []);
      } catch (err) {
        console.error('Failed to fetch requests:', err);
        setError('Failed to load requests. Please try again.');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesTab = activeTab === 'all' || req.status === activeTab;
    const matchesSearch = req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.requestId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getInitials = () => {
    const name = user?.fullName || userEmail;
    if (name) {
      return name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'JD';
  };

  const getDisplayName = () => {
    if (user?.fullName) return user.fullName;
    if (userEmail) return userEmail;
    return 'John Doe';
  };

  const profileAvatarContent = () => {
    if (user?.profilePicture) {
      return <img src={user.profilePicture} alt={getDisplayName()} />;
    }
    return getInitials();
  };

  // Count by status for tabs
  const tabCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    'in-progress': requests.filter(r => r.status === 'In Progress').length,
    completed: requests.filter(r => r.status === 'Completed').length
  };

  // Pagination
  const itemsPerPage = 5;
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

  // Handle row selection
  const toggleRowSelection = (requestId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedRequests.length) {
      setSelectedRows(new Set());
    } else {
      const allIds = new Set(paginatedRequests.map(r => r._id));
      setSelectedRows(allIds);
    }
  };

  return (
    <>
      {/* Main Content */}
      <div className="main-content">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="navbar-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search requests... ⌘K"
              className="search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="navbar-profile" ref={dropdownRef}>
            <button
              className="profile-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="profile-avatar">{profileAvatarContent()}</div>
              <span className="profile-name">{getDisplayName()}</span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {dropdownOpen && (
              <div className="profile-dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/profile');
                    setDropdownOpen(false);
                  }}
                >
                  Edit Profile
                </button>
                <button className="dropdown-item">Change Password</button>
                <button
                  className="dropdown-item logout-item"
                  onClick={() => {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userRole');
                    navigate('/login');
                    setDropdownOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">My Requests</h1>
          <button 
            className="btn-submit-new"
            onClick={() => navigate('/submit-request')}
          >
            + Submit New Request
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs-row">
          <div className="filter-tabs">
            <button
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
            >
              All Requests
              <span className="tab-count">{tabCounts.all}</span>
            </button>
            <button
              className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('pending');
                setCurrentPage(1);
              }}
            >
              Pending
              <span className="tab-count">{tabCounts.pending}</span>
            </button>
            <button
              className={`tab ${activeTab === 'in-progress' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('in-progress');
                setCurrentPage(1);
              }}
            >
              In Progress
              <span className="tab-count">{tabCounts['in-progress']}</span>
            </button>
            <button
              className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('completed');
                setCurrentPage(1);
              }}
            >
              Completed
              <span className="tab-count">{tabCounts.completed}</span>
            </button>
          </div>
          <button className="btn-filter">
            <span>⊙</span> Filter
          </button>
        </div>

        {/* Search and Results Info */}
        <div className="table-header">
          <div className="search-table">
            <span className="search-icon-small">🔍</span>
            <input
              type="text"
              placeholder="Search requests..."
              className="search-input-small"
            />
          </div>
          <div className="results-info">
            Showing {paginatedRequests.length} of {requests.length} results
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div className="table-empty-state">
              <div className="loading-spinner">⏳</div>
              <p>Loading your requests...</p>
            </div>
          ) : error ? (
            <div className="table-error-state">
              <p className="error-text">{error}</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="table-empty-state">
              <div className="empty-icon">📋</div>
              <h3>No requests yet</h3>
              <p>Click '+ Submit New Request' to get started</p>
            </div>
          ) : (
            <table className="requests-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedRows.size === paginatedRequests.length && paginatedRequests.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Request ID</th>
                  <th>Issue Description</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((request) => (
                  <tr key={request._id}>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedRows.has(request._id)}
                        onChange={() => toggleRowSelection(request._id)}
                      />
                    </td>
                    <td className="request-id">{request.requestId || request._id}</td>
                    <td className="description">{request.title}</td>
                    <td className="category">{request.category}</td>
                    <td>
                      <span className={`badge badge-priority-${request.priority.toLowerCase()}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-status-${request.status.toLowerCase().replace(/\s/g, '-')}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="date-submitted">{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td className="action-cell">
                      <button className="action-menu">⋮</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {requests.length > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {paginatedRequests.length} of {requests.length} results
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
