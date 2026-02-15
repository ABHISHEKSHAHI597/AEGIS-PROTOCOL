/**
 * CourseProgress Model
 * Linked to User - tracks student course progress, attendance, marks
 */
import mongoose from 'mongoose';

const courseProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    faculty: {
      type: String,
      trim: true,
      default: '',
    },
    attendancePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    marks: {
      type: Number,
      default: 0,
      min: 0,
    },
    assignmentsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAssignments: {
      type: Number,
      default: 0,
      min: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

courseProgressSchema.index({ user: 1, courseName: 1 }, { unique: true });

export default mongoose.model('CourseProgress', courseProgressSchema);
