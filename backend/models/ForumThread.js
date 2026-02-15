/**
 * ForumThread Model - Campus Forum
 */
import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
}, { _id: true });

const forumThreadSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Academics', 'Hostel', 'Placements', 'Events'],
      required: true,
    },
    description: { type: String, default: '' },
    attachments: [attachmentSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

forumThreadSchema.index({ category: 1, createdAt: -1 });

export default mongoose.model('ForumThread', forumThreadSchema);
