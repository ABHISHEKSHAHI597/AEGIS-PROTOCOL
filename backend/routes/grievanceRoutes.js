/**
 * Grievance Routes
 * CRUD operations for grievances
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  createGrievance,
  getGrievances,
  getGrievanceById,
  updateGrievance,
  deleteGrievance,
  addAttachments,
  assignToFaculty,
} from '../controllers/grievanceController.js';
import { uploadGrievanceFiles } from '../middleware/uploadGrievance.js';
import { uploadNoteFiles } from '../middleware/uploadNote.js';
import { getNotes, addNote, deleteNote } from '../controllers/noteController.js';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/role.js';
import { canCreateGrievance } from '../middleware/role.js';

const router = express.Router();

// Validation middleware for create
const validateCreate = async (req, res, next) => {
  const validations = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
  ];
  for (const v of validations) await v.run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// All grievance routes require authentication
router.use(protect);

// POST /api/grievances (user & author only)
router.post('/', canCreateGrievance, validateCreate, createGrievance);

// GET /api/grievances
router.get('/', getGrievances);
// Validation for add note (content can come from JSON or multipart form)
const validateAddNote = async (req, res, next) => {
  const content = req.body?.content?.trim?.() || req.body?.content;
  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }
  next();
};

// Notes - more specific, before /:id
router.get('/:id/notes', getNotes);
router.post('/:id/notes', uploadNoteFiles.array('attachments', 3), validateAddNote, addNote);
router.delete('/:id/notes/:noteId', deleteNote);
// POST /api/grievances/:id/attachments
router.post('/:id/attachments', uploadGrievanceFiles.array('attachments', 5), addAttachments);
// PUT /api/grievances/:id/assign (admin only - assign to faculty)
router.put('/:id/assign', admin, assignToFaculty);
// GET /api/grievances/:id
router.get('/:id', getGrievanceById);
// PUT /api/grievances/:id
router.put('/:id', updateGrievance);
// DELETE /api/grievances/:id
router.delete('/:id', deleteGrievance);

export default router;
