/**
 * Faculty Panel – View and manage grievances + course progress updates
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGrievances, updateGrievance } from '../services/grievanceService';
import { getAllCourseProgress, updateAttendance, updateMarks, updateAssignments } from '../services/courseProgressService';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import './FacultyPanel.css';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved'];

export const FacultyPanel = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [grievances, setGrievances] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('grievances');

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const data = await getGrievances(statusFilter ? { status: statusFilter } : {});
      setGrievances(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load grievances');
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await getAllCourseProgress();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load courses');
      setCourses([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'grievances') fetchGrievances();
    else fetchCourses();
  }, [statusFilter, activeTab]);

  const handleCourseUpdate = async (courseId, field, value) => {
    try {
      if (field === 'attendance') await updateAttendance(courseId, Number(value));
      else if (field === 'marks') await updateMarks(courseId, Number(value));
      else if (field === 'assignments') {
        const c = courses.find((x) => x._id === courseId);
        if (!c) return;
        await updateAssignments(courseId, {
          assignmentsCompleted: Number(value),
          totalAssignments: c.totalAssignments || 0,
        });
      }
      toast.success('Updated');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updateGrievance(id, { status: newStatus });
      toast.success('Status updated');
      fetchGrievances();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Layout>
      <div className="container faculty-panel">
        <h1>Faculty Panel</h1>
        <p className="faculty-subtitle">
          Grievances assigned to you. You can update their status.
          {user?.facultyId && <span className="faculty-id"> (ID: {user.facultyId})</span>}
        </p>

        <div className="faculty-tabs">
          <button className={activeTab === 'grievances' ? 'active' : ''} onClick={() => setActiveTab('grievances')}>
            Grievances
          </button>
          <button className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}>
            Course Updates
          </button>
        </div>

        {activeTab === 'grievances' && (
          <div className="faculty-filters">
            <label>
              Status:
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {activeTab === 'courses' ? (
          <div className="faculty-courses-wrap">
            {loading ? (
              <div className="flex-center py-8"><LoadingSpinner size="lg" /></div>
            ) : courses.length === 0 ? (
              <p className="text-muted">No course progress entries.</p>
            ) : (
              <div className="faculty-courses-list">
                {courses.map((c) => (
                  <div key={c._id} className="faculty-course-card card">
                    <h4>{c.courseName}</h4>
                    <p className="course-student">{c.user?.name} ({c.user?.email})</p>
                    <div className="course-update-row">
                      <label>Attendance %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={c.attendancePercentage || ''}
                        onChange={(e) => handleCourseUpdate(c._id, 'attendance', e.target.value)}
                        onBlur={(e) => e.target.value && handleCourseUpdate(c._id, 'attendance', e.target.value)}
                      />
                    </div>
                    <div className="course-update-row">
                      <label>Marks</label>
                      <input
                        type="number"
                        min="0"
                        value={c.marks || ''}
                        onChange={(e) => handleCourseUpdate(c._id, 'marks', e.target.value)}
                        onBlur={(e) => e.target.value !== '' && handleCourseUpdate(c._id, 'marks', e.target.value)}
                      />
                    </div>
                    <div className="course-update-row">
                      <label>Assignments done</label>
                      <input
                        type="number"
                        min="0"
                        value={c.assignmentsCompleted || ''}
                        onChange={(e) => handleCourseUpdate(c._id, 'assignments', e.target.value)}
                        onBlur={(e) => e.target.value !== '' && handleCourseUpdate(c._id, 'assignments', e.target.value)}
                      />
                      <span>/ {c.totalAssignments || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : grievances.length === 0 ? (
          <div className="empty-state">
            <p>No grievances assigned to you.</p>
          </div>
        ) : (
          <div className="faculty-grievance-list">
            {grievances.map((g) => (
              <div key={g._id} className="faculty-grievance-card">
                <div className="fg-header">
                  <Link to={`/grievance/${g._id}`} className="fg-title">{g.title}</Link>
                  <span className={`status-badge status-${(g.status || '').replace(/\s/g, '-').toLowerCase()}`}>
                    {g.status}
                  </span>
                </div>
                <p className="fg-description">{g.description}</p>
                <div className="fg-meta">
                  <span>Category: {g.category}</span>
                  <span>By: {g.createdBy?.name}</span>
                  <span>{new Date(g.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="fg-actions">
                  <label>
                    Update status:
                    <select
                      value={g.status}
                      onChange={(e) => handleStatusChange(g._id, e.target.value)}
                      disabled={updatingId === g._id}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <Link to={`/grievance/${g._id}`} className="btn-outline btn-sm">View details</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
