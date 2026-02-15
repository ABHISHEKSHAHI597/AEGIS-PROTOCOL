/**
 * CourseProgress Controller
 * Assign courses, update attendance, marks, progress
 */
import CourseProgress from '../models/CourseProgress.js';

const calcProgress = (assignmentsCompleted, totalAssignments) => {
  if (!totalAssignments || totalAssignments <= 0) return 0;
  return Math.round((assignmentsCompleted / totalAssignments) * 100);
};

/**
 * @route   GET /api/courses/progress/all
 * @desc    Admin/Faculty: list all course progress
 */
export const getAllCourseProgress = async (req, res, next) => {
  try {
    const courses = await CourseProgress.find({})
      .populate('user', 'name email')
      .sort({ courseName: 1 })
      .lean();
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/courses/progress
 * @desc    Student: view own courses
 */
export const getMyCourses = async (req, res, next) => {
  try {
    const courses = await CourseProgress.find({ user: req.user._id })
      .sort({ courseName: 1 })
      .lean();
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/courses/progress
 * @desc    Admin/Faculty: assign course to student
 */
export const assignCourse = async (req, res, next) => {
  try {
    const { userId, courseName, faculty, totalAssignments } = req.body;
    if (!userId || !courseName) {
      return res.status(400).json({ message: 'userId and courseName are required' });
    }

    const course = await CourseProgress.findOneAndUpdate(
      { user: userId, courseName: courseName.trim() },
      {
        user: userId,
        courseName: courseName.trim(),
        faculty: faculty || '',
        totalAssignments: totalAssignments || 0,
      },
      { upsert: true, new: true }
    );
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/courses/progress/:id/attendance
 * @desc    Faculty: update attendance
 */
export const updateAttendance = async (req, res, next) => {
  try {
    const { attendancePercentage } = req.body;
    if (attendancePercentage === undefined) {
      return res.status(400).json({ message: 'attendancePercentage is required' });
    }
    const val = Math.min(100, Math.max(0, Number(attendancePercentage)));
    const course = await CourseProgress.findByIdAndUpdate(
      req.params.id,
      { attendancePercentage: val },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/courses/progress/:id/marks
 * @desc    Faculty: update marks
 */
export const updateMarks = async (req, res, next) => {
  try {
    const { marks } = req.body;
    if (marks === undefined) {
      return res.status(400).json({ message: 'marks is required' });
    }
    const course = await CourseProgress.findByIdAndUpdate(
      req.params.id,
      { marks: Math.max(0, Number(marks)) },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/courses/progress/:id/assignments
 * @desc    Faculty: update assignments completed
 */
export const updateAssignments = async (req, res, next) => {
  try {
    const { assignmentsCompleted, totalAssignments } = req.body;
    const doc = await CourseProgress.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Course not found' });

    const updates = {};
    if (assignmentsCompleted !== undefined) updates.assignmentsCompleted = Math.max(0, Number(assignmentsCompleted));
    if (totalAssignments !== undefined) updates.totalAssignments = Math.max(0, Number(totalAssignments));

    const finalAssignments = updates.assignmentsCompleted ?? doc.assignmentsCompleted;
    const finalTotal = updates.totalAssignments ?? doc.totalAssignments;
    updates.progressPercentage = calcProgress(finalAssignments, finalTotal);

    const course = await CourseProgress.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(course);
  } catch (error) {
    next(error);
  }
};
