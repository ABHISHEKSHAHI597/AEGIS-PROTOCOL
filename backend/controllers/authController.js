/**
 * Authentication Controller
 * Handles user registration and login
 * Email domains: @students.iitmandi.ac.in for students (user), @iitmandi.ac.in for faculty/authority/admin
 */
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { validationResult } from 'express-validator';

const STUDENTS_DOMAIN = 'students.iitmandi.ac.in';
const INSTITUTE_DOMAIN = 'iitmandi.ac.in';

const getEmailDomain = (email) => {
  const parts = (email || '').toLowerCase().trim().split('@');
  return parts.length === 2 ? parts[1] : '';
};

const validateEmailDomainForRole = (email, role) => {
  const domain = getEmailDomain(email);
  if (role === 'user') {
    if (domain !== STUDENTS_DOMAIN) return { valid: false, message: 'Students must use @students.iitmandi.ac.in' };
  } else {
    if (domain !== INSTITUTE_DOMAIN) return { valid: false, message: 'Faculty, Authority and Admin must use @iitmandi.ac.in' };
  }
  return { valid: true };
};

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role: reqRole } = req.body;
    const normalizedEmail = email?.toLowerCase()?.trim();

    const role = ['author', 'faculty', 'authority'].includes(reqRole) ? reqRole : 'user';
    const domainCheck = validateEmailDomainForRole(normalizedEmail, role);
    if (!domainCheck.valid) {
      return res.status(400).json({ message: domainCheck.message });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name: name?.trim(),
      email: normalizedEmail,
      password,
      role,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      facultyId: user.facultyId,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const normalizedEmail = (email || '').toLowerCase().trim();
    const domain = getEmailDomain(normalizedEmail);
    if (domain !== STUDENTS_DOMAIN && domain !== INSTITUTE_DOMAIN) {
      return res.status(400).json({ message: 'Only @students.iitmandi.ac.in and @iitmandi.ac.in emails are allowed.' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'No account found for this email. Please register.', code: 'USER_NOT_FOUND' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.', code: 'INVALID_PASSWORD' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      facultyId: user.facultyId,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};
