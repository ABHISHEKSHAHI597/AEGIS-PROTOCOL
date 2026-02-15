/**
 * CourseProgress API Service
 */
import api from './api';

export const getAllCourseProgress = async () => {
  const response = await api.get('/courses/progress/all');
  return response.data;
};

export const getMyCourses = async () => {
  const response = await api.get('/courses/progress');
  return response.data;
};

export const assignCourse = async (data) => {
  const response = await api.post('/courses/progress', data);
  return response.data;
};

export const updateAttendance = async (id, attendancePercentage) => {
  const response = await api.put(`/courses/progress/${id}/attendance`, { attendancePercentage });
  return response.data;
};

export const updateMarks = async (id, marks) => {
  const response = await api.put(`/courses/progress/${id}/marks`, { marks });
  return response.data;
};

export const updateAssignments = async (id, data) => {
  const response = await api.put(`/courses/progress/${id}/assignments`, data);
  return response.data;
};
