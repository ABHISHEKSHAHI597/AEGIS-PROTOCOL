/**
 * Forum API Service - Campus Forum
 */
import api from './api';

export const getThreads = async (category) => {
  const params = category ? { category } : {};
  const sp = new URLSearchParams(params).toString();
  const url = sp ? `/forum/threads?${sp}` : '/forum/threads';
  const response = await api.get(url);
  return response.data;
};

export const getThreadById = async (id) => {
  const response = await api.get(`/forum/threads/${id}`);
  return response.data;
};

export const createThread = async (data) => {
  const response = await api.post('/forum/threads', data);
  return response.data;
};

export const addReply = async (threadId, message) => {
  const response = await api.post(`/forum/threads/${threadId}/reply`, { message });
  return response.data;
};

export const upvoteThread = async (threadId) => {
  const response = await api.post(`/forum/threads/${threadId}/upvote`);
  return response.data;
};

export const deleteThread = async (threadId) => {
  const response = await api.delete(`/forum/threads/${threadId}`);
  return response.data;
};
