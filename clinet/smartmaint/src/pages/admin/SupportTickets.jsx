import { useEffect, useMemo, useState } from 'react';
import { getAdminSupportTickets, replyToSupportTicket, updateSupportTicketStatus } from '../../api/support';

const statusOptions = ['Open', 'In Review', 'Resolved'];
const priorityOptions = ['Low', 'Medium', 'High'];

const statusBadgeStyle = (status) => {
  if (status === 'Open') return { background: '#DBEAFE', color: '#2563EB' };
  if (status === 'In Review') return { background: '#FEF3C7', color: '#D97706' };
  if (status === 'Resolved') return { background: '#D1FAE5', color: '#059669' };
  return { background: '#F3F4F6', color: '#6B7280' };
};

const getStatusClass = (status) => {
  if (status === 'Open') return 'admin-ticket-badge open';
  if (status === 'In Review') return 'admin-ticket-badge review';
  if (status === 'Resolved') return 'admin-ticket-badge resolved';
  return 'admin-ticket-badge';
};

export default function SupportTicketsAdmin() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminSupportTickets({
        status: filters.status,
        category: filters.category,
        priority: filters.priority,
        search,
      });
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
    } catch (err) {
      setError(err.message || 'Unable to load support tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    await loadTickets();
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    try {
      const data = await replyToSupportTicket(selectedTicket._id, replyText.trim());
      setSelectedTicket(data.ticket || selectedTicket);
      setReplyText('');
      await loadTickets();
    } catch (err) {
      setError(err.message || 'Unable to send reply');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedTicket || !statusUpdate) return;
    try {
      const data = await updateSupportTicketStatus(selectedTicket._id, statusUpdate);
      setSelectedTicket(data.ticket || selectedTicket);
      setStatusUpdate('');
      await loadTickets();
    } catch (err) {
      setError(err.message || 'Unable to update ticket status');
    }
  };

  const selectedUpdatedTicket = selectedTicket?.status || '';

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 24, padding: 24, boxShadow: '0 12px 34px rgba(15, 23, 42, 0.06)' }}>
        <p style={{ margin: 0, color: '#4285F4', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Support Center</p>
        <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.9rem', color: '#111827' }}>Support Tickets</h1>
        <p style={{ margin: '0.75rem 0 0', color: '#6B7280' }}>Track, respond to, and update client support tickets from a single admin view.</p>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: 24, padding: 20, boxShadow: '0 12px 34px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <input
            placeholder="Search tickets"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: '1 1 240px', minWidth: 180, border: '1px solid #E5E7EB', borderRadius: 9999, padding: '0.8rem 1rem', background: '#F8FAFC' }}
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            style={{ border: '1px solid #E5E7EB', borderRadius: 9999, padding: '0.8rem 1rem', background: '#FFFFFF', minWidth: 180 }}
          >
            <option value="">Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            style={{ border: '1px solid #E5E7EB', borderRadius: 9999, padding: '0.8rem 1rem', background: '#FFFFFF', minWidth: 180 }}
          >
            <option value="">Category</option>
            <option value="Billing">Billing</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Complaint">Complaint</option>
            <option value="General Inquiry">General Inquiry</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
            style={{ border: '1px solid #E5E7EB', borderRadius: 9999, padding: '0.8rem 1rem', background: '#FFFFFF', minWidth: 180 }}
          >
            <option value="">Priority</option>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSearch}
            style={{ border: 'none', background: '#4285F4', color: '#FFFFFF', borderRadius: 9999, padding: '0.85rem 1.2rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Apply
          </button>
        </div>

        {error && <div style={{ padding: 16, borderRadius: 18, background: '#FEF2F2', color: '#B91C1C' }}>{error}</div>}

        {loading ? (
          <div style={{ padding: 24, borderRadius: 20, background: '#F8FAFC', color: '#1D4ED8' }}>Loading support tickets...</div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: 24, borderRadius: 20, background: '#F7F7F5', color: '#374151' }}>No support tickets available right now.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Subject</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Priority</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}
                  >
                    <td style={tdStyle}>{ticket.client?.fullName || ticket.client?.email || 'Unknown'}</td>
                    <td style={tdStyle}>{ticket.subject}</td>
                    <td style={tdStyle}>{ticket.category}</td>
                    <td style={tdStyle}>{ticket.priority}</td>
                    <td style={tdStyle}><span style={{ ...statusBadgeStyle(ticket.status), borderRadius: 9999, padding: '0.45rem 0.85rem', fontWeight: 700 }}>{ticket.status}</span></td>
                    <td style={tdStyle}>{new Date(ticket.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTicket && (
        <div style={{ background: '#FFFFFF', borderRadius: 24, padding: 24, boxShadow: '0 12px 34px rgba(15, 23, 42, 0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
            <div>
              <p style={{ margin: 0, color: '#6B7280', fontWeight: 700 }}>Ticket detail</p>
              <h2 style={{ margin: '12px 0 0', color: '#111827' }}>{selectedTicket.subject}</h2>
              <div style={{ color: '#6B7280', marginTop: 8 }}>{selectedTicket.category} · {selectedTicket.priority} priority</div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ ...statusBadgeStyle(selectedTicket.status), borderRadius: 9999, padding: '0.55rem 0.9rem', fontWeight: 700 }}>{selectedTicket.status}</span>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                style={{ border: '1px solid #E5E7EB', borderRadius: 9999, padding: '0.75rem 1rem', background: '#FFFFFF' }}
              >
                <option value="">Change status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={!statusUpdate}
                style={{ border: 'none', background: '#4285F4', color: '#FFFFFF', borderRadius: 9999, padding: '0.85rem 1.2rem', fontWeight: 700, cursor: statusUpdate ? 'pointer' : 'not-allowed' }}
              >
                Update
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ background: '#F8FAFC', borderRadius: 20, padding: 22, border: '1px solid #E5E7EB' }}>
              <p style={{ margin: 0, color: '#6B7280', marginBottom: 10 }}>Description</p>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.75, color: '#111827' }}>{selectedTicket.description}</p>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {selectedTicket.replies?.map((reply) => (
                <div key={`${reply._id}-${reply.createdAt}`} style={{ background: reply.senderRole === 'admin' ? '#EFF6FF' : '#FFFFFF', borderRadius: 20, padding: 20, border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{reply.senderRole === 'admin' ? 'Admin reply' : 'Client reply'}</span>
                    <span style={{ color: '#6B7280', fontSize: 13 }}>{new Date(reply.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.75, color: '#111827' }}>{reply.message}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <label htmlFor="adminReply" style={{ color: '#374151', fontWeight: 700 }}>Reply to client</label>
              <textarea
                id="adminReply"
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your response..."
                style={{ width: '100%', borderRadius: 18, border: '1px solid #E5E7EB', padding: '18px 20px', resize: 'vertical' }}
              />
              <button
                type="button"
                onClick={handleReply}
                disabled={!replyText.trim()}
                style={{ border: 'none', background: '#4285F4', color: '#FFFFFF', borderRadius: 9999, padding: '0.95rem 1.3rem', fontWeight: 700, cursor: replyText.trim() ? 'pointer' : 'not-allowed' }}
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '18px 20px',
  textAlign: 'left',
  color: '#667085',
  fontSize: 14,
  fontWeight: 700,
};

const tdStyle = {
  padding: '18px 20px',
  color: '#111827',
  fontSize: 14,
  verticalAlign: 'top',
};
