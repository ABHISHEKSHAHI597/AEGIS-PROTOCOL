/**
 * Analytics Routes
 * Grievances by priority, department, escalation - Admin only
 */
import express from 'express';
import Grievance from '../models/Grievance.js';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/role.js';

const router = express.Router();
router.use(protect);
router.use(admin);

/**
 * @route   GET /api/analytics/grievances
 * @desc    Aggregate counts: by priority, department, status, escalation
 * @access  Private/Admin
 */
router.get('/grievances', async (req, res, next) => {
  try {
    const [byPriority, byDepartment, byStatus, byEscalation] = await Promise.all([
      Grievance.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Grievance.aggregate([
        { $match: { assignedDepartment: { $ne: '', $exists: true } } },
        { $group: { _id: '$assignedDepartment', count: { $sum: 1 } } },
      ]),
      Grievance.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Grievance.aggregate([{ $group: { _id: '$escalationLevel', count: { $sum: 1 } } }]),
    ]);

    res.json({
      byPriority: Object.fromEntries(byPriority.map((p) => [p._id || 'unknown', p.count])),
      byDepartment: Object.fromEntries(byDepartment.map((d) => [d._id, d.count])),
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      byEscalation: Object.fromEntries(byEscalation.map((e) => [`level_${e._id}`, e.count])),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
