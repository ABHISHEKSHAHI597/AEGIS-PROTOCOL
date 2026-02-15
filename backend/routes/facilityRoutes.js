/**
 * Facility Routes
 * Facilities + booking CRUD, approval, history
 */
import express from 'express';
import {
  getFacilities,
  getFacility,
  getMapCoordinates,
  getNearestFacilities,
  getAvailability,
  createBooking,
  approveBooking,
  rejectBooking,
  getMyBookings,
  getPendingBookings,
  cancelBooking,
  adminOverride,
} from '../controllers/facilityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getFacilities);
router.get('/map/coordinates', getMapCoordinates);
router.get('/map/nearest', getNearestFacilities);
router.get('/bookings/my', getMyBookings);
router.get('/bookings/pending', getPendingBookings);
router.put('/bookings/:bookingId/approve', approveBooking);
router.put('/bookings/:bookingId/reject', rejectBooking);
router.put('/bookings/:bookingId/admin-override', adminOverride);
router.delete('/bookings/:bookingId', cancelBooking);

router.get('/:id', getFacility);
router.get('/:id/availability', getAvailability);
router.post('/:id/book', createBooking);

export default router;
