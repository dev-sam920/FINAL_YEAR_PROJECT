const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';

export async function sendSupportMessage({ name, email, category, message }) {
  try {
    const response = await fetch(`${API_BASE_URL}/support/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name, email, category, message }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send support message');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'An error occurred while sending support message');
  }
}
