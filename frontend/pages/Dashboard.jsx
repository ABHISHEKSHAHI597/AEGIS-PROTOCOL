/**
 * Dashboard Page
 * Compact layout with tabs: Overview, Grievances, My Courses (when applicable)
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGrievances } from '../services/grievanceService';
import { getMyCourses } from '../services/courseProgressService';
import { getAnnouncements } from '../services/announcementService';
import { getUpcomingEvents } from '../services/eventService';
import { GrievanceCard } from '../components/GrievanceCard';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { PageSkeleton } from '../components/PageSkeleton';
import './Dashboard.css';

const QUICK_LINKS = [
  { to: '/create', icon: '📝', label: 'New Grievance', desc: 'Submit a complaint', roles: ['user', 'author'] },
  { to: '/faculty', icon: '📋', label: 'Faculty Panel', desc: 'Manage assigned grievances', roles: ['faculty'] },
  { to: '/admin', icon: '⚙️', label: 'Admin Panel', desc: 'Manage portal & users', roles: ['admin'] },
  { to: '/analytics', icon: '📊', label: 'Analytics', desc: 'View reports', roles: ['admin'] },
  { to: '/notes', icon: '📚', label: 'Academic Vault', desc: 'Notes & documents' },
  { to: '/opportunities', icon: '💼', label: 'Internships & Research', desc: 'Explore opportunities' },
  { to: '/forum', icon: '💬', label: 'Campus Forum', desc: 'Discussion boards' },
  { to: '/announcements', icon: '📢', label: 'Notice Board', desc: 'Announcements' },
  { to: '/cabshare', icon: '🚗', label: 'Cab Share', desc: 'Find or offer rides' },
  { to: '/facilities', icon: '🏢', label: 'Facilities', desc: 'Explore campus' },
  { to: '/map', icon: '🗺', label: 'Campus Map', desc: 'Navigate campus' },
  { to: '/events', icon: '📅', label: 'Events', desc: 'Campus events & RSVP' },
  { to: '/academic-calendar', icon: '📆', label: 'Academic Calendar', desc: 'Official calendar' },
];

const GRIEVANCES_PER_PAGE = 6;

export const Dashboard = () => {
  const { user, isAdmin, isFaculty, isAuthority, canCreateGrievance } = useAuth();
  const visibleQuickLinks = QUICK_LINKS.filter((item) => !item.roles || item.roles.includes(user?.role));
  const [activeTab, setActiveTab] = useState('overview');
  const [grievances, setGrievances] = useState([]);
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grievancePage, setGrievancePage] = useState(1);
  const [eventsOpen, setEventsOpen] = useState(true);
  const [noticesOpen, setNoticesOpen] = useState(true);

  const fetchGrievances = async () => {
    try {
      const data = await getGrievances();
      setGrievances(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load grievances');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await getMyCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (_) { setCourses([]); }
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch (_) { setAnnouncements([]); }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const data = await getUpcomingEvents(5);
      setUpcomingEvents(Array.isArray(data) ? data : []);
    } catch (_) { setUpcomingEvents([]); }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchGrievances();
      if (user) {
        await Promise.all([fetchCourses(), fetchAnnouncements(), fetchUpcomingEvents()]);
      }
      setLoading(false);
    };
    load();
  }, [user?._id]);

  const stats = {
    total: grievances.length,
    pending: grievances.filter((g) => g.status === 'Pending').length,
    resolved: grievances.filter((g) => g.status === 'Resolved').length,
    inProgress: grievances.filter((g) => g.status === 'In Progress').length,
  };

  const showCoursesTab = courses.length > 0 && !isAdmin && !isFaculty;
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'grievances', label: 'Grievances', badge: stats.total },
    ...(showCoursesTab ? [{ id: 'courses', label: 'My Courses' }] : []),
  ];

  const paginatedGrievances = grievances.slice(
    (grievancePage - 1) * GRIEVANCES_PER_PAGE,
    grievancePage * GRIEVANCES_PER_PAGE
  );
  const totalGrievancePages = Math.max(1, Math.ceil(grievances.length / GRIEVANCES_PER_PAGE));

  return (
    <Layout>
      <div className="container dashboard-container">
        <div className="dashboard-hero dashboard-hero-compact">
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p className="dashboard-subtitle">
            {isAdmin && 'Manage grievances and oversee the campus portal.'}
            {isFaculty && 'View and update status of grievances assigned to you.'}
            {isAuthority && 'View analytics and oversee campus services.'}
            {!isAdmin && !isFaculty && !isAuthority && 'Track your grievances and access campus services.'}
          </p>
        </div>

        <div className="dashboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="dashboard-tab-badge">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            <div className="dashboard-overview-main">
              <section className="dashboard-quick-section card">
                <h2 className="dashboard-section-title">Quick access</h2>
                <div className="quick-links quick-links-grid">
                  {visibleQuickLinks.map((item) => (
                    <Link key={item.to} to={item.to} className="quick-link-card">
                      <span className="quick-link-icon">{item.icon}</span>
                      <div className="quick-link-text">
                        <strong>{item.label}</strong>
                        <span>{item.desc}</span>
                      </div>
                      <span className="quick-link-arrow">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
            <div className="dashboard-overview-side">
              {upcomingEvents.length > 0 && (
                <div className="dashboard-collapsible card">
                  <button
                    type="button"
                    className="dashboard-collapsible-header"
                    onClick={() => setEventsOpen(!eventsOpen)}
                    aria-expanded={eventsOpen}
                  >
                    <span>📅 Upcoming Events</span>
                    <span className="dashboard-collapsible-chevron">{eventsOpen ? '▼' : '▶'}</span>
                  </button>
                  {eventsOpen && (
                    <div className="dashboard-collapsible-body">
                      <ul>
                        {upcomingEvents.map((ev) => (
                          <li key={ev._id}>
                            <Link to="/events" className="dashboard-list-link">{ev.eventTitle}</Link>
                            <span className="event-date">{new Date(ev.dateTime).toLocaleDateString()} · {ev.venue || 'TBA'}</span>
                          </li>
                        ))}
                      </ul>
                      <Link to="/events" className="btn-outline btn-sm btn-block">View all events</Link>
                    </div>
                  )}
                </div>
              )}
              {announcements.length > 0 && (
                <div className="dashboard-collapsible card">
                  <button
                    type="button"
                    className="dashboard-collapsible-header"
                    onClick={() => setNoticesOpen(!noticesOpen)}
                    aria-expanded={noticesOpen}
                  >
                    <span>📢 Latest Notices</span>
                    <span className="dashboard-collapsible-chevron">{noticesOpen ? '▼' : '▶'}</span>
                  </button>
                  {noticesOpen && (
                    <div className="dashboard-collapsible-body">
                      <ul>
                        {announcements.map((a) => (
                          <li key={a._id}>
                            <Link to="/announcements" className="dashboard-list-link">{a.title}</Link>
                            {a.pinned && <span className="pin-badge">Pinned</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'grievances' && (
          <section className="dashboard-section dashboard-grievances-tab card">
            <div className="section-header">
              <h2>{isFaculty ? 'Assigned to you' : 'Grievances'}</h2>
              {canCreateGrievance && (
                <Link to="/create" className="btn-primary btn-sm">+ New</Link>
              )}
            </div>
            {loading ? (
              <PageSkeleton />
            ) : error ? (
              <div className="error-box">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            ) : grievances.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No grievances yet</h3>
                <p>Submit your first grievance to get started.</p>
                {canCreateGrievance && (
                  <Link to="/create" className="btn-primary">Create Grievance</Link>
                )}
              </div>
            ) : (
              <>
                <div className="stats-row">
                  <div className="stat-card">
                    <span className="stat-value">{stats.total}</span>
                    <span className="stat-label">Total</span>
                  </div>
                  <div className="stat-card stat-pending">
                    <span className="stat-value">{stats.pending}</span>
                    <span className="stat-label">Pending</span>
                  </div>
                  <div className="stat-card stat-progress">
                    <span className="stat-value">{stats.inProgress}</span>
                    <span className="stat-label">In Progress</span>
                  </div>
                  <div className="stat-card stat-resolved">
                    <span className="stat-value">{stats.resolved}</span>
                    <span className="stat-label">Resolved</span>
                  </div>
                </div>
                <div className="grievance-grid">
                  {paginatedGrievances.map((g) => (
                    <GrievanceCard
                      key={g._id}
                      grievance={g}
                      onUpdate={fetchGrievances}
                      onDelete={fetchGrievances}
                      showLink
                    />
                  ))}
                </div>
                {totalGrievancePages > 1 && (
                  <div className="dashboard-pagination">
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      disabled={grievancePage <= 1}
                      onClick={() => setGrievancePage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <span className="dashboard-pagination-info">
                      Page {grievancePage} of {totalGrievancePages}
                    </span>
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      disabled={grievancePage >= totalGrievancePages}
                      onClick={() => setGrievancePage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'courses' && showCoursesTab && (
          <section className="dashboard-section my-courses-section card">
            <h2>My Courses</h2>
            <div className="courses-grid">
              {courses.map((c) => (
                <div key={c._id} className="course-card">
                  <h4>{c.courseName}</h4>
                  {c.faculty && <p className="course-faculty">{c.faculty}</p>}
                  <div className="course-progress-row">
                    <span>Attendance: {c.attendancePercentage}%</span>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${c.attendancePercentage}%` }} />
                    </div>
                  </div>
                  <div className="course-progress-row">
                    <span>Assignments: {c.assignmentsCompleted}/{c.totalAssignments} ({c.progressPercentage}%)</span>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${c.progressPercentage}%` }} />
                    </div>
                  </div>
                  {c.marks > 0 && <p className="course-marks">Marks: {c.marks}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};
