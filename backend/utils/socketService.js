/**
 * Socket.IO Service
 * Real-time notifications: grievance status change, new comment, escalation
 * Emit to specific users or broadcast as needed
 */
let io = null;

import { Server } from 'socket.io';

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
  });

  io.on('connection', (socket) => {
    // User joins their own room for targeted notifications
    socket.on('join', (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });
  });

  return io;
};

export const getIO = () => io;

/** Notify user(s) about grievance status change */
export const emitGrievanceStatusChange = (grievanceId, createdByUserId, title, newStatus) => {
  if (!io) return;
  io.to(`user:${createdByUserId}`).emit('grievance_status', {
    grievanceId,
    title,
    status: newStatus,
    message: `"${title}" is now ${newStatus}.`,
  });
};

/** Notify when new comment added - creator and assigned faculty */
export const emitNewComment = (grievanceId, title, commentAuthorId, userIdsToNotify) => {
  if (!io) return;
  const unique = [...new Set(userIdsToNotify.filter(Boolean))];
  unique.forEach((uid) => {
    if (uid && uid.toString() !== commentAuthorId?.toString()) {
      io.to(`user:${uid}`).emit('new_comment', {
        grievanceId,
        title,
        message: `New comment on "${title}".`,
      });
    }
  });
};

/** Broadcast new announcement to all */
export const emitNewAnnouncement = (announcement) => {
  if (!io) return;
  io.emit('new_announcement', announcement);
};

/** Notify when grievance escalated */
export const emitEscalation = (grievanceId, title, createdByUserId, newLevel) => {
  if (!io) return;
  io.to(`user:${createdByUserId}`).emit('grievance_escalated', {
    grievanceId,
    title,
    level: newLevel,
    message: `"${title}" has been escalated to level ${newLevel}.`,
  });
};
