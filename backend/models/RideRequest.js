/**
 * Ride Request Model
 * Join requests for rides (approval workflow)
 */
import mongoose from 'mongoose';

const rideRequestSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CabShare',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },
    message: { type: String, trim: true },
  },
  { timestamps: true }
);

rideRequestSchema.index({ ride: 1, user: 1 }, { unique: true });
rideRequestSchema.index({ ride: 1, status: 1 });
rideRequestSchema.index({ user: 1 });

export default mongoose.model('RideRequest', rideRequestSchema);
