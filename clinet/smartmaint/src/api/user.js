import axiosInstance from '../utils/axiosInstance.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';

export async function updateProfile({ fullName, phone, unitAddress, address, state, specialty, lga }) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ fullName, phone, unitAddress, address, state, specialty, lga }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'An error occurred while updating profile');
  }
}

export async function changePassword({ currentPassword, newPassword }) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to change password');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'An error occurred while changing password');
  }
}

export async function uploadProfilePicture(file) {
  try {
    const formData = new FormData();
    formData.append('profilePicture', file);

    // Use fetch for multipart/form-data to avoid forcing Content-Type headers
    const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
    const response = await fetch(`${API_BASE_URL}/users/profile-picture`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload profile picture');
    }

    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to upload profile picture';
    throw new Error(message);
  }
}
