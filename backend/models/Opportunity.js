/**
 * Opportunity Model
 * Internship & Research opportunities
 */
import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    company: { type: String, trim: true, default: '' },
    facultyName: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['Internship', 'Research'],
      required: true,
    },
    stipend: { type: String, trim: true, default: '' },
    deadline: { type: Date, default: null },
    eligibility: { type: String, trim: true, default: '' },
    applyLink: { type: String, trim: true, default: '' },
    description: { type: String, default: '' },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

opportunitySchema.index({ type: 1, status: 1 });
opportunitySchema.index({ deadline: 1 });

export default mongoose.model('Opportunity', opportunitySchema);
