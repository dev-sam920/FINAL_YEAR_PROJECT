import axiosInstance from '../utils/axiosInstance.js';

export async function getAdminStats() {
  const resp = await axiosInstance.get('/api/admin/stats');
  return resp.data;
}

export async function getAllRequests(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const resp = await axiosInstance.get(`/api/admin/requests${params ? '?' + params : ''}`);
  return resp.data;
}

export async function getTechnicians() {
  const resp = await axiosInstance.get('/api/admin/technicians');
  return resp.data;
}

export async function createTechnician(data) {
  const resp = await axiosInstance.post('/api/admin/technicians', {
    fullName: data?.fullName,
    email: data?.email,
  });
  return resp.data;
}

export async function getClients() {
  const resp = await axiosInstance.get('/api/admin/clients');
  return resp.data;
}

export async function assignTechnician(requestId, technicianId) {
  const resp = await axiosInstance.patch(`/api/admin/requests/${requestId}/assign`, { technicianId });
  return resp.data;
}
