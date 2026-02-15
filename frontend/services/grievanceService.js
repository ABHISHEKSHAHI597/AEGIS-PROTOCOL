/**
 * Grievance API Service
 * Full API call examples for grievance endpoints
 */
import api from './api';

/**
 * Create new grievance
 * Body: { title, description, category, priority? }
 */
export const createGrievance = async (grievanceData) => {
  const response = await api.post('/grievances', grievanceData);
  return response.data;
};

/**
 * Add attachments to grievance (FormData with 'attachments' files)
 */
export const addGrievanceAttachments = async (id, formData) => {
  const response = await api.post(`/grievances/${id}/attachments`, formData);
  return response.data;
};

/**
 * Assign grievance to faculty (admin only)
 * PUT /api/grievances/:id/assign
 * Body: { assignedTo: facultyUserId }
 */
export const assignGrievanceToFaculty = async (id, assignedTo) => {
  const response = await api.put(`/grievances/${id}/assign`, { assignedTo });
  return response.data;
};

/**
 * Get grievances (role-aware). Params: status, department, faculty, priority, escalationLevel
 * GET /api/grievances
 */
export const getGrievances = async (params = {}) => {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.department) sp.set('department', params.department);
  if (params.faculty) sp.set('faculty', params.faculty);
  if (params.priority) sp.set('priority', params.priority);
  if (params.escalationLevel) sp.set('escalationLevel', params.escalationLevel);
  const url = sp.toString() ? `/grievances?${sp.toString()}` : '/grievances';
  const response = await api.get(url);
  return response.data;
};

/**
 * Get single grievance by ID
 * GET /api/grievances/:id
 */
export const getGrievanceById = async (id) => {
  const response = await api.get(`/grievances/${id}`);
  return response.data;
};

/**
 * Update grievance
 * PUT /api/grievances/:id
 * Body: { title?, description?, category?, status?, assignedTo? }
 */
export const updateGrievance = async (id, updateData) => {
  const response = await api.put(`/grievances/${id}`, updateData);
  return response.data;
};

/**
 * Delete grievance
 * DELETE /api/grievances/:id
 */
export const deleteGrievance = async (id) => {
  const response = await api.delete(`/grievances/${id}`);
  return response.data;
};
