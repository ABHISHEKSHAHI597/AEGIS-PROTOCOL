/**
 * Seed courses for academic notes
 * Run: node scripts/seedCourses.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';

dotenv.config();

const courses = [
  { code: 'MATH101', name: 'Linear Algebra', department: 'Mathematics' },
  { code: 'PHY101', name: 'Physics I', department: 'Physics' },
  { code: 'CS101', name: 'Introduction to Programming', department: 'Computer Science' },
  { code: 'CHEM101', name: 'Chemistry I', department: 'Chemistry' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    for (const c of courses) {
      await Course.findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
    }
    console.log('Courses seeded:', courses.length);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
