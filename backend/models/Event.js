/**
 * Event Model
 * Campus events with RSVP and attendance tracking
 */
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    eventTitle: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    organizer: {
      type: String,
      trim: true,
      default: '',
    },
    dateTime: {
      type: Date,
      required: [true, 'Date and time are required'],
    },
    venue: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    registrationLink: {
      type: String,
      trim: true,
      default: '',
    },
    attendeesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

eventSchema.index({ dateTime: 1 });
eventSchema.index({ dateTime: -1 });

export default mongoose.model('Event', eventSchema);
