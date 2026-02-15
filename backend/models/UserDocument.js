/**
 * UserDocument Model
 * Private document uploads for digital identity (e.g. certificates, ID proofs)
 */
import mongoose from 'mongoose';

const userDocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    originalName: { type: String, trim: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    isPrivate: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userDocumentSchema.index({ user: 1 });

export default mongoose.model('UserDocument', userDocumentSchema);
