/**
 * Facility Booking Model
 * Time slots, status, recurring support
 */
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    facility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facility',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingTimeSlot: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    recurringBooking: {
      enabled: { type: Boolean, default: false },
      pattern: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly',
      },
      endDate: { type: Date },
    },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

bookingSchema.index({ facility: 1, 'bookingTimeSlot.start': 1, 'bookingTimeSlot.end': 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ bookingStatus: 1 });

export default mongoose.model('Booking', bookingSchema);
