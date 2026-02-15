/**
 * Profile API Service
 */
import api from './api';

const getBaseURL = () => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  }
  return ''; // Same origin with proxy
};

export const getProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/users/me', data);
  return response.data;
};

export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append('photo', file);
  const response = await api.post('/users/upload-photo', formData);
  return response.data;
};

export const getProfileQR = async () => {
  const response = await api.get('/users/me/qr');
  return response.data;
};

/** Get full URL for uploaded files (attachments, profile images) */
export const getProfileImageUrl = (path) => {
  if (!path) return null;
  const base = getBaseURL();
  return path.startsWith('http') ? path : `${base}${path}`;
};

/** Alias for attachment URLs - same logic as getProfileImageUrl */
export const getAttachmentUrl = (path) => getProfileImageUrl(path);

/** List my documents */
export const getMyDocuments = async () => {
  const response = await api.get('/users/me/documents');
  return response.data;
};

/** Upload document (FormData with 'document' file and optional 'name') */
export const uploadProfileDocument = async (formData) => {
  const response = await api.post('/users/me/documents', formData);
  return response.data;
};

/** Download document (returns blob; caller should trigger download) */
export const downloadDocument = async (documentId) => {
  const response = await api.get(`/users/me/documents/${documentId}/download`, { responseType: 'blob' });
  return response.data;
};

/** Delete my document */
export const deleteDocument = async (documentId) => {
  await api.delete(`/users/me/documents/${documentId}`);
};
