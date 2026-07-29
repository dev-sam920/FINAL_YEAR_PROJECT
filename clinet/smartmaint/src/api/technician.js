import axiosInstance from '../utils/axiosInstance.js';

export async function getTechnicianStats() {
  const resp = await axiosInstance.get('/api/technician/stats');
  return resp.data;
}

export async function getMyAssignments(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const resp = await axiosInstance.get(`/api/technician/requests${params ? '?' + params : ''}`);
  return resp.data;
}

export async function updateRequestStatus(requestId, status, note) {
  const resp = await axiosInstance.patch(`/api/technician/requests/${requestId}/status`, { status, note });
  return resp.data;
}

export async function changeTechnicianPassword(currentPassword, newPassword) {
  const resp = await axiosInstance.patch('/api/technician/change-password', { currentPassword, newPassword });
  return resp.data;
}
