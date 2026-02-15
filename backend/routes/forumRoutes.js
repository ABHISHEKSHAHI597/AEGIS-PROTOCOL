/**
 * Forum Routes - Campus Forum
 */
import express from 'express';
import {
  getThreads,
  getThreadById,
  createThread,
  addReply,
  upvoteThread,
  deleteThread,
} from '../controllers/forumController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public read (no auth for GET threads - but we use protect for consistency)
router.get('/threads', protect, getThreads);
router.get('/threads/:id', protect, getThreadById);

router.post('/threads', protect, createThread);
router.post('/threads/:id/reply', protect, addReply);
router.post('/threads/:id/upvote', protect, upvoteThread);
router.delete('/threads/:id', protect, deleteThread);

export default router;
