/**
 * Grievance Detail – Discussion thread, priority, escalation, attachments, escalation history
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGrievanceById, updateGrievance, addGrievanceAttachments, deleteGrievance } from '../services/grievanceService';
import { getNotes, addNote, deleteNote } from '../services/noteService';
import { getAttachmentUrl } from '../services/profileService';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import './GrievanceDetail.css';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const DEPARTMENTS = ['Infrastructure', 'Administration', 'Academic', 'Finance', 'Other'];

export const GrievanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isFaculty, user } = useAuth();
  const isCreator = grievance?.createdBy && (
    (grievance.createdBy?._id || grievance.createdBy)?.toString?.() === user?._id?.toString?.()
  );
  const isAssignedFaculty = isFaculty && grievance?.assignedTo && (
    grievance.assignedTo?._id?.toString?.() === user?._id?.toString?.() || grievance.assignedTo?.toString?.() === user?._id?.toString?.()
  );
  const isDepartmentFaculty = isFaculty && user?.department && grievance?.assignedDepartment === user?.department;
  const canManage = isAdmin || isAssignedFaculty || isDepartmentFaculty;
  const canAddAttachment = isAdmin || isCreator || (isFaculty && (isAssignedFaculty || isDepartmentFaculty));
  const canDelete = isAdmin || isCreator;
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [grievance, setGrievance] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [internalNote, setInternalNote] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [escalationLevel, setEscalationLevel] = useState(1);
  const [assignedDepartment, setAssignedDepartment] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [commentFiles, setCommentFiles] = useState([]);
  const commentFileInputRef = useRef(null);

  const fetchGrievance = async () => {
    try {
      const g = await getGrievanceById(id);
      setGrievance(g);
      setStatus(g.status);
      setPriority(g.priority || 'medium');
      setEscalationLevel(g.escalationLevel ?? 1);
      setAssignedDepartment(g.assignedDepartment || '');
    } catch (err) {
      setGrievance(null);
    }
  };

  const fetchNotes = async () => {
    try {
      const data = await getNotes(id);
      setNotes(data);
    } catch (err) {
      setNotes([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchGrievance();
      await fetchNotes();
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setAddingNote(true);
    try {
      await addNote(id, noteContent.trim(), internalNote, commentFiles);
      setNoteContent('');
      setInternalNote(false);
      setCommentFiles([]);
      if (commentFileInputRef.current) commentFileInputRef.current.value = '';
      await fetchNotes();
      toast.success('Comment added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setAddingNote(false);
    }
  };

  const handleCommentFileChange = (e) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const valid = selected.filter((f) => allowed.includes(f.type));
    setCommentFiles((prev) => [...prev, ...valid].slice(0, 3));
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(id, noteId);
      await fetchNotes();
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      await updateGrievance(id, { status: newStatus });
      setStatus(newStatus);
      await fetchGrievance();
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handlePriorityChange = async (e) => {
    const val = e.target.value;
    try {
      await updateGrievance(id, { priority: val });
      setPriority(val);
      await fetchGrievance();
      toast.success('Priority updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleEscalationChange = async (e) => {
    const val = Number(e.target.value);
    try {
      await updateGrievance(id, { escalationLevel: val });
      setEscalationLevel(val);
      await fetchGrievance();
      toast.success('Escalation updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDepartmentChange = async (e) => {
    const val = e.target.value;
    try {
      await updateGrievance(id, { assignedDepartment: val });
      setAssignedDepartment(val);
      await fetchGrievance();
      toast.success('Department updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleAttachmentsUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingAttachments(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('attachments', files[i]);
      }
      const updated = await addGrievanceAttachments(id, formData);
      setGrievance(updated);
      toast.success('Attachments added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingAttachments(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    try {
      await deleteGrievance(id);
      toast.success('Grievance deleted');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mt-4 flex-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }
  if (!grievance) {
    return (
      <Layout>
        <div className="container mt-4">Grievance not found.</div>
      </Layout>
    );
  }

  const statusClass = {
    Pending: 'status-pending',
    'In Progress': 'status-progress',
    Resolved: 'status-resolved',
  }[status] || '';
  const priorityClass = priority ? `priority-${priority}` : '';

  const attachments = grievance.attachments || [];
  const isImage = (mime) => /^image\//.test(mime);

  return (
    <Layout>
      <div className="container">
        <button className="btn-outline btn-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="grievance-detail-card">
          <div className="detail-header">
            <h1>{grievance.title}</h1>
            <div className="detail-badges">
              <span className={`priority-badge ${priorityClass}`}>{priority}</span>
              <span className={`status-badge ${statusClass}`}>{status}</span>
            </div>
          </div>

          <div className="detail-meta">
            <span>Category: {grievance.category}</span>
            <span>By: {grievance.createdBy?.name}</span>
            <span>{new Date(grievance.createdAt).toLocaleString()}</span>
          </div>

          {(grievance.escalationLevel > 1 || grievance.assignedDepartment) && (
            <div className="detail-escalation-row">
              {grievance.escalationLevel > 1 && (
                <span className="escalation-indicator" title="Escalation level">
                  Escalation: L{grievance.escalationLevel}
                </span>
              )}
              {grievance.assignedDepartment && (
                <span className="assigned-dept">Dept: {grievance.assignedDepartment}</span>
              )}
            </div>
          )}

          <p className="detail-description">{grievance.description}</p>

          {attachments.length > 0 && (
            <div className="attachments-block">
              <h3 className="attachments-title">Attachments</h3>
              <div className="attachments-grid">
                {attachments.map((att, idx) => (
                  <div key={idx} className="attachment-preview">
                    {isImage(att.mimeType) ? (
                      <a
                        href={getAttachmentUrl(att.path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment-link"
                      >
                        <img src={getAttachmentUrl(att.path)} alt={att.originalName} />
                        <span>{att.originalName}</span>
                      </a>
                    ) : (
                      <a
                        href={getAttachmentUrl(att.path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment-link attachment-file"
                        download
                      >
                        <span className="file-icon">📄</span>
                        <span>{att.originalName}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Escalation history */}
          {grievance.escalationHistory?.length > 0 && (
            <div className="escalation-history-block">
              <h3 className="attachments-title">Escalation History</h3>
              <ul className="escalation-history-list">
                {grievance.escalationHistory.map((h, i) => (
                  <li key={i}>
                    Level {h.fromLevel} → Level {h.toLevel} by {h.escalatedBy?.name || 'Unknown'} at{' '}
                    {new Date(h.timestamp).toLocaleString()}
                    {h.reason && ` — ${h.reason}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="detail-actions">
            {canManage && (
              <select value={status} onChange={handleStatusChange} className="status-select">
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
            )}
            {(isAdmin || isFaculty) && (
              <>
                <select
                  value={priority}
                  onChange={handlePriorityChange}
                  className="priority-select"
                  title="Priority"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <select
                  value={escalationLevel}
                  onChange={handleEscalationChange}
                  className="escalation-select"
                  title="Escalation"
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>Level {n}</option>
                  ))}
                </select>
              </>
            )}
            {isAdmin && (
              <select
                value={assignedDepartment}
                onChange={handleDepartmentChange}
                className="dept-select"
                title="Assigned department"
              >
                <option value="">No department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
            {canAddAttachment && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={handleAttachmentsUpload}
                />
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAttachments}
                >
                  {uploadingAttachments ? 'Uploading...' : '+ Add attachment'}
                </button>
              </>
            )}
            {canDelete && (
              <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>
                Delete
              </button>
            )}
          </div>
        </div>

        <ConfirmModal
          open={showDeleteModal}
          title="Delete Grievance"
          message="Are you sure you want to delete this grievance? This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />

        <div className="notes-section discussion-section">
          <h2>Discussion</h2>
          <form onSubmit={handleAddNote} className="add-note-form">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              required
            />
            <div className="comment-attachments-row">
              <input
                ref={commentFileInputRef}
                type="file"
                multiple
                accept=".pdf,image/*"
                className="hidden"
                onChange={handleCommentFileChange}
              />
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => commentFileInputRef.current?.click()}
              >
                + Attach files
              </button>
              {commentFiles.length > 0 && (
                <span className="file-names">{commentFiles.map((f) => f.name).join(', ')}</span>
              )}
            </div>
            {isAdmin && (
              <label className="internal-checkbox">
                <input
                  type="checkbox"
                  checked={internalNote}
                  onChange={(e) => setInternalNote(e.target.checked)}
                />
                Internal (visible only to admins)
              </label>
            )}
            <button type="submit" className="btn-primary" disabled={addingNote}>
              {addingNote ? 'Adding...' : 'Add Comment'}
            </button>
          </form>
          <div className="notes-list thread-list">
            {notes.length === 0 ? (
              <p className="text-muted">No comments yet.</p>
            ) : (
              notes.map((n) => (
                <div
                  key={n._id}
                  className={`note-item ${n.isInternal ? 'note-internal' : ''}`}
                >
                  <div className="note-header">
                    <strong>{n.createdBy?.name}</strong>
                    {n.createdBy?.role && <span className="role-tag">{n.createdBy.role}</span>}
                    {n.isInternal && <span className="internal-tag">Internal</span>}
                    <span className="note-date">{new Date(n.createdAt).toLocaleString()}</span>
                    {(n.createdBy?._id === user?._id || isAdmin) && (
                      <button
                        type="button"
                        className="btn-delete-comment"
                        onClick={() => handleDeleteNote(n._id)}
                        title="Delete comment"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <p>{n.content}</p>
                  {n.attachments?.length > 0 && (
                    <div className="note-attachments">
                      {n.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={getAttachmentUrl(att.path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="note-attachment-link"
                        >
                          {isImage(att.mimeType) ? (
                            <img src={getAttachmentUrl(att.path)} alt={att.originalName} />
                          ) : (
                            <span>📄 {att.originalName}</span>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
