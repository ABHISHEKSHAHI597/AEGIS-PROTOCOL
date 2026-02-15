/**
 * Announcement Model
 */
import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
}, { _id: true });

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: { type: String, default: '' },
    department: { type: String, trim: true, default: '' },
    attachments: [attachmentSchema],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    pinned: { type: Boolean, default: false },
    expiryDate: { type: Date, default: null },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

announcementSchema.index({ department: 1 });
announcementSchema.index({ expiryDate: 1 });
announcementSchema.index({ pinned: -1, createdAt: -1 });

export default mongoose.model('Announcement', announcementSchema);
