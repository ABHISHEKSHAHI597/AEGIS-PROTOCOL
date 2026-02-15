/**
 * Booking Approval Dashboard (Admin)
 * Approve/reject pending bookings; notifications on response
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPendingBookings, approveBooking, rejectBooking } from '../services/facilityService';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './BookingApproval.css';

export const BookingApproval = () => {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState({ id: null, value: '' });

  const fetchPending = async () => {
    try {
      const data = await getPendingBookings();
      setBookings(data);
    } catch (err) {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    try {
      const result = await approveBooking(id);
      toast.success(result.message || 'Booking approved');
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectBooking(id, rejectReason.id === id ? rejectReason.value : '');
      toast.success('Booking rejected. User will be notified.');
      setRejectReason({ id: null, value: '' });
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container">
          <p>Admin only.</p>
          <Link to="/facilities" className="btn-outline">Facilities</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container booking-approval">
        <h1>Booking approval</h1>
        <p className="subtitle">Approve or reject pending facility bookings</p>
        <Link to="/facilities" className="btn-outline">← Facilities</Link>

        {loading ? (
          <p className="mt-4">Loading...</p>
        ) : bookings.length === 0 ? (
          <div className="card empty-state">
            <p>No pending bookings.</p>
          </div>
        ) : (
          <div className="pending-list">
            {bookings.map((b) => (
              <div key={b._id} className="card pending-card">
                <div className="pending-header">
                  <h3>{b.facility?.name}</h3>
                  <span className="facility-type">{b.facility?.type}</span>
                </div>
                <p className="pending-user">
                  Requested by: <strong>{b.user?.name}</strong> ({b.user?.email})
                </p>
                <p className="pending-time">
                  {new Date(b.bookingTimeSlot?.start).toLocaleString()} – {new Date(b.bookingTimeSlot?.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="reject-reason-wrap">
                  <input
                    type="text"
                    placeholder="Rejection reason (optional)"
                    value={rejectReason.id === b._id ? rejectReason.value : ''}
                    onChange={(e) => setRejectReason({ id: b._id, value: e.target.value })}
                    className="reject-input"
                  />
                </div>
                <div className="pending-actions">
                  <button className="btn-primary btn-sm" onClick={() => handleApprove(b._id)}>
                    Approve
                  </button>
                  <button className="btn-outline btn-sm" onClick={() => handleReject(b._id)}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
