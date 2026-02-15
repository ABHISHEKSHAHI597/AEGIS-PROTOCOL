/**
 * Announcement Controller
 */
import Announcement from '../models/Announcement.js';
import { emitNewAnnouncement } from '../utils/socketService.js';

/**
 * @route   GET /api/announcements
 * @desc    Get announcements, department filter, auto-expire
 */
export const getAnnouncements = async (req, res, next) => {
  try {
    const { department } = req.query;
    const query = { $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }] };
    if (department) query.department = department;

    const announcements = await Announcement.find(query)
      .populate('postedBy', 'name')
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    res.json(announcements);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/announcements
 * @desc    Admin/Faculty: post announcement
 */
export const postAnnouncement = async (req, res, next) => {
  try {
    const { title, description, department, priority, pinned, expiryDate } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });

    const ann = await Announcement.create({
      title,
      description: description || '',
      department: department || '',
      priority: priority || 'medium',
      pinned: pinned === true,
      expiryDate: expiryDate || null,
      postedBy: req.user._id,
    });

    const populated = await Announcement.findById(ann._id).populate('postedBy', 'name');
    emitNewAnnouncement(populated);
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/announcements/:id
 * @desc    Edit announcement
 */
export const updateAnnouncement = async (req, res, next) => {
  try {
    const { title, description, department, priority, pinned, expiryDate } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (department !== undefined) updates.department = department;
    if (priority !== undefined) updates.priority = priority;
    if (pinned !== undefined) updates.pinned = pinned;
    if (expiryDate !== undefined) updates.expiryDate = expiryDate || null;

    const ann = await Announcement.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('postedBy', 'name');
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });
    res.json(ann);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/announcements/:id
 * @desc    Delete announcement
 */
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const ann = await Announcement.findByIdAndDelete(req.params.id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};
