/**
 * Analytics API Service
 */
import api from './api';

export const getGrievanceAnalytics = async () => {
  const response = await api.get('/analytics/grievances');
  return response.data;
};
