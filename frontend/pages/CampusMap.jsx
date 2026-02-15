/**
 * Campus Map – Interactive navigation
 * Building search, click for details, route between locations, zoomable map, markers with metadata.
 * Optional: North/South campus PDF map links (indoor/layout reference).
 */
import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getFacilities } from '../services/facilityService';
import { Layout } from '../components/Layout';
import 'leaflet/dist/leaflet.css';
import './CampusMap.css';

const TYPE_COLORS = {
  Library: '#3b82f6',
  Cafeteria: '#22c55e',
  Lab: '#8b5cf6',
  Sports: '#f59e0b',
  Hostel: '#ec4899',
  Admin: '#64748b',
  Classroom: '#06b6d4',
  Parking: '#6366f1',
  Medical: '#ef4444',
  Other: '#94a3b8',
};

const DEFAULT_CENTER = [28.536, 77.169];
const DEFAULT_ZOOM = 16;

// Fix default marker icons in Leaflet with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createColoredIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<span style="background-color:${color};width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:block;"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function MapFitBounds({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (!locations || locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map(([lat, lng]) => [lat, lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
  }, [map, locations]);
  return null;
}

export const CampusMap = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCampus, setFilterCampus] = useState('');
  const [selected, setSelected] = useState(null);
  const [routeFrom, setRouteFrom] = useState(null);
  const [routeTo, setRouteTo] = useState(null);
  const [showIndoorMaps, setShowIndoorMaps] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { type: filterType || undefined, campus: filterCampus || undefined, search: search.trim() || undefined };
        const data = await getFacilities(params);
        setFacilities(Array.isArray(data) ? data : []);
        if (!selected || !data.find((f) => f._id === selected._id)) setSelected(null);
      } catch (err) {
        setFacilities([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filterType, filterCampus, search]);

  const withCoords = useMemo(() => facilities.filter((f) => f.latitude != null && f.longitude != null), [facilities]);

  const routePoints = useMemo(() => {
    if (!routeFrom || !routeTo) return [];
    return [
      [routeFrom.latitude, routeFrom.longitude],
      [routeTo.latitude, routeTo.longitude],
    ];
  }, [routeFrom, routeTo]);

  const fitBoundsLocations = useMemo(() => {
    if (routePoints.length >= 2) return routePoints;
    if (withCoords.length === 0) return null;
    return withCoords.map((f) => [f.latitude, f.longitude]);
  }, [routePoints, withCoords]);

  return (
    <Layout>
      <div className="campus-map-page">
        <header className="map-header">
          <h1>Campus Map</h1>
          <p className="subtitle">Search buildings, click markers for details, and get directions between locations</p>

          <div className="map-controls">
            <input
              type="search"
              placeholder="Search buildings or building code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="map-search"
            />
            <select value={filterCampus} onChange={(e) => setFilterCampus(e.target.value)} className="map-filter">
              <option value="">All campuses</option>
              <option value="north">North Campus</option>
              <option value="south">South Campus</option>
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="map-filter">
              <option value="">All types</option>
              {Object.keys(TYPE_COLORS).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <label className="map-toggle">
              <input type="checkbox" checked={showIndoorMaps} onChange={(e) => setShowIndoorMaps(e.target.checked)} />
              <span>Show map PDFs</span>
            </label>
          </div>

          {/* Route selection */}
          <div className="route-controls">
            <span className="route-label">Route:</span>
            <select
              value={routeFrom?._id || ''}
              onChange={(e) => setRouteFrom(withCoords.find((f) => f._id === e.target.value) || null)}
              className="route-select"
            >
              <option value="">From...</option>
              {withCoords.map((f) => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
            <span className="route-arrow">→</span>
            <select
              value={routeTo?._id || ''}
              onChange={(e) => setRouteTo(withCoords.find((f) => f._id === e.target.value) || null)}
              className="route-select"
            >
              <option value="">To...</option>
              {withCoords.map((f) => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
            {(routeFrom || routeTo) && (
              <button type="button" className="btn-outline btn-sm" onClick={() => { setRouteFrom(null); setRouteTo(null); }}>
                Clear route
              </button>
            )}
          </div>
        </header>

        {showIndoorMaps && (
          <div className="indoor-maps-bar">
            <a href="/maps/NorthCampusMap.pdf" target="_blank" rel="noopener noreferrer" className="indoor-link">North Campus Map (PDF)</a>
            <a href="/maps/SouthCampusMap.pdf" target="_blank" rel="noopener noreferrer" className="indoor-link">South Campus Map (PDF)</a>
          </div>
        )}

        {loading ? (
          <p className="map-loading">Loading map...</p>
        ) : withCoords.length === 0 ? (
          <div className="map-empty">
            <p>No buildings with coordinates found.</p>
            <p className="text-small text-muted">Run <code>npm run seed-facilities</code> in the backend to load campus data.</p>
          </div>
        ) : (
          <div className="map-wrapper">
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              className="map-container-leaflet"
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {fitBoundsLocations && fitBoundsLocations.length > 0 && <MapFitBounds locations={fitBoundsLocations} />}

              {routePoints.length === 2 && (
                <Polyline positions={routePoints} color="#2563eb" weight={4} opacity={0.8} dashArray="10, 10" />
              )}

              {withCoords.map((f) => (
                <Marker
                  key={f._id}
                  position={[f.latitude, f.longitude]}
                  icon={createColoredIcon(TYPE_COLORS[f.type] || TYPE_COLORS.Other)}
                  eventHandlers={{
                    click: () => setSelected(selected?._id === f._id ? null : f),
                  }}
                >
                  <Popup>
                    <strong>{f.name}</strong>
                    <br />
                    <span className="popup-type">{f.type}</span>
                    {f.campus && <><br />Campus: {f.campus}</>}
                    {f.hours && <><br />Hours: {f.hours}</>}
                    {f.building && <><br />Building: {f.building}</>}
                    <br />
                    <button type="button" className="btn-route-from" onClick={() => setRouteFrom(f)}>Set as From</button>
                    <button type="button" className="btn-route-to" onClick={() => setRouteTo(f)}>Set as To</button>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {selected && (
              <div className="map-detail-panel">
                <h3>{selected.name}</h3>
                <span className="detail-type">{selected.type}</span>
                {selected.campus && <p><strong>Campus:</strong> {selected.campus}</p>}
                {selected.description && <p>{selected.description}</p>}
                {selected.building && <p><strong>Building:</strong> {selected.building}</p>}
                {selected.buildingCode && <p><strong>Code:</strong> {selected.buildingCode}</p>}
                {selected.floorMapImage && (
                  <p>
                    <a href={selected.floorMapImage} target="_blank" rel="noopener noreferrer" className="floor-map-link">
                      View floor map
                    </a>
                  </p>
                )}
                {selected.floor && <p><strong>Floor:</strong> {selected.floor}</p>}
                {selected.location && <p><strong>Location:</strong> {selected.location}</p>}
                {selected.hours && <p><strong>Opening hours:</strong> {selected.hours}</p>}
                {selected.amenities?.length > 0 && <p><strong>Amenities:</strong> {selected.amenities.join(', ')}</p>}
                {selected.contact && <p><a href={`mailto:${selected.contact}`}>{selected.contact}</a></p>}
                <div className="detail-actions">
                  <button type="button" className="btn-outline btn-sm" onClick={() => setRouteFrom(selected)}>From here</button>
                  <button type="button" className="btn-outline btn-sm" onClick={() => setRouteTo(selected)}>To here</button>
                  <button type="button" className="btn-outline btn-sm" onClick={() => setSelected(null)}>Close</button>
                </div>
              </div>
            )}

            <div className="map-legend">
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <span key={type} className="legend-item">
                  <span className="legend-dot" style={{ background: color }} />
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
