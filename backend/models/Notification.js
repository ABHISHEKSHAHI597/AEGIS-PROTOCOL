/**
 * Notification Model
 * In-app alerts (e.g. grievance status change)
 */
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, // e.g. 'grievance_status'
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' }, // e.g. /grievance/:id
    read: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
