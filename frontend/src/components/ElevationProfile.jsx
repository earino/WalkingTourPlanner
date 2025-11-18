export default function ElevationProfile({ route, places }) {
  if (!route || !route.elevation || !route.legs) {
    return null; // No elevation data available
  }

  const { elevation } = route;
  const width = 800;
  const height = 150;
  const padding = { top: 20, right: 40, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Build elevation profile from legs
  const elevationPoints = [];
  let cumulativeDistance = 0;

  route.legs.forEach((leg, legIndex) => {
    if (leg.steps) {
      leg.steps.forEach((step) => {
        if (step.elevation !== undefined) {
          elevationPoints.push({
            distance: cumulativeDistance,
            elevation: step.elevation,
            stopIndex: legIndex
          });
          cumulativeDistance += step.distance;
        }
      });
    }
  });

  if (elevationPoints.length === 0) {
    return null; // No elevation data in steps
  }

  const maxDistance = cumulativeDistance;
  const minElevation = elevation.min;
  const maxElevation = elevation.max;
  const elevationRange = maxElevation - minElevation;

  // Create path for elevation line
  const pathData = elevationPoints.map((point, index) => {
    const x = padding.left + (point.distance / maxDistance) * chartWidth;
    const y = padding.top + chartHeight - ((point.elevation - minElevation) / elevationRange) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Mark stop positions
  const stopMarkers = places.map((place, index) => {
    // Find cumulative distance to this stop
    let distanceToStop = 0;
    for (let i = 0; i < index; i++) {
      if (route.legs[i]) {
        distanceToStop += route.legs[i].distance;
      }
    }

    // Find elevation at this point
    const nearestPoint = elevationPoints.reduce((prev, curr) => {
      return Math.abs(curr.distance - distanceToStop) < Math.abs(prev.distance - distanceToStop) ? curr : prev;
    });

    const x = padding.left + (distanceToStop / maxDistance) * chartWidth;
    const y = padding.top + chartHeight - ((nearestPoint.elevation - minElevation) / elevationRange) * chartHeight;

    return { x, y, number: index + 1, elevation: nearestPoint.elevation };
  });

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '1rem',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    }}>
      <h3 style={{
        fontSize: '1rem',
        marginBottom: '1rem',
        color: '#1f2937',
        fontWeight: 600
      }}>
        Elevation Profile
      </h3>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Background grid */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke="#e5e7eb"
          strokeWidth="2"
        />

        {/* Elevation area fill */}
        <path
          d={`${pathData} L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`}
          fill="url(#elevationGradient)"
          opacity="0.3"
        />

        {/* Elevation line */}
        <path
          d={pathData}
          stroke="#3b82f6"
          strokeWidth="3"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Stop markers */}
        {stopMarkers.map((marker, index) => (
          <g key={index}>
            <circle
              cx={marker.x}
              cy={marker.y}
              r="6"
              fill="white"
              stroke="#3b82f6"
              strokeWidth="3"
            />
            <text
              x={marker.x}
              y={marker.y - 15}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#3b82f6"
            >
              {marker.number}
            </text>
          </g>
        ))}

        {/* Y-axis labels */}
        <text
          x={padding.left - 10}
          y={padding.top}
          textAnchor="end"
          fontSize="11"
          fill="#6b7280"
        >
          {Math.round(maxElevation)}m
        </text>
        <text
          x={padding.left - 10}
          y={padding.top + chartHeight}
          textAnchor="end"
          fontSize="11"
          fill="#6b7280"
        >
          {Math.round(minElevation)}m
        </text>

        {/* X-axis label */}
        <text
          x={padding.left + chartWidth / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize="12"
          fill="#6b7280"
        >
          Distance: {(maxDistance / 1000).toFixed(1)} km
        </text>

        {/* Gradient definition */}
        <defs>
          <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        marginTop: '1rem',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        <div>
          <strong style={{ color: '#1f2937' }}>Elevation Gain:</strong> {elevation.gain}m
        </div>
        <div>
          <strong style={{ color: '#1f2937' }}>Highest Point:</strong> {elevation.max}m
        </div>
        <div>
          <strong style={{ color: '#1f2937' }}>Lowest Point:</strong> {elevation.min}m
        </div>
        <div>
          <strong style={{ color: '#1f2937' }}>Total Climb:</strong> {maxElevation - minElevation}m
        </div>
      </div>
    </div>
  );
}
