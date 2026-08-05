import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPayments } from '../../api/payments';
import './Payments.css';

const statusLabelMap = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  pending: 'Pending',
};

const getStatusClass = (status) => {
  switch (status) {
    case 'paid':
      return 'payment-pill paid';
    case 'pending':
      return 'payment-pill pending';
    default:
      return 'payment-pill unpaid';
  }
};

export default function Payments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getMyPayments();
        setPayments(Array.isArray(data.payments) ? data.payments : []);
      } catch (err) {
        setError(err.message || 'Unable to load your payments');
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (statusFilter !== 'All' && payment.paymentStatus !== statusFilter.toLowerCase()) {
        return false;
      }

      if (!query) {
        return true;
      }

      const search = query.toLowerCase();
      return (
        (payment.title || '').toLowerCase().includes(search) ||
        (payment.category || '').toLowerCase().includes(search) ||
        (payment.paymentReference || '').toLowerCase().includes(search)
      );
    });
  }, [payments, statusFilter, query]);

  const totalPayments = payments.length;
  const paidCount = payments.filter((item) => item.paymentStatus === 'paid').length;
  const unpaidCount = payments.filter((item) => item.paymentStatus === 'unpaid').length;
  const pendingCount = payments.filter((item) => item.paymentStatus === 'pending').length;

  return (
    <main className="payments-page">
      <div className="payments-container">
        <section className="page-header">
          <div className="page-meta">
            <span className="page-badge">Payments</span>
            <h1 className="page-title">Payment history</h1>
            <p className="page-subtitle">Review all paid and outstanding request charges in one place.</p>
          </div>
          <button className="btn-submit-new" type="button" onClick={() => navigate('/my-requests')}>
            View all requests
          </button>
        </section>

        <section className="payments-toolbar">
          <div className="payments-summary">
            <div>
              <p className="summary-label">Total payments</p>
              <p className="summary-value">{totalPayments}</p>
            </div>
            <div>
              <p className="summary-label">Paid</p>
              <p className="summary-value">{paidCount}</p>
            </div>
            <div>
              <p className="summary-label">Unpaid</p>
              <p className="summary-value">{unpaidCount}</p>
            </div>
            <div>
              <p className="summary-label">Pending</p>
              <p className="summary-value">{pendingCount}</p>
            </div>
          </div>

          <div className="payments-actions">
            <div className="status-filter">
              {['All', 'Paid', 'Pending', 'Unpaid'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`status-pill ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="search"
                placeholder="Search payments by title, category or reference"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="request-loading">Loading payment history...</div>
        ) : error ? (
          <div className="request-error">{error}</div>
        ) : filteredPayments.length === 0 ? (
          <div className="request-empty-state">
            <p className="no-requests-title">No payments found</p>
            <p className="no-requests-copy">If you have completed requests, their payment records will appear here.</p>
          </div>
        ) : (
          <div className="payments-list">
            {filteredPayments.map((payment) => (
              <div key={payment._id} className="payment-card">
                <div className="payment-card-header">
                  <div>
                    <p className="payment-card-title">{payment.title || payment.category || 'Maintenance Request'}</p>
                    <p className="payment-card-meta">
                      {payment.category || 'General'} · {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={getStatusClass(payment.paymentStatus)}>{statusLabelMap[payment.paymentStatus] || payment.paymentStatus}</span>
                </div>

                <div className="payment-card-body">
                  <div className="payment-summary-row">
                    <div>
                      <p className="payment-label">Service Cost</p>
                      <p className="payment-value">₦{Number(payment.jobCost || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="payment-label">Platform Fee</p>
                      <p className="payment-value">₦{Number(payment.platformFee || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="payment-label">Total Paid</p>
                      <p className="payment-value">₦{Number(payment.totalAmount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="payment-details-row">
                    <div>
                      <p className="payment-detail-label">Reference</p>
                      <p className="payment-detail-value">{payment.paymentReference || '—'}</p>
                    </div>
                    <div>
                      <p className="payment-detail-label">Paid on</p>
                      <p className="payment-detail-value">
                        {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Not paid yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
