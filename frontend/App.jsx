/**
 * Main App Component
 * Routes and protected route setup
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { CreateGrievance } from './pages/CreateGrievance';
import { GrievanceDetail } from './pages/GrievanceDetail';
import { CabShare } from './pages/CabShare';
import { RideDetail } from './pages/RideDetail';
import { NotesDashboard } from './pages/NotesDashboard';
import { NoteUpload } from './pages/NoteUpload';
import { NoteDetail } from './pages/NoteDetail';
import { Facilities } from './pages/Facilities';
import { FacilityBook } from './pages/FacilityBook';
import { BookingHistory } from './pages/BookingHistory';
import { BookingApproval } from './pages/BookingApproval';
import { CampusMap } from './pages/CampusMap';
import { Profile } from './pages/Profile';
import { AdminPanel } from './pages/AdminPanel';
import { Analytics } from './pages/Analytics';
import { FacultyPanel } from './pages/FacultyPanel';
import { Opportunities } from './pages/Opportunities';
import { Announcements } from './pages/Announcements';
import { Forum } from './pages/Forum';
import { ForumDetail } from './pages/ForumDetail';
import { ForumNew } from './pages/ForumNew';
import { Events } from './pages/Events';
import { AcademicCalendar } from './pages/AcademicCalendar';
import { FacultyRoute } from './components/FacultyRoute';
import { CreateGrievanceRoute } from './components/CreateGrievanceRoute';

// Redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-loading"><LoadingSpinner size="lg" /><span>Loading...</span></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <CreateGrievanceRoute>
            <CreateGrievance />
          </CreateGrievanceRoute>
        }
      />
      <Route
        path="/grievance/:id"
        element={
          <ProtectedRoute>
            <GrievanceDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            <NotesDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes/upload"
        element={
          <ProtectedRoute>
            <NoteUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes/:id"
        element={
          <ProtectedRoute>
            <NoteDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cabshare"
        element={
          <ProtectedRoute>
            <CabShare />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cabshare/:id"
        element={
          <ProtectedRoute>
            <RideDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilities"
        element={
          <ProtectedRoute>
            <Facilities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilities/bookings"
        element={
          <ProtectedRoute>
            <BookingHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilities/approval"
        element={
          <ProtectedRoute>
            <BookingApproval />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilities/:id/book"
        element={
          <ProtectedRoute>
            <FacilityBook />
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <CampusMap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <AdminRoute>
            <Analytics />
          </AdminRoute>
        }
      />
      <Route
        path="/faculty"
        element={
          <FacultyRoute>
            <FacultyPanel />
          </FacultyRoute>
        }
      />
      <Route path="/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
      <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
      <Route path="/forum/new" element={<ProtectedRoute><ForumNew /></ProtectedRoute>} />
      <Route path="/forum/:id" element={<ProtectedRoute><ForumDetail /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/academic-calendar" element={<ProtectedRoute><AcademicCalendar /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
