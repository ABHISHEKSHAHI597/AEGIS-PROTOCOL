/**
 * CourseProgress Routes
 */
import express from 'express';
import {
  getMyCourses,
  getAllCourseProgress,
  assignCourse,
  updateAttendance,
  updateMarks,
  updateAssignments,
} from '../controllers/courseProgressController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const facultyOrAdmin = (req, res, next) => {
  if (['admin', 'faculty'].includes(req.user?.role)) return next();
  res.status(403).json({ message: 'Access denied' });
};

router.use(protect);

// Admin/Faculty: list all course progress
router.get('/progress/all', facultyOrAdmin, getAllCourseProgress);

// Student: view own courses
router.get('/progress', getMyCourses);

// Admin/Faculty: assign course
router.post('/progress', facultyOrAdmin, assignCourse);

// Faculty: update course data
router.put('/progress/:id/attendance', facultyOrAdmin, updateAttendance);
router.put('/progress/:id/marks', facultyOrAdmin, updateMarks);
router.put('/progress/:id/assignments', facultyOrAdmin, updateAssignments);

export default router;
