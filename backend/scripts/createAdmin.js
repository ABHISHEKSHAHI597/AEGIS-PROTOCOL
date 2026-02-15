/**
 * Script to create an admin user
 * Run: node scripts/createAdmin.js
 * Or: npm run create-admin (add script to package.json)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = process.argv[2] || 'admin@iitmandi.ac.in';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Admin';

    const exists = await User.findOne({ email });
    if (exists) {
      console.log('Admin user already exists with this email');
      process.exit(0);
    }

    const admin = await User.create({ name, email, password, role: 'admin' });
    console.log('Admin created:', admin.email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();

