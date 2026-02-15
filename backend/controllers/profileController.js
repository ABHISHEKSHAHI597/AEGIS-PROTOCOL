/**
 * Profile Controller
 * User profile management - only own profile
 */
import User from '../models/User.js';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile (own only)
 * @access  Private
 */
export const updateMe = async (req, res, next) => {
  try {
    const { name, rollNumber, department, year, semester, phone } = req.body;

    const updates = {};
    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ message: 'Name cannot be empty' });
      updates.name = trimmed;
    }
    if (rollNumber !== undefined) updates.rollNumber = String(rollNumber || '').trim();
    if (department !== undefined) updates.department = String(department || '').trim();
    if (year !== undefined) updates.year = String(year || '').trim();
    if (semester !== undefined) updates.semester = String(semester || '').trim();
    if (phone !== undefined) updates.phone = String(phone || '').trim();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users/upload-photo
 * @desc    Upload profile photo
 * @access  Private
 */
export const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old photo if exists
    if (user.profileImage) {
      const oldPath = path.join(__dirname, '..', 'uploads', path.basename(user.profileImage));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Store relative path: /uploads/filename
    user.profileImage = '/uploads/' + req.file.filename;
    await user.save({ validateBeforeSave: false });

    const updated = await User.findById(user._id).select('-password');
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/me/qr
 * @desc    Get QR code containing student ID data
 * @access  Private
 */
export const getMyQR = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('name email rollNumber department year semester');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const idData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber || '',
      department: user.department || '',
      year: user.year || '',
      semester: user.semester || '',
    };

    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(idData), {
      width: 200,
      margin: 2,
    });

    res.json({ qr: qrDataUrl, data: idData });
  } catch (error) {
    next(error);
  }
};
