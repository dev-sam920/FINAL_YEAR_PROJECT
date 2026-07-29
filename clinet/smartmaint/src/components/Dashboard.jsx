import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import authService from '../api/authService';
import './css/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Check if user has a valid access token from backend login
    const token = authService.getAccessToken();
    
    // If no token, still set a default user for display (for testing)
    // In production, you would redirect to login here: navigate('/login');
    
    // Set user object with default values if no token
    setUser({ name: 'User Account', email: 'user@example.com', authenticated: !!token });
    setLoading(false);
  }, [navigate]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      await signOut(auth);
      setIsDropdownOpen(false);
      navigate('/');
    } catch (error) {
      setError('Failed to logout. Please try again.');
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h1></h1>
        </div>
        <div className="profile-menu-wrapper" ref={dropdownRef}>
          <button 
            className="profile-avatar"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            title="Profile Menu"
          >
            {getInitials()}
          </button>
          
          {isDropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="user-display-name">{user?.name || 'User'}</div>
                <div className="user-display-email">{user?.email || 'user@example.com'}</div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <button 
                className="dropdown-item"
                onClick={() => {
                  navigate('/profile');
                  setIsDropdownOpen(false);
                }}
              >
                <span className="material-symbols-outlined">edit</span>
                Edit Profile
              </button>
              
              <button className="dropdown-item">
                <span className="material-symbols-outlined">lock</span>
                Change Password
              </button>
              
              <div className="dropdown-divider"></div>
              
              <button 
                className="dropdown-item logout-item"
                onClick={handleLogout}
                disabled={loading}
              >
                <span className="material-symbols-outlined">logout</span>
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <section className="welcome-section">
            <h2>Welcome back, {user?.name || user?.email?.split('@')[0]}! 👋</h2>
            <p>You're successfully logged in to SmartMaint</p>
          </section>

          {error && <div className="error-message">{error}</div>}
        </div>
      </main>
    </div>
  );
}
