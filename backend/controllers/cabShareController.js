/**
 * Cab Share Controller
 * Full ride management: requests, completion, history, ratings
 */
import CabShare from '../models/CabShare.js';
import RideRequest from '../models/RideRequest.js';
import RideRating from '../models/RideRating.js';

const addHistory = (ride, action, userId, meta = {}) => {
  if (!ride.rideHistory) ride.rideHistory = [];
  ride.rideHistory.push({ action, userId, at: new Date(), meta });
};

/**
 * @route   POST /api/cabshare
 * @desc    Create new ride
 */
export const createRide = async (req, res, next) => {
  try {
    const { from, to, date, time, seats, contactInfo, notes, routeCoordinates } = req.body;
    const ride = await CabShare.create({
      from,
      to,
      date,
      time,
      seats: seats || 4,
      contactInfo: contactInfo || '',
      notes: notes || '',
      createdBy: req.user._id,
      passengers: [],
      rideStatus: 'active',
      routeCoordinates: routeCoordinates || [],
      rideHistory: [{ action: 'created', userId: req.user._id, at: new Date() }],
    });

    const populated = await CabShare.findById(ride._id)
      .populate('createdBy', 'name email')
      .populate('passengers', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/cabshare
 * @desc    Get rides with filters (active/full by default)
 */
export const getRides = async (req, res, next) => {
  try {
    const { status, from, to, date } = req.query;
    let query = {};

    const statusMap = { Open: 'active', Full: 'full', Completed: 'completed', Cancelled: 'cancelled' };
    const s = status || 'active,full';
    const statuses = s.split(',').map((x) => statusMap[x.trim()] || x.trim()).filter(Boolean);
    if (statuses.length) {
      const legacyStatuses = statuses.map((x) => (x === 'active' ? 'Open' : x === 'full' ? 'Full' : x === 'completed' ? 'Completed' : 'Cancelled'));
      query.$or = [
        { rideStatus: { $in: statuses } },
        { status: { $in: legacyStatuses } },
      ];
    }

    if (from) query.from = new RegExp(from, 'i');
    if (to) query.to = new RegExp(to, 'i');
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: d, $lt: nextDay };
    }

    const rides = await CabShare.find(query)
      .populate('createdBy', 'name email')
      .populate('passengers', 'name email')
      .sort({ date: 1, time: 1 });

    res.json(rides);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/cabshare/my
 * @desc    My rides (created or passenger)
 */
export const getMyRides = async (req, res, next) => {
  try {
    const rides = await CabShare.find({
      $or: [
        { createdBy: req.user._id },
        { passengers: req.user._id },
      ],
    })
      .populate('createdBy', 'name email')
      .populate('passengers', 'name email')
      .sort({ date: -1, time: -1 });

    res.json(rides);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/cabshare/history
 * @desc    Ride history for current user
 */
export const getRideHistory = async (req, res, next) => {
  try {
    const rides = await CabShare.find({
      $or: [
        { createdBy: req.user._id },
        { passengers: req.user._id },
      ],
      rideStatus: { $in: ['completed', 'cancelled'] },
    })
      .populate('createdBy', 'name email')
      .populate('passengers', 'name email')
      .sort({ date: -1, time: -1 })
      .limit(50);

    res.json(rides);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/cabshare/:id
 * @desc    Single ride detail
 */
export const getRideById = async (req, res, next) => {
  try {
    const ride = await CabShare.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('passengers', 'name email');
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    res.json(ride);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/cabshare/:id/request
 * @desc    Request to join (creates pending request)
 */
export const requestJoin = async (req, res, next) => {
  try {
    const ride = await CabShare.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.rideStatus !== 'active') {
      return res.status(400).json({ message: 'Ride is not accepting passengers' });
    }
    if (ride.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You are the driver' });
    }
    if (ride.passengers.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You are already in this ride' });
    }
    if ((ride.passengers?.length || 0) >= ride.seats) {
      return res.status(400).json({ message: 'Ride is full' });
    }

    const existing = await RideRequest.findOne({
      ride: ride._id,
      user: req.user._id,
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending request' });
    }

    await RideRequest.create({
      ride: ride._id,
      user: req.user._id,
      status: 'pending',
      message: req.body.message || '',
    });

    const populated = await CabShare.findById(ride._id)
      .populate('createdBy', 'name email')
      .populate('passengers', 'name email');
    res.status(201).json({ message: 'Request sent', ride: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/cabshare/:id/request/:requestId/approve
 * @desc    Driver approves join request
 */
export const approveRequest = async (req, res, next) => {
  try {
    const ride = await CabShare.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the driver can approve requests' });
    }
    if (ride.rideStatus !== 'active') {
      return res.status(400).json({ message: 'Ride is not accepting passengers' });
    }

    const reqDoc = await RideRequest.findById(req.params.requestId);
    if (!reqDoc || reqDoc.ride.toString() !== ride._id.toString()) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (reqDoc.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    if ((ride.passengers?.length || 0) >= ride.seats) {
      await RideRequest.findByIdAndUpdate(reqDoc._id, {
        status: 'rejected',
        respondedBy: req.user._id,
        respondedAt: new Date(),
      });
      return res.status(400).json({ message: 'Ride is now full' });
    }

    ride.passengers.push(reqDoc.user);
    addHistory(ride, 'request_approved', reqDoc.user, { by: req.user._id });
    if (ride.passengers.length >= ride.seats) {
      ride.rideStatus = 'full';
    }
    await ride.save();

    await RideRequest.findByIdAndUpdate(reqDoc._id, {
      status: 'approved',
      respondedBy: req.user._id,
      respondedAt: new Date(),
    });

    const populated = await CabShare.findById(ride._id)
      .populate('createdBy', 'name email')
      .populate('passengers', 'name email');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/cabshare/:id/request/:requestId/reject
 * @desc    Driver rejects join request
 */
export const rejectRequest = async (req, res, next) => {
  try {
    const ride = await CabShare.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the driver can reject requests' });
    }

    const reqDoc = await RideRequest.findById(req.params.requestId);
    if (!reqDoc || reqDoc.ride.toString() !== ride._id.toString()) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (reqDoc.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    await RideRequest.findByIdAndUpdate(reqDoc._id, {
      status: 'rejected',
      respondedBy: req.user._id,
      respondedAt: new Date(),
    });

    const populated = await CabShare.findById(ride._id)
      .populate('createdBy', 'name email')
      .populate('passengers', 'name email');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/cabshare/:id/requests
 * @desc    Pending requests for a ride (driver only)
 */
export const getRideRequests = async (req, res, next) => {
  try {
    const ride = await CabShare.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the driver can see requests' });
    }

    const requests = await RideRequest.find({ ride: ride._id, status: 'pending' })
      .populate('user', 'name email');
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/cabshare/:id/join
 * @desc    Direct join (no approval) - backward compatible
 */
export const joinRide = async (req, res, next) => {
  try {
    const ride = await CabShare.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.rideStatus !== 'active') {
      return res.status(400).json({ message: 'Ride is not accepting passengers' });
    }
    if (ride.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You are the driver' });
    }
    if (ride.passengers.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You have already joined' });
    }
    if ((ride.passengers?.length || 0) >= ride.seats) {
      return res.status(400).json({ message: 'Ride is full' });
    }

    ride.passengers.push(req.user._id);
    addHistory(ride, 'joined', req.user._id);
    if (ride.passengers.length >= ride.seats) {
      ride.rideStatus = 'full';
    }
    await ride.save();

    const populated = await CabShare.findById(ride._id)
      .populate('createdBy', 'name email')
      .populate('passengers', 'name email');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/cabshare/:id/leave
 * @desc    Leave ride
 */
export const leaveRide = async (req, res, next) => {
  try {
    const ride = await CabShare.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    ride.passengers = ride.passengers.filter(
      (p) => p.toString() !== req.user._id.toString()
    );
    addHistory(ride, 'left', req.user._id);
    if (ride.rideStatus === 'full') ride.rideStatus = 'active';
    await ride.save();

    const populated = await CabShare.findById(ride._id)
      .populate('createdBy', 'name email')
      .populate('passengers', 'name email');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/cabshare/:id/complete
 * @desc    Mark ride as completed (driver only)
 */
export const completeRide = async (req, res, next) => {
  try {
    const ride = await CabShare.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the driver can complete the ride' });
    }
    if (ride.rideStatus === 'cancelled') {
      return res.status(400).json({ message: 'Ride is cancelled' });
    }

    ride.rideStatus = 'completed';
    addHistory(ride, 'completed', req.user._id);
    await ride.save();

    const populated = await CabShare.findById(ride._id)
      .populate('createdBy', 'name email')
      .populate('passengers', 'name email');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/cabshare/:id
 * @desc    Cancel ride (driver only)
 */
export const cancelRide = async (req, res, next) => {
  try {
    const ride = await CabShare.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the driver can cancel' });
    }

    ride.rideStatus = 'cancelled';
    addHistory(ride, 'cancelled', req.user._id);
    await ride.save();

    res.json({ message: 'Ride cancelled', ride });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/cabshare/:id/rate
 * @desc    Rate a user after ride (driver or passenger)
 */
export const rateRide = async (req, res, next) => {
  try {
    const ride = await CabShare.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.rideStatus !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed rides' });
    }

    const isDriver = ride.createdBy.toString() === req.user._id.toString();
    const isPassenger = ride.passengers.some((p) => p.toString() === req.user._id.toString());
    if (!isDriver && !isPassenger) {
      return res.status(403).json({ message: 'You were not in this ride' });
    }

    const { toUserId, rating, comment } = req.body;
    if (!toUserId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'toUserId and rating (1-5) required' });
    }

    const toUserStr = toUserId.toString();
    if (toUserStr === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot rate yourself' });
    }
    const allowed = [ride.createdBy.toString(), ...ride.passengers.map((p) => p.toString())];
    if (!allowed.includes(toUserStr)) {
      return res.status(400).json({ message: 'Can only rate participants of this ride' });
    }

    const existing = await RideRating.findOne({
      ride: ride._id,
      fromUser: req.user._id,
      toUser: toUserId,
    });
    if (existing) {
      return res.status(400).json({ message: 'You already rated this user for this ride' });
    }

    await RideRating.create({
      ride: ride._id,
      fromUser: req.user._id,
      toUser: toUserId,
      rating: parseInt(rating, 10),
      comment: comment || '',
    });

    res.status(201).json({ message: 'Rating submitted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/cabshare/ratings/:userId
 * @desc    Get average rating for a user
 */
export const getUserRatings = async (req, res, next) => {
  try {
    const ratings = await RideRating.find({ toUser: req.params.userId })
      .populate('fromUser', 'name')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const avg =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
        : 0;

    res.json({ average: Math.round(avg * 10) / 10, count: ratings.length, ratings });
  } catch (error) {
    next(error);
  }
};
