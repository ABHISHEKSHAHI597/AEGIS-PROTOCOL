/**
 * Notice Board - Announcements
 */
import { useState, useEffect } from 'react';
import { getAnnouncements, postAnnouncement, deleteAnnouncement } from '../services/announcementService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import './Announcements.css';

const DEPARTMENTS = ['Infrastructure', 'Administration', 'Academic', 'Finance', 'Other'];

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('');
  const [annForm, setAnnForm] = useState({ title: '', description: '', department: '', pinned: false });
  const [showPostForm, setShowPostForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const { user, isAdmin, isFaculty } = useAuth();
  const toast = useToast();
  const canPost = isAdmin || isFaculty;

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await getAnnouncements(department || undefined);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [department]);

  const handlePost = async (e) => {
    e?.preventDefault?.();
    if (!annForm.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    setPosting(true);
    try {
      await postAnnouncement({
        title: annForm.title.trim(),
        description: annForm.description?.trim() || '',
        department: annForm.department || '',
        pinned: annForm.pinned,
      });
      toast.success('Announcement posted');
      setAnnForm({ title: '', description: '', department: '', pinned: false });
      setShowPostForm(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAnnouncement(id);
      toast.success('Deleted');
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <Layout>
      <div className="container announcements-page">
        <div className="announcements-header">
          <div>
            <h1>Notice Board</h1>
            <p className="subtitle">Latest announcements</p>
          </div>
          {canPost && (
            <button type="button" className="btn-primary" onClick={() => setShowPostForm(!showPostForm)}>
              {showPostForm ? 'Cancel' : '+ Post Announcement'}
            </button>
          )}
        </div>

        {showPostForm && canPost && (
          <form onSubmit={handlePost} className="card ann-post-form">
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
            <button type="submit" className="btn-primary" disabled={posting}>{posting ? 'Posting...' : 'Post'}</button>
          </form>
        )}

        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="filter-select mb-2">
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <p>No announcements yet.</p>
          </div>
        ) : (
          <div className="announcements-list">
            {announcements.map((ann) => (
              <div key={ann._id} className={`announcement-card card ${ann.pinned ? 'pinned' : ''}`}>
                {ann.pinned && <span className="pin-badge">📌 Pinned</span>}
                <h3>{ann.title}</h3>
                {ann.description && <p>{ann.description}</p>}
                <div className="ann-meta">
                  {ann.department && <span>{ann.department}</span>}
                  <span>{ann.postedBy?.name}</span>
                  <span>{new Date(ann.createdAt).toLocaleString()}</span>
                  {canPost && (
                    <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(ann._id)}>Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
