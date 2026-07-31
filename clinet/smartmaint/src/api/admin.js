import axiosInstance from '../utils/axiosInstance.js';

export async function getAdminStats() {
  const resp = await axiosInstance.get('/admin/stats');
  return resp.data;
}

export async function getAllRequests(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const resp = await axiosInstance.get(`/admin/requests${params ? '?' + params : ''}`);
  return resp.data;
}

export async function getTechnicians() {
  const resp = await axiosInstance.get('/admin/technicians');
  return resp.data;
}

export async function getPendingTechnicians() {
  const resp = await axiosInstance.get('/admin/technicians/pending');
  return resp.data;
}

export async function reviewTechnicianApplication(technicianId, action) {
  const resp = await axiosInstance.patch(`/admin/technicians/${technicianId}/review`, { action });
  return resp.data;
}

export async function createTechnician(data) {
  const resp = await axiosInstance.post('/admin/technicians', {
    fullName: data?.fullName,
    email: data?.email,
  });
  return resp.data;
}

export async function getClients() {
  const resp = await axiosInstance.get('/admin/clients');
  return resp.data;
}

export async function assignTechnician(requestId, technicianId) {
  const resp = await axiosInstance.patch(`/admin/requests/${requestId}/assign`, { technicianId });
  return resp.data;
}
