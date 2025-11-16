import TourMap from './TourMap';
import PlaceCard from './PlaceCard';

export default function TourResults({ tour }) {
  const { title, overview, metadata, places } = tour;

  return (
    <div className="tour-results">
      <div className="tour-header">
        <h2 className="tour-title">{title}</h2>
        <p className="tour-overview">{overview}</p>
        <div className="tour-stats">
          <div className="tour-stat">
            <span className="tour-stat-icon">📍</span>
            <span className="tour-stat-text">{metadata.totalPlaces} stops</span>
          </div>
          <div className="tour-stat">
            <span className="tour-stat-icon">⏱️</span>
            <span className="tour-stat-text">{metadata.estimatedDuration}</span>
          </div>
          <div className="tour-stat">
            <span className="tour-stat-icon">🚶</span>
            <span className="tour-stat-text">{metadata.totalDistance}</span>
          </div>
        </div>
      </div>

      <TourMap tour={tour} />

      <div className="places-list">
        <h3 className="places-header">Your Tour Stops</h3>
        {places.map((place, index) => (
          <PlaceCard key={place.id} place={place} index={index} />
        ))}
      </div>
    </div>
  );
}
