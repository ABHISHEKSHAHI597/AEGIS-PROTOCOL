/**
 * Forum Thread Detail - Discussion with replies (reuse grievance comment UI)
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getThreadById, addReply, upvoteThread, deleteThread } from '../services/forumService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';
import './ForumDetail.css';

const CATEGORIES = ['Academics', 'Hostel', 'Placements', 'Events'];

export const ForumDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchThread = async () => {
    try {
      const d = await getThreadById(id);
      setData(d);
    } catch (err) {
      setData(null);
      toast.error(err.response?.data?.message || 'Thread not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [id]);

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await addReply(id, replyText.trim());
      setReplyText('');
      await fetchThread();
      toast.success('Reply added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    try {
      await upvoteThread(id);
      await fetchThread();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upvote');
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    try {
      await deleteThread(id);
      toast.success('Thread deleted');
      navigate('/forum');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const thread = data?.thread;
  const replies = data?.replies || [];
  const isOwner = thread?.createdBy && (thread.createdBy._id || thread.createdBy)?.toString?.() === user?._id?.toString?.();

  if (loading) return <Layout><div className="container mt-4">Loading...</div></Layout>;
  if (!thread) return <Layout><div className="container mt-4">Thread not found.</div></Layout>;

  return (
    <Layout>
      <div className="container forum-detail">
        <Link to="/forum" className="back-link">← Forum</Link>

        <div className="forum-thread-main card">
          <div className="thread-header">
            <h1>{thread.title}</h1>
            <span className="thread-category">{thread.category}</span>
            {(isOwner || isAdmin) && (
              <button className="btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>Delete</button>
            )}
          </div>
          <div className="thread-meta">
            <span>By {thread.createdBy?.name}</span>
            <span>{new Date(thread.createdAt).toLocaleString()}</span>
            <button type="button" className="btn-outline btn-sm" onClick={handleUpvote}>
              👍 {thread.upvotes || 0} Upvote
            </button>
          </div>
          <p className="thread-description">{thread.description}</p>
        </div>

        <div className="forum-replies-section">
          <h2>Replies ({replies.length})</h2>
          <form onSubmit={handleAddReply} className="add-reply-form">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add a reply..."
              rows={3}
              required
            />
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
          </form>
          <div className="replies-list">
            {replies.length === 0 ? (
              <p className="text-muted">No replies yet.</p>
            ) : (
              replies.map((r) => (
                <div key={r._id} className="reply-item note-item">
                  <div className="note-header">
                    <strong>{r.userId?.name}</strong>
                    <span className="note-date">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{r.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <ConfirmModal
          open={showDeleteModal}
          title="Delete Thread"
          message="Are you sure you want to delete this thread? All replies will be deleted."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      </div>
    </Layout>
  );
};
