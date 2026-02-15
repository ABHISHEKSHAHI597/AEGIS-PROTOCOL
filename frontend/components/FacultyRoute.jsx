/**
 * Faculty Route – Restricts access to faculty-only pages
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

export const FacultyRoute = ({ children }) => {
  const { isFaculty } = useAuth();

  return (
    <ProtectedRoute>
      {isFaculty ? children : <Navigate to="/" replace />}
    </ProtectedRoute>
  );
};
