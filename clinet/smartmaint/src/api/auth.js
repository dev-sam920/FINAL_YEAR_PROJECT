/**
 * Authentication API calls
 * Handles signup, login, and logout operations
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Sign up a new user
 * @param {Object} formData - User registration data
 * @param {string} formData.fullName - User's full name
 * @param {string} formData.email - User's email address
 * @param {string} formData.password - User's password
 * @returns {Promise<Object>} Success response with user data
 * @throws {Error} With backend error message
 */
export async function signupUser({ fullName, email, password }) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        fullName,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create account');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'An error occurred during signup');
  }
}

/**
 * Login user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} Success response with user data and token
 * @throws {Error} With backend error message
 */
export async function loginUser({ email, password }) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to login');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'An error occurred during login');
  }
}

/**
 * Logout user
 * @returns {Promise<Object>} Success response
 * @throws {Error} With backend error message
 */
export async function logoutUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to logout');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'An error occurred during logout');
  }
}

/**
 * Get current authenticated user from backend
 * @returns {Promise<Object>} Response with user data
 * @throws {Error} With backend error message
 */
export async function getCurrentUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load user');
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'An error occurred while fetching current user');
  }
}
