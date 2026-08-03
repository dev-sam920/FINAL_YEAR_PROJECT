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
