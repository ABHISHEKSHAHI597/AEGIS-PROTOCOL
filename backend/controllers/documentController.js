/**
 * Document Controller
 * User document uploads – private access (owner only)
 */
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import UserDocument from '../models/UserDocument.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @route   GET /api/users/me/documents
 * @desc    List current user's documents
 */
export const getMyDocuments = async (req, res, next) => {
  try {
    const docs = await UserDocument.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-filePath');
    res.json(docs);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users/me/documents
 * @desc    Upload a document (private to user)
 */
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const name = (req.body.name && String(req.body.name).trim()) || req.file.originalname || 'Document';
    const doc = await UserDocument.create({
      user: req.user._id,
      name,
      filePath: '/uploads/documents/' + req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || 'application/octet-stream',
      isPrivate: true,
    });
    res.status(201).json({
      _id: doc._id,
      name: doc.name,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      isPrivate: doc.isPrivate,
      createdAt: doc.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/me/documents/:id/download
 * @desc    Download document – private access (owner only)
 */
export const downloadDocument = async (req, res, next) => {
  try {
    const doc = await UserDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (doc.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this document' });
    }
    const fullPath = path.join(__dirname, '..', doc.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    const filename = doc.originalName || doc.name || 'document';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.sendFile(path.resolve(fullPath));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/users/me/documents/:id
 * @desc    Delete own document
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await UserDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (doc.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this document' });
    }
    const fullPath = path.join(__dirname, '..', doc.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    await doc.deleteOne();
    res.json({ message: 'Document deleted' });
  } catch (error) {
    next(error);
  }
};
