import axiosInstance from '../utils/axiosInstance.js';

export async function getTechnicianStats() {
  const resp = await axiosInstance.get('/technician/stats');
  return resp.data;
}

export async function getMyAssignments(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const resp = await axiosInstance.get(`/technician/requests${params ? '?' + params : ''}`);
  return resp.data;
}

export async function updateRequestStatus(requestId, status, note, jobCost) {
  const resp = await axiosInstance.patch(`/technician/requests/${requestId}/status`, { status, note, jobCost });
  return resp.data;
}

export async function changeTechnicianPassword(currentPassword, newPassword) {
  const resp = await axiosInstance.patch('/technician/change-password', { currentPassword, newPassword });
  return resp.data;
}

export async function getTechnicianBankList() {
  const resp = await axiosInstance.get('/technician/banks');
  return resp.data;
}

export async function getTechnicianBalance() {
  const resp = await axiosInstance.get('/technician/balance');
  return resp.data;
}

export async function getTechnicianWithdrawals() {
  const resp = await axiosInstance.get('/technician/withdrawals');
  return resp.data;
}

export async function submitBankAccount(payload) {
  const resp = await axiosInstance.post('/technician/bank-account', payload);
  return resp.data;
}

export async function requestWithdrawal(amount) {
  const resp = await axiosInstance.post('/technician/withdraw', { amount });
  return resp.data;
}
