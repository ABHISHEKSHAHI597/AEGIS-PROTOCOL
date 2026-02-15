/**
 * Event API Service
 */
import api from './api';

export const getEvents = async (params = {}) => {
  const sp = new URLSearchParams(params).toString();
  const url = sp ? `/events?${sp}` : '/events';
  const response = await api.get(url);
  return response.data;
};

export const getUpcomingEvents = async (limit = 10) => {
  const response = await api.get(`/events?upcoming=true`);
  return Array.isArray(response.data) ? response.data.slice(0, limit) : [];
};

export const createEvent = async (data) => {
  const response = await api.post('/events', data);
  return response.data;
};

export const rsvpEvent = async (eventId) => {
  const response = await api.post(`/events/${eventId}/rsvp`);
  return response.data;
};

export const markAttendance = async (eventId, userId) => {
  const response = await api.post(`/events/${eventId}/attendance`, userId ? { userId } : {});
  return response.data;
};
