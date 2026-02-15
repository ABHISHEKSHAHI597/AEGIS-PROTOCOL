/**
 * ForumReply Model - Replies to forum threads
 */
import mongoose from 'mongoose';

const forumReplySchema = new mongoose.Schema(
  {
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForumThread',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

forumReplySchema.index({ threadId: 1, createdAt: 1 });

export default mongoose.model('ForumReply', forumReplySchema);
