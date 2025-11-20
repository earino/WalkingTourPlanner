import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TourMap from './TourMap';
import ElevationProfile from './ElevationProfile';
import PlaceCard from './PlaceCard';
import WalkingDirections from './WalkingDirections';
import { exportTourAsPdf } from '../services/api';

export default function TourResults({ tour }) {
  const { title, overview, metadata, places, route } = tour;
  const [searchParams] = useSearchParams();
  const [copySuccess, setCopySuccess] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

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

  // Handle PDF export
  const handleExportPdf = async () => {
    setPdfExporting(true);
    try {
      await exportTourAsPdf(tour);
    } catch (error) {
      alert('Failed to export PDF: ' + error.message);
    } finally {
      setPdfExporting(false);
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
          <button
            className="pdf-button"
            onClick={handleExportPdf}
            disabled={pdfExporting}
          >
            <span className="pdf-icon">📄</span>
            <span className="pdf-text">
              {pdfExporting ? 'Generating PDF...' : 'Download PDF Guide'}
            </span>
          </button>
        </div>
      </div>

      <TourMap tour={tour} />

      <ElevationProfile route={route} places={places} />

      <div className="places-list">
        <h3 className="places-header">Your Tour Stops</h3>
        {places.map((place, index) => (
          <div key={place.id} className="place-with-directions">
            <PlaceCard place={place} index={index} />
            {/* Show walking directions to the next stop */}
            {index < places.length - 1 && route?.legs && route.legs[index] && (
              <WalkingDirections
                leg={route.legs[index]}
                fromPlace={place}
                toPlace={places[index + 1]}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
