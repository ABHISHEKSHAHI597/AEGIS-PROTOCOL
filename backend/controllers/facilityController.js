/**
 * Facility Controller
 * Facilities + booking: conflict detection, approval, history, cancel, admin override
 */
import Facility from '../models/Facility.js';
import Booking from '../models/Booking.js';

/**
 * @route   GET /api/facilities
 * @desc    Get all facilities (optional: type, campus, search by name)
 */
export const getFacilities = async (req, res, next) => {
  try {
    const { type, campus, search } = req.query;
    const query = {};
    if (type) query.type = type;
    if (campus) query.campus = campus;
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { building: { $regex: term, $options: 'i' } },
        { location: { $regex: term, $options: 'i' } },
        { buildingCode: { $regex: term, $options: 'i' } },
      ];
    }
    const facilities = await Facility.find(query).sort({ campus: 1, type: 1, name: 1 });
    res.json(facilities);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/facilities/:id
 * @desc    Get single facility
 */
export const getFacility = async (req, res, next) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json(facility);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/facilities/:id/availability
 * @desc    Get availability for a date (for heatmap/slot picker)
 */
export const getAvailability = async (req, res, next) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const approved = await Booking.find({
      facility: facility._id,
      bookingStatus: 'approved',
      'bookingTimeSlot.start': { $gte: date, $lt: nextDay },
      cancelledAt: { $exists: false },
    }).lean();

    res.json({ slots: approved, maxCapacity: facility.maxCapacity || 1 });
  } catch (error) {
    next(error);
  }
};

/**
 * Check overlapping approved bookings in time range
 */
const getConflictCount = async (facilityId, start, end, excludeBookingId = null) => {
  const q = {
    facility: facilityId,
    bookingStatus: 'approved',
    'bookingTimeSlot.start': { $lt: end },
    'bookingTimeSlot.end': { $gt: start },
    $or: [{ cancelledAt: { $exists: false } }, { cancelledAt: null }],
  };
  if (excludeBookingId) q._id = { $ne: excludeBookingId };
  return Booking.countDocuments(q);
};

/**
 * @route   POST /api/facilities/:id/book
 * @desc    Create booking (pending by default)
 */
