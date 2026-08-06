import { useContext, useEffect, useState } from 'react';
import NaijaStates from 'naija-state-local-government';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { updateProfile } from '../../api/user';
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
    if (response?.lgas && Array.isArray(response.lgas)) {
      return response.lgas;
    }
    return [];
  } catch (error) {
    console.error('Failed to load local governments:', error);
    return [];
  }
};

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    unitAddress: '',
    state: '',
    lga: '',
  });
  const [availableLgas, setAvailableLgas] = useState([]);
  const [lgaHelpText, setLgaHelpText] = useState('Select a state first');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        unitAddress: user.unitAddress || '',
        state: user.state || '',
        lga: user.lga || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!profile.state) {
      setAvailableLgas([]);
      setProfile((prev) => ({ ...prev, lga: '' }));
      setLgaHelpText('Select a state first');
      return;
    }

    const lgas = getLgaOptions(profile.state);
    setAvailableLgas(lgas);
    setLgaHelpText(lgas.length > 0 ? '' : 'No local governments available for this state');

    setProfile((prev) => {
      if (prev.lga && !lgas.includes(prev.lga)) {
        return { ...prev, lga: '' };
      }
      return prev;
    });
  }, [profile.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!profile.fullName.trim() || !profile.phone.trim() || !profile.unitAddress.trim() || !profile.state || !profile.lga) {
      setError('Please complete all required fields before continuing.');
      return;
    }

    setLoading(true);

    try {
      const data = await updateProfile({
        fullName: profile.fullName,
        phone: profile.phone,
        unitAddress: profile.unitAddress,
        state: profile.state,
        lga: profile.lga,
      });

      setMessage(data.message || 'Profile completed successfully.');
      // Update auth context with the fresh user object returned from server
      setUser(data.user);

      navigate('/client-dashboard');
    } catch (err) {
      setError(err.message || 'Unable to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Complete Your Profile</h1>
          <p className="page-subtitle">Finish setting up your account so you can submit requests and access the client dashboard.</p>
        </div>
      </div>

      <div className="profile-card">
        {message && <div className="message-banner success-banner">✓ {message}</div>}
        {error && <div className="message-banner error-banner">✕ {error}</div>}

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={profile.fullName}
              onChange={handleChange}
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
            <label htmlFor="phone" className="form-label">
              <span className="form-label-icon material-symbols-outlined">call</span>
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={profile.phone}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="unitAddress" className="form-label">
              <span className="form-label-icon material-symbols-outlined">home</span>
              Unit / Apartment / Property Address
            </label>
            <input
              id="unitAddress"
              name="unitAddress"
              type="text"
              value={profile.unitAddress}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="state" className="form-label">
              <span className="form-label-icon material-symbols-outlined">location_on</span>
              State
            </label>
            <select id="state" name="state" value={profile.state} onChange={handleChange} className="form-input">
              <option value="">Select state</option>
              {stateOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="lga" className="form-label">
              <span className="form-label-icon material-symbols-outlined">map</span>
              Local Government
            </label>
            <select id="lga" name="lga" value={profile.lga} onChange={handleChange} className="form-input" disabled={!profile.state || availableLgas.length === 0}>
              <option value="">{profile.state ? (availableLgas.length > 0 ? 'Select local government' : 'No local governments available') : 'Select a state first'}</option>
              {availableLgas.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {lgaHelpText && <div className="form-help">{lgaHelpText}</div>}
          </div>

          <div className="action-row full-width">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Completing...' : 'Complete Profile'}
              <span className="btn-icon material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
