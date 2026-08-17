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

export async function getAdminPayments() {
  const resp = await axiosInstance.get('/admin/payments');
  return resp.data;
}

export async function assignTechnician(requestId, technicianId) {
  const resp = await axiosInstance.patch(`/admin/requests/${requestId}/assign`, { technicianId });
  return resp.data;
}

export async function setRequestCost(requestId, cost) {
  const resp = await axiosInstance.patch(`/admin/requests/${requestId}/set-cost`, { cost });
  return resp.data;
}

export async function getAnalyticsOverview() {
  const resp = await axiosInstance.get('/admin/analytics/overview');
  return resp.data;
}

export async function getRequestsOverTime(days = 30) {
  const resp = await axiosInstance.get(`/admin/analytics/requests-over-time?days=${days}`);
  return resp.data;
}

export async function getRevenueOverTime(days = 30) {
  const resp = await axiosInstance.get(`/admin/analytics/revenue-over-time?days=${days}`);
  return resp.data;
}

export async function getRequestsByCategory() {
  const resp = await axiosInstance.get('/admin/analytics/requests-by-category');
  return resp.data;
}

export async function getRequestsByStatus() {
  const resp = await axiosInstance.get('/admin/analytics/requests-by-status');
  return resp.data;
}

export async function getTopTechnicians() {
  const resp = await axiosInstance.get('/admin/analytics/top-technicians');
  return resp.data;
}

export async function getCompletedGrowth() {
  const resp = await axiosInstance.get('/admin/analytics/completed-growth');
  return resp.data;
}
