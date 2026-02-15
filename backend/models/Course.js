/**
 * Course Model
 * Reference for academic notes (course code/name)
 */
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: { type: String, trim: true },
  },
  { timestamps: true }
);

courseSchema.index({ code: 1 });
courseSchema.index({ name: 'text' });

export default mongoose.model('Course', courseSchema);
