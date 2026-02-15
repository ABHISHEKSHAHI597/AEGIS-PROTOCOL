/**
 * User API Service
 * Admin-only user management
 */
import api from './api';

/**
 * Get all users or by role (admin only)
 * GET /api/users?role=faculty|admin|user|author
 */
export const getUsers = async (role) => {
  const url = role ? `/users?role=${encodeURIComponent(role)}` : '/users';
  const response = await api.get(url);
  return response.data;
};
