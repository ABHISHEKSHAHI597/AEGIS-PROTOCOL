/**
 * Academic Notes Routes
 * Upload, search, filter, download, versioning
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  getNotes,
  getNoteById,
  uploadNote,
  updateNote,
  downloadNote,
  getNoteFile,
  getNoteVersions,
  getTopDownloads,
  getCourses,
} from '../controllers/academicNoteController.js';
import { protect } from '../middleware/auth.js';
import { faculty, admin } from '../middleware/role.js';
import { uploadNoteFile } from '../middleware/uploadNotes.js';

const router = express.Router();

router.use(protect);

// Upload protected: Faculty/Admin only
const facultyOrAdmin = (req, res, next) => {
  if (['admin', 'faculty'].includes(req.user?.role)) return next();
  return res.status(403).json({ message: 'Only faculty or admin can upload notes.' });
};

const validateUpload = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('semester').trim().notEmpty().withMessage('Semester is required'),
];
const runValidate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.get('/', getNotes);
router.get('/analytics/top', getTopDownloads);
router.get('/courses', getCourses);
router.get('/:id/file', getNoteFile);
router.get('/:id/versions', getNoteVersions);
router.get('/:id/download', downloadNote);
router.get('/:id', getNoteById);

router.post('/', facultyOrAdmin, uploadNoteFile.single('file'), validateUpload, runValidate, uploadNote);
router.put('/:id', facultyOrAdmin, uploadNoteFile.single('file'), updateNote);

export default router;
