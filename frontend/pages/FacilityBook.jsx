/**
 * Facility Booking – Time slot picker and booking form
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFacility, getAvailability, createBooking } from '../services/facilityService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import './FacilityBook.css';

const SLOT_MINUTES = 60;
const HOUR_START = 8;
const HOUR_END = 20;

export const FacilityBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [facility, setFacility] = useState(null);
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedEnd, setSelectedEnd] = useState('');
  const [recurring, setRecurring] = useState({ enabled: false, pattern: 'weekly' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const f = await getFacility(id);
        setFacility(f);
      } catch (err) {
        setFacility(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!id || !date) return;
    getAvailability(id, date).then((data) => setSlots(data.slots || [])).catch(() => setSlots([]));
  }, [id, date]);

  const timeOptions = [];
  for (let h = HOUR_START; h < HOUR_END; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      timeOptions.push(t);
    }
  }

  const isSlotBusy = (slotStart, slotEnd) => {
    return slots.some((s) => {
      const sStart = new Date(s.bookingTimeSlot?.start || s.start);
      const sEnd = new Date(s.bookingTimeSlot?.end || s.end);
      return sStart < slotEnd && sEnd > slotStart;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStart || !selectedEnd) {
      toast.error('Select start and end time');
      return;
    }
    const startDt = new Date(`${date}T${selectedStart}`);
    const endDt = new Date(`${date}T${selectedEnd}`);
    if (endDt <= startDt) {
      toast.error('End must be after start');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createBooking(id, {
        start: startDt.toISOString(),
        end: endDt.toISOString(),
        recurring: recurring.enabled ? { pattern: recurring.pattern } : undefined,
      });
      toast.success(result.message || 'Booking request submitted');
      navigate('/facilities/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !facility) {
    return (
      <Layout>
        <div className="container"><p>Loading...</p></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container facility-book">
        <Link to="/facilities" className="back-link">← Facilities</Link>
        <h1>Book: {facility.name}</h1>
        <p className="subtitle">{facility.type}</p>

        <form onSubmit={handleSubmit} className="card booking-form">
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="form-group">
              <label>Start time</label>
              <select
                value={selectedStart}
                onChange={(e) => setSelectedStart(e.target.value)}
              >
                <option value="">Select</option>
                {timeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>End time</label>
              <select
                value={selectedEnd}
                onChange={(e) => setSelectedEnd(e.target.value)}
              >
                <option value="">Select</option>
                {timeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={recurring.enabled}
                onChange={(e) => setRecurring({ ...recurring, enabled: e.target.checked })}
              />
              {' '}Recurring booking
            </label>
            {recurring.enabled && (
              <select
                value={recurring.pattern}
                onChange={(e) => setRecurring({ ...recurring, pattern: e.target.value })}
                className="ml-2"
              >
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
            )}
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Request booking'}
          </button>
        </form>

        <div className="card availability-heatmap">
          <h3>Approved slots on this day (busy)</h3>
          {slots.length === 0 ? (
            <p className="text-muted">No approved bookings for this date.</p>
          ) : (
            <ul className="slot-list">
              {slots.map((s, i) => (
                <li key={i}>
                  {new Date(s.bookingTimeSlot?.start || s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  – {new Date(s.bookingTimeSlot?.end || s.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
};
