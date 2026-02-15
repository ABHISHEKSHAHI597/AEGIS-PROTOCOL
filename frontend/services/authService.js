/**
 * Authentication API Service
 * Full API call examples for auth endpoints
 */
import api from './api';

/**
 * Register new user
 * POST /api/auth/register
 * Body: { name, email, password, role? }
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

/**
 * Login user
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};
