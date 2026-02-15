/**
 * Academic Notes API Service
 */
import api from './api';

export const getNotes = async (params = {}) => {
  const searchParams = new URLSearchParams(params).toString();
  const url = searchParams ? `/notes?${searchParams}` : '/notes';
  const response = await api.get(url);
  return response.data;
};

export const getNoteById = async (id) => {
  const response = await api.get(`/notes/${id}`);
  return response.data;
};

/** Fetch note file as blob (use with createObjectURL for preview) */
export const getNoteFileBlob = async (id) => {
  const response = await api.get(`/notes/${id}/file`, { responseType: 'blob' });
  return response.data;
};

export const downloadNote = async (id) => {
  const response = await api.get(`/notes/${id}/download`);
  return response.data;
};

export const getNoteVersions = async (id) => {
  const response = await api.get(`/notes/${id}/versions`);
  return response.data;
};

export const getTopDownloads = async (limit = 10) => {
  const response = await api.get(`/notes/analytics/top?limit=${limit}`);
  return response.data;
};

export const getCourses = async () => {
  const response = await api.get('/notes/courses');
  return response.data;
};

export const uploadNote = async (formData) => {
  const response = await api.post('/notes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateNote = async (id, formData) => {
  const response = await api.put(`/notes/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
