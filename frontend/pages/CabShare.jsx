/**
 * Cab Share – Ride listing dashboard
 * Create, browse, join; status badges and seat indicator
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  createRide,
  getRides,
  getMyRides,
  joinRide,
  leaveRide,
  cancelRide,
} from '../services/cabShareService';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import './CabShare.css';

const statusLabel = (r) => r?.rideStatus || r?.status || 'active';
const seatAvailability = (r) => Math.max(0, (r?.seats || 0) - (r?.passengers?.length || 0));

export const CabShare = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [rides, setRides] = useState([]);
  const [myRides, setMyRides] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    from: '',
    to: '',
    date: '',
    time: '',
    seats: 4,
    contactInfo: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, rideId: null });

  const fetchRides = async () => {
    try {
      const params = {};
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;
      if (filterDate) params.date = filterDate;
      const data = await getRides(params);
      setRides(data);
    } catch (err) {
      setRides([]);
    }
  };

  const fetchMyRides = async () => {
    try {
      const data = await getMyRides();
      setMyRides(data);
    } catch (err) {
      setMyRides([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchRides();
      await fetchMyRides();
      setLoading(false);
    };
    load();
  }, [activeTab, filterFrom, filterTo, filterDate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createRide({
        from: form.from,
        to: form.to,
        date: form.date,
        time: form.time,
        seats: form.seats,
        contactInfo: form.contactInfo || undefined,
        notes: form.notes || undefined,
      });
      setForm({ from: '', to: '', date: '', time: '', seats: 4, contactInfo: '', notes: '' });
      setShowCreate(false);
      await fetchRides();
      await fetchMyRides();
      toast.success('Ride created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ride');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (id) => {
    try {
      await joinRide(id);
      await fetchRides();
      await fetchMyRides();
      toast.success('Joined ride');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join');
    }
  };

  const handleLeave = async (id) => {
    setConfirmModal({ open: false });
    try {
      await leaveRide(id);
      await fetchRides();
      await fetchMyRides();
      toast.success('Left ride');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave');
    }
  };

  const handleCancel = async (id) => {
    setConfirmModal({ open: false });
    try {
      await cancelRide(id);
      await fetchRides();
      await fetchMyRides();
      toast.success('Ride cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const runConfirmAction = () => {
    if (confirmModal.action === 'leave') handleLeave(confirmModal.rideId);
    else if (confirmModal.action === 'cancel') handleCancel(confirmModal.rideId);
  };

  const isCreator = (ride) => ride.createdBy?._id === user?._id;
  const isPassenger = (ride) =>
    ride.passengers?.some((p) => p._id === user?._id) || false;
  const rideStatus = (r) => statusLabel(r);
  const canJoin = (ride) =>
    (ride.rideStatus === 'active' || ride.status === 'Open') &&
    !isCreator(ride) &&
    !isPassenger(ride) &&
    seatAvailability(ride) > 0;

  return (
    <Layout>
      <div className="container">
        <div className="cabshare-header">
          <div>
            <h1>Cab Share</h1>
            <p className="subtitle">Share rides with the campus community</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : '+ Create Ride'}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="create-ride-form card">
            <h3>Create Ride</h3>
            <div className="form-row">
              <div className="form-group">
                <label>From</label>
                <input
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                  placeholder="Pickup location"
                  required
                />
              </div>
              <div className="form-group">
                <label>To</label>
                <input
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  placeholder="Drop location"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Seats</label>
                <input
                  type="number"
                  min={1}
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Contact (optional)</label>
              <input
                value={form.contactInfo}
                onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                placeholder="Phone/Email"
              />
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional info"
                rows={2}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Ride'}
            </button>
          </form>
        )}

        <div className="cabshare-tabs">
          <button
            className={activeTab === 'browse' ? 'active' : ''}
            onClick={() => setActiveTab('browse')}
          >
            Browse Rides
          </button>
          <button
            className={activeTab === 'my' ? 'active' : ''}
            onClick={() => setActiveTab('my')}
          >
            My Rides
          </button>
        </div>

        {activeTab === 'browse' && (
          <div className="filter-bar">
            <input
              placeholder="From"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
            />
            <input
              placeholder="To"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
            />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        )}

        {loading ? (
          <p className="mt-4">Loading...</p>
        ) : activeTab === 'browse' ? (
          <div className="rides-grid">
            {rides.length === 0 ? (
              <p className="text-muted">No upcoming rides. Create one!</p>
            ) : (
              rides.map((r) => (
                <div key={r._id} className={`ride-card ride-status-${(rideStatus(r) || 'active').toLowerCase()}`}>
                  <div className="ride-route">
                    <span className="from">{r.from}</span>
                    <span className="arrow">→</span>
                    <span className="to">{r.to}</span>
                  </div>
                  <div className="ride-meta">
                    <span>{new Date(r.date).toLocaleDateString()}</span>
                    <span>{r.time}</span>
                    <span className="seat-availability">Seats: {r.passengers?.length || 0}/{r.seats}</span>
                    <span className={`ride-status-badge ${(rideStatus(r) || 'active').toLowerCase()}`}>
                      {rideStatus(r) || 'active'}
                    </span>
                    <span>By: {r.createdBy?.name}</span>
                  </div>
                  {r.contactInfo && <p className="ride-contact">{r.contactInfo}</p>}
                  {r.notes && <p className="ride-notes text-small">{r.notes}</p>}
                  <div className="ride-actions">
                    <Link to={`/cabshare/${r._id}`} className="btn-outline btn-sm">Details</Link>
                    {canJoin(r) && (
                      <button className="btn-primary btn-sm" onClick={() => handleJoin(r._id)}>
                        Join
                      </button>
                    )}
                    {isPassenger(r) && (rideStatus(r) === 'active' || rideStatus(r) === 'full') && (
                      <button className="btn-outline btn-sm" onClick={() => setConfirmModal({ open: true, action: 'leave', rideId: r._id })}>
                        Leave
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="rides-grid">
            {myRides.length === 0 ? (
              <p className="text-muted">You have no rides.</p>
            ) : (
              myRides.map((r) => (
                <div key={r._id} className={`ride-card my ride-status-${(rideStatus(r) || 'active').toLowerCase()}`}>
                  <div className="ride-route">
                    <span className="from">{r.from}</span>
                    <span className="arrow">→</span>
                    <span className="to">{r.to}</span>
                  </div>
                  <div className="ride-meta">
                    <span>{new Date(r.date).toLocaleDateString()}</span>
                    <span>{r.time}</span>
                    <span className="seat-availability">Seats: {r.passengers?.length || 0}/{r.seats}</span>
                    <span className={`ride-status-badge ${(rideStatus(r) || 'active').toLowerCase()}`}>
                      {rideStatus(r) || 'active'}
                    </span>
                    {isCreator(r) && <span className="creator-tag">Your ride</span>}
                  </div>
                  {r.passengers?.length > 0 && (
                    <p className="passengers">Passengers: {r.passengers.map((p) => p.name).join(', ')}</p>
                  )}
                  <div className="ride-actions">
                    <Link to={`/cabshare/${r._id}`} className="btn-outline btn-sm">Details</Link>
                    {isCreator(r) && rideStatus(r) !== 'cancelled' && rideStatus(r) !== 'completed' && (
                      <button className="btn-danger btn-sm" onClick={() => setConfirmModal({ open: true, action: 'cancel', rideId: r._id })}>
                        Cancel Ride
                      </button>
                    )}
                    {isPassenger(r) && (rideStatus(r) === 'active' || rideStatus(r) === 'full') && (
                      <button className="btn-outline btn-sm" onClick={() => setConfirmModal({ open: true, action: 'leave', rideId: r._id })}>
                        Leave
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <ConfirmModal
          open={confirmModal.open}
          title={confirmModal.action === 'cancel' ? 'Cancel Ride' : 'Leave Ride'}
          message={
            confirmModal.action === 'cancel'
              ? 'Cancel this ride? Passengers will no longer see it.'
              : 'Leave this ride?'
          }
          confirmLabel={confirmModal.action === 'cancel' ? 'Cancel Ride' : 'Leave'}
          onConfirm={runConfirmAction}
          onCancel={() => setConfirmModal({ open: false })}
        />
      </div>
    </Layout>
  );
};
