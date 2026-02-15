/**
 * Facility API Service + Booking
 */
import api from './api';

export const getFacilities = async (params = {}) => {
  const opts = typeof params === 'string' ? { type: params } : params;
  const { type, campus, search, buildingCode } = opts;
  const sp = new URLSearchParams();
  if (type) sp.set('type', type);
  if (campus) sp.set('campus', campus);
  if (search && search.trim()) sp.set('search', search.trim());
  if (buildingCode && buildingCode.trim()) sp.set('buildingCode', buildingCode.trim());
  const url = sp.toString() ? `/facilities?${sp.toString()}` : '/facilities';
  const response = await api.get(url);
  return response.data;
};

export const getMapCoordinates = async (params = {}) => {
  const sp = new URLSearchParams(params).toString();
  const url = sp ? `/facilities/map/coordinates?${sp}` : '/facilities/map/coordinates';
  const response = await api.get(url);
  return response.data;
};

export const getNearestFacilities = async (lat, lng, limit = 10, type) => {
  const sp = new URLSearchParams({ lat, lng, limit: limit || 10 });
  if (type) sp.set('type', type);
  const response = await api.get(`/facilities/map/nearest?${sp}`);
  return response.data;
};

export const getFacility = async (id) => {
  const response = await api.get(`/facilities/${id}`);
  return response.data;
};

export const getAvailability = async (facilityId, date) => {
  const params = date ? { date: typeof date === 'string' ? date : date.toISOString().slice(0, 10) } : {};
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `/facilities/${facilityId}/availability?${qs}` : `/facilities/${facilityId}/availability`;
  const response = await api.get(url);
  return response.data;
};

export const createBooking = async (facilityId, data) => {
  const response = await api.post(`/facilities/${facilityId}/book`, data);
  return response.data;
};

export const getMyBookings = async () => {
  const response = await api.get('/facilities/bookings/my');
  return response.data;
};

export const getPendingBookings = async () => {
  const response = await api.get('/facilities/bookings/pending');
  return response.data;
};

export const approveBooking = async (bookingId) => {
  const response = await api.put(`/facilities/bookings/${bookingId}/approve`);
  return response.data;
};

export const rejectBooking = async (bookingId, reason = '') => {
  const response = await api.put(`/facilities/bookings/${bookingId}/reject`, { reason });
  return response.data;
};

export const cancelBooking = async (bookingId) => {
  const response = await api.delete(`/facilities/bookings/${bookingId}`);
  return response.data;
};

export const adminOverrideBooking = async (bookingId, action) => {
  const response = await api.put(`/facilities/bookings/${bookingId}/admin-override`, { action });
  return response.data;
};
