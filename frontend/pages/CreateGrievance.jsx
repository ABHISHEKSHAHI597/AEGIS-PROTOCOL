/**
 * Create Grievance Page
 * Supports file attachments (images, PDFs) on creation
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGrievance, addGrievanceAttachments } from '../services/grievanceService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import './CreateGrievance.css';

const CATEGORIES = ['Infrastructure', 'Administration', 'Academic', 'Finance', 'Other'];
const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const CreateGrievance = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  const handleFileChange = (e) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const valid = selected.filter((f) => allowed.includes(f.type));
    if (valid.length !== selected.length) {
      toast.error('Only PDF and images (JPEG, PNG, WebP) allowed');
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 5)); // Max 5
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const grievance = await createGrievance({ title, description, category, priority });
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((f) => formData.append('attachments', f));
        await addGrievanceAttachments(grievance._id, formData);
      }
      toast.success('Grievance submitted');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create grievance';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container">
        <div className="create-header">
          <h1>Submit Grievance</h1>
          <p>Report an issue or complaint for review</p>
        </div>
        <div className="create-card">
          <form onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Brief title for your grievance"
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="Describe your grievance in detail..."
              />
            </div>
            <div className="form-group">
              <label>Attachments (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="file-input"
              />
              {files.length > 0 && (
                <ul className="file-list">
                  {files.map((f, i) => (
                    <li key={i}>
                      {f.name} <button type="button" onClick={() => removeFile(i)} className="btn-remove">×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Grievance'}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};
