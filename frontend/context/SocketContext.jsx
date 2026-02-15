/**
 * Socket.IO Context
 * Real-time notifications: grievance status, new comment, escalation
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

const getSocketUrl = () => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  }
  return 'http://localhost:5000'; // Backend runs Socket.IO on port 5000
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  return ctx;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user?._id) return;

    const url = getSocketUrl();
    const sock = io(url, { withCredentials: true });

    sock.on('connect', () => {
      sock.emit('join', user._id);
    });

    sock.on('grievance_status', (data) => {
      toast.success(data.message || 'Grievance status updated');
      // Optional: trigger refresh of grievance list
      window.dispatchEvent(new CustomEvent('grievance-updated', { detail: data }));
    });

    sock.on('new_comment', (data) => {
      toast.success(data.message || 'New comment added');
      window.dispatchEvent(new CustomEvent('comment-added', { detail: data }));
    });

    sock.on('grievance_escalated', (data) => {
      toast.info(data.message || 'Grievance escalated');
      window.dispatchEvent(new CustomEvent('grievance-escalated', { detail: data }));
    });

    sock.on('new_announcement', (data) => {
      toast.info(data.title ? `New: ${data.title}` : 'New announcement');
      window.dispatchEvent(new CustomEvent('new-announcement', { detail: data }));
    });

    setSocket(sock);

    return () => {
      sock.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
