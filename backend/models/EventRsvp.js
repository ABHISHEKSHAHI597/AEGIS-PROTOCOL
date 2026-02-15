/**
 * EventRsvp - RSVP and attendance tracking for events
 */
import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['rsvp', 'attended'],
      default: 'rsvp',
    },
    attendedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

rsvpSchema.index({ event: 1, user: 1 }, { unique: true });

export default mongoose.model('EventRsvp', rsvpSchema);
