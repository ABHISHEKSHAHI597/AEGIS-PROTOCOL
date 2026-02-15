/**
 * Facilities Page
 * Browse campus facilities, book, view bookings
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFacilities } from '../services/facilityService';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './Facilities.css';

const FACILITY_TYPES = [
  'Library',
  'Cafeteria',
  'Lab',
  'Sports',
  'Hostel',
  'Admin',
  'Classroom',
  'Parking',
  'Medical',
  'Other',
];

const TYPE_ICONS = {
  Library: '📚',
  Cafeteria: '🍽️',
  Lab: '💻',
  Sports: '⚽',
  Hostel: '🏠',
  Admin: '🏢',
  Classroom: '📖',
  Parking: '🅿️',
  Medical: '🏥',
  Other: '📍',
};

export const Facilities = () => {
  const { isAdmin } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getFacilities(filterType || undefined);
        setFacilities(data);
      } catch (err) {
        setFacilities([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filterType]);

  return (
    <Layout>
      <div className="container">
        <div className="facilities-header">
          <h1>Campus Facilities</h1>
          <p className="subtitle">Explore buildings, labs, cafeterias, and book facilities</p>
          <div className="facilities-actions">
            <Link to="/facilities/bookings" className="btn-outline">My Bookings</Link>
            {isAdmin && (
              <Link to="/facilities/approval" className="btn-primary">Approval dashboard</Link>
            )}
          </div>
        </div>
        <div className="filter-row">
          <span>Filter:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="type-select"
          >
            <option value="">All Types</option>
            {FACILITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_ICONS[t] || '📍'} {t}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="mt-4">Loading...</p>
        ) : facilities.length === 0 ? (
          <div className="empty-state">
            <p>No facilities found. Run <code>npm run seed-facilities</code> in backend.</p>
          </div>
        ) : (
          <div className="facilities-grid">
            {facilities.map((f) => (
              <div key={f._id} className="facility-card">
                <div className="facility-icon">{TYPE_ICONS[f.type] || '📍'}</div>
                <h3>{f.name}</h3>
                <span className="facility-type">{f.type}</span>
                {f.description && <p className="facility-desc">{f.description}</p>}
                {f.building && <p className="facility-meta">Building: {f.building}</p>}
                {f.floor && <p className="facility-meta">Floor: {f.floor}</p>}
                {f.location && <p className="facility-meta">Location: {f.location}</p>}
                {f.hours && <p className="facility-hours">Hours: {f.hours}</p>}
                {f.amenities?.length > 0 && (
                  <div className="amenities">
                    {f.amenities.map((a) => (
                      <span key={a} className="amenity-tag">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                {f.contact && (
                  <p className="facility-contact text-small">
                    <a href={`mailto:${f.contact}`}>{f.contact}</a>
                  </p>
                )}
                <Link to={`/facilities/${f._id}/book`} className="btn-primary btn-sm facility-book-btn">
                  Book
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
