import { useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance.js';
import { AuthContext } from '../../context/AuthContext';
import './SubmitRequest.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function SubmitRequest() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Plumbing',
    priority: 'Medium',
    description: '',
    location: '',
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage('Photo must be smaller than 10MB.');
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setPhotoPreview(event.target.result);
      reader.readAsDataURL(file);
      setErrorMessage('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage('Photo must be smaller than 10MB.');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setPhotoPreview(event.target.result);
      reader.readAsDataURL(file);
      setErrorMessage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Issue title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await axiosInstance.post('/requests', {
        title: formData.title,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
        location: formData.location,
        photos: photoPreview ? [photoPreview] : [],
      });

      setSuccessMessage('Request submitted successfully!');
      setFormData({ title: '', category: 'Plumbing', priority: 'Medium', description: '', location: '' });
      setPhotoPreview(null);
      setPhotoFile(null);
      setErrors({});

      setTimeout(() => {
        navigate('/client-dashboard');
      }, 1800);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit request. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const name = user?.fullName || user?.email || 'Client';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const profileAvatarContent = () => {
    if (user?.profilePicture) {
      return <img src={user.profilePicture} alt={user.fullName || 'Profile'} />;
    }
    return getInitials();
  };

  return (
    <>
      <header className="top-navbar">
          <div className="page-branding">
            <div className="page-badge">Client</div>
            <div className="page-tag">Submit new maintenance request</div>
          </div>

          <div className="navbar-profile">
            <button className="profile-button" type="button">
              <div className="profile-avatar">{profileAvatarContent()}</div>
              <div className="profile-name-group">
                <span className="profile-name">{user?.fullName || 'Client'}</span>
                <span className="profile-role">{user?.role || 'Tenant'}</span>
              </div>
            </button>
          </div>
        </header>

        <div className="page-header">
          <div>
            <h1 className="page-title">Submit Request</h1>
            <p className="page-subtitle">
              Tell us what needs fixing and we’ll route your request to the right team.
            </p>
          </div>
          <button className="btn-submit-new" type="button" onClick={() => navigate('/client-dashboard')}>
            Back to Dashboard
          </button>
        </div>

        <div className="form-card">
          {successMessage && <div className="message-banner success-banner">✓ {successMessage}</div>}
          {errorMessage && <div className="message-banner error-banner">✕ {errorMessage}</div>}

          <form className="request-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title" className="form-label">Issue Title *</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="e.g. Kitchen sink leaking"
                />
                {errors.title && <div className="error-text">{errors.title}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="category" className="form-label">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Structural">Structural</option>
                  <option value="Appliance">Appliance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className="priority-options">
                {['Low', 'Medium', 'High'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`priority-button ${formData.priority === option ? 'active' : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, priority: option }))}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                placeholder="Describe the problem in detail..."
              />
              {errors.description && <div className="error-text">{errors.description}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location" className="form-label">Location / Area</label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g. Living room, Unit 4B"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Photo (optional)</label>
              <div
                className="photo-upload-area"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? (
                  <div className="photo-preview-wrapper">
                    <img src={photoPreview} alt="Preview" className="photo-preview" />
                    <button
                      type="button"
                      className="remove-photo-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPhotoPreview(null);
                        setPhotoFile(null);
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <p className="upload-text">Click to upload or drag and drop</p>
                    <p className="upload-hint">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-submit-new" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </>
  );
}
