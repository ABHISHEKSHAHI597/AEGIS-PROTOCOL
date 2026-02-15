/**
 * Academic Notes Dashboard
 * Search, filters, pagination, lazy loading, top downloads
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getNotes, getTopDownloads, getCourses, downloadNote } from '../services/notesService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import './NotesDashboard.css';

export const NotesDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [topDownloads, setTopDownloads] = useState([]);
  const [canUpload, setCanUpload] = useState(false);

  const canUploadRoles = ['admin', 'faculty'];
  useEffect(() => {
    setCanUpload(canUploadRoles.includes(user?.role));
  }, [user?.role]);

  const fetchNotes = useCallback(async (page = 1, append = false) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (subject.trim()) params.subject = subject.trim();
      if (semester.trim()) params.semester = semester.trim();
      if (courseId) params.courseId = courseId;
      const data = await getNotes(params);
      if (append) {
        setNotes((prev) => (page === 1 ? data.notes : [...prev, ...data.notes]));
      } else {
        setNotes(data.notes);
      }
      setPagination(data.pagination || {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notes');
      if (!append) setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, subject, semester, courseId, toast]);

  useEffect(() => {
    fetchNotes(1, false);
  }, [keyword, subject, semester, courseId]);

  useEffect(() => {
    const load = async () => {
      try {
        const [top] = await Promise.all([
          getTopDownloads(5),
          getCourses().then(setCourses).catch(() => []),
        ]);
        setTopDownloads(top || []);
      } catch (_) {}
    };
    load();
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchNotes(1, false);
  };

  const loadMore = () => {
    if (pagination.page < pagination.totalPages && !loading) {
      fetchNotes(pagination.page + 1, true);
      setPagination((p) => ({ ...p, page: p.page + 1 }));
    }
  };

  return (
    <Layout>
      <div className="container notes-dashboard">
        <div className="notes-header">
          <div>
            <h1>Academic Vault</h1>
            <p className="subtitle">Search and download course notes</p>
          </div>
          {canUpload && (
            <Link to="/notes/upload" className="btn-primary">
              + Upload Note
            </Link>
          )}
        </div>

        <div className="notes-layout">
          <aside className="notes-sidebar">
            <div className="card">
              <h3>Top downloads</h3>
              {topDownloads.length === 0 ? (
                <p className="text-muted text-small">No data yet</p>
              ) : (
                <ul className="top-downloads-list">
                  {topDownloads.map((n) => (
                    <li key={n._id}>
                      <Link to={`/notes/${n._id}`}>{n.title}</Link>
                      <span className="count">{n.downloadCount}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <main className="notes-main">
            <form onSubmit={handleSearch} className="notes-filters card">
              <input
                type="search"
                placeholder="Search by title, subject, tags... (keyword or title)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="search-input"
              />
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="filter-select"
              >
                <option value="">All subjects</option>
                <option value="Math">Math</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="CS">CS</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="filter-input"
              />
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="filter-select"
              >
                <option value="">All courses</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                ))}
              </select>
              <button type="submit" className="btn-primary">Search</button>
            </form>

            {loading && notes.length === 0 ? (
              <p className="loading-notes">Loading...</p>
            ) : notes.length === 0 ? (
              <div className="empty-notes">
                <p>No notes found. {canUpload && 'Try uploading one!'}</p>
              </div>
            ) : (
              <>
                <div className="notes-grid">
                  {notes.map((note) => (
                    <div key={note._id} className="note-card card">
                      <div className="note-card-header">
                        <h3><Link to={`/notes/${note.rootId || note._id}`}>{note.title}</Link></h3>
                        {note.version > 1 && <span className="version-badge">v{note.version}</span>}
                      </div>
                      <p className="note-meta">
                        {note.subject} · {note.semester}
                        {note.courseId?.code && ` · ${note.courseId.code}`}
                      </p>
                      {note.tags?.length > 0 && (
                        <div className="note-tags">
                          {note.tags.slice(0, 3).map((t) => (
                            <span key={t} className="tag">{t}</span>
                          ))}
                        </div>
                      )}
                      <p className="note-stats">
                        <span>↓ {note.downloadCount}</span>
                        <span>By {note.uploadedBy?.name}</span>
                      </p>
                      <div className="note-card-actions">
                        <Link to={`/notes/${note.rootId || note._id}`} className="btn-outline btn-sm">View</Link>
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={async () => {
                            try {
                              const d = await downloadNote(note._id);
                              const base = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || '') : '';
                              window.open(`${base}/api/notes/${note._id}/file`, '_blank');
                            } catch (e) {
                              toast.error('Download failed');
                            }
                          }}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {pagination.page < pagination.totalPages && (
                  <div className="load-more-wrap">
                    <button type="button" className="btn-outline" onClick={loadMore} disabled={loading}>
                      {loading ? 'Loading...' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
};
