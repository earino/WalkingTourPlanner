import axios from 'axios';

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v2';
const GEOAPIFY_ROUTING_URL = 'https://api.geoapify.com/v1/routing';

/**
 * Search for places using Geoapify Places API
 */
export async function searchPlaces(query, limit = 20) {
  try {
    const response = await axios.get(`${GEOAPIFY_BASE_URL}/places`, {
      params: {
        categories: 'tourism',
        filter: `circle:${query.center.lon},${query.center.lat},${query.radius || 5000}`,
        text: query.text,
        limit: limit,
        apiKey: GEOAPIFY_API_KEY
      }
    });

    return response.data.features.map(feature => ({
      id: feature.properties.place_id,
      name: feature.properties.name || feature.properties.formatted,
      category: feature.properties.categories?.[0] || 'tourism',
      address: feature.properties.formatted,
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      properties: feature.properties
    }));
  } catch (error) {
    console.error('Error searching places:', error.message);
    throw new Error('Failed to search places');
  }
}

/**
 * Geocode a location string to get coordinates
 */
export async function geocodeLocation(locationString) {
  try {
    const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: {
        text: locationString,
        limit: 1,
        apiKey: GEOAPIFY_API_KEY
      }
    });

    if (response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      return {
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        formatted: feature.properties.formatted,
        bbox: feature.properties.bbox
      };
    }

    throw new Error('Location not found');
  } catch (error) {
    console.error('Error geocoding location:', error.message);
    throw new Error('Failed to geocode location');
  }
}

/**
 * Calculate optimized route through multiple waypoints
 */
export async function calculateOptimizedRoute(waypoints) {
  try {
    // Format waypoints for the routing API
    const waypointsParam = waypoints
      .map(wp => `${wp.longitude},${wp.latitude}`)
      .join('|');

    const response = await axios.get(`${GEOAPIFY_ROUTING_URL}`, {
      params: {
        waypoints: waypointsParam,
        mode: 'walk',
        apiKey: GEOAPIFY_API_KEY
      }
    });

    if (response.data.features && response.data.features.length > 0) {
      const route = response.data.features[0];
      return {
        distance: route.properties.distance, // in meters
        time: route.properties.time, // in seconds
        geometry: route.geometry,
        legs: route.properties.legs
      };
    }

    throw new Error('No route found');
  } catch (error) {
    console.error('Error calculating route:', error.message);
    throw new Error('Failed to calculate route');
  }
}

/**
 * Get distance matrix between multiple points (for optimization)
 */
export async function getDistanceMatrix(points) {
  try {
    const distances = [];

    // Calculate pairwise distances
    for (let i = 0; i < points.length; i++) {
      distances[i] = [];
      for (let j = 0; j < points.length; j++) {
        if (i === j) {
          distances[i][j] = 0;
        } else {
          // Simple Haversine distance calculation
          const R = 6371e3; // Earth radius in meters
          const φ1 = points[i].latitude * Math.PI / 180;
          const φ2 = points[j].latitude * Math.PI / 180;
          const Δφ = (points[j].latitude - points[i].latitude) * Math.PI / 180;
          const Δλ = (points[j].longitude - points[i].longitude) * Math.PI / 180;

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

          distances[i][j] = R * c;
        }
      }
    }

    return distances;
  } catch (error) {
    console.error('Error calculating distance matrix:', error.message);
    throw error;
  }
}
