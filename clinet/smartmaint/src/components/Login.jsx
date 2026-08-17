import { useState, useContext } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { googleAuth, loginUser } from '../api/auth';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import heroImage from '../assets/hero.png';
import { auth, googleProvider } from './firebase';
import './css/Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useContext(AuthContext);
  const { triggerSplash } = useLoading();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    if (error) {
      setError('');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await googleAuth(idToken);

      if (response?.user) {
        setUser(response.user);
        // show splash once during transition after successful login
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

    if (!formData.email.trim() || !formData.password) {
      setError('Email and password are required');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      if (response?.user) {
        setUser(response.user);
        // show splash once during transition after successful login
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
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      const message = err.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-main">
      <section className="login-left">
        <header className="login-header">
          <div className="login-logo">SmartMaint</div>
        </header>

        <div className="login-form-container">
          <h2 className="login-title">Welcome Back</h2>

          <button className="btn-google-login" type="button" onClick={handleGoogleSignIn} disabled={loading}>
            <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span>SIGN IN WITH GOOGLE</span>
          </button>

          <div className="login-divider">
            <div className="divider-line"></div>
            <span className="divider-text">or</span>
            <div className="divider-line"></div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {location.state?.message && (
              <div className="success-message" style={{ marginBottom: 12, padding: '0.8rem 1rem', borderRadius: 12, background: '#ECFDF3', color: '#166534' }}>
                {location.state.message}
              </div>
            )}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">EMAIL ADDRESS</label>
              <input
                className="form-input"
                id="email"
                type="email"
                placeholder="@gmail.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div className="password-header">
                <label className="form-label" htmlFor="password">Password</label>
                <a className="forgot-link" href="#">Forgot?</a>
              </div>
              <div className="password-input-wrapper">
                <input
                  className="form-input"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
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
            </div>

            <button className="btn-sign-in" type="submit" disabled={loading}>
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>
        </div>

        <footer className="login-footer" onClick={() => navigate('/signup')}>
          <span className="footer-text">Don't have an account?</span>
          <span className="footer-link">
            Register
            <span className="footer-icon material-symbols-outlined">arrow_outward</span>
          </span>
        </footer>
      </section>

      <section className="login-right">
        <div
          className="login-image"
          style={{
            backgroundImage: `url(${heroImage})`
          }}
        ></div>

        <div className="login-overlay"></div>

        <div className="login-caption">
          <div className="caption-divider"></div>
          <p className="caption-label">PREMIUM ACCESS</p>
          <p className="caption-quote">"Stewardship is the art of understanding spaces and their promise."</p>
        </div>
      </section>
    </main>
  );
}
