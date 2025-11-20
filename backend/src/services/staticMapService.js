import axios from 'axios';

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const GEOAPIFY_STATIC_MAP_URL = 'https://maps.geoapify.com/v1/staticmap';

/**
 * Generate a static map image URL for the full tour route
 */
export function generateFullRouteMapUrl(places, route, options = {}) {
  const {
    width = 800,
    height = 600,
    style = 'osm-bright',
    scaleFactor = 2 // for retina displays
  } = options;

  // Create markers for each place
  const markers = places.map((place, index) => {
    const markerColor = index === 0 ? '28a745' : index === places.length - 1 ? 'dc3545' : '007bff';
    const label = index + 1;
    return `lonlat:${place.longitude},${place.latitude};color:%23${markerColor};size:large;text:${label}`;
  }).join('|');

  // Get route geometry if available
  let geometry = '';
  if (route && route.geometry && route.geometry.coordinates) {
    // Encode the route geometry (simplified for URL length)
    const coords = route.geometry.coordinates;
    if (coords.length > 0) {
      geometry = `&geometry=linestring:${encodeURIComponent(JSON.stringify(coords))};linecolor:%233b82f6;linewidth:4`;
    }
  }

  return `${GEOAPIFY_STATIC_MAP_URL}?style=${style}&width=${width}&height=${height}&scaleFactor=${scaleFactor}&marker=${encodeURIComponent(markers)}${geometry}&apiKey=${GEOAPIFY_API_KEY}`;
}

/**
 * Generate a static map image URL for a single route segment (leg)
 */
export function generateSegmentMapUrl(fromPlace, toPlace, leg, options = {}) {
  const {
    width = 400,
    height = 300,
    style = 'osm-bright',
    scaleFactor = 2
  } = options;

  // Start and end markers
  const markers = [
    `lonlat:${fromPlace.longitude},${fromPlace.latitude};color:%2328a745;size:medium;text:A`,
    `lonlat:${toPlace.longitude},${toPlace.latitude};color:%23dc3545;size:medium;text:B`
  ].join('|');

  // Get leg geometry if available
  let geometry = '';
  if (leg && leg.geometry && leg.geometry.coordinates) {
    const coords = leg.geometry.coordinates;
    if (coords.length > 0) {
      geometry = `&geometry=linestring:${encodeURIComponent(JSON.stringify(coords))};linecolor:%233b82f6;linewidth:4`;
    }
  }

  return `${GEOAPIFY_STATIC_MAP_URL}?style=${style}&width=${width}&height=${height}&scaleFactor=${scaleFactor}&marker=${encodeURIComponent(markers)}${geometry}&apiKey=${GEOAPIFY_API_KEY}`;
}

/**
 * Download static map image as base64 (for embedding in PDF)
 */
export async function fetchStaticMapAsBase64(mapUrl) {
  try {
    const response = await axios.get(mapUrl, {
      responseType: 'arraybuffer'
    });

    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Error fetching static map:', error.message);
    return null;
  }
}

/**
 * Generate elevation profile chart as static image URL
 * Uses Chart.js via QuickChart.io API (free service)
 */
export function generateElevationChartUrl(route, places, options = {}) {
  const {
    width = 800,
    height = 200
  } = options;

  // Extract elevation data from route legs
  const elevationData = [];
  const labels = [];

  if (route && route.rawLegs) {
    let cumulativeDistance = 0;

    route.rawLegs.forEach((leg, legIndex) => {
      if (leg.steps) {
        leg.steps.forEach((step) => {
          if (step.min_elevation !== undefined) {
            elevationData.push(Math.round(step.min_elevation));
            labels.push(`${(cumulativeDistance / 1000).toFixed(1)}km`);
            cumulativeDistance += step.distance || 0;
          }
        });
      }
    });
  }

  // If no elevation data, return null
  if (elevationData.length === 0) {
    return null;
  }

  // Create Chart.js configuration
  const chartConfig = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Elevation (m)',
        data: elevationData,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        tension: 0.4
      }]
    },
    options: {
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Elevation Profile',
          font: {
            size: 16
          }
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'Elevation (m)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Distance'
          },
          ticks: {
            maxTicksLimit: 10
          }
        }
      }
    }
  };

  // Use QuickChart.io to generate chart image
  const chartUrl = `https://quickchart.io/chart?width=${width}&height=${height}&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;

  return chartUrl;
}
