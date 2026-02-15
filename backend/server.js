/**
 * Grievance Management System - Backend Server
 * Entry point for Express API with Socket.IO for real-time notifications
 */
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import { initSocket } from './utils/socketService.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import grievanceRoutes from './routes/grievanceRoutes.js';
import cabShareRoutes from './routes/cabShareRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import academicNoteRoutes from './routes/academicNoteRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import courseProgressRoutes from './routes/courseProgressRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO for real-time notifications
initSocket(httpServer);

// CORS - Allow frontend to connect
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - profile uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/cabshare', cabShareRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/notes', academicNoteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/courses', courseProgressRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/events', eventRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Grievance Management API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.IO enabled for real-time notifications');
});
