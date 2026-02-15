/**
 * Axios API Service
 * Base configuration with JWT token attachment for authenticated requests
 */
import axios from 'axios';

// Base URL - Proxy in dev (vite proxies /api), full URL in production
const api = axios.create({
  baseURL: import.meta.env.PROD ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData: must not set Content-Type so browser adds multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 - Clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
