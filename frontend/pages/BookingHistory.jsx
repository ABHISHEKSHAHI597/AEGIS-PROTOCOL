/**
 * My Bookings – Booking history and status
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyBookings, cancelBooking } from '../services/facilityService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import './BookingHistory.css';

export const BookingHistory = () => {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ open: false, id: null });

  const fetchBookings = async () => {
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch (err) {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async () => {
    if (!cancelModal.id) return;
    try {
      await cancelBooking(cancelModal.id);
      toast.success('Booking cancelled');
      setCancelModal({ open: false, id: null });
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  const statusLabel = (b) => {
    if (b.cancelledAt) return 'Cancelled';
    return b.bookingStatus || 'pending';
  };

  const statusClass = (b) => {
    if (b.cancelledAt) return 'cancelled';
    return (b.bookingStatus || 'pending').toLowerCase();
  };

  return (
    <Layout>
      <div className="container booking-history">
        <h1>My Bookings</h1>
        <p className="subtitle">View and manage your facility bookings</p>
        <Link to="/facilities" className="btn-outline">← Back to Facilities</Link>

        {loading ? (
          <p className="mt-4">Loading...</p>
        ) : bookings.length === 0 ? (
          <div className="empty-state card">
            <p>You have no bookings.</p>
            <Link to="/facilities" className="btn-primary">Browse facilities</Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((b) => (
              <div key={b._id} className={`booking-card card ${statusClass(b)}`}>
                <div className="booking-header">
                  <h3>{b.facility?.name}</h3>
                  <span className={`booking-status-badge ${statusClass(b)}`}>
                    {statusLabel(b)}
                  </span>
                </div>
                <p className="booking-time">
                  {new Date(b.bookingTimeSlot?.start).toLocaleString()} – {new Date(b.bookingTimeSlot?.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {b.bookingStatus === 'rejected' && b.rejectionReason && (
                  <p className="rejection-reason">Reason: {b.rejectionReason}</p>
                )}
                {!b.cancelledAt && b.bookingStatus !== 'rejected' && (
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => setCancelModal({ open: true, id: b._id })}
                  >
                    Cancel booking
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={cancelModal.open}
        title="Cancel booking"
        message="Cancel this booking?"
        confirmLabel="Cancel booking"
        onConfirm={handleCancel}
        onCancel={() => setCancelModal({ open: false, id: null })}
      />
    </Layout>
  );
};
