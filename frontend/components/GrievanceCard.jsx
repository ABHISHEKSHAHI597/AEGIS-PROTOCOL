/**
 * Grievance Card Component
 * Displays a single grievance with actions
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateGrievance, deleteGrievance } from '../services/grievanceService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from './ConfirmModal';
import './GrievanceCard.css';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved'];

export const GrievanceCard = ({ grievance, onUpdate, onDelete, showLink = false }) => {
  const { isAdmin, isFaculty, user } = useAuth();
  const canChangeStatus = isAdmin || (isFaculty && (
    (grievance.assignedTo?._id || grievance.assignedTo)?.toString?.() === user?._id ||
    (user?.department && grievance.assignedDepartment === user.department)
  ));
  const toast = useToast();
  const [status, setStatus] = useState(grievance.status);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await updateGrievance(grievance._id, { status: newStatus });
      setStatus(newStatus);
      onUpdate?.();
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setDeleting(true);
    try {
      await deleteGrievance(grievance._id);
      onDelete?.();
      toast.success('Grievance deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const statusClass = {
    Pending: 'status-pending',
    'In Progress': 'status-progress',
    Resolved: 'status-resolved',
  }[status] || '';

  const priorityClass = grievance.priority ? `priority-${grievance.priority}` : '';

  return (
    <div className="grievance-card">
      <div className="card-header">
        <h3>
          {showLink ? (
            <Link to={`/grievance/${grievance._id}`} className="grievance-link">
              {grievance.title}
            </Link>
          ) : (
            grievance.title
          )}
        </h3>
        <div className="card-badges">
          {grievance.priority && (
            <span className={`priority-badge ${priorityClass}`} title="Priority">
              {grievance.priority}
            </span>
          )}
          {grievance.escalationLevel > 1 && (
            <span className="escalation-badge" title="Escalation">L{grievance.escalationLevel}</span>
          )}
          <span className={`status-badge ${statusClass}`}>{status}</span>
        </div>
      </div>
      <p className="card-description">{grievance.description}</p>
      <div className="card-meta">
        <span>Category: {grievance.category}</span>
        <span>By: {grievance.createdBy?.name || 'Unknown'}</span>
        <span className="text-small text-muted">
          {new Date(grievance.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="card-actions">
        {canChangeStatus && (
          <select
            value={status}
            onChange={handleStatusChange}
            disabled={updating}
            className="status-select"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        <button
          className="btn-danger btn-sm"
          onClick={() => setShowDeleteModal(true)}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
      <ConfirmModal
        open={showDeleteModal}
        title="Delete Grievance"
        message="Are you sure you want to delete this grievance? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
