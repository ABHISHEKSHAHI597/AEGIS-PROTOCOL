/**
 * Event Routes
 */
import express from 'express';
import { getEvents, createEvent, rsvpEvent, markAttendance } from '../controllers/eventController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const facultyOrAdmin = (req, res, next) => {
  if (['admin', 'faculty'].includes(req.user?.role)) return next();
  res.status(403).json({ message: 'Access denied' });
};

router.use(protect);

router.get('/', getEvents);
router.post('/', facultyOrAdmin, createEvent);
router.post('/:id/rsvp', rsvpEvent);
router.post('/:id/attendance', markAttendance);

export default router;
