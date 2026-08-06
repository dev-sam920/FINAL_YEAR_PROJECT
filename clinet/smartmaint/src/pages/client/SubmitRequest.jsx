import { useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance.js';
import { AuthContext } from '../../context/AuthContext';
import './SubmitRequest.css';

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const CATEGORY_OPTIONS = [
  'Plumbing',
  'Electrical',
  'HVAC / Air Conditioning',
  'Appliances',
  'Structural / Building',
  'Pest Control',
  'Cleaning',
  'Security',
  'Landscaping / Outdoor',
  'Painting',
  'Carpentry',
  'Other',
];

export default function SubmitRequest() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Plumbing',
    customCategory: '',
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'category' && value !== 'Other' ? { customCategory: '' } : {}),
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    console.debug('SubmitRequest: handleTitleChange ->', value);
    setFormData((prev) => ({ ...prev, title: value }));
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: '' }));
    }
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    console.debug('SubmitRequest: handleCategoryChange ->', value);
    setFormData((prev) => ({
      ...prev,
      category: value,
      ...(value !== 'Other' ? { customCategory: '' } : {}),
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage('Image must be under 4MB.');
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
        setErrorMessage('Image must be under 4MB.');
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
    if (formData.category === 'Other' && !formData.customCategory.trim()) {
      newErrors.customCategory = 'Please specify the category';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBack = () => {
    navigate('/client-dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('category', formData.category === 'Other' ? formData.customCategory.trim() : formData.category);
      payload.append('priority', formData.priority);
      payload.append('description', formData.description.trim());
      payload.append('location', formData.location.trim());
      if (photoFile) {
        payload.append('photo', photoFile);
      }

      await axiosInstance.post('/requests', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessMessage('Request submitted successfully!');
      setFormData({ title: '', category: 'Plumbing', customCategory: '', priority: 'Medium', description: '', location: '' });
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
            <div className="page-badge">Welcome To SM</div>
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
          <button className="btn-submit-new" type="button" onClick={handleBack} style={{ pointerEvents: 'auto' }}>
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
                  key="issue-title-input"
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  autoComplete="off"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="e.g. Kitchen sink leaking"
                  style={{ pointerEvents: 'auto', WebkitAppearance: 'textfield', MozAppearance: 'textfield', appearance: 'textfield' }}
                />
                {errors.title && <div className="error-text">{errors.title}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="category" className="form-label">Category</label>
                <div className="form-select-wrapper">
                  <select
                    key="category-select"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className="form-input"
                    aria-label="Request category"
                    style={{ pointerEvents: 'auto', WebkitAppearance: 'menulist-button', MozAppearance: 'menulist-button', appearance: 'menulist-button' }}
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {formData.category === 'Other' && (
                  <div className="form-group" style={{ gap: 10 }}>
                    <label htmlFor="customCategory" className="form-label">Please specify category *</label>
                    <input
                      id="customCategory"
                      name="customCategory"
                      type="text"
                      value={formData.customCategory}
                      onChange={handleInputChange}
                      className={`form-input ${errors.customCategory ? 'error' : ''}`}
                      placeholder="e.g. Pool maintenance"
                    />
                    {errors.customCategory && <div className="error-text">{errors.customCategory}</div>}
                  </div>
                )}
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
                    <p className="upload-hint">PNG, JPG, GIF up to 4MB</p>
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
