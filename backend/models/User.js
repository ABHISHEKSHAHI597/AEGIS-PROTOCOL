/**
 * User Model
 * Roles: user (create/view own), admin (manage all), faculty (manage assigned), author (create/view own)
 * facultyId = unique identifier for faculty; department = for faculty and author
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'faculty', 'author'],
      default: 'user',
    },
    /** Unique identifier for faculty role; used when assigning grievances */
    facultyId: { type: String, trim: true, sparse: true },
    /** Department (for faculty and author) */
    department: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    year: { type: String, trim: true },
    semester: { type: String, trim: true },
    phone: { type: String, trim: true },
    profileImage: { type: String, default: null },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.index({ facultyId: 1 }, { unique: true, sparse: true });

// Hash password before saving to database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
