/**
 * Campus Events - Calendar view, RSVP, upcoming events
 */
import { useState, useEffect } from 'react';
import { getEvents, createEvent, rsvpEvent } from '../services/eventService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import './Events.css';

export const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ eventTitle: '', organizer: '', dateTime: '', venue: '', description: '', registrationLink: '' });
  const [posting, setPosting] = useState(false);
  const { user, isAdmin, isFaculty } = useAuth();
  const toast = useToast();
  const canPost = isAdmin || isFaculty;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = view === 'upcoming' ? { upcoming: 'true' } : {};
      const data = await getEvents(params);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [view]);

  const handlePost = async (e) => {
    e?.preventDefault?.();
    if (!form.eventTitle?.trim() || !form.dateTime) {
      toast.error('Title and date/time are required');
      return;
    }
    setPosting(true);
    try {
      await createEvent(form);
      toast.success('Event created');
      setShowForm(false);
      setForm({ eventTitle: '', organizer: '', dateTime: '', venue: '', description: '', registrationLink: '' });
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setPosting(false);
    }
  };

  const handleRsvp = async (eventId) => {
    try {
      await rsvpEvent(eventId);
      toast.success('RSVP recorded');
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to RSVP');
    }
  };

  return (
    <Layout>
      <div className="container events-page">
        <div className="events-header">
          <div>
            <h1>Campus Events</h1>
            <p className="subtitle">View upcoming events and RSVP</p>
          </div>
          {canPost && (
            <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Create Event'}
            </button>
          )}
        </div>

        {showForm && canPost && (
          <form onSubmit={handlePost} className="card event-form">
            <h3>Create Event</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input value={form.eventTitle} onChange={(e) => setForm({ ...form, eventTitle: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Organizer</label>
                <input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} placeholder="Organizer name" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date & Time *</label>
                <input type="datetime-local" value={form.dateTime} onChange={(e) => setForm({ ...form, dateTime: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Venue</label>
                <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Venue" />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="form-group">
              <label>Registration Link</label>
              <input type="url" value={form.registrationLink} onChange={(e) => setForm({ ...form, registrationLink: e.target.value })} placeholder="https://..." />
            </div>
            <button type="submit" className="btn-primary" disabled={posting}>{posting ? 'Creating...' : 'Create'}</button>
          </form>
        )}

        <div className="events-view-toggle">
          <button className={view === 'upcoming' ? 'active' : ''} onClick={() => setView('upcoming')}>Upcoming</button>
          <button className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}>All</button>
        </div>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <p>No events found.</p>
            {canPost && <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>Create first event</button>}
          </div>
        ) : (
          <div className="events-calendar-grid">
            {events.map((ev) => (
              <div key={ev._id} className="event-card card">
                <div className="event-date-badge">
                  <span className="day">{new Date(ev.dateTime).getDate()}</span>
                  <span className="month">{new Date(ev.dateTime).toLocaleString('en', { month: 'short' })}</span>
                  <span className="year">{new Date(ev.dateTime).getFullYear()}</span>
                </div>
                <div className="event-content">
                  <h3>{ev.eventTitle}</h3>
                  {ev.organizer && <p className="event-organizer">{ev.organizer}</p>}
                  <p className="event-time">{new Date(ev.dateTime).toLocaleString()}</p>
                  {ev.venue && <p className="event-venue">📍 {ev.venue}</p>}
                  {ev.description && <p className="event-desc">{ev.description.slice(0, 80)}...</p>}
                  <div className="event-footer">
                    <span className="attendees">👥 {ev.attendeesCount || 0} attending</span>
                    {ev.registrationLink && (
                      <a href={ev.registrationLink} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm">Register</a>
                    )}
                    <button type="button" className="btn-primary btn-sm" onClick={() => handleRsvp(ev._id)}>RSVP</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
