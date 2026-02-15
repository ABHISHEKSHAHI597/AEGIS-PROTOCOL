/**
 * User Routes
 * Profile (own) + Admin user management
 */
import express from 'express';
import { getUsers } from '../controllers/userController.js';
import {
  getMe,
  updateMe,
  uploadPhoto as uploadPhotoHandler,
  getMyQR,
} from '../controllers/profileController.js';
import {
  getMyDocuments,
  uploadDocument as uploadDocumentHandler,
  downloadDocument,
  deleteDocument,
} from '../controllers/documentController.js';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/role.js';
import { uploadPhoto as multerUpload } from '../middleware/upload.js';
import { uploadDocument as multerDoc } from '../middleware/uploadDocuments.js';

const router = express.Router();

// Profile routes - more specific first
router.get('/me/qr', protect, getMyQR);
router.get('/me/documents', protect, getMyDocuments);
router.post('/me/documents', protect, multerDoc.single('document'), uploadDocumentHandler);
router.get('/me/documents/:id/download', protect, downloadDocument);
router.delete('/me/documents/:id', protect, deleteDocument);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.post('/upload-photo', protect, multerUpload.single('photo'), uploadPhotoHandler);

// Admin only - get all users
router.get('/', protect, admin, getUsers);

export default router;
