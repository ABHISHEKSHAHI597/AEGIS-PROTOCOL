/**
 * Note Controller
 * CRUD for grievance comments/notes - users, faculty, admins can add comments
 * Faculty can add notes to grievances in their department or assigned to them
 */
import Note from '../models/Note.js';
import Grievance from '../models/Grievance.js';
import { emitNewComment } from '../utils/socketService.js';

/** Check if user can access grievance (creator, admin, assigned faculty, or department faculty) */
const canAccessGrievance = (grievance, userId, userRole, userDepartment) => {
  if (!grievance) return false;
  const creatorId = (grievance.createdBy?._id || grievance.createdBy)?.toString?.();
  const assignedId = (grievance.assignedTo?._id || grievance.assignedTo)?.toString?.();
  const myId = userId.toString();
  if (userRole === 'admin') return true;
  if (creatorId === myId) return true;
  if (assignedId === myId) return true;
  if (userRole === 'faculty' && grievance.assignedDepartment && userDepartment &&
      grievance.assignedDepartment === userDepartment) return true;
  return false;
};

/** Check if user can add notes */
const canAddNote = (grievance, userId, userRole, userDepartment) =>
  canAccessGrievance(grievance, userId, userRole, userDepartment);

/**
 * @route   GET /api/grievances/:id/notes
 * @desc    Get comments for a grievance
 * @access  Private - creator, admin, assigned faculty, or department faculty
 */
export const getNotes = async (req, res, next) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate('createdBy', 'name department')
      .populate('assignedTo', 'name department');
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const allowed = canAccessGrievance(grievance, req.user._id, req.user.role, req.user.department);
    if (!allowed) {
      return res.status(403).json({ message: 'Not authorized to view this grievance' });
    }

    let query = { grievance: req.params.id };
    if (req.user.role !== 'admin') {
      query.isInternal = false;
    }

    const notes = await Note.find(query)
      .populate('createdBy', 'name email role department')
      .sort({ createdAt: 1 });

    res.json(notes);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/grievances/:id/notes
 * @desc    Add comment (JSON body) or comment with attachments (multipart)
 * @access  Private - creator, faculty (dept/assigned), admin
 */
export const addNote = async (req, res, next) => {
  try {
    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const allowed = canAddNote(grievance, req.user._id, req.user.role, req.user.department);
    if (!allowed) {
      return res.status(403).json({ message: 'Not authorized to add comments to this grievance' });
    }

    const content = req.body.content || req.body.content?.trim?.() || '';
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const isInternal = req.body.isInternal === true && req.user.role === 'admin';

    const noteData = {
      grievance: req.params.id,
      content: content.trim(),
      createdBy: req.user._id,
      isInternal,
    };

    // Handle file attachments (from multer)
    if (req.files && req.files.length > 0) {
      noteData.attachments = req.files.map((f) => ({
        originalName: f.originalname,
        path: '/uploads/notes/' + f.filename,
        mimeType: f.mimetype || 'application/octet-stream',
      }));
    }

    const note = await Note.create(noteData);
    const populated = await Note.findById(note._id)
      .populate('createdBy', 'name email role department');

    // Real-time: notify creator and assigned faculty (except comment author)
    const grievancePop = await Grievance.findById(req.params.id)
      .populate('createdBy', '_id')
      .populate('assignedTo', '_id');
    const creatorId = (grievancePop?.createdBy?._id || grievancePop?.createdBy)?.toString();
    const assignedId = (grievancePop?.assignedTo?._id || grievancePop?.assignedTo)?.toString();
    const userIdsToNotify = [creatorId, assignedId].filter(Boolean);
    emitNewComment(
      req.params.id,
      grievancePop?.title || 'Grievance',
      req.user._id?.toString(),
      userIdsToNotify
    );

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/grievances/:id/notes/:noteId
 * @desc    Delete a comment (author or admin only)
 * @access  Private
 */
export const deleteNote = async (req, res, next) => {
  try {
    const { id: grievanceId, noteId } = req.params;
    const grievance = await Grievance.findById(grievanceId);
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const note = await Note.findOne({ _id: noteId, grievance: grievanceId });
    if (!note) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isAuthor = note.createdBy.toString() === req.user._id.toString();
    if (!isAuthor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await note.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};
