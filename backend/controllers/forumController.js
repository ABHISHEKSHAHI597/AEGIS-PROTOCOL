/**
 * Forum Controller - Campus Forum
 */
import ForumThread from '../models/ForumThread.js';
import ForumReply from '../models/ForumReply.js';

/**
 * @route   GET /api/forum/threads
 * @desc    Public read - list threads
 */
export const getThreads = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category) query.category = category;

    const threads = await ForumThread.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const replyCounts = await ForumReply.aggregate([
      { $match: { threadId: { $in: threads.map((t) => t._id) } } },
      { $group: { _id: '$threadId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(replyCounts.map((r) => [r._id.toString(), r.count]));

    const enriched = threads.map((t) => ({
      ...t,
      replyCount: countMap[t._id.toString()] || 0,
    }));
    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/forum/threads/:id
 * @desc    Get thread with replies
 */
export const getThreadById = async (req, res, next) => {
  try {
    const thread = await ForumThread.findById(req.params.id)
      .populate('createdBy', 'name email');
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const replies = await ForumReply.find({ threadId: req.params.id })
      .populate('userId', 'name')
      .sort({ createdAt: 1 })
      .lean();

    res.json({ thread, replies });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/forum/threads
 * @desc    Auth: create thread
 */
export const createThread = async (req, res, next) => {
  try {
    const { title, category, description } = req.body;
    if (!title || !category) {
      return res.status(400).json({ message: 'title and category are required' });
    }

    const thread = await ForumThread.create({
      title,
      category,
      description: description || '',
      createdBy: req.user._id,
    });

    const populated = await ForumThread.findById(thread._id).populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/forum/threads/:id/reply
 * @desc    Auth: reply to thread
 */
export const addReply = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ message: 'message is required' });

    const thread = await ForumThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const reply = await ForumReply.create({
      threadId: req.params.id,
      message: message.trim(),
      userId: req.user._id,
    });

    const populated = await ForumReply.findById(reply._id).populate('userId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/forum/threads/:id/upvote
 * @desc    Auth: upvote thread
 */
export const upvoteThread = async (req, res, next) => {
  try {
    const thread = await ForumThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const userId = req.user._id;
    const upvoted = thread.upvotedBy?.some((id) => id.toString() === userId.toString()) ?? false;

    if (upvoted) {
      await ForumThread.findByIdAndUpdate(req.params.id, {
        $pull: { upvotedBy: userId },
        $inc: { upvotes: -1 },
      });
    } else {
      await ForumThread.findByIdAndUpdate(req.params.id, {
        $addToSet: { upvotedBy: userId },
        $inc: { upvotes: 1 },
      });
    }

    const updated = await ForumThread.findById(req.params.id).populate('createdBy', 'name');
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/forum/threads/:id
 * @desc    Delete own thread
 */
export const deleteThread = async (req, res, next) => {
  try {
    const thread = await ForumThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const isOwner = thread.createdBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this thread' });
    }

    await ForumReply.deleteMany({ threadId: req.params.id });
    await ForumThread.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};
