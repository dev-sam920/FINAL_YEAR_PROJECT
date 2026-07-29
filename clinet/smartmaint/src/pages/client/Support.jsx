import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { sendSupportMessage } from '../../api/support';
import './Support.css';

const faqItems = [
  {
    question: 'How do I submit a maintenance request?',
    answer: 'Go to Submit Request, fill in the issue details, and press Submit. We will route it to the right team immediately.',
  },
  {
    question: 'How long does it take to resolve a request?',
    answer: 'Most requests are reviewed within 24 hours; resolution time depends on the issue priority and team availability.',
  },
  {
    question: 'Can I edit or cancel a request after submitting?',
    answer: 'Once submitted, requests cannot be edited in the app, but you can contact support to request a cancellation or update.',
  },
  {
    question: 'How do I know when my request status changes?',
    answer: 'You will receive updates in the app, and you may also be notified by email when the status changes.',
  },
  {
    question: 'Who do I contact for urgent issues?',
    answer: 'Use the Contact Support form below and select Urgent Issue so our team can respond as quickly as possible.',
  },
];

export default function Support() {
  const { user } = useContext(AuthContext);
  const [openIndex, setOpenIndex] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    category: 'General Inquiry',
    message: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.fullName || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!formData.message.trim()) {
      setErrorMessage('Please enter your message.');
      return;
    }

    setLoading(true);

    try {
      const data = await sendSupportMessage(formData);
      setSuccessMessage(data.message || 'Your message has been sent.');
      setFormData((prev) => ({ ...prev, message: '' }));
    } catch (error) {
      setErrorMessage(error.message || 'Unable to send support message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Support</h1>
          <p className="page-subtitle">Find answers fast or contact our support team directly.</p>
        </div>
      </div>

      <div className="support-card">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqItems.map((item, index) => (
            <div key={item.question} className="faq-item">
              <button type="button" className="faq-question" onClick={() => toggleItem(index)}>
                <span>{item.question}</span>
                <span>{openIndex === index ? '−' : '+'}</span>
              </button>
              {openIndex === index && <p className="faq-answer">{item.answer}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="support-card">
        <h2>Contact Support</h2>
        {successMessage && <div className="message-banner success-banner">✓ {successMessage}</div>}
        {errorMessage && <div className="message-banner error-banner">✕ {errorMessage}</div>}
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
          <div className="form-group full-width">
            <label htmlFor="category" className="form-label">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="form-input"
            >
              <option>General Inquiry</option>
              <option>Report a Bug</option>
              <option>Urgent Issue</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label htmlFor="message" className="form-label">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Write your support request here..."
            />
          </div>
          <div className="action-row full-width">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
