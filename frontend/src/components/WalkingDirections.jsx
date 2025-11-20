import { useState } from 'react';

/**
 * Displays turn-by-turn walking directions between tour stops
 */
export default function WalkingDirections({ leg, fromPlace, toPlace }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!leg || !leg.directions) {
    return null;
  }

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds) => {
    const minutes = Math.round(seconds / 60);
    return minutes === 1 ? '1 min' : `${minutes} mins`;
  };

  // Get icon for instruction type
  const getDirectionIcon = (type) => {
    const icons = {
      'turn-right': '↗️',
      'turn-left': '↖️',
      'turn-slight-right': '↗️',
      'turn-slight-left': '↖️',
      'turn-sharp-right': '⤴️',
      'turn-sharp-left': '⤵️',
      'continue': '⬆️',
      'straight': '⬆️',
      'uturn': '🔄',
      'arrive': '🎯',
      'depart': '🚶'
    };
    return icons[type] || '➡️';
  };

  return (
    <div className="walking-directions">
      <div className="walking-directions-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="walking-directions-summary">
          <span className="walking-icon">🚶</span>
          <span className="walking-text">
            Walk to <strong>{toPlace?.name}</strong>
          </span>
        </div>
        <div className="walking-directions-stats">
          <span className="walking-stat">{formatDistance(leg.distance)}</span>
          <span className="walking-stat-separator">•</span>
          <span className="walking-stat">{formatDuration(leg.duration)}</span>
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </div>
      </div>

      {isExpanded && (
        <div className="walking-directions-details">
          <ol className="directions-list">
            {leg.directions.map((direction, index) => (
              <li key={index} className="direction-step">
                <span className="direction-icon">{getDirectionIcon(direction.type)}</span>
                <div className="direction-content">
                  <div className="direction-instruction">{direction.instruction}</div>
                  {direction.streetName && (
                    <div className="direction-street">on {direction.streetName}</div>
                  )}
                  <div className="direction-distance">
                    {formatDistance(direction.distance)}
                    {direction.duration > 0 && ` (${formatDuration(direction.duration)})`}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
