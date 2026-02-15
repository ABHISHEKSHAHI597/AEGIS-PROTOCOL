/**
 * Ride Rating Model
 * Rate driver or passenger after ride completion
 */
import mongoose from 'mongoose';

const rideRatingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CabShare',
      required: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

rideRatingSchema.index({ ride: 1, fromUser: 1, toUser: 1 }, { unique: true });
rideRatingSchema.index({ toUser: 1 });

export default mongoose.model('RideRating', rideRatingSchema);
