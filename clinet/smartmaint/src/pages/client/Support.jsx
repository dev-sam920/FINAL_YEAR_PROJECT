import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { sendSupportMessage, getMySupportTickets, replyToSupportTicket } from '../../api/support';
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

const categoryOptions = [
  'Billing',
  'Technical Issue',
  'Complaint',
  'General Inquiry',
  'Other',
];

const priorityOptions = ['Low', 'Medium', 'High'];

const statusBadgeStyle = (status) => {
  if (status === 'Open') return { background: '#DBEAFE', color: '#2563EB' };
  if (status === 'In Review') return { background: '#FEF3C7', color: '#D97706' };
  if (status === 'Resolved') return { background: '#D1FAE5', color: '#059669' };
  return { background: '#F3F4F6', color: '#6B7280' };
};

export default function Support() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('contact');
  const [openIndex, setOpenIndex] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'General Inquiry',
    priority: 'Medium',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const ticketCount = useMemo(() => tickets.length, [tickets]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        subject: prev.subject || `Support request from ${user.fullName || user.email}`,
      }));
    }
  }, [user]);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setTicketLoading(true);
        const data = await getMySupportTickets();
        setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      } catch (error) {
        console.error('Failed to load tickets', error);
      } finally {
        setTicketLoading(false);
      }
    };

    loadTickets();
  }, []);

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const refreshTickets = async () => {
    try {
      const data = await getMySupportTickets();
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
    } catch (error) {
      console.error('Failed to refresh tickets', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!formData.subject.trim()) {
      setErrorMessage('Please provide a subject.');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage('Please enter your message.');
      return;
    }

    setLoading(true);
    try {
      const data = await sendSupportMessage(formData);
      setSuccessMessage(data.message || 'Your ticket has been submitted.');
      setFormData((prev) => ({ ...prev, description: '', subject: '' }));
      await refreshTickets();
      setActiveTab('tickets');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to send support message.');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) {
      setErrorMessage('Please enter a reply message.');
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');
      const data = await replyToSupportTicket(selectedTicket._id, replyMessage.trim());
      setSelectedTicket(data.ticket || selectedTicket);
      await refreshTickets();
      setReplyMessage('');
      setSuccessMessage('Reply sent successfully.');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to send reply.');
    }
  };

  const activeTicket = selectedTicket;

  return (
    <div className="support-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Support</h1>
          <p className="page-subtitle">Find answers fast or contact our support team directly.</p>
        </div>
      </div>

      <div className="support-card" style={{ display: 'grid', gap: 24 }}>
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

      <div className="support-card" style={{ paddingBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            style={{
              border: 'none',
              borderRadius: 9999,
              padding: '0.85rem 1.2rem',
              background: activeTab === 'contact' ? '#4285F4' : '#F3F4F6',
              color: activeTab === 'contact' ? '#FFFFFF' : '#374151',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Contact Support
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            style={{
              border: 'none',
              borderRadius: 9999,
              padding: '0.85rem 1.2rem',
              background: activeTab === 'tickets' ? '#4285F4' : '#F3F4F6',
              color: activeTab === 'tickets' ? '#FFFFFF' : '#374151',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            My Support Tickets ({ticketCount})
          </button>
        </div>

        {activeTab === 'contact' ? (
          <>
            <h2>Contact Support</h2>
            {successMessage && <div className="message-banner success-banner">✓ {successMessage}</div>}
            {errorMessage && <div className="message-banner error-banner">✕ {errorMessage}</div>}
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="form-group full-width">
                <label htmlFor="subject" className="form-label">Subject</label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Brief summary of your issue"
                />
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
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="priority" className="form-label">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="form-group full-width">
                <label htmlFor="description" className="form-label">Message</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Write your support request here..."
                />
              </div>
              <div className="action-row full-width">
                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Ticket'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ display: 'grid', gap: 24 }}>
            <h2>My Support Tickets</h2>
            {ticketLoading ? (
              <div className="message-banner" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>Loading your tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="message-banner" style={{ background: '#F7F7F5', color: '#374151' }}>No support tickets found. Submit a new ticket above to start a conversation.</div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {tickets.map((ticket) => (
                  <button
                    key={ticket._id}
                    type="button"
                    onClick={() => setSelectedTicket(ticket)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      borderRadius: 20,
                      border: selectedTicket?._id === ticket._id ? '2px solid #4285F4' : '1px solid #E5E7EB',
                      background: '#FFFFFF',
                      padding: 20,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#111111', marginBottom: 6 }}>{ticket.subject}</div>
                        <div style={{ color: '#6B7280', fontSize: 14 }}>{ticket.category} · {ticket.priority} priority</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ ...statusBadgeStyle(ticket.status), borderRadius: 9999, padding: '0.45rem 0.85rem', fontWeight: 700, fontSize: 12 }}>{ticket.status}</span>
                        <div style={{ color: '#6B7280', fontSize: 13 }}>{new Date(ticket.updatedAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTicket && (
              <div style={{ background: '#F8FAFC', borderRadius: 24, padding: 24, border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 22, color: '#111827' }}>{activeTicket.subject}</h3>
                    <p style={{ margin: '8px 0 0', color: '#6B7280' }}>{activeTicket.category} · {activeTicket.priority} priority</p>
                  </div>
                  <span style={{ ...statusBadgeStyle(activeTicket.status), padding: '0.5rem 0.95rem', borderRadius: 9999, fontWeight: 700 }}>{activeTicket.status}</span>
                </div>

                <div style={{ marginTop: 20, display: 'grid', gap: 18 }}>
                  <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 20, border: '1px solid #E5E7EB' }}>
                    <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 10 }}>Original message</div>
                    <p style={{ margin: 0, color: '#111827', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{activeTicket.description}</p>
                  </div>

                  <div style={{ display: 'grid', gap: 12 }}>
                    {activeTicket.replies?.map((reply) => (
                      <div key={`${reply._id}-${reply.createdAt}`} style={{ background: reply.senderRole === 'admin' ? '#EFF6FF' : '#F8FAFC', borderRadius: 20, padding: 18, border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
                          <span style={{ fontWeight: 700, color: '#0F172A' }}>{reply.senderRole === 'admin' ? 'Support Team' : user?.fullName || 'You'}</span>
                          <span style={{ color: '#6B7280', fontSize: 13 }}>{new Date(reply.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, color: '#111827', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{reply.message}</p>
                      </div>
                    ))}
                  </div>

                  {activeTicket.status !== 'Resolved' ? (
                    <div style={{ display: 'grid', gap: 12 }}>
                      <label htmlFor="replyMessage" style={{ color: '#374151', fontWeight: 700 }}>Add a reply</label>
                      <textarea
                        id="replyMessage"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={4}
                        className="form-textarea"
                        style={{ width: '100%' }}
                        placeholder="Write a response to support..."
                      />
                      <button type="button" className="btn-primary" onClick={handleReply}>
                        Send Reply
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: '#16A34A', fontWeight: 700 }}>This ticket is resolved and no further replies are accepted.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
