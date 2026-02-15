/**
 * Academic Note Controller
 * Search, filter, upload, versioning, download count, optional faculty-only upload
 */
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import AcademicNote from '../models/AcademicNote.js';
import Course from '../models/Course.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const ALLOWED_ROLES_UPLOAD = ['admin', 'faculty']; // set to ['admin','faculty','user'] to allow all

/**
 * @route   GET /api/notes
 * @desc    List notes with search, filter, pagination
 */
export const getNotes = async (req, res, next) => {
  try {
    const {
      keyword,
      title,
      courseId,
      subject,
      semester,
      uploadedBy,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
    } = req.query;

    const query = { parentNoteId: null }; // only top-level (latest version per note chain)

    if (keyword && keyword.trim()) {
      query.$or = [
        { title: new RegExp(keyword.trim(), 'i') },
        { description: new RegExp(keyword.trim(), 'i') },
        { subject: new RegExp(keyword.trim(), 'i') },
        { tags: new RegExp(keyword.trim(), 'i') },
      ];
    }
    if (title && title.trim()) {
      query.title = new RegExp(title.trim(), 'i');
    }
    if (courseId) query.courseId = courseId;
    if (subject) query.subject = new RegExp(subject, 'i');
    if (semester) query.semester = new RegExp(semester, 'i');
    if (uploadedBy) query.uploadedBy = uploadedBy;
    // Students cannot see faculty-only notes
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      query.facultyOnly = { $ne: true };
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, Math.max(1, parseInt(limit, 10)));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const [roots, total] = await Promise.all([
      AcademicNote.find(query)
        .populate('courseId', 'code name')
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AcademicNote.countDocuments(query),
    ]);

    const latestIds = [...new Set(roots.map((r) => (r.latestVersionId || r._id).toString()))];
    const latestDocs = latestIds.length
      ? await AcademicNote.find({ _id: { $in: roots.map((r) => r.latestVersionId || r._id) } })
          .populate('courseId', 'code name')
          .populate('uploadedBy', 'name email')
          .lean()
      : [];
    const byId = Object.fromEntries(latestDocs.map((d) => [d._id.toString(), d]));
    const notes = roots.map((r) => {
      const latest = byId[(r.latestVersionId || r._id).toString()];
      return latest ? { ...latest, _id: r._id, rootId: r._id } : { ...r, rootId: r._id };
    });

    res.json({
      notes,
      pagination: {
        page: Math.max(1, parseInt(page, 10)),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notes/:id
 * @desc    Get single note (for detail / preview); resolves to latest version if exists
 */
export const getNoteById = async (req, res, next) => {
  try {
    let note = await AcademicNote.findById(req.params.id)
      .populate('courseId', 'code name')
      .populate('uploadedBy', 'name email')
      .lean();
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    if (note.latestVersionId) {
      const latest = await AcademicNote.findById(note.latestVersionId)
        .populate('courseId', 'code name')
        .populate('uploadedBy', 'name email')
        .lean();
      if (latest) note = { ...latest, _id: note._id, rootId: note._id };
    }
    res.json(note);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/notes
 * @desc    Upload new note (optional: faculty only)
 */
export const uploadNote = async (req, res, next) => {
  try {
    if (ALLOWED_ROLES_UPLOAD.length && !ALLOWED_ROLES_UPLOAD.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only faculty or admin can upload notes. Contact admin for access.',
      });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'File is required' });
    }

    const { title, description, courseId, subject, semester, tags } = req.body;
    if (!title || !subject || !semester) {
      return res.status(400).json({
        message: 'Title, subject, and semester are required',
      });
    }

    const tagArray = typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : Array.isArray(tags) ? tags.filter(Boolean) : [];

    const facultyOnly = req.body.facultyOnly === true || req.body.facultyOnly === 'true';
    const note = await AcademicNote.create({
      title: title.trim(),
      description: (description || '').trim(),
      fileUrl: `/uploads/notes/${req.file.filename}`,
      fileName: req.file.originalname || req.file.filename,
      fileSize: req.file.size || 0,
      mimeType: req.file.mimetype || 'application/pdf',
      courseId: courseId || null,
      subject: subject.trim(),
      semester: semester.trim(),
      uploadedBy: req.user._id,
      version: 1,
      downloadCount: 0,
      facultyOnly,
      ratings: 0,
      tags: tagArray,
    });

    const populated = await AcademicNote.findById(note._id)
      .populate('courseId', 'code name')
      .populate('uploadedBy', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/notes/:id
 * @desc    Update note (new version: upload new file and create new doc linked by parentNoteId)
 */
export const updateNote = async (req, res, next) => {
  try {
    const existing = await AcademicNote.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Note not found' });
    }
    if (existing.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    const parentId = existing.parentNoteId || existing._id;
    const nextVersion = (existing.version || 1) + 1;

    const { title, description, courseId, subject, semester, tags } = req.body;
    const tagArray = typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : Array.isArray(tags) ? tags.filter(Boolean) : [];

    const updateData = {
      title: (title || existing.title).trim(),
      description: (description ?? existing.description).trim(),
      courseId: courseId || existing.courseId,
      subject: (subject || existing.subject).trim(),
      semester: (semester || existing.semester).trim(),
      tags: tagArray.length ? tagArray : existing.tags,
      parentNoteId: parentId,
      version: nextVersion,
      uploadedBy: req.user._id,
      downloadCount: 0,
    };

    if (req.file && req.file.path) {
      updateData.fileUrl = `/uploads/notes/${req.file.filename}`;
      updateData.fileName = req.file.originalname || req.file.filename;
      updateData.fileSize = req.file.size || 0;
      updateData.mimeType = req.file.mimetype || 'application/pdf';
    } else {
      updateData.fileUrl = existing.fileUrl;
      updateData.fileName = existing.fileName;
      updateData.fileSize = existing.fileSize;
      updateData.mimeType = existing.mimeType;
    }

    const newNote = await AcademicNote.create(updateData);
    await AcademicNote.findByIdAndUpdate(parentId, { latestVersionId: newNote._id });

    const populated = await AcademicNote.findById(newNote._id)
      .populate('courseId', 'code name')
      .populate('uploadedBy', 'name email');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notes/:id/download
 * @desc    Get download URL and increment download count (on root)
 */
export const downloadNote = async (req, res, next) => {
  try {
    const root = await AcademicNote.findById(req.params.id).lean();
    if (!root) {
      return res.status(404).json({ message: 'Note not found' });
    }
    const fileNote = root.latestVersionId
      ? await AcademicNote.findById(root.latestVersionId).lean()
      : root;
    await AcademicNote.findByIdAndUpdate(root._id, { $inc: { downloadCount: 1 } });
    const newCount = (root.downloadCount || 0) + 1;
    res.json({
      downloadUrl: fileNote.fileUrl,
      fileName: fileNote.fileName,
      downloadCount: newCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notes/:id/versions
 * @desc    Get version history for a note
 */
export const getNoteVersions = async (req, res, next) => {
  try {
    const note = await AcademicNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    const parentId = note.parentNoteId || note._id;
    const versions = await AcademicNote.find({ $or: [{ _id: parentId }, { parentNoteId: parentId }] })
      .populate('uploadedBy', 'name')
      .sort({ version: 1 })
      .lean();
    res.json(versions);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notes/analytics/top
 * @desc    Top notes by download count (for dashboard)
 */
export const getTopDownloads = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const notes = await AcademicNote.find({ parentNoteId: null })
      .sort({ downloadCount: -1 })
      .limit(limit)
      .populate('courseId', 'code name')
      .populate('uploadedBy', 'name')
      .select('title subject semester downloadCount fileUrl')
      .lean();
    res.json(notes);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notes/:id/file
 * @desc    Stream note file for preview (authenticated); uses latest version file if exists
 */
export const getNoteFile = async (req, res, next) => {
  try {
    let note = await AcademicNote.findById(req.params.id).lean();
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    if (note.latestVersionId) {
      const latest = await AcademicNote.findById(note.latestVersionId).lean();
      if (latest) note = latest;
    }
    const fullPath = path.join(__dirname, '..', note.fileUrl);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.setHeader('Content-Type', note.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(note.fileName)}"`);
    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/courses
 * @desc    List courses (for dropdowns)
 */
export const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({}).sort({ code: 1 }).lean();
    res.json(courses);
  } catch (error) {
    next(error);
  }
};
