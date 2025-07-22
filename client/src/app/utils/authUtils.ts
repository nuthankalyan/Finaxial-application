'use client';

/**
 * Gets the authentication token from localStorage
 * @returns {string|null} The authentication token or null if not found
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('token');
};

/**
 * Sets the authentication token in localStorage
 * @param {string} token - The authentication token to store
 */
export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('token', token);
};

/**
 * Removes the authentication token from localStorage
 */
export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem('token');
};

/**
 * Checks if the user is authenticated
 * @returns {boolean} True if the user is authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return !!localStorage.getItem('token');
};
