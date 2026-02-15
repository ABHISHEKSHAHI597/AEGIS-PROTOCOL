/**
 * Upload Academic Note
 * Metadata form + file (faculty/admin only when access control enabled)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadNote, getCourses } from '../services/notesService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import './NoteUpload.css';

export const NoteUpload = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    courseId: '',
    subject: '',
    semester: '',
    tags: '',
    facultyOnly: false,
  });
  const [file, setFile] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    getCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (!form.title.trim() || !form.subject.trim() || !form.semester.trim()) {
      toast.error('Title, subject and semester are required');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('subject', form.subject.trim());
      fd.append('semester', form.semester.trim());
      fd.append('facultyOnly', form.facultyOnly);
      if (form.courseId) fd.append('courseId', form.courseId);
      if (form.tags.trim()) fd.append('tags', form.tags.trim());
      const note = await uploadNote(fd);
      toast.success('Note uploaded');
      navigate(`/notes/${note._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed';
      if (err.response?.status === 403) setForbidden(true);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const allowed = ['admin', 'faculty'].includes(user?.role);
  if (!allowed && !forbidden) {
    return (
      <Layout>
        <div className="container">
          <p className="text-muted">Only faculty or admin can upload notes. Contact admin for access.</p>
          <button type="button" className="btn-outline" onClick={() => navigate('/notes')}>
            Back to Notes
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container note-upload-page">
        <h1>Upload Note</h1>
        <p className="subtitle">PDF, DOC, DOCX, TXT, images up to 15MB</p>

        {forbidden && (
          <div className="alert alert-warning">
            Only faculty or admin can upload notes.
          </div>
        )}

        <form onSubmit={handleSubmit} className="card note-upload-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Linear Algebra Unit 1"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description"
              rows={2}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Subject *</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Mathematics"
                required
              />
            </div>
            <div className="form-group">
              <label>Semester *</label>
              <input
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                placeholder="e.g. 3rd"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Course</label>
            <select
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            >
              <option value="">-- Select --</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.facultyOnly}
                onChange={(e) => setForm({ ...form, facultyOnly: e.target.checked })}
              />
              Faculty only (hidden from students)
            </label>
          </div>
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="algebra, matrices"
            />
          </div>
          <div className="form-group">
            <label>File *</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            {file && <span className="file-name">{file.name}</span>}
          </div>
          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={() => navigate('/notes')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
