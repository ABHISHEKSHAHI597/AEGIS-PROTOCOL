/**
 * Note API Service
 * Comments with optional attachments
 */
import api from './api';

export const getNotes = async (grievanceId) => {
  const response = await api.get(`/grievances/${grievanceId}/notes`);
  return response.data;
};

/**
 * Add comment - supports JSON (content only) or FormData (content + attachments)
 */
export const addNote = async (grievanceId, content, isInternal = false, attachments = []) => {
  if (attachments?.length > 0) {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('isInternal', isInternal);
    attachments.forEach((f) => formData.append('attachments', f));
    const response = await api.post(`/grievances/${grievanceId}/notes`, formData);
    return response.data;
  }
  const response = await api.post(`/grievances/${grievanceId}/notes`, {
    content,
    isInternal,
  });
  return response.data;
};

export const deleteNote = async (grievanceId, noteId) => {
  await api.delete(`/grievances/${grievanceId}/notes/${noteId}`);
};
