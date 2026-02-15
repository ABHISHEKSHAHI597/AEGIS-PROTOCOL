/**
 * Grievance Model
 * Complaint with priority, escalation, assignment, attachments, escalation history
 */
import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
}, { _id: true });

/** Tracks when and by whom a grievance was escalated */
const escalationHistorySchema = new mongoose.Schema({
  fromLevel: { type: Number, required: true },
  toLevel: { type: Number, required: true },
  escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, trim: true, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { _id: true });

const grievanceSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    priorityScore: { type: Number, default: 2 }, // 1-4 for sorting
    escalationLevel: { type: Number, default: 1, min: 1, max: 3 },
    escalationHistory: [escalationHistorySchema],
    assignedDepartment: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

grievanceSchema.index({ status: 1, priorityScore: -1, createdAt: -1 });
grievanceSchema.index({ assignedDepartment: 1 });
grievanceSchema.index({ escalationLevel: 1 });

export default mongoose.model('Grievance', grievanceSchema);
