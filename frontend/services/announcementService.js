/**
 * Announcements API Service
 */
import api from './api';

export const getAnnouncements = async (department) => {
  const params = department ? { department } : {};
  const sp = new URLSearchParams(params).toString();
  const url = sp ? `/announcements?${sp}` : '/announcements';
  const response = await api.get(url);
  return response.data;
};

export const postAnnouncement = async (data) => {
  const response = await api.post('/announcements', data);
  return response.data;
};

export const updateAnnouncement = async (id, data) => {
  const response = await api.put(`/announcements/${id}`, data);
  return response.data;
};

export const deleteAnnouncement = async (id) => {
  const response = await api.delete(`/announcements/${id}`);
  return response.data;
};
