/**
 * Create Grievance Route – Only user and author can create grievances
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

export const CreateGrievanceRoute = ({ children }) => {
  const { canCreateGrievance } = useAuth();

  return (
    <ProtectedRoute>
      {canCreateGrievance ? children : <Navigate to="/" replace />}
    </ProtectedRoute>
  );
};
