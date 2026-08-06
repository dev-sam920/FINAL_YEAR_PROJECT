import { useContext, useEffect, useState } from 'react';
import { getTechnicianBankList, getTechnicianBalance, getTechnicianWithdrawals, requestWithdrawal, submitBankAccount } from '../../api/technician';
import { AuthContext } from '../../context/AuthContext';

export default function TechnicianWithdraw() {
  const { user } = useContext(AuthContext);
  const [balance, setBalance] = useState({ availableBalance: 0, minimumWithdrawalAmount: 1000, bankAccount: null });
  const [withdrawals, setWithdrawals] = useState([]);
  const [bankForm, setBankForm] = useState({ bankName: '', bankCode: '058', accountNumber: '', confirmAccount: false });
  const [bankOptions, setBankOptions] = useState([]);
  const [bankMessage, setBankMessage] = useState('');
  const [bankError, setBankError] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMessage, setWithdrawMessage] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [loadingBank, setLoadingBank] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [balanceResponse, withdrawalsResponse, bankListResponse] = await Promise.all([
          getTechnicianBalance(),
          getTechnicianWithdrawals(),
          getTechnicianBankList(),
        ]);

        setBalance(balanceResponse || { availableBalance: 0, minimumWithdrawalAmount: 1000, bankAccount: null });
        setWithdrawals(Array.isArray(withdrawalsResponse.withdrawals) ? withdrawalsResponse.withdrawals : []);
        setBankOptions(Array.isArray(bankListResponse.banks) ? bankListResponse.banks : []);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, []);

  const handleBankSubmit = async (event) => {
    event.preventDefault();
    setBankError('');
    setBankMessage('');
    setLoadingBank(true);

    try {
      const response = await submitBankAccount({
        bankName: bankForm.bankName,
        bankCode: bankForm.bankCode,
        accountNumber: bankForm.accountNumber,
        confirmAccount: bankForm.confirmAccount,
      });

      if (response.requiresConfirmation) {
        setBankMessage(`Account holder name: ${response.accountName}. Please confirm and submit again to save this account.`);
      } else {
        setBankMessage(response.message || 'Bank account saved successfully.');
        setBalance((prev) => ({ ...prev, bankAccount: response.bankAccount }));
        setBankForm((prev) => ({ ...prev, accountNumber: '', bankName: '', confirmAccount: false }));
      }
    } catch (err) {
      setBankError(err?.response?.data?.message || 'Unable to verify bank account');
    } finally {
      setLoadingBank(false);
    }
  };

  const handleWithdraw = async (event) => {
    event.preventDefault();
    setWithdrawError('');
    setWithdrawMessage('');
    setLoadingWithdraw(true);

    try {
      const response = await requestWithdrawal(Number(withdrawAmount));
      setWithdrawError('');
      setWithdrawMessage(response.message || 'Withdrawal successful');
      setWithdrawAmount('');
      const refreshedBalance = await getTechnicianBalance();
      const refreshedWithdrawals = await getTechnicianWithdrawals();
      setBalance(refreshedBalance || { availableBalance: 0, minimumWithdrawalAmount: 1000, bankAccount: null });
      setWithdrawals(Array.isArray(refreshedWithdrawals.withdrawals) ? refreshedWithdrawals.withdrawals : []);
    } catch (err) {
      setWithdrawMessage('');
      setWithdrawError(err?.response?.data?.message || 'Unable to process withdrawal');
    } finally {
      setLoadingWithdraw(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: '#FFFFFF', color: '#111111', padding: '2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Technician Portal</p>
          <h1 style={{ margin: '0.75rem 0 0', fontSize: '2.3rem' }}>Withdraw Funds</h1>
          <p style={{ margin: '0.85rem 0 0', color: '#6B7280' }}>Hello {user?.fullName || 'Technician'}, manage your outgoing transfers here.</p>
        </section>

        <section style={{ background: '#FFFFFF', borderRadius: 24, border: '1px solid #E5E7EB', padding: '1.5rem', boxShadow: '0 10px 24px rgba(17,17,17,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Available Balance</h2>
              <p style={{ margin: '0.4rem 0 0', color: '#6B7280' }}>Transfer your available earnings to your Nigerian bank account.</p>
            </div>
            <div style={{ padding: '0.9rem 1.1rem', borderRadius: 20, background: '#4285F4', color: '#FFFFFF', minWidth: 220 }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 }}>Available Balance</div>
              <div style={{ marginTop: 6, fontSize: '1.55rem', fontWeight: 700 }}>₦{Number(balance.availableBalance || 0).toLocaleString()}</div>
            </div>
          </div>

          <div style={{ marginTop: '1.3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <form onSubmit={handleBankSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', border: '1px solid #E5E7EB', borderRadius: 20, padding: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Bank Account</h3>
              {balance.bankAccount?.accountNumber ? (
                <div style={{ padding: '0.8rem', borderRadius: 16, background: '#F8FAFC' }}>
                  <div style={{ fontWeight: 700 }}>{balance.bankAccount.accountName || 'Saved account'}</div>
                  <div style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>{balance.bankAccount.bankName || 'Bank account'} · {balance.bankAccount.accountNumber}</div>
                </div>
              ) : (
                <>
                  <select value={bankForm.bankCode} onChange={(event) => setBankForm((prev) => ({ ...prev, bankCode: event.target.value }))} style={{ borderRadius: 14, border: '1px solid #E5E7EB', padding: '0.8rem 0.9rem' }}>
                    {bankOptions.length === 0 ? (
                      <>
                        <option value="058">Guaranty Trust Bank (GTB)</option>
                        <option value="033">United Bank for Africa (UBA)</option>
                        <option value="044">Access Bank</option>
                        <option value="057">Zenith Bank</option>
                      </>
                    ) : bankOptions.map((bank) => (
                      <option key={bank.code} value={bank.code}>{bank.name}</option>
                    ))}
                  </select>
                  <input value={bankForm.accountNumber} onChange={(event) => setBankForm((prev) => ({ ...prev, accountNumber: event.target.value }))} placeholder="Account number" style={{ borderRadius: 14, border: '1px solid #E5E7EB', padding: '0.8rem 0.9rem' }} />
                  <input value={bankForm.bankName} onChange={(event) => setBankForm((prev) => ({ ...prev, bankName: event.target.value }))} placeholder="Bank name" style={{ borderRadius: 14, border: '1px solid #E5E7EB', padding: '0.8rem 0.9rem' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6B7280' }}>
                    <input type="checkbox" checked={bankForm.confirmAccount} onChange={(event) => setBankForm((prev) => ({ ...prev, confirmAccount: event.target.checked }))} />
                    Yes, this is my account
                  </label>
                  <button type="submit" disabled={loadingBank} style={{ borderRadius: 14, background: '#4285F4', color: '#FFFFFF', border: 'none', padding: '0.8rem 1rem', fontWeight: 700, cursor: 'pointer' }}>{loadingBank ? 'Verifying...' : 'Verify & Save Account'}</button>
                </>
              )}
              {bankMessage && <div style={{ color: '#4285F4', fontSize: 13 }}>{bankMessage}</div>}
              {bankError && <div style={{ color: '#B91C1C', fontSize: 13 }}>{bankError}</div>}
            </form>

            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', border: '1px solid #E5E7EB', borderRadius: 20, padding: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Withdraw Funds</h3>
              <input type="number" min={balance.minimumWithdrawalAmount} max={balance.availableBalance || 0} value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder={`Amount (min ₦${Number(balance.minimumWithdrawalAmount || 1000).toLocaleString()})`} style={{ borderRadius: 14, border: '1px solid #E5E7EB', padding: '0.8rem 0.9rem' }} />
              <div style={{ color: '#6B7280', fontSize: 13 }}>Maximum available: ₦{Number(balance.availableBalance || 0).toLocaleString()}</div>
              <button type="submit" disabled={loadingWithdraw || Number(balance.availableBalance || 0) < Number(balance.minimumWithdrawalAmount || 1000)} style={{ borderRadius: 14, background: '#4285F4', color: '#FFFFFF', border: 'none', padding: '0.8rem 1rem', fontWeight: 700, cursor: 'pointer' }}>{loadingWithdraw ? 'Processing...' : 'Request Withdrawal'}</button>
              {withdrawMessage && <div style={{ color: '#4285F4', fontSize: 13 }}>{withdrawMessage}</div>}
              {withdrawError && <div style={{ color: '#B91C1C', fontSize: 13 }}>{withdrawError}</div>}
            </form>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Withdrawal History</h2>
              <p style={{ margin: '0.4rem 0 0', color: '#6B7280' }}>Your recent transfer requests.</p>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {withdrawals.length === 0 ? (
              <div style={{ padding: '1.5rem', borderRadius: 20, background: '#F8FAFC', color: '#111111', textAlign: 'center' }}>No withdrawals yet.</div>
            ) : withdrawals.map((item) => (
              <div key={item._id} style={{ borderRadius: 20, background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '1rem', marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>₦{Number(item.amount || 0).toLocaleString()}</div>
                  <div style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>{new Date(item.createdAt).toLocaleDateString()}</div>
                </div>
                <span style={{ padding: '0.35rem 0.8rem', borderRadius: 9999, fontSize: 12, fontWeight: 700, background: item.status === 'success' ? '#ECFCCB' : item.status === 'failed' ? '#FEE2E2' : '#FDE68A', color: item.status === 'success' ? '#166534' : item.status === 'failed' ? '#991B1B' : '#92400E' }}>{(item.status || 'pending').toUpperCase()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
