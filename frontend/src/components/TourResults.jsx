import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TourMap from './TourMap';
import ElevationProfile from './ElevationProfile';
import PlaceCard from './PlaceCard';

export default function TourResults({ tour }) {
  const { title, overview, metadata, places, route } = tour;
  const [searchParams] = useSearchParams();
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle share button click
  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Generate Google Maps URL with turn-by-turn directions
  const generateGoogleMapsUrl = () => {
    if (!places || places.length === 0) return '#';

    const origin = `${places[0].latitude},${places[0].longitude}`;
    const destination = `${places[places.length - 1].latitude},${places[places.length - 1].longitude}`;

    // Waypoints are all stops except first and last
    const waypoints = places.length > 2
      ? places.slice(1, -1).map(p => `${p.latitude},${p.longitude}`).join('|')
      : '';

    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const params = new URLSearchParams({
      origin,
      destination,
      travelmode: 'walking'
    });

    if (waypoints) {
      params.append('waypoints', waypoints);
    }

    return `${baseUrl}&${params.toString()}`;
  };

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
          {metadata.elevationGain > 0 && (
            <div className="tour-stat">
              <span className="tour-stat-icon">⬆️</span>
              <span className="tour-stat-text">{metadata.elevationGain}m elevation gain</span>
            </div>
          )}
        </div>
        <div className="tour-actions">
          <button className="share-button" onClick={handleShare}>
            <span className="share-icon">🔗</span>
            <span className="share-text">{copySuccess ? 'Link Copied!' : 'Share This Tour'}</span>
          </button>
          <a
            href={generateGoogleMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="maps-button"
          >
            <span className="maps-icon">🗺️</span>
            <span className="maps-text">Open in Google Maps</span>
          </a>
        </div>
      </div>

      <TourMap tour={tour} />

      <ElevationProfile route={route} places={places} />

      <div className="places-list">
        <h3 className="places-header">Your Tour Stops</h3>
        {places.map((place, index) => (
          <PlaceCard key={place.id} place={place} index={index} />
        ))}
      </div>
    </div>
  );
}
