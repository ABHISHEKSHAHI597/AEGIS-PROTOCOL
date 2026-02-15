/**
 * Create a faculty user (for assigning grievances).
 * Run: node scripts/createFaculty.js [email] [password] [name] [facultyId] [department]
 * Example: node scripts/createFaculty.js faculty@example.com faculty123 "Dr. Smith" F001 CSE
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createFaculty = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = process.argv[2] || 'faculty@example.com';
    const password = process.argv[3] || 'faculty123';
    const name = process.argv[4] || 'Faculty User';
    const facultyId = process.argv[5] || 'F001';
    const department = process.argv[6] || 'Academic';

    const exists = await User.findOne({ email });
    if (exists) {
      console.log('User already exists with this email. Updating to faculty...');
      exists.role = 'faculty';
      exists.facultyId = facultyId;
      exists.department = department;
      await exists.save();
      console.log('Updated to faculty:', exists.email);
      process.exit(0);
      return;
    }

    const faculty = await User.create({
      name,
      email,
      password,
      role: 'faculty',
      facultyId,
      department,
    });
    console.log('Faculty created:', faculty.email, '| facultyId:', faculty.facultyId);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createFaculty();
