/**
 * Optimize tour route using 2-opt algorithm for TSP
 * Finds mathematically optimal (or near-optimal) route minimizing total distance
 * Tries all places as potential starting points to find best linear path
 */
export function optimizeTourRoute(places, startLocation = null) {
  if (places.length === 0) return [];
  if (places.length === 1) return places;
  if (places.length === 2) return places;

  let bestRoute = null;
  let bestDistance = Infinity;

  // Try each place as a potential starting point
  for (let startIdx = 0; startIdx < places.length; startIdx++) {
    const startPlace = places[startIdx];
    const startPos = { lat: startPlace.latitude, lon: startPlace.longitude };

    // Build route starting from this place
    let route = greedyRoute(places, startPos);

    // Improve with 2-opt algorithm
    route = twoOptImprove(route);

    const distance = calculateRouteDistance(route);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestRoute = route;
    }
  }

  console.log(`TSP optimization: Best route distance: ${Math.round(bestDistance)}m, starting at ${bestRoute[0].name}`);
  return bestRoute;
}

/**
 * Improve route with 2-opt algorithm
 */
function twoOptImprove(route) {
  let improved = true;
  let iterations = 0;
  const maxIterations = 100;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 2; j < route.length; j++) {
        const newRoute = twoOptSwap(route, i, j);
        const currentDist = calculateRouteDistance(route);
        const newDist = calculateRouteDistance(newRoute);

        if (newDist < currentDist) {
          route = newRoute;
          improved = true;
        }
      }
    }
  }

  return route;
}

/**
 * Greedy nearest-neighbor initial route
 */
function greedyRoute(places, startLocation) {
  const visited = new Set();
  const route = [];
  let current = startLocation || getCentroid(places);

  while (visited.size < places.length) {
    let nearest = null;
    let minDistance = Infinity;

    for (const place of places) {
      if (!visited.has(place.id)) {
        const distance = calculateDistance(current, {
          lat: place.latitude,
          lon: place.longitude
        });

        if (distance < minDistance) {
          minDistance = distance;
          nearest = place;
        }
      }
    }

    if (nearest) {
      route.push(nearest);
      visited.add(nearest.id);
      current = { lat: nearest.latitude, lon: nearest.longitude };
    }
  }

  return route;
}

/**
 * 2-opt swap: reverse segment between i and j
 */
function twoOptSwap(route, i, j) {
  const newRoute = route.slice(0, i + 1);
  const reversed = route.slice(i + 1, j + 1).reverse();
  const remaining = route.slice(j + 1);
  return [...newRoute, ...reversed, ...remaining];
}

/**
 * Calculate total distance of a route
 */
function calculateRouteDistance(route) {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += calculateDistance(
      { lat: route[i].latitude, lon: route[i].longitude },
      { lat: route[i + 1].latitude, lon: route[i + 1].longitude }
    );
  }
  return total;
}

/**
 * Calculate centroid of places (center point)
 */
function getCentroid(places) {
  const sumLat = places.reduce((sum, p) => sum + p.latitude, 0);
  const sumLon = places.reduce((sum, p) => sum + p.longitude, 0);

  return {
    lat: sumLat / places.length,
    lon: sumLon / places.length
  };
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(point1, point2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lon - point1.lon) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

/**
 * Filter and rank places based on relevance
 */
export function filterAndRankPlaces(places, query, maxPlaces = 10) {
  // Score places based on name match and category
  const scored = places.map(place => {
    let score = 0;

    // Exact name match gets highest score
    if (place.name.toLowerCase().includes(query.toLowerCase())) {
      score += 10;
    }

    // Category match
    if (place.category && place.category.includes('tourism')) {
      score += 5;
    }

    // Has Wikipedia info
    if (place.wikiInfo) {
      score += 3;
    }

    return { ...place, score };
  });

  // Sort by score and take top results
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPlaces);
}

/**
 * Estimate tour duration based on walking speed and visit time
 */
export function estimateTourDuration(route, walkingSpeedKmh = 4, visitTimeMinutes = 15) {
  let totalDistance = 0;

  // Calculate total walking distance
  for (let i = 0; i < route.length - 1; i++) {
    const distance = calculateDistance(
      { lat: route[i].latitude, lon: route[i].longitude },
      { lat: route[i + 1].latitude, lon: route[i + 1].longitude }
    );
    totalDistance += distance;
  }

  // Walking time in minutes
  const walkingTimeMinutes = (totalDistance / 1000) / walkingSpeedKmh * 60;

  // Total visit time
  const visitTime = route.length * visitTimeMinutes;

  // Total time
  const totalMinutes = walkingTimeMinutes + visitTime;

  return {
    totalMinutes: Math.round(totalMinutes),
    walkingMinutes: Math.round(walkingTimeMinutes),
    visitMinutes: visitTime,
    totalDistanceMeters: Math.round(totalDistance)
  };
}
