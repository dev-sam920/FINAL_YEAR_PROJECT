import { useContext, useEffect, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import NaijaStates from 'naija-state-local-government';
import { useNavigate } from 'react-router-dom';
import { googleAuth, signupUser, technicianSignupUser } from '../api/auth';
import heroImage from '../assets/hero.png';
import { auth, googleProvider } from './firebase';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import './css/Signup.css';

const specialtyOptions = ['Plumbing', 'Electrical', 'HVAC', 'Structural', 'Appliance', 'General'];
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
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.lgas)) return response.lgas;
    return [];
  } catch (error) {
    console.error('Failed to load local governments:', error);
    return [];
  }
};

export default function Signup() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const { triggerSplash } = useLoading();

 
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client',
    phone: '',
    state: '',
    lga: '',
    specialty: 'General',
    yearsOfExperience: '',
    bio: '',
  });

 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ level: 'weak', color: '#ba1a1a' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableLgas, setAvailableLgas] = useState([]);
  const [lgaHelpText, setLgaHelpText] = useState('Select a state first');
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [idDocumentFile, setIdDocumentFile] = useState(null);
  const [idDocumentName, setIdDocumentName] = useState('');

  /**
   * Calculate password strength
   * Weak: < 6 chars or missing number/uppercase
   * Medium: 6-9 chars with some complexity
   * Strong: 10+ chars with uppercase, lowercase, number, special char
   */
  const calculatePasswordStrength = (password) => {
    if (!password) return { level: 'weak', color: '#ba1a1a' };

    let strength = 0;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const length = password.length;

    // Minimum length requirement
    if (length < 6) return { level: 'weak', color: '#ba1a1a' };

    // Count complexity factors
    if (hasUppercase) strength++;
    if (hasLowercase) strength++;
    if (hasNumber) strength++;
    if (hasSpecial) strength++;
    if (length >= 10) strength++;

    if (strength <= 2) {
      return { level: 'weak', color: '#ba1a1a' };
    } else if (strength <= 3) {
      return { level: 'medium', color: '#f9a825' };
    } else {
      return { level: 'strong', color: '#2d6a4f' };
    }
  };

  /**
   * Validate email format
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    if (!formData.state) {
      setAvailableLgas([]);
      setLgaHelpText('Select a state first');
      return;
    }

    const nextLgas = getLgaOptions(formData.state);
    setAvailableLgas(nextLgas);
    setLgaHelpText(nextLgas.length > 0 ? '' : 'No local governments available for this state');

    if (formData.lga && !nextLgas.includes(formData.lga)) {
      setFormData((prev) => ({ ...prev, lga: '' }));
    }
  }, [formData.state]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const fieldName = id === 'name' ? 'fullName' : id;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (fieldName === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    if (error) {
      setError('');
    }
  };

  const handleFileChange = (event, kind) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (kind === 'profilePicture') {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setError('Please upload a JPG or PNG profile picture');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile picture must be smaller than 5MB');
        return;
      }
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }

    if (kind === 'idDocument') {
      if (!['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setError('Please upload a PDF, JPG, or PNG document');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('ID document must be smaller than 5MB');
        return;
      }
      setIdDocumentFile(file);
      setIdDocumentName(file.name);
    }

    if (error) {
      setError('');
    }
  };

  /**
   * Handle password visibility toggle
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Handle confirm password visibility toggle
   */
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    // Check all fields are filled
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

   
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.role === 'technician') {
      if (!formData.phone.trim()) {
        setError('Phone number is required for technician applications');
        return false;
      }
      if (!formData.state || !formData.lga) {
        setError('Please choose your state and local government');
        return false;
      }
      if (!formData.specialty.trim()) {
        setError('Please share your specialty so we can review your application');
        return false;
      }
      if (!profilePictureFile) {
        setError('Please upload a profile picture');
        return false;
      }
      if (!idDocumentFile) {
        setError('Please upload an ID document or certificate');
        return false;
      }
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    // Check password minimum length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (!formData.confirmPassword) {
      setError('Please confirm your password');
      return false;
    }

    // Check passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  
  const handleGoogleSignIn = async () => {
    if (formData.role === 'technician') {
      setError('Google sign-in is only available for client accounts.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await googleAuth(idToken);

      if (response?.user) {
        setUser(response.user);
        // show splash once during transition after successful signup via Google
        triggerSplash();
        if (response.user.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (response.user.role === 'technician') {
          navigate('/technician-dashboard');
        } else if (!response.user.profileCompleted) {
          navigate('/client/complete-profile');
        } else {
          navigate('/client-dashboard');
        }
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (formData.role === 'technician') {
        const payload = new FormData();
        payload.append('fullName', formData.fullName);
        payload.append('email', formData.email);
        payload.append('password', formData.password);
        payload.append('phone', formData.phone);
        payload.append('state', formData.state);
        payload.append('lga', formData.lga);
        payload.append('specialty', formData.specialty);
        payload.append('yearsOfExperience', formData.yearsOfExperience || '');
        payload.append('bio', formData.bio);
        payload.append('profilePicture', profilePictureFile);
        payload.append('idDocument', idDocumentFile);

        await technicianSignupUser(payload);
      } else {
        await signupUser({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          specialty: formData.specialty,
        });
      }

      navigate('/login', {
        state: {
          message: formData.role === 'technician'
            ? 'Technician application submitted successfully. We will review it shortly.'
            : 'Account created successfully! Please log in.',
        },
      });
    } catch (err) {
      // Display error message from backend
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signup-main">
      <section className="signup-left">
        <header className="signup-header">
          <div className="signup-logo">SmartMaint</div>
        </header>

        <div className="signup-form-container">
          <h1 className="signup-title">
            Begin Your<br />Stewardship.
          </h1>

          {/* Error message display */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="signup-google-section">
            <button className="btn-google" type="button" onClick={handleGoogleSignIn} disabled={loading || formData.role === 'technician'}>
              <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="btn-google-text">{formData.role === 'technician' ? 'GOOGLE SIGN-IN UNAVAILABLE' : 'SIGN UP WITH GOOGLE'}</span>
            </button>

            <div className="signup-divider">
              <div className="divider-line"></div>
              <span className="divider-text">OR REGISTER WITH EMAIL</span>
              <div className="divider-line"></div>
            </div>
          </div>

          <form className="signup-form" onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="name">FULL NAME</label>
              <input
                className="form-input"
                id="name"
                placeholder="E.g. Enter your name"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="role">I AM REGISTERING AS</label>
              <select
                className="form-input"
                id="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="client">Client</option>
                <option value="technician">Technician</option>
              </select>
            </div>

            {formData.role === 'technician' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">PHONE NUMBER</label>
                  <input
                    className="form-input"
                    id="phone"
                    placeholder="E.g. 08012345678"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="state">STATE</label>
                  <select
                    className="form-input"
                    id="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">Select state</option>
                    {stateOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lga">LOCAL GOVERNMENT</label>
                  <select
                    className="form-input"
                    id="lga"
                    value={formData.lga}
                    onChange={handleInputChange}
                    disabled={loading || !formData.state || availableLgas.length === 0}
                  >
                    <option value="">{formData.state ? (availableLgas.length > 0 ? 'Select local government' : 'No local governments available') : 'Select a state first'}</option>
                    {availableLgas.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {lgaHelpText && <div style={{ marginTop: 6, fontSize: 12, color: '#6B7280' }}>{lgaHelpText}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="specialty">SPECIALTY</label>
                  <select
                    className="form-input"
                    id="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    {specialtyOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="yearsOfExperience">YEARS OF EXPERIENCE</label>
                  <input
                    className="form-input"
                    id="yearsOfExperience"
                    placeholder="E.g. 5"
                    type="number"
                    min="0"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="bio">BIO</label>
                  <textarea
                    className="form-input"
                    id="bio"
                    placeholder="Tell us about your experience"
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={loading}
                    style={{ resize: 'vertical', minHeight: 110 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profilePicture">PROFILE PICTURE</label>
                  <input
                    className="form-input"
                    id="profilePicture"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(event) => handleFileChange(event, 'profilePicture')}
                    disabled={loading}
                  />
                  {profilePicturePreview && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={profilePicturePreview} alt="Profile preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '1px solid #E5E7EB' }} />
                      <span style={{ color: '#4285F4', fontWeight: 700 }}>Preview ready</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="idDocument">ID / CERTIFICATE</label>
                  <input
                    className="form-input"
                    id="idDocument"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/jpg"
                    onChange={(event) => handleFileChange(event, 'idDocument')}
                    disabled={loading}
                  />
                  {idDocumentName && <div style={{ marginTop: 8, color: '#4285F4', fontWeight: 700 }}>Selected: {idDocumentName}</div>}
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">WORK EMAIL</label>
              <input
                className="form-input"
                id="email"
                placeholder="@gmail.com"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">PASSWORD</label>
              <div className="password-input-wrapper">
                <input
                  className="form-input"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-label">
                    Password Strength: <span style={{ color: passwordStrength.color }}>
                      {passwordStrength.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{
                        width: passwordStrength.level === 'weak' ? '33%' : passwordStrength.level === 'medium' ? '66%' : '100%',
                        backgroundColor: passwordStrength.color,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">CONFIRM PASSWORD</label>
              <div className="password-input-wrapper">
                <input
                  className="form-input"
                  id="confirmPassword"
                  placeholder="••••••••"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                  disabled={loading}
                >
                  <span className="material-symbols-outlined">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-submit">
              <button
                className="btn-create"
                type="submit"
                disabled={loading}
              >
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
            </div>
          </form>
        </div>

        <footer className="signup-footer" onClick={() => navigate('/login')}>
          <span className="footer-text">Already have an account?</span>
          <span className="footer-link">
            Login
            <span className="footer-icon material-symbols-outlined">arrow_outward</span>
          </span>
        </footer>
      </section>

      <section className="signup-right">
        <div
          className="signup-image"
          style={{
            backgroundImage: `url(${heroImage})`
          }}
        ></div>

        <div className="signup-overlay"></div>

        <div className="signup-caption">
          <div className="caption-divider"></div>
          <p className="caption-label">CURATED SPACES</p>
          <p className="caption-quote">"Excellence is not an act, but a habit of meticulous stewardship."</p>
        </div>

        <div className="signup-grid">
          <div className="grid-dot"></div>
          <div className="grid-dot"></div>
          <div className="grid-dot"></div>
          <div className="grid-dot"></div>
          <div className="grid-dot"></div>
          <div className="grid-dot"></div>
        </div>
      </section>
    </main>
  );
}
