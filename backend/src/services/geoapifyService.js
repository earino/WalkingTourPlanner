import axios from 'axios';

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v2';
const GEOAPIFY_ROUTING_URL = 'https://api.geoapify.com/v1/routing';

/**
 * Search for places using Geoapify Places API
 */
export async function searchPlaces(query, limit = 100) {  // Increased from 20 to 100 for AI ranking
  try {
    // Build search parameters
    const params = {
      filter: `circle:${query.center.lon},${query.center.lat},${query.radius || 5000}`,
      limit: limit,
      apiKey: GEOAPIFY_API_KEY
    };

    // Add text search if provided
    if (query.text) {
      params.text = query.text;
    }

    // Use AI-generated Geoapify category if available, otherwise use fallback mapping
    let categories;
    if (query.geoapifyCategory) {
      // Use the category from AI parsing (e.g., "catering.restaurant.tapas,catering.bar")
      categories = query.geoapifyCategory;
      console.log('Using AI-generated category:', categories);
    } else {
      // Fallback category mapping for when AI parsing fails
      const categoryMap = {
        'tapas bars': 'catering.restaurant.tapas,catering.bar',
        'restaurants': 'catering.restaurant',
        'bars': 'catering.bar,catering.pub',
        'museums': 'entertainment.museum',
        'churches': 'religion.place_of_worship.christianity',
        'temples': 'religion.place_of_worship.buddhism',
        'mosques': 'religion.place_of_worship.islam',
        'historic sites': 'tourism.sights,heritage',
        'parks': 'leisure.park',
        'viewpoints': 'tourism.attraction.viewpoint',
        'markets': 'commercial.marketplace',
        'shopping': 'commercial.shopping_mall'
      };
      categories = categoryMap[query.placeType?.toLowerCase()] || 'tourism.attraction,tourism.sights';
      console.log('Using fallback category mapping:', categories);
    }

    params.categories = categories;

    console.log('Geoapify search params:', params);

    const response = await axios.get(`${GEOAPIFY_BASE_URL}/places`, { params });

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
    console.log(`Geocoding location: "${locationString}"`);

    const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: {
        text: locationString,
        limit: 5, // Get top 5 results to be safer
        apiKey: GEOAPIFY_API_KEY
      }
    });

    if (response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      console.log(`Geocoded to: ${feature.properties.formatted} (${feature.geometry.coordinates[1]}, ${feature.geometry.coordinates[0]})`);
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
    // Format waypoints for the routing API (latitude,longitude format)
    const waypointsParam = waypoints
      .map(wp => `${wp.latitude},${wp.longitude}`)
      .join('|');

    const response = await axios.get(`${GEOAPIFY_ROUTING_URL}`, {
      params: {
        waypoints: waypointsParam,
        mode: 'walk',
        details: 'elevation',  // Request elevation data
        apiKey: GEOAPIFY_API_KEY
      }
    });

    if (response.data.features && response.data.features.length > 0) {
      const route = response.data.features[0];

      // Calculate total elevation gain from all legs
      let totalElevationGain = 0;
      let maxElevation = 0;
      let minElevation = Infinity;

      if (route.properties.legs) {
        route.properties.legs.forEach(leg => {
          leg.steps?.forEach(step => {
            if (step.elevation_gain) totalElevationGain += step.elevation_gain;
            if (step.max_elevation) maxElevation = Math.max(maxElevation, step.max_elevation);
            if (step.min_elevation) minElevation = Math.min(minElevation, step.min_elevation);
          });
        });
      }

      return {
        distance: route.properties.distance, // in meters
        time: route.properties.time, // in seconds
        geometry: route.geometry,
        legs: route.properties.legs,
        elevation: {
          gain: Math.round(totalElevationGain),
          max: Math.round(maxElevation),
          min: minElevation === Infinity ? 0 : Math.round(minElevation)
        }
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