export const createBooking = async (req, res, next) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    const { start, end, recurring } = req.body;
    if (!start || !end) {
      return res.status(400).json({ message: 'Start and end time required' });
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate <= startDate) {
      return res.status(400).json({ message: 'End must be after start' });
    }

    const conflictCount = await getConflictCount(facility._id, startDate, endDate);
    const maxCap = facility.maxCapacity || 1;
    if (conflictCount >= maxCap) {
      return res.status(400).json({
        message: 'Time slot not available (conflict or at capacity)',
        conflict: true,
      });
    }

    const booking = await Booking.create({
      facility: facility._id,
      user: req.user._id,
      bookingTimeSlot: { start: startDate, end: endDate },
      bookingStatus: 'pending',
      recurringBooking: recurring
        ? { enabled: true, pattern: recurring.pattern || 'weekly', endDate: recurring.endDate ? new Date(recurring.endDate) : null }
        : { enabled: false },
    });

    const populated = await Booking.findById(booking._id)
      .populate('facility', 'name type')
      .populate('user', 'name email');
    res.status(201).json({
      ...populated.toObject(),
      message: 'Booking request submitted. You will be notified when approved.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/facilities/bookings/:bookingId/approve
 * @desc    Approve booking (admin or facility manager)
 */
export const approveBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('facility');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.bookingStatus !== 'pending') {
      return res.status(400).json({ message: 'Booking already processed' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can approve' });
    }

    const conflictCount = await getConflictCount(
      booking.facility._id,
      booking.bookingTimeSlot.start,
      booking.bookingTimeSlot.end,
      booking._id
    );
    const maxCap = booking.facility.maxCapacity || 1;
    if (conflictCount >= maxCap) {
      return res.status(400).json({
        message: 'Cannot approve: slot conflict or at capacity',
        conflict: true,
      });
    }

    booking.bookingStatus = 'approved';
    booking.respondedBy = req.user._id;
    booking.respondedAt = new Date();
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('facility', 'name type')
      .populate('user', 'name email');
    res.json({
      ...populated.toObject(),
      message: 'Booking approved. User will be notified.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/facilities/bookings/:bookingId/reject
 * @desc    Reject booking
 */
export const rejectBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.bookingStatus !== 'pending') {
      return res.status(400).json({ message: 'Booking already processed' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can reject' });
    }

    booking.bookingStatus = 'rejected';
    booking.respondedBy = req.user._id;
    booking.respondedAt = new Date();
    booking.rejectionReason = req.body.reason || '';
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('facility', 'name type')
      .populate('user', 'name email');
    res.json({
      ...populated.toObject(),
      message: 'Booking rejected. User will be notified.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/facilities/bookings/my
 * @desc    Current user's bookings (history)
 */
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('facility', 'name type')
      .sort({ 'bookingTimeSlot.start': -1 })
      .limit(100);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/facilities/bookings/pending
 * @desc    Pending bookings (admin approval dashboard)
 */
export const getPendingBookings = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    const bookings = await Booking.find({ bookingStatus: 'pending' })
      .populate('facility', 'name type')
      .populate('user', 'name email')
      .sort({ createdAt: 1 });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/facilities/bookings/:bookingId
 * @desc    Cancel booking (user or admin override)
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user._id;
    await booking.save();

    res.json({
      message: 'Booking cancelled',
      booking: await Booking.findById(booking._id).populate('facility', 'name').populate('user', 'name'),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/facilities/map/coordinates
 * @desc    Get facilities with map coordinates (latitude, longitude) for Leaflet markers
 */
export const getMapCoordinates = async (req, res, next) => {
  try {
    const { type, campus, buildingCode } = req.query;
    const query = {
      latitude: { $ne: null, $exists: true },
      longitude: { $ne: null, $exists: true },
    };
    if (type) query.type = type;
    if (campus) query.campus = campus;
    if (buildingCode && buildingCode.trim()) {
      query.$or = [
        { buildingCode: new RegExp(buildingCode.trim(), 'i') },
        { building: new RegExp(buildingCode.trim(), 'i') },
      ];
    }
    const facilities = await Facility.find(query)
      .select('name type latitude longitude building buildingCode campus hours floor floorMapImage')
      .sort({ name: 1 });
    res.json(facilities);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/facilities/map/nearest
 * @desc    Get nearest facilities to user's lat/lng
 */
export const getNearestFacilities = async (req, res, next) => {
  try {
    const { lat, lng, limit = 10, type } = req.query;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ message: 'lat and lng are required (valid numbers)' });
    }

    const query = {
      latitude: { $ne: null, $exists: true },
      longitude: { $ne: null, $exists: true },
    };
    if (type) query.type = type;

    const facilities = await Facility.find(query).lean();
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    const withDistance = facilities.map((f) => {
      const d = Math.sqrt(
        Math.pow(f.latitude - userLat, 2) + Math.pow(f.longitude - userLng, 2)
      ) * 111; // rough km
      return { ...f, distance: Math.round(d * 1000) / 1000 };
    });
    withDistance.sort((a, b) => a.distance - b.distance);
    res.json(withDistance.slice(0, limitNum));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/facilities/bookings/:bookingId/admin-override
 * @desc    Admin override: force approve (ignore conflict) or force cancel
 */
export const adminOverride = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    const booking = await Booking.findById(req.params.bookingId).populate('facility');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const { action } = req.body;
    if (action === 'approve') {
      booking.bookingStatus = 'approved';
      booking.respondedBy = req.user._id;
      booking.respondedAt = new Date();
      await booking.save();
      return res.json({ message: 'Booking force-approved (admin override)', booking });
    }
    if (action === 'cancel') {
      booking.cancelledAt = new Date();
      booking.cancelledBy = req.user._id;
      await booking.save();
      return res.json({ message: 'Booking cancelled (admin override)', booking });
    }
    return res.status(400).json({ message: 'action must be approve or cancel' });
  } catch (error) {
    next(error);
  }
};
