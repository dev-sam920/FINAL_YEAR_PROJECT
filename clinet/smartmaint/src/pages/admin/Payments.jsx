import { useEffect, useMemo, useState } from 'react';
import { getAdminPayments } from '../../api/payments';
import './Payments.css';

const statusBadge = {
  paid: { label: 'Paid', className: 'admin-payment-badge paid' },
  unpaid: { label: 'Unpaid', className: 'admin-payment-badge unpaid' },
  pending: { label: 'Pending', className: 'admin-payment-badge pending' },
};

const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString()}`;
const formatDateTime = (dateString) => {
  if (!dateString) return 'Not yet paid';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAdminPayments();
        setPayments(Array.isArray(data.payments) ? data.payments : []);
      } catch (err) {
        setError(err.message || 'Unable to load admin payments');
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    if (filter === 'All') return payments;
    return payments.filter((payment) => payment.paymentStatus === filter.toLowerCase());
  }, [payments, filter]);

  const summary = useMemo(() => {
    const paid = payments.filter((payment) => payment.paymentStatus === 'paid');
    const totalRevenue = paid.reduce((sum, item) => sum + (Number(item.platformFee) || 0), 0);
    const totalTransactionValue = paid.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
    const pendingPaymentsCount = payments.filter((payment) => payment.paymentStatus === 'unpaid' && Number(payment.totalAmount) > 0).length;
    return { totalRevenue, totalTransactionValue, pendingPaymentsCount };
  }, [payments]);

  return (
    <main className="admin-payments-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-page-label">Payments</p>
          <h1 className="admin-page-title">Transaction ledger</h1>
          <p className="admin-page-subtitle">Review payments across all clients and assigned technicians.</p>
        </div>
      </div>

      <div className="admin-payments-stats">
        <div className="admin-stat-card">
          <p>Total Platform Revenue</p>
          <h3>{formatCurrency(summary.totalRevenue)}</h3>
        </div>
        <div className="admin-stat-card">
          <p>Total Transaction Value</p>
          <h3>{formatCurrency(summary.totalTransactionValue)}</h3>
        </div>
        <div className="admin-stat-card">
          <p>Pending Payments</p>
          <h3>{summary.pendingPaymentsCount}</h3>
        </div>
      </div>

      <div className="admin-payments-toolbar">
        <div className="admin-filter-group">
          {['All', 'Paid', 'Unpaid'].map((statusOption) => (
            <button
              type="button"
              key={statusOption}
              className={`admin-filter-pill ${filter === statusOption ? 'active' : ''}`}
              onClick={() => setFilter(statusOption)}
            >
              {statusOption}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-empty-state">Loading payment records...</div>
      ) : error ? (
        <div className="admin-empty-state">{error}</div>
      ) : filteredPayments.length === 0 ? (
        <div className="admin-empty-state">No payment records found.</div>
      ) : (
        <div className="admin-payments-table-wrapper">
          <table className="admin-payments-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Technician Name</th>
                <th>Request Title</th>
                <th>Job Cost (₦)</th>
                <th>Platform Fee (₦)</th>
                <th>Total Amount (₦)</th>
                <th>Payment Status</th>
                <th>Payment Reference</th>
                <th>Date &amp; Time Paid</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment._id}>
                  <td>{payment.client?.fullName || payment.client?.email || 'Unknown client'}</td>
                  <td>{payment.assignedTechnician?.fullName || 'Unassigned'}</td>
                  <td>{payment.title || payment.category || 'No title'}</td>
                  <td>{formatCurrency(payment.jobCost)}</td>
                  <td>{formatCurrency(payment.platformFee)}</td>
                  <td>{formatCurrency(payment.totalAmount)}</td>
                  <td>
                    <span className={statusBadge[payment.paymentStatus]?.className || 'admin-payment-badge unpaid'}>
                      {statusBadge[payment.paymentStatus]?.label || payment.paymentStatus}
                    </span>
                  </td>
                  <td>{payment.paymentReference || '—'}</td>
                  <td>{formatDateTime(payment.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
