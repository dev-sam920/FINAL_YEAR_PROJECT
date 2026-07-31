import axiosInstance from '../utils/axiosInstance.js';

export async function getNotifications() {
  const resp = await axiosInstance.get('/notifications');
  return resp.data;
}

export async function getUnreadCount() {
  const resp = await axiosInstance.get('/notifications/unread-count');
  return resp.data;
}

export async function markAsRead(id) {
  const resp = await axiosInstance.patch(`/notifications/${id}/read`);
  return resp.data;
}

export async function markAllAsRead() {
  const resp = await axiosInstance.patch('/notifications/mark-all-read');
  return resp.data;
}
