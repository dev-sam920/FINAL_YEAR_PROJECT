const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch support data');
  }
  return data;
}

export async function sendSupportMessage({ subject, category, description, priority }) {
  try {
    return await requestJson('/support/contact', {
      method: 'POST',
      body: JSON.stringify({ subject, category, description, priority }),
    });
  } catch (error) {
    throw new Error(error.message || 'An error occurred while sending support message');
  }
}

export async function getMySupportTickets() {
  return await requestJson('/support/tickets', { method: 'GET' });
}

export async function getSupportTicket(ticketId) {
  return await requestJson(`/support/tickets/${ticketId}`, { method: 'GET' });
}

export async function replyToSupportTicket(ticketId, message) {
  return await requestJson(`/support/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function getAdminSupportTickets(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return await requestJson(`/support/admin/tickets${params ? `?${params}` : ''}`, { method: 'GET' });
}

export async function updateSupportTicketStatus(ticketId, status) {
  return await requestJson(`/support/tickets/${ticketId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
