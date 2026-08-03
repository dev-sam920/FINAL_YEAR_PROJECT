const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function initializePayment(requestId) {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ requestId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to initialize payment');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'An error occurred while initializing payment');
  }
}

export async function verifyPayment(reference) {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify payment');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'An error occurred while verifying payment');
  }
}
