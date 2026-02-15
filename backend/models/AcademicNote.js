/**
 * Academic Note Model
 * Academic repository - notes with file upload, versioning, metadata
 */
import mongoose from 'mongoose';

const academicNoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File is required'],
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: 'application/pdf' },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    facultyOnly: {
      type: Boolean,
      default: false,
    },
    ratings: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    parentNoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicNote',
      default: null,
    },
    latestVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicNote',
      default: null,
    },
  },
  { timestamps: true }
);

academicNoteSchema.index({ subject: 1, semester: 1 });
academicNoteSchema.index({ courseId: 1 });
academicNoteSchema.index({ uploadedBy: 1 });
academicNoteSchema.index({ title: 'text', description: 'text', subject: 'text', tags: 'text' });

export default mongoose.model('AcademicNote', academicNoteSchema);
