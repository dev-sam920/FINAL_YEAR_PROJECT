import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { changePassword as apiChangePassword, updateNotificationPreferences } from '../../api/user';
import './Profile.css';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState('');
  const [pwdError, setPwdError] = useState('');

  const [prefs, setPrefs] = useState({ emailNotifications: true, inAppNotifications: true });
  const [prefsMessage, setPrefsMessage] = useState('');

  useEffect(() => {
    if (user) {
      setPrefs({ emailNotifications: !!user.emailNotifications, inAppNotifications: !!user.inAppNotifications });
    }
  }, [user]);

  const handlePwdChange = (e) => setPasswords((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submitPassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdMessage('');
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setPwdError('New passwords do not match');
      return;
    }
    setLoadingPwd(true);
    try {
      const data = await apiChangePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPwdMessage(data.message || 'Password updated');
      setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setPwdError(err.message || 'Failed to update password');
    } finally {
      setLoadingPwd(false);
    }
  };

  const togglePref = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      const res = await updateNotificationPreferences(next);
      setPrefsMessage(res.message || 'Preferences updated');
      if (res.user) setUser((prev) => ({ ...prev, ...res.user }));
    } catch (err) {
      setPrefsMessage(err.message || 'Failed to update preferences');
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences and security settings.</p>
        </div>
      </div>

      <div className="profile-card">
        <h2>Change Password</h2>
        {pwdMessage && <div className="message-banner success-banner">✓ {pwdMessage}</div>}
        {pwdError && <div className="message-banner error-banner">✕ {pwdError}</div>}
        <form className="form-grid" onSubmit={submitPassword}>
          <div className="form-group full-width">
            <label className="form-label" htmlFor="currentPassword">Current Password</label>
            <input id="currentPassword" name="currentPassword" type="password" value={passwords.currentPassword} onChange={handlePwdChange} className="form-input" />
          </div>
          <div className="form-group full-width">
            <label className="form-label" htmlFor="newPassword">New Password</label>
            <input id="newPassword" name="newPassword" type="password" value={passwords.newPassword} onChange={handlePwdChange} className="form-input" />
          </div>
          <div className="form-group full-width">
            <label className="form-label" htmlFor="confirmNewPassword">Confirm New Password</label>
            <input id="confirmNewPassword" name="confirmNewPassword" type="password" value={passwords.confirmNewPassword} onChange={handlePwdChange} className="form-input" />
          </div>
          <div className="action-row full-width">
            <button className="btn-primary" type="submit" disabled={loadingPwd}>{loadingPwd ? 'Updating...' : 'Update Password'}</button>
          </div>
        </form>
      </div>

      <div className="profile-card">
        <h2>Notification Preferences</h2>
        {prefsMessage && <div className="message-banner success-banner">✓ {prefsMessage}</div>}
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span>Email Notifications</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={prefs.emailNotifications} onChange={() => togglePref('emailNotifications')} />
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span>In-App Notifications</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={prefs.inAppNotifications} onChange={() => togglePref('inAppNotifications')} />
            </div>
          </label>
        </div>
      </div>

      <div className="profile-card">
        <h2>Account</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" type="button" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
          <DeleteAccountCard setUser={setUser} logout={logout} />
        </div>
      </div>

      <div className="profile-card" style={{ border: '1px solid rgba(220,38,38,0.12)', background: '#fff6f6' }}>
        <h2>Danger Zone</h2>
        <p style={{ color: '#7a1f1f' }}>Deleting your account is permanent and cannot be undone. All your personal data will be removed, but historical requests will be retained for reporting.</p>
        <DeleteAccountCard setUser={setUser} logout={logout} />
      </div>
    </div>
  );
}

function DeleteAccountCard({ setUser, logout }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const confirmDelete = async () => {
    setError('');
    setMessage('');
    if (!password) return setError('Please enter your password to confirm');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/client/account`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete account');
      setMessage(data.message || 'Account deleted');
      // Clear client-side user and redirect to login
      setUser(null);
      logout();
    } catch (err) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {message && <div className="message-banner success-banner">✓ {message}</div>}
      {error && <div className="message-banner error-banner">✕ {error}</div>}
      <button className="btn-danger" type="button" onClick={() => setOpen(true)}>Delete Account</button>

      {open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Account Deletion</h2>
              <button className="modal-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#7a1f1f' }}>This action cannot be undone. Type your password to confirm account deletion.</p>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="Enter your password" />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="btn-danger" type="button" onClick={confirmDelete} disabled={loading}>{loading ? 'Deleting...' : 'Confirm Delete'}</button>
                <button className="btn-primary" type="button" onClick={() => setOpen(false)} style={{ background: '#E5E7EB', color: '#111' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
