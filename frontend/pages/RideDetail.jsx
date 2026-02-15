/**
 * Ride Detail – Request management, map link, complete, ratings
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getRideById,
  getRideRequests,
  requestJoin,
  approveRequest,
  rejectRequest,
  leaveRide,
  completeRide,
  cancelRide,
  rateRide,
  getMapsUrl,
} from '../services/cabShareService';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import './RideDetail.css';

const statusLabel = (r) => r?.rideStatus || r?.status || 'active';
const seatAvailability = (r) => Math.max(0, (r?.seats || 0) - (r?.passengers?.length || 0));

const RequestJoinButton = ({ rideId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const handleRequest = async () => {
    setLoading(true);
    try {
      await requestJoin(rideId);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <button className="btn-primary" onClick={handleRequest} disabled={loading}>
      {loading ? 'Sending...' : 'Request to join'}
    </button>
  );
};

export const RideDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [ride, setRide] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState({ open: false, toUser: null });
  const [ratingForm, setRatingForm] = useState({ rating: 5, comment: '' });
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null });

  const fetchRide = useCallback(async () => {
    try {
      const r = await getRideById(id);
      setRide(r);
      return r;
    } catch (err) {
      setRide(null);
    }
  }, [id]);

  const fetchRequests = useCallback(async () => {
    if (!ride?.createdBy?._id || ride.createdBy._id !== user?._id) return;
    try {
      const list = await getRideRequests(id);
      setRequests(list);
    } catch {
      setRequests([]);
    }
  }, [id, ride?.createdBy?._id, user?._id]);

  useEffect(() => {
    let t;
    const load = async () => {
      setLoading(true);
      await fetchRide();
      setLoading(false);
    };
    load();
    return () => clearTimeout(t);
  }, [id]);

  useEffect(() => {
    if (!ride) return;
    fetchRequests();
    const isDriver = ride.createdBy?._id === user?._id;
    const isPassenger = ride.passengers?.some((p) => p._id === user?._id);
    if (isDriver || isPassenger) {
      const t = setInterval(() => fetchRide(), 8000);
      return () => clearInterval(t);
    }
  }, [ride?._id, user?._id, ride?.createdBy?._id]);

  useEffect(() => {
    if (ride?.createdBy?._id === user?._id) fetchRequests();
  }, [ride, user?._id, fetchRequests]);

  const isCreator = ride?.createdBy?._id === user?._id;
  const isPassenger = ride?.passengers?.some((p) => p._id === user?._id);
  const canJoin = ride && statusLabel(ride) === 'active' && !isCreator && !isPassenger && seatAvailability(ride) > 0;
  const status = ride ? statusLabel(ride) : '';

  const handleApprove = async (requestId) => {
    try {
      await approveRequest(id, requestId);
      toast.success('Request approved');
      await fetchRide();
      await fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectRequest(id, requestId);
      toast.success('Request rejected');
      await fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleLeave = async () => {
    setConfirmModal({ open: false });
    try {
      await leaveRide(id);
      toast.success('Left ride');
      navigate('/cabshare');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleComplete = async () => {
    setConfirmModal({ open: false });
    try {
      await completeRide(id);
      toast.success('Ride marked complete');
      await fetchRide();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleCancel = async () => {
    setConfirmModal({ open: false });
    try {
      await cancelRide(id);
      toast.success('Ride cancelled');
      navigate('/cabshare');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleRateSubmit = async () => {
    if (!ratingModal.toUser) return;
    try {
      await rateRide(id, ratingModal.toUser._id, ratingForm.rating, ratingForm.comment);
      toast.success('Rating submitted');
      setRatingModal({ open: false, toUser: null });
      setRatingForm({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading && !ride) {
    return (
      <Layout>
        <div className="container"><p>Loading...</p></div>
      </Layout>
    );
  }
  if (!ride) {
    return (
      <Layout>
        <div className="container">
          <p>Ride not found.</p>
          <Link to="/cabshare" className="btn-outline">Back to Rides</Link>
        </div>
      </Layout>
    );
  }

  const mapsUrl = getMapsUrl(ride.from, ride.to);

  return (
    <Layout>
      <div className="container ride-detail">
        <Link to="/cabshare" className="back-link">← Rides</Link>

        <div className="ride-detail-header card">
          <div className="ride-route-row">
            <span className="from">{ride.from}</span>
            <span className="arrow">→</span>
            <span className="to">{ride.to}</span>
          </div>
          <div className="ride-meta-row">
            <span>{new Date(ride.date).toLocaleDateString()}</span>
            <span>{ride.time}</span>
            <span className={`ride-status-badge ${status}`}>{status}</span>
            <span className="seat-availability">
              Seats: {ride.passengers?.length || 0}/{ride.seats} available
            </span>
          </div>
          <p className="ride-driver">Driver: {ride.createdBy?.name}</p>
          {ride.contactInfo && <p className="ride-contact">{ride.contactInfo}</p>}
          {ride.notes && <p className="ride-notes">{ride.notes}</p>}

          <div className="ride-detail-actions">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
              View route on map
            </a>
            {canJoin && (
              <RequestJoinButton rideId={id} onSuccess={() => { fetchRide(); toast.success('Request sent'); }} />
            )}
            {isPassenger && (status === 'active' || status === 'full') && (
              <button className="btn-outline" onClick={() => setConfirmModal({ open: true, action: 'leave' })}>
                Leave ride
              </button>
            )}
            {isCreator && status !== 'cancelled' && status !== 'completed' && (
              <>
                <button className="btn-outline" onClick={() => setConfirmModal({ open: true, action: 'cancel' })}>
                  Cancel ride
                </button>
                <button className="btn-primary" onClick={() => setConfirmModal({ open: true, action: 'complete' })}>
                  Mark completed
                </button>
              </>
            )}
          </div>
        </div>

        {isCreator && (status === 'active' || status === 'full') && (
          <div className="card ride-requests-section">
            <h3>Join requests</h3>
            {requests.length === 0 ? (
              <p className="text-muted">No pending requests.</p>
            ) : (
              <ul className="request-list">
                {requests.map((req) => (
                  <li key={req._id}>
                    <span>{req.user?.name} – {req.user?.email}</span>
                    <div>
                      <button className="btn-primary btn-sm" onClick={() => handleApprove(req._id)}>Approve</button>
                      <button className="btn-outline btn-sm" onClick={() => handleReject(req._id)}>Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="card ride-passengers">
          <h3>Driver & Passengers</h3>
          <ul>
            <li>
              <span>{ride.createdBy?.name} (driver)</span>
              {status === 'completed' && isPassenger && (
                <button
                  className="btn-outline btn-sm"
                  onClick={() => setRatingModal({ open: true, toUser: ride.createdBy })}
                >
                  Rate driver
                </button>
              )}
            </li>
            {ride.passengers?.map((p) => (
              <li key={p._id}>
                <span>{p.name}</span>
                {status === 'completed' && (isCreator || isPassenger) && p._id !== user?._id && (
                  <button
                    className="btn-outline btn-sm"
                    onClick={() => setRatingModal({ open: true, toUser: p })}
                  >
                    Rate
                  </button>
                )}
              </li>
            ))}
          </ul>
          {(!ride.passengers || ride.passengers.length === 0) && (
            <p className="text-muted">No passengers yet.</p>
          )}
        </div>

        {ride.rideHistory?.length > 0 && (
          <div className="card ride-history">
            <h3>History</h3>
            <ul>
              {ride.rideHistory.slice(-10).reverse().map((h, i) => (
                <li key={i}>{h.action} – {new Date(h.at).toLocaleString()}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={
          confirmModal.action === 'leave' ? 'Leave ride' :
          confirmModal.action === 'cancel' ? 'Cancel ride' : 'Mark completed'
        }
        message={
          confirmModal.action === 'leave' ? 'Leave this ride?' :
          confirmModal.action === 'cancel' ? 'Cancel this ride? Passengers will be notified.' :
          'Mark this ride as completed?'
        }
        confirmLabel={confirmModal.action === 'leave' ? 'Leave' : confirmModal.action === 'cancel' ? 'Cancel' : 'Complete'}
        onConfirm={() => {
          if (confirmModal.action === 'leave') handleLeave();
          else if (confirmModal.action === 'cancel') handleCancel();
          else if (confirmModal.action === 'complete') handleComplete();
        }}
        onCancel={() => setConfirmModal({ open: false })}
      />

      {ratingModal.open && ratingModal.toUser && (
        <div className="modal-overlay" onClick={() => setRatingModal({ open: false })}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <h3>Rate {ratingModal.toUser.name}</h3>
            <div className="form-group">
              <label>Rating (1-5)</label>
              <select
                value={ratingForm.rating}
                onChange={(e) => setRatingForm({ ...ratingForm, rating: parseInt(e.target.value, 10) })}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Comment (optional)</label>
              <textarea
                value={ratingForm.comment}
                onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                rows={2}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setRatingModal({ open: false })}>Cancel</button>
              <button className="btn-primary" onClick={handleRateSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
