/**
 * Event Controller - Campus events with RSVP and attendance
 */
import Event from '../models/Event.js';
import EventRsvp from '../models/EventRsvp.js';

/**
 * @route   GET /api/events
 * @desc    Get events, optional date range
 */
export const getEvents = async (req, res, next) => {
  try {
    const { from, to, upcoming } = req.query;
    const query = {};

    if (upcoming === 'true') {
      query.dateTime = { $gte: new Date() };
    } else if (from || to) {
      if (from) query.dateTime = { ...query.dateTime, $gte: new Date(from) };
      if (to) query.dateTime = { ...query.dateTime, $lte: new Date(to) };
    }

    const events = await Event.find(query)
      .populate('postedBy', 'name')
      .sort({ dateTime: 1 })
      .lean();

    res.json(events);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/events
 * @desc    Create event (Admin/Faculty)
 */
export const createEvent = async (req, res, next) => {
  try {
    const { eventTitle, organizer, dateTime, venue, description, registrationLink } = req.body;
    if (!eventTitle || !dateTime) {
      return res.status(400).json({ message: 'eventTitle and dateTime are required' });
    }

    const event = await Event.create({
      eventTitle,
      organizer: organizer || '',
      dateTime: new Date(dateTime),
      venue: venue || '',
      description: description || '',
      registrationLink: registrationLink || '',
      postedBy: req.user._id,
      attendeesCount: 0,
    });

    const populated = await Event.findById(event._id).populate('postedBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/events/:id/rsvp
 * @desc    RSVP to event
 */
export const rsvpEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const existing = await EventRsvp.findOne({ event: req.params.id, user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'Already RSVPed', rsvp: existing });
    }

    const rsvp = await EventRsvp.create({
      event: req.params.id,
      user: req.user._id,
      status: 'rsvp',
    });

    await Event.findByIdAndUpdate(req.params.id, { $inc: { attendeesCount: 1 } });

    const populated = await EventRsvp.findById(rsvp._id)
      .populate('event', 'eventTitle dateTime venue')
      .populate('user', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/events/:id/attendance
 * @desc    Mark attended (Admin/Faculty or self)
 */
export const markAttendance = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const userId = req.body.userId || req.user._id;
    const canMark = req.user.role === 'admin' || req.user.role === 'faculty' || userId.toString() === req.user._id.toString();

    if (!canMark) {
      return res.status(403).json({ message: 'Not authorized to mark attendance' });
    }

    const rsvp = await EventRsvp.findOneAndUpdate(
      { event: req.params.id, user: userId },
      { status: 'attended', attendedAt: new Date() },
      { new: true }
    );

    if (!rsvp) return res.status(404).json({ message: 'RSVP not found' });
    res.json(rsvp);
  } catch (error) {
    next(error);
  }
};
