/**
 * Grievance Controller
 * Role-aware: user/author (own), faculty (assigned), admin (all). Assign to faculty (admin only).
 */
import Grievance from '../models/Grievance.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { emitGrievanceStatusChange, emitEscalation } from '../utils/socketService.js';

const PRIORITY_SCORE = { low: 1, medium: 2, high: 3, critical: 4 };
const POPULATE_CREATED = { path: 'createdBy', select: 'name email role department' };
const POPULATE_ASSIGNED = { path: 'assignedTo', select: 'name email facultyId department role' };

/**
 * @route   POST /api/grievances
 * @desc    Create grievance (user & author only)
 * @access  Private
 */
export const createGrievance = async (req, res, next) => {
  try {
    const { title, description, category, priority } = req.body;
    const priorityScore = priority ? (PRIORITY_SCORE[priority] || 2) : 2;
    const grievance = await Grievance.create({
      title,
      description,
      category,
      priority: priority || 'medium',
      priorityScore,
      createdBy: req.user._id,
    });

    const populated = await Grievance.findById(grievance._id)
      .populate(POPULATE_CREATED)
      .populate(POPULATE_ASSIGNED);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/grievances/:id
 * @desc    Get single grievance (admin: all; user/author: own; faculty: if assigned)
 * @access  Private
 */
export const getGrievanceById = async (req, res, next) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate(POPULATE_CREATED)
      .populate(POPULATE_ASSIGNED)
      .populate('escalationHistory.escalatedBy', 'name email role');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const creatorId = (grievance.createdBy?._id || grievance.createdBy)?.toString();
    const assignedId = (grievance.assignedTo?._id || grievance.assignedTo)?.toString();
    const myId = req.user._id.toString();

    if (req.user.role === 'admin') {
      return res.json(grievance);
    }
    if (req.user.role === 'faculty') {
      const myDept = req.user.department || '';
      const inMyDept = myDept && grievance.assignedDepartment === myDept;
      if (assignedId === myId || inMyDept) return res.json(grievance);
      return res.status(403).json({ message: 'Not authorized to view this grievance' });
    }
    if (creatorId !== myId) {
      return res.status(403).json({ message: 'Not authorized to view this grievance' });
    }
    res.json(grievance);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/grievances
 * @desc    List grievances. Admin: all + filter by status, department, assignedTo, priority, escalation.
 *          Faculty: assigned OR department grievances. User/Author: own.
 * @access  Private
 */
export const getGrievances = async (req, res, next) => {
  try {
    let query = {};
    const { status, department, faculty, priority, escalationLevel } = req.query;

    if (req.user.role === 'admin') {
      if (status) query.status = status;
      if (department) query.assignedDepartment = department;
      if (faculty) query.assignedTo = faculty;
      if (priority) query.priority = priority;
      if (escalationLevel) query.escalationLevel = Number(escalationLevel) || 1;
    } else if (req.user.role === 'faculty') {
      // Faculty sees: assigned to them OR in their department
      const myId = req.user._id;
      const myDept = req.user.department || '';
      query.$or = [
        { assignedTo: myId },
        ...(myDept ? [{ assignedDepartment: myDept }] : []),
      ];
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (escalationLevel) query.escalationLevel = Number(escalationLevel) || 1;
    } else {
      query.createdBy = req.user._id;
      if (status) query.status = status;
      if (priority) query.priority = priority;
    }

    const grievances = await Grievance.find(query)
      .populate(POPULATE_CREATED)
      .populate(POPULATE_ASSIGNED)
      .sort({ priorityScore: -1, createdAt: -1 });

    res.json(grievances);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/grievances/:id
 * @desc    Update. Admin: full. Faculty: status only for assigned. User/Author: title, description, category (own).
 * @access  Private
 */
export const updateGrievance = async (req, res, next) => {
  try {
    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const creatorId = grievance.createdBy?.toString?.() || grievance.createdBy?.toString();
    const assignedId = grievance.assignedTo?.toString?.() || grievance.assignedTo?.toString();
    const myId = req.user._id.toString();

    let allowedFields = ['title', 'description', 'category'];
    if (req.user.role === 'admin') {
      allowedFields = ['title', 'description', 'category', 'status', 'assignedTo', 'priority', 'escalationLevel', 'assignedDepartment'];
    } else if (req.user.role === 'faculty') {
      // Faculty can update if assigned OR grievance is in their department
      const myDept = req.user.department || '';
      const inMyDept = myDept && grievance.assignedDepartment === myDept;
      if (assignedId !== myId && !inMyDept) {
        return res.status(403).json({ message: 'Not authorized to update this grievance' });
      }
      allowedFields = ['status', 'priority', 'escalationLevel'];
    } else {
      if (creatorId !== myId) {
        return res.status(403).json({ message: 'Not authorized to update this grievance' });
      }
    }

    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    if (updates.priority) {
      updates.priorityScore = PRIORITY_SCORE[updates.priority] ?? grievance.priorityScore;
    }

    // Track escalation history when escalationLevel changes
    if (updates.escalationLevel !== undefined && updates.escalationLevel !== grievance.escalationLevel) {
      const historyEntry = {
        fromLevel: grievance.escalationLevel,
        toLevel: updates.escalationLevel,
        escalatedBy: req.user._id,
        reason: req.body.escalationReason || '',
      };
      updates.$push = updates.$push || {};
      updates.$push.escalationHistory = historyEntry;
    }

    const previousStatus = grievance.status;
    const updated = await Grievance.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate(POPULATE_CREATED)
      .populate(POPULATE_ASSIGNED);

    if (updated && updates.status && updates.status !== previousStatus) {
      const toNotify = (updated.createdBy?._id || updated.createdBy)?.toString();
      if (toNotify) {
        await Notification.create({
          user: toNotify,
          type: 'grievance_status',
          title: 'Grievance status updated',
          message: `"${updated.title}" is now ${updates.status}.`,
          link: `/grievance/${updated._id}`,
          metadata: { grievanceId: updated._id, previousStatus, newStatus: updates.status },
        });
        emitGrievanceStatusChange(updated._id, toNotify, updated.title, updates.status);
      }
    }

    if (updated && updates.escalationLevel !== undefined && updates.escalationLevel !== grievance.escalationLevel) {
      const creatorId = (updated.createdBy?._id || updated.createdBy)?.toString();
      if (creatorId) {
        emitEscalation(updated._id, updated.title, creatorId, updates.escalationLevel);
      }
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/grievances/:id/assign
 * @desc    Assign grievance to faculty (admin only). assignedTo must be a faculty user.
 * @access  Private/Admin
 */
export const assignToFaculty = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    if (!assignedTo) {
      return res.status(400).json({ message: 'assignedTo (faculty user ID) is required' });
    }

    const facultyUser = await User.findById(assignedTo).select('role');
    if (!facultyUser || facultyUser.role !== 'faculty') {
      return res.status(400).json({ message: 'assignedTo must be a user with faculty role' });
    }

    const grievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true, runValidators: true }
    )
      .populate(POPULATE_CREATED)
      .populate(POPULATE_ASSIGNED);

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    res.json(grievance);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/grievances/:id/attachments
 * @desc    Add file attachments (creator, admin, or assigned faculty)
 * @access  Private
 */
export const addAttachments = async (req, res, next) => {
  try {
    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }
    const creatorId = grievance.createdBy?.toString?.() || grievance.createdBy?.toString();
    const assignedId = grievance.assignedTo?.toString?.() || grievance.assignedTo?.toString();
    const myId = req.user._id.toString();
    const myDept = req.user.department || '';
    const inMyDept = myDept && grievance.assignedDepartment === myDept;
    const allowed = req.user.role === 'admin' || creatorId === myId ||
      (req.user.role === 'faculty' && (assignedId === myId || inMyDept));
    if (!allowed) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const files = req.files || [];
    for (const f of files) {
      grievance.attachments.push({
        originalName: f.originalname,
        path: '/uploads/grievances/' + f.filename,
        mimeType: f.mimetype || 'application/octet-stream',
      });
    }
    await grievance.save();
    const updated = await Grievance.findById(grievance._id)
      .populate(POPULATE_CREATED)
      .populate(POPULATE_ASSIGNED);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/grievances/:id
 * @desc    Delete grievance
 * @access  Private
 */
export const deleteGrievance = async (req, res, next) => {
  try {
    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    // Only creator or admin can delete
    if (req.user.role !== 'admin' && grievance.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this grievance' });
    }

    await grievance.deleteOne();
    res.json({ message: 'Grievance removed' });
  } catch (error) {
    next(error);
  }
};
