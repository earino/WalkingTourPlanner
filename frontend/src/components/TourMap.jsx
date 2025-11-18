import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create numbered marker icons
const createNumberedIcon = (number) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">${number}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export default function TourMap({ tour }) {
  const { places, location, route } = tour;

  // Calculate bounds to fit all markers
  const bounds = places.map(place => [place.latitude, place.longitude]);

  // Create route coordinates - use actual walking route if available
  let routeCoordinates = [];

  if (route && route.geometry) {
    // Use actual walking route from Geoapify
    if (route.geometry.type === 'MultiLineString') {
      // MultiLineString: array of line segments (one per leg)
      routeCoordinates = route.geometry.coordinates.map(lineString =>
        lineString.map(coord => [coord[1], coord[0]]) // Convert [lon, lat] to [lat, lon] for Leaflet
      );
    } else if (route.geometry.type === 'LineString') {
      // LineString: single continuous line
      routeCoordinates = [route.geometry.coordinates.map(coord => [coord[1], coord[0]])];
    }
  } else {
    // Fallback: straight lines between places
    routeCoordinates = [places.map(place => [place.latitude, place.longitude])];
  }

  return (
    <div className="tour-map">
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route lines (supports multiple segments for MultiLineString) */}
        {routeCoordinates.map((lineSegment, idx) => (
          <Polyline
            key={idx}
            positions={lineSegment}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
          />
        ))}

        {/* Place markers */}
        {places.map((place, index) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={createNumberedIcon(index + 1)}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  {place.name}
                </h3>
                <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                  {place.address}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
