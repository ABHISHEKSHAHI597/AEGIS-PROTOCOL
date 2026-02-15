/**
 * User Controller
 * Handles user-related operations (admin only)
 */
import User from '../models/User.js';

/**
 * @route   GET /api/users
 * @desc    Get all users or filter by role (admin only). Query: ?role=faculty|admin|user|author
 * @access  Private/Admin
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = role && ['user', 'admin', 'faculty', 'author'].includes(role) ? { role } : {};
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};
