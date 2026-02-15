/**
 * OpportunityApplication - Student apply/save for opportunities
 */
import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['saved', 'applied'],
      default: 'saved',
    },
  },
  { timestamps: true }
);

applicationSchema.index({ opportunity: 1, user: 1 }, { unique: true });

export default mongoose.model('OpportunityApplication', applicationSchema);
