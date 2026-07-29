import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signupUser } from '../api/auth';
import heroImage from '../assets/hero.png';
import './css/Signup.css';

export default function Signup() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ level: 'weak', color: '#ba1a1a' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Update password strength when password changes
    if (fieldName === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear error when user starts typing
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

    // Validate email format
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
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

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Call signup API
      const response = await signupUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      // Success - redirect to login page
      navigate('/login', {
        state: {
          message: 'Account created successfully! Please log in.',
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
            <button className="btn-google" type="button" disabled>
              <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="btn-google-text">SIGN UP WITH GOOGLE</span>
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
