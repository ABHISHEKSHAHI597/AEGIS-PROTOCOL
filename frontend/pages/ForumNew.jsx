/**
 * Create Forum Thread
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createThread } from '../services/forumService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import './ForumNew.css';

const CATEGORIES = ['Academics', 'Hostel', 'Placements', 'Events'];

export const ForumNew = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !category) {
      toast.error('Title and category are required');
      return;
    }
    setLoading(true);
    try {
      const thread = await createThread({ title: title.trim(), category, description: description.trim() });
      toast.success('Thread created');
      navigate(`/forum/${thread._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create thread');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container forum-new-page">
        <h1>New Thread</h1>
        <form onSubmit={handleSubmit} className="card forum-new-form">
          <div className="form-group">
            <label>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Thread title" />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Select</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Describe..." />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={() => navigate('/forum')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
