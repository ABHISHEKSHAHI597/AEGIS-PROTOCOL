/**
 * Announcement Routes
 */
import express from 'express';
import {
  getAnnouncements,
  postAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const facultyOrAdmin = (req, res, next) => {
  if (['admin', 'faculty'].includes(req.user?.role)) return next();
  res.status(403).json({ message: 'Access denied' });
};

router.get('/', protect, getAnnouncements);
router.post('/', protect, facultyOrAdmin, postAnnouncement);
router.put('/:id', protect, facultyOrAdmin, updateAnnouncement);
router.delete('/:id', protect, facultyOrAdmin, deleteAnnouncement);

export default router;
