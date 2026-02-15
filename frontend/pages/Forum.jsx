/**
 * Campus Forum - Thread list
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getThreads } from '../services/forumService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import './Forum.css';

const CATEGORIES = ['Academics', 'Hostel', 'Placements', 'Events'];

export const Forum = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const toast = useToast();

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const data = await getThreads(category || undefined);
      setThreads(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load threads');
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [category]);

  return (
    <Layout>
      <div className="container forum-page">
        <div className="forum-header">
          <h1>Campus Forum</h1>
          <Link to="/forum/new" className="btn-primary">+ New Thread</Link>
        </div>

        <select value={category} onChange={(e) => setCategory(e.target.value)} className="filter-select mb-2">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : threads.length === 0 ? (
          <div className="empty-state">
            <p>No threads yet.</p>
            <Link to="/forum/new" className="btn-primary">Start a thread</Link>
          </div>
        ) : (
          <div className="forum-thread-list">
            {threads.map((t) => (
              <Link key={t._id} to={`/forum/${t._id}`} className="forum-thread-card card">
                <h3>{t.title}</h3>
                <span className="thread-category">{t.category}</span>
                <div className="thread-meta">
                  <span>👤 {t.createdBy?.name}</span>
                  <span>💬 {t.replyCount || 0} replies</span>
                  <span>👍 {t.upvotes || 0}</span>
                  <span>{new Date(t.createdAt).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
