/**
 * Admin Panel – Manage all users and grievances; assign grievances to faculty; filter by status, department, faculty
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUsers } from '../services/userService';
import { getGrievances, assignGrievanceToFaculty } from '../services/grievanceService';
import { assignCourse } from '../services/courseProgressService';
import { getAnnouncements, postAnnouncement, deleteAnnouncement } from '../services/announcementService';
import { GrievanceCard } from '../components/GrievanceCard';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import './AdminPanel.css';

const DEPARTMENTS = ['Infrastructure', 'Administration', 'Academic', 'Finance', 'Other'];

export const AdminPanel = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grievances');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [assigningId, setAssigningId] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [courseAssign, setCourseAssign] = useState({ userId: '', courseName: '', faculty: '', totalAssignments: 0 });
  const [assigningCourse, setAssigningCourse] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [annForm, setAnnForm] = useState({ title: '', description: '', department: '', pinned: false });

  const fetchGrievances = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (departmentFilter) params.department = departmentFilter;
      if (facultyFilter) params.faculty = facultyFilter;
      const data = await getGrievances(params);
      setGrievances(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load grievances');
      setGrievances([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers(userRoleFilter || undefined);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsers([]);
    }
  };

  const fetchFaculty = async () => {
    try {
      const data = await getUsers('faculty');
      setFacultyList(Array.isArray(data) ? data : []);
    } catch (err) {
      setFacultyList([]);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (_) { setAnnouncements([]); }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchGrievances(), fetchUsers(), fetchFaculty(), fetchAnnouncements()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, userRoleFilter]);

  useEffect(() => {
    if (activeTab === 'grievances' && (statusFilter || departmentFilter || facultyFilter)) {
      setLoading(true);
      fetchGrievances().finally(() => setLoading(false));
    }
  }, [statusFilter, departmentFilter, facultyFilter]);

  const handlePostAnnouncement = async (e) => {
    e?.preventDefault?.();
    if (!annForm.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      await postAnnouncement({
        title: annForm.title.trim(),
        description: annForm.description?.trim() || '',
        department: annForm.department || '',
        pinned: annForm.pinned,
      });
      toast.success('Announcement posted');
      setAnnForm({ title: '', description: '', department: '', pinned: false });
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await deleteAnnouncement(id);
      toast.success('Deleted');
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleAssignCourse = async (e) => {
    e?.preventDefault?.();
    if (!courseAssign.userId || !courseAssign.courseName) {
      toast.error('Select user and enter course name');
      return;
    }
    setAssigningCourse(true);
    try {
      await assignCourse({
        userId: courseAssign.userId,
        courseName: courseAssign.courseName.trim(),
        faculty: courseAssign.faculty?.trim() || undefined,
        totalAssignments: courseAssign.totalAssignments || 0,
      });
      toast.success('Course assigned');
      setCourseAssign({ userId: '', courseName: '', faculty: '', totalAssignments: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign course');
    } finally {
      setAssigningCourse(false);
    }
  };

  const handleAssign = async (grievanceId, facultyId) => {
    if (!facultyId) return;
    setAssigningId(grievanceId);
    try {
      await assignGrievanceToFaculty(grievanceId, facultyId);
      toast.success('Assigned to faculty');
      fetchGrievances();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign failed');
    } finally {
      setAssigningId(null);
    }
  };

  const statusCounts = grievances.reduce(
    (acc, g) => {
      acc[g.status] = (acc[g.status] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <Layout>
      <div className="container">
        <h1>Admin Panel</h1>
        <div className="admin-tabs">
          <button
            className={activeTab === 'grievances' ? 'active' : ''}
            onClick={() => setActiveTab('grievances')}
          >
            All Grievances ({grievances.length})
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Users ({users.length})
          </button>
          <button
            className={activeTab === 'courses' ? 'active' : ''}
            onClick={() => setActiveTab('courses')}
          >
            Assign Courses
          </button>
          <button
            className={activeTab === 'announcements' ? 'active' : ''}
            onClick={() => setActiveTab('announcements')}
          >
            Announcements ({announcements.length})
          </button>
        </div>

        {loading && activeTab === 'grievances' ? (
          <p className="mt-4">Loading...</p>
        ) : activeTab === 'grievances' ? (
          <>
            <div className="admin-filters">
              <label>
                Status
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </label>
              <label>
                Department
                <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                  <option value="">All</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label>
                Assigned to faculty
                <select value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)}>
                  <option value="">All</option>
                  {facultyList.map((f) => (
                    <option key={f._id} value={f._id}>{f.name} ({f.facultyId || f.email})</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="stats-bar">
              <span>Pending: {statusCounts.Pending || 0}</span>
              <span>In Progress: {statusCounts['In Progress'] || 0}</span>
              <span>Resolved: {statusCounts.Resolved || 0}</span>
            </div>
            {grievances.length === 0 ? (
              <p className="text-muted mt-4">No grievances.</p>
            ) : (
              <div className="grievance-grid">
                {grievances.map((g) => (
                  <div key={g._id} className="admin-grievance-wrap">
                    <GrievanceCard
                      grievance={g}
                      onUpdate={fetchData}
                      onDelete={fetchData}
                      showLink
                    />
                    <div className="admin-assign">
                      <label>
                        Assign to faculty:
                        <select
                          value={g.assignedTo?._id || g.assignedTo || ''}
                          onChange={(e) => handleAssign(g._id, e.target.value || null)}
                          disabled={assigningId === g._id}
                        >
                          <option value="">— None —</option>
                          {facultyList.map((f) => (
                            <option key={f._id} value={f._id}>{f.name} ({f.facultyId || f.department})</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'announcements' ? (
          <div className="admin-announcements">
            <form onSubmit={handlePostAnnouncement} className="card admin-ann-form">
              <h3>Post Announcement</h3>
              <div className="form-group">
                <label>Title *</label>
                <input value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={annForm.description} onChange={(e) => setAnnForm({ ...annForm, description: e.target.value })} rows={3} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select value={annForm.department} onChange={(e) => setAnnForm({ ...annForm, department: e.target.value })}>
                  <option value="">All</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <label className="checkbox-label">
                <input type="checkbox" checked={annForm.pinned} onChange={(e) => setAnnForm({ ...annForm, pinned: e.target.checked })} />
                Pin
              </label>
              <button type="submit" className="btn-primary">Post</button>
            </form>
            <div className="announcements-list-admin">
              {announcements.map((a) => (
                <div key={a._id} className="card ann-item">
                  <h4>{a.title} {a.pinned && '📌'}</h4>
                  <p>{a.description}</p>
                  <div className="ann-item-meta">{a.department} · {a.postedBy?.name}</div>
                  <button type="button" className="btn-danger btn-sm" onClick={() => handleDeleteAnnouncement(a._id)}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'courses' ? (
          <div className="admin-course-assign card">
            <h3>Assign Course to Student</h3>
            <form onSubmit={handleAssignCourse} className="course-assign-form">
              <div className="form-group">
                <label>Student *</label>
                <select
                  value={courseAssign.userId}
                  onChange={(e) => setCourseAssign({ ...courseAssign, userId: e.target.value })}
                  required
                >
                  <option value="">Select student</option>
                  {users.filter((u) => u.role === 'user' || u.role === 'author').map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Course Name *</label>
                <input
                  value={courseAssign.courseName}
                  onChange={(e) => setCourseAssign({ ...courseAssign, courseName: e.target.value })}
                  placeholder="e.g. Mathematics"
                  required
                />
              </div>
              <div className="form-group">
                <label>Faculty</label>
                <input
                  value={courseAssign.faculty}
                  onChange={(e) => setCourseAssign({ ...courseAssign, faculty: e.target.value })}
                  placeholder="Faculty name"
                />
              </div>
              <div className="form-group">
                <label>Total Assignments</label>
                <input
                  type="number"
                  min="0"
                  value={courseAssign.totalAssignments || ''}
                  onChange={(e) => setCourseAssign({ ...courseAssign, totalAssignments: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={assigningCourse}>
                {assigningCourse ? 'Assigning...' : 'Assign Course'}
              </button>
            </form>
          </div>
        ) : (
          <div className="users-table-wrap">
            <div className="admin-user-filters">
              <label>
                Filter by role
                <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="user">User</option>
                  <option value="author">Author</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Faculty ID</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.role}`}>{u.role}</span>
                    </td>
                    <td>{u.department || '—'}</td>
                    <td>{u.facultyId || '—'}</td>
                    <td className="text-small text-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};
