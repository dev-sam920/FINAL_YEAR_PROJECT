import axiosInstance from '../utils/axiosInstance';

export async function initializePayment(requestId) {
  try {
    const response = await axiosInstance.post('/payments/initialize', { requestId });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'An error occurred while initializing payment');
  }
}

export async function verifyPayment(reference) {
  try {
    const response = await axiosInstance.get(`/payments/verify/${encodeURIComponent(reference)}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'An error occurred while verifying payment');
  }
}

export async function getMyPayments() {
  try {
    const response = await axiosInstance.get('/payments/my-payments');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Unable to load payment history');
  }
}

export async function getAdminPayments() {
  try {
    const response = await axiosInstance.get('/admin/payments');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Unable to load admin payments');
  }
}
