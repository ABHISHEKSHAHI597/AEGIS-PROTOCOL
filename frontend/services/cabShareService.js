/**
 * Cab Share / Ride API Service
 */
import api from './api';

export const createRide = async (data) => {
  const response = await api.post('/cabshare', data);
  return response.data;
};

export const getRides = async (params = {}) => {
  const searchParams = new URLSearchParams(params).toString();
  const url = searchParams ? `/cabshare?${searchParams}` : '/cabshare';
  const response = await api.get(url);
  return response.data;
};

export const getMyRides = async () => {
  const response = await api.get('/cabshare/my');
  return response.data;
};

export const getRideHistory = async () => {
  const response = await api.get('/cabshare/history');
  return response.data;
};

export const getRideById = async (id) => {
  const response = await api.get(`/cabshare/${id}`);
  return response.data;
};

export const getRideRequests = async (id) => {
  const response = await api.get(`/cabshare/${id}/requests`);
  return response.data;
};

export const requestJoin = async (id, message = '') => {
  const response = await api.post(`/cabshare/${id}/request`, { message });
  return response.data;
};

export const approveRequest = async (rideId, requestId) => {
  const response = await api.put(`/cabshare/${rideId}/request/${requestId}/approve`);
  return response.data;
};

export const rejectRequest = async (rideId, requestId) => {
  const response = await api.put(`/cabshare/${rideId}/request/${requestId}/reject`);
  return response.data;
};

export const joinRide = async (id) => {
  const response = await api.put(`/cabshare/${id}/join`);
  return response.data;
};

export const leaveRide = async (id) => {
  const response = await api.put(`/cabshare/${id}/leave`);
  return response.data;
};

export const completeRide = async (id) => {
  const response = await api.put(`/cabshare/${id}/complete`);
  return response.data;
};

export const cancelRide = async (id) => {
  const response = await api.delete(`/cabshare/${id}`);
  return response.data;
};

export const rateRide = async (rideId, toUserId, rating, comment = '') => {
  const response = await api.post(`/cabshare/${rideId}/rate`, {
    toUserId,
    rating,
    comment,
  });
  return response.data;
};

export const getUserRatings = async (userId) => {
  const response = await api.get(`/cabshare/ratings/${userId}`);
  return response.data;
};

/** Build Google Maps directions URL for from/to */
export const getMapsUrl = (from, to) => {
  const q = `from ${encodeURIComponent(from)} to ${encodeURIComponent(to)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(to)}&origin=${encodeURIComponent(from)}`;
};
