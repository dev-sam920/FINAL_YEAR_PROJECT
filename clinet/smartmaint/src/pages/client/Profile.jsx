import { useContext, useEffect, useRef, useState } from 'react';
import NaijaStates from 'naija-state-local-government';
import { AuthContext } from '../../context/AuthContext';
import { updateProfile, changePassword, uploadProfilePicture } from '../../api/user';
import './Profile.css';

const stateOptions = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

const getLgaOptions = (selectedState) => {
  if (!selectedState || !selectedState.trim()) {
    return [];
  }

  try {
    const response = NaijaStates.lgas(selectedState);
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.lgas)) {
      return response.lgas;
    }
    return [];
  } catch (error) {
    console.error('Failed to load local governments:', error);
    return [];
  }
};

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    unitAddress: user?.unitAddress || '',
    state: user?.state || '',
    lga: user?.lga || '',
  });
  const [availableLgas, setAvailableLgas] = useState([]);
  const [lgaHelpText, setLgaHelpText] = useState('Select a state first');

  useEffect(() => {
    if (user) {
      const nextProfile = {
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        unitAddress: user.unitAddress || '',
        state: user.state || '',
        lga: user.lga || '',
      };
      setProfile(nextProfile);
      if (nextProfile.state) {
        const nextLgas = getLgaOptions(nextProfile.state);
        setAvailableLgas(nextLgas);
        setLgaHelpText(nextLgas.length > 0 ? '' : 'No local governments available for this state');
      } else {
        setAvailableLgas([]);
        setLgaHelpText('Select a state first');
      }
    }
  }, [user]);

  useEffect(() => {
    if (!profile.state) {
      setAvailableLgas([]);
      setProfile((prev) => ({ ...prev, lga: '' }));
      return;
    }

    const nextLgas = getLgaOptions(profile.state);
    setAvailableLgas(nextLgas);
    setLgaHelpText(nextLgas.length > 0 ? '' : 'No local governments available for this state');

    setProfile((prev) => {
      if (prev.lga && !nextLgas.includes(prev.lga)) {
        return { ...prev, lga: '' };
      }
      return prev;
    });
  }, [profile.state]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef(null);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Please upload a JPG or PNG image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be smaller than 5MB');
      return;
    }

    setPhotoError('');
    setUploadingPhoto(true);

    try {
      const data = await uploadProfilePicture(file);
      setUser((prev) => ({
        ...(prev || {}),
        ...data.user,
        role: data.user?.role ?? prev?.role,
      }));
      setProfile((prev) => ({ ...prev, ...data.user }));
      setProfileMessage('Profile picture updated successfully');
    } catch (error) {
      setPhotoError(error.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLoadingProfile(true);
    setProfileError('');
    setProfileMessage('');

    try {
      const data = await updateProfile({
        fullName: profile.fullName,
        phone: profile.phone,
        unitAddress: profile.unitAddress,
        state: profile.state,
        lga: profile.lga,
      });

      setProfileMessage(data.message || 'Profile updated successfully');
      setUser((prev) => ({
        ...(prev || {}),
        ...data.user,
        role: data.user?.role ?? prev?.role,
      }));
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setLoadingPassword(true);

    try {
      const data = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordMessage(data.message || 'Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Update your account details and change your password securely.</p>
        </div>
      </div>

      <div className="profile-card">
        <h2>Account Details</h2>
        <div className="profile-avatar-row">
          <button
            type="button"
            className="profile-avatar-button"
            onClick={handleAvatarClick}
            disabled={uploadingPhoto}
          >
            <div className="profile-avatar">
              {uploadingPhoto ? (
                <div className="avatar-loading" />
              ) : user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" />
              ) : (
                user?.fullName
                  .split(' ')
                  .filter(Boolean)
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              )}
            </div>
          </button>
          <div className="avatar-info">
            <button type="button" className="edit-photo-button" onClick={handleAvatarClick} disabled={uploadingPhoto}>
              {uploadingPhoto ? 'Uploading...' : 'Edit Photo'}
            </button>
            <p className="avatar-help">Click the avatar to upload a JPG/PNG image (max 5MB).</p>
            {photoError && <div className="error-text">{photoError}</div>}
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg"
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
        {profileMessage && <div className="message-banner success-banner">✓ {profileMessage}</div>}
        {profileError && <div className="message-banner error-banner">✕ {profileError}</div>}
        <form className="form-grid" onSubmit={handleSaveProfile}>
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={profile.fullName}
              onChange={handleProfileChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={profile.email}
              readOnly
              className="form-input read-only"
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={profile.phone}
              onChange={handleProfileChange}
              className="form-input"
            />
          </div>
          <div className="form-group full-width">
            <label htmlFor="unitAddress" className="form-label">Unit / Apartment / Property Address</label>
            <input
              id="unitAddress"
              name="unitAddress"
              type="text"
              value={profile.unitAddress}
              onChange={handleProfileChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="state" className="form-label">State</label>
            <select id="state" name="state" value={profile.state} onChange={handleProfileChange} className="form-input">
              <option value="">Select state</option>
              {stateOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="lga" className="form-label">Local Government</label>
            <select id="lga" name="lga" value={profile.lga} onChange={handleProfileChange} className="form-input" disabled={!profile.state || availableLgas.length === 0}>
              <option value="">{profile.state ? (availableLgas.length > 0 ? 'Select local government' : 'No local governments available') : 'Select a state first'}</option>
              {availableLgas.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {lgaHelpText && <div className="form-help">{lgaHelpText}</div>}
          </div>

          <div className="action-row full-width">
            <button
              className="btn-primary"
              type="button"
              disabled={loadingProfile}
              onClick={(event) => handleSaveProfile(event)}
            >
              {loadingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="profile-card">
        <h2>Change Password</h2>
        {passwordMessage && <div className="message-banner success-banner">✓ {passwordMessage}</div>}
        {passwordError && <div className="message-banner error-banner">✕ {passwordError}</div>}
        <form className="form-grid" onSubmit={handleUpdatePassword}>
          <div className="form-group full-width">
            <label htmlFor="currentPassword" className="form-label">Current Password</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="form-input"
            />
          </div>
          <div className="form-group full-width">
            <label htmlFor="newPassword" className="form-label">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="form-input"
            />
          </div>
          <div className="form-group full-width">
            <label htmlFor="confirmNewPassword" className="form-label">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              value={passwordData.confirmNewPassword}
              onChange={handlePasswordChange}
              className="form-input"
            />
          </div>

          <div className="action-row full-width">
            <button className="btn-primary" type="submit" disabled={loadingPassword}>
              {loadingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
