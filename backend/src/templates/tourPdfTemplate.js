/**
 * Generate HTML template for PDF tour guide
 */
export function generatePdfHtml(tour, images) {
  const { title, overview, metadata, places, route } = tour;
  const { fullMapUrl, elevationChartUrl, tourQRCode, segmentMaps, segmentQRCodes } = images;

  const formatDistance = (meters) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getDirectionIcon = (type) => {
    const icons = {
      'turn-right': '↗',
      'turn-left': '↖',
      'turn-slight-right': '↗',
      'turn-slight-left': '↖',
      'turn-sharp-right': '⤴',
      'turn-sharp-left': '⤵',
      'continue': '↑',
      'straight': '↑',
      'uturn': '↶',
      'arrive': '●',
      'depart': '○'
    };
    return icons[type] || '→';
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 1.5cm;
    }

    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
    }

    .page {
      page-break-after: always;
      padding: 1cm 0;
    }

    .page:last-child {
      page-break-after: auto;
    }

    /* Cover Page */
    .cover {
      text-align: center;
      padding-top: 3cm;
    }

    .cover h1 {
      font-size: 28pt;
      margin-bottom: 1cm;
      color: #1a1a1a;
      font-weight: bold;
    }

    .cover .overview {
      font-size: 13pt;
      margin: 2cm 3cm;
      line-height: 1.8;
      color: #333;
    }

    .cover .stats {
      margin: 2cm 0;
      display: flex;
      justify-content: center;
      gap: 2cm;
    }

    .cover .stat {
      text-align: center;
    }

    .cover .stat-value {
      font-size: 20pt;
      font-weight: bold;
      color: #000;
      display: block;
    }

    .cover .stat-label {
      font-size: 10pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 0.3cm;
      display: block;
    }

    .cover .qr-section {
      margin-top: 3cm;
    }

    .cover .qr-code {
      width: 4cm;
      height: 4cm;
      margin: 0 auto;
    }

    .cover .qr-label {
      margin-top: 0.5cm;
      font-size: 9pt;
      color: #666;
    }

    /* Route Overview Page */
    .route-overview h2 {
      font-size: 18pt;
      margin-bottom: 0.8cm;
      color: #000;
      border-bottom: 2pt solid #000;
      padding-bottom: 0.3cm;
    }

    .full-map {
      width: 100%;
      max-height: 12cm;
      margin: 1cm 0;
      border: 1pt solid #ccc;
    }

    .elevation-chart {
      width: 100%;
      max-height: 6cm;
      margin: 1cm 0;
      border: 1pt solid #ccc;
    }

    .stops-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1cm 0;
      font-size: 10pt;
    }

    .stops-table th {
      background: #f0f0f0;
      padding: 0.3cm;
      text-align: left;
      border: 1pt solid #ccc;
      font-weight: bold;
    }

    .stops-table td {
      padding: 0.3cm;
      border: 1pt solid #ccc;
    }

    /* Stop Detail Pages */
    .stop-page h2 {
      font-size: 16pt;
      margin-bottom: 0.3cm;
      color: #000;
    }

    .stop-page .stop-number {
      display: inline-block;
      background: #000;
      color: #fff;
      width: 1.2cm;
      height: 1.2cm;
      line-height: 1.2cm;
      text-align: center;
      border-radius: 50%;
      margin-right: 0.5cm;
      font-size: 14pt;
      font-weight: bold;
    }

    .stop-description {
      margin: 0.5cm 0 1cm 0;
      line-height: 1.6;
      color: #333;
    }

    .walking-section {
      margin-top: 1cm;
      padding: 0.5cm;
      background: #f9f9f9;
      border: 1pt solid #ddd;
      border-radius: 4pt;
    }

    .walking-header {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 0.5cm;
      color: #000;
    }

    .walking-stats {
      display: flex;
      gap: 1cm;
      margin-bottom: 0.5cm;
      font-size: 10pt;
      color: #666;
    }

    .segment-map {
      width: 100%;
      max-height: 8cm;
      margin: 0.5cm 0;
      border: 1pt solid #ccc;
    }

    .directions-list {
      list-style: none;
      padding: 0;
      margin: 0.5cm 0;
    }

    .direction-step {
      padding: 0.3cm 0;
      border-bottom: 1pt dotted #ddd;
      display: flex;
      gap: 0.3cm;
    }

    .direction-step:last-child {
      border-bottom: none;
    }

    .direction-icon {
      font-size: 12pt;
      width: 0.8cm;
      flex-shrink: 0;
    }

    .direction-text {
      flex: 1;
      font-size: 10pt;
    }

    .direction-distance {
      color: #666;
      font-size: 9pt;
      margin-top: 0.1cm;
    }

    .qr-code-small {
      width: 3cm;
      height: 3cm;
      float: right;
      margin-left: 0.5cm;
    }

    .qr-caption {
      font-size: 8pt;
      color: #666;
      text-align: center;
      margin-top: 0.2cm;
    }

    /* Footer */
    .footer {
      position: fixed;
      bottom: 0.5cm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 8pt;
      color: #999;
    }

    .page-number:after {
      counter-increment: page;
      content: counter(page);
    }

    /* Print optimizations */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="page cover">
    <h1>${title}</h1>
    <div class="overview">${overview}</div>

    <div class="stats">
      <div class="stat">
        <span class="stat-value">${metadata.totalPlaces}</span>
        <span class="stat-label">Stops</span>
      </div>
      <div class="stat">
        <span class="stat-value">${metadata.totalDistance}</span>
        <span class="stat-label">Distance</span>
      </div>
      <div class="stat">
        <span class="stat-value">${metadata.estimatedDuration}</span>
        <span class="stat-label">Duration</span>
      </div>
      ${metadata.elevationGain > 0 ? `
      <div class="stat">
        <span class="stat-value">${metadata.elevationGain}m</span>
        <span class="stat-label">Elevation</span>
      </div>
      ` : ''}
    </div>

    ${tourQRCode ? `
    <div class="qr-section">
      <img src="${tourQRCode}" alt="Tour QR Code" class="qr-code" />
      <div class="qr-label">Scan for live navigation</div>
    </div>
    ` : ''}

    <div style="position: absolute; bottom: 1cm; left: 0; right: 0; text-align: center; font-size: 9pt; color: #999;">
      Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>

  <!-- ROUTE OVERVIEW PAGE -->
  <div class="page route-overview">
    <h2>Route Overview</h2>

    ${fullMapUrl ? `
      <img src="${fullMapUrl}" alt="Full Route Map" class="full-map" />
    ` : ''}

    ${elevationChartUrl ? `
      <img src="${elevationChartUrl}" alt="Elevation Profile" class="elevation-chart" />
    ` : ''}

    <table class="stops-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Stop</th>
          <th>Address</th>
        </tr>
      </thead>
      <tbody>
        ${places.map((place, index) => `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${place.name}</strong></td>
            <td>${place.address || place.formatted || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- STOP DETAIL PAGES -->
  ${places.map((place, index) => {
    const leg = route?.legs?.[index];
    const nextPlace = places[index + 1];
    const segmentMap = segmentMaps?.[index];
    const qrCode = segmentQRCodes?.[index];

    return `
  <div class="page stop-page">
    <h2>
      <span class="stop-number">${index + 1}</span>
      ${place.name}
    </h2>

    <div class="stop-description">
      ${place.aiDescription || place.description || `Stop ${index + 1} on your walking tour.`}
    </div>

    ${place.address || place.formatted ? `
      <p style="font-size: 10pt; color: #666; margin-bottom: 0.5cm;">
        📍 ${place.address || place.formatted}
      </p>
    ` : ''}

    ${leg && nextPlace ? `
    <div class="walking-section">
      ${qrCode ? `
        <div>
          <img src="${qrCode}" alt="Navigation QR" class="qr-code-small" />
          <div class="qr-caption">Scan for<br/>live directions</div>
        </div>
      ` : ''}

      <div class="walking-header">🚶 Walking to: ${nextPlace.name}</div>

      <div class="walking-stats">
        <span><strong>Distance:</strong> ${formatDistance(leg.distance)}</span>
        <span><strong>Time:</strong> ${formatDuration(leg.duration)}</span>
      </div>

      ${segmentMap ? `
        <img src="${segmentMap}" alt="Route Segment" class="segment-map" />
      ` : ''}

      ${leg.directions && leg.directions.length > 0 ? `
        <h3 style="font-size: 11pt; margin-top: 0.5cm; margin-bottom: 0.3cm;">Turn-by-Turn Directions</h3>
        <ol class="directions-list">
          ${leg.directions.map((dir, dirIndex) => `
            <li class="direction-step">
              <span class="direction-icon">${getDirectionIcon(dir.type)}</span>
              <div class="direction-text">
                ${dir.instruction}
                ${dir.streetName ? `<br/><em style="color: #666;">on ${dir.streetName}</em>` : ''}
                <div class="direction-distance">${formatDistance(dir.distance)}</div>
              </div>
            </li>
          `).join('')}
        </ol>
      ` : ''}
    </div>
    ` : index === places.length - 1 ? `
    <div style="margin-top: 2cm; padding: 1cm; background: #f0f0f0; text-align: center; border-radius: 4pt;">
      <strong style="font-size: 14pt;">🎉 End of Tour</strong>
      <p style="margin-top: 0.5cm; color: #666;">You've reached your final destination!</p>
    </div>
    ` : ''}
  </div>
    `;
  }).join('')}

  <!-- BACK COVER -->
  <div class="page">
    <h2 style="font-size: 18pt; margin-bottom: 1cm;">Walking Tour Tips</h2>

    <ul style="line-height: 2; font-size: 11pt; margin-left: 1cm;">
      <li>Wear comfortable walking shoes</li>
      <li>Bring water and snacks</li>
      <li>Check weather conditions before you go</li>
      <li>Take your time at each stop to fully appreciate it</li>
      <li>Scan QR codes for live navigation on your phone</li>
      <li>Share your experience using #WalkingTourPlanner</li>
    </ul>

    <div style="margin-top: 3cm; padding: 1cm; background: #f9f9f9; border: 1pt solid #ddd; font-size: 9pt; color: #666;">
      <strong style="display: block; margin-bottom: 0.5cm; color: #000;">Credits & Data Sources</strong>
      <p>Maps and routing powered by <strong>Geoapify</strong></p>
      <p>Place descriptions generated by <strong>AI</strong> via OpenRouter</p>
      <p>Tour planning by <strong>Walking Tour Planner</strong></p>
      <p style="margin-top: 0.5cm;">
        Generated: ${new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
  </div>

</body>
</html>
  `.trim();
}
