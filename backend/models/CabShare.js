/**
 * Cab Share / Ride Model
 * Full ride management: status, seats, route, history, driver verification
 */
import mongoose from 'mongoose';

const rideHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['created', 'joined', 'left', 'cancelled', 'completed', 'request_approved', 'request_rejected'],
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const cabShareSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: [true, 'Pickup location is required'],
      trim: true,
    },
    to: {
      type: String,
      required: [true, 'Drop location is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
      trim: true,
    },
    seats: {
      type: Number,
      required: true,
      min: 1,
      default: 4,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    passengers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    contactInfo: { type: String, trim: true },
    notes: { type: String, trim: true },
    rideStatus: {
      type: String,
      enum: ['active', 'full', 'completed', 'cancelled'],
      default: 'active',
    },
    routeCoordinates: [
      {
        lat: { type: Number },
        lng: { type: Number },
        label: { type: String },
      },
    ],
    rideHistory: [rideHistorySchema],
    driverVerificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

cabShareSchema.index({ date: 1, rideStatus: 1 });
cabShareSchema.index({ createdBy: 1 });
cabShareSchema.index({ passengers: 1 });

cabShareSchema.virtual('seatAvailability').get(function () {
  return Math.max(0, this.seats - (this.passengers?.length || 0));
});

cabShareSchema.set('toJSON', { virtuals: true });
cabShareSchema.set('toObject', { virtuals: true });

export default mongoose.model('CabShare', cabShareSchema);
