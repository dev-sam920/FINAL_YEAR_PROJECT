/**
 * Request API calls for SmartMaint client dashboard.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';

/**
 * Get the logged-in client's requests.
 * @returns {Promise<Object>} Response data with requests array.
 */
export async function getMyRequests() {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/my-requests`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch requests');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'An error occurred while fetching requests');
  }
}

/**
 * Rate a request with a numeric score.
 * @param {string} requestId
 * @param {number} rating
 */
export async function rateRequest(requestId, rating) {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/rating`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ rating }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to rate request');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'An error occurred while rating the request');
  }
}
