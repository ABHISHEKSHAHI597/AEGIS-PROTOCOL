/**
 * Note Model
 * Notes/comments on grievances - can be internal (admin-only) or public
 */
import mongoose from 'mongoose';

const noteAttachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
}, { _id: true });

const noteSchema = new mongoose.Schema(
  {
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isInternal: {
      type: Boolean,
      default: false, // Internal notes visible only to admins
    },
    attachments: [noteAttachmentSchema],
  },
  { timestamps: true }
);

noteSchema.index({ grievance: 1, createdAt: 1 });

export default mongoose.model('Note', noteSchema);
