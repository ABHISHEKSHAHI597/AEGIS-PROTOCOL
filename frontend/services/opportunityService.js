/**
 * Opportunities API Service - Internships & Research
 */
import api from './api';

export const getOpportunities = async (type) => {
  const params = type ? { type } : {};
  const sp = new URLSearchParams(params).toString();
  const url = sp ? `/opportunities?${sp}` : '/opportunities';
  const response = await api.get(url);
  return response.data;
};

export const postOpportunity = async (data) => {
  const response = await api.post('/opportunities', data);
  return response.data;
};

export const applyOpportunity = async (id, action = 'applied') => {
  const response = await api.post(`/opportunities/${id}/apply`, { action });
  return response.data;
};
