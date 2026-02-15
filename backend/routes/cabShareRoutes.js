/**
 * Cab Share Routes
 * Ride CRUD, requests, completion, ratings
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  createRide,
  getRides,
  getMyRides,
  getRideHistory,
  getRideById,
  requestJoin,
  approveRequest,
  rejectRequest,
  getRideRequests,
  joinRide,
  leaveRide,
  completeRide,
  cancelRide,
  rateRide,
  getUserRatings,
} from '../controllers/cabShareController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const validateCreate = async (req, res, next) => {
  await Promise.all([
    body('from').trim().notEmpty().withMessage('Pickup location is required').run(req),
    body('to').trim().notEmpty().withMessage('Drop location is required').run(req),
    body('date').notEmpty().withMessage('Date is required').run(req),
    body('time').trim().notEmpty().withMessage('Time is required').run(req),
    body('seats').isInt({ min: 1 }).withMessage('Seats must be at least 1').run(req),
  ]);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.use(protect);

router.post('/', validateCreate, createRide);
router.get('/', getRides);
router.get('/my', getMyRides);
router.get('/history', getRideHistory);
router.get('/ratings/:userId', getUserRatings);
router.get('/:id', getRideById);
router.get('/:id/requests', getRideRequests);
router.post('/:id/request', requestJoin);
router.put('/:id/request/:requestId/approve', approveRequest);
router.put('/:id/request/:requestId/reject', rejectRequest);
router.put('/:id/join', joinRide);
router.put('/:id/leave', leaveRide);
router.put('/:id/complete', completeRide);
router.delete('/:id', cancelRide);
router.post('/:id/rate', rateRide);

export default router;
