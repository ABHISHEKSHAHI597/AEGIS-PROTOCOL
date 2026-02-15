/**
 * Opportunity Routes - Internships & Research
 */
import express from 'express';
import { getOpportunities, postOpportunity, applyOpportunity } from '../controllers/opportunityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const facultyOrAdmin = (req, res, next) => {
  if (['admin', 'faculty'].includes(req.user?.role)) return next();
  res.status(403).json({ message: 'Only admin or faculty can post opportunities' });
};

// Public read (or protected - all logged-in can view)
router.get('/', protect, getOpportunities);

router.post('/', protect, facultyOrAdmin, postOpportunity);
router.post('/:id/apply', protect, applyOpportunity);

export default router;
