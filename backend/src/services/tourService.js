import { geocodeLocation, searchPlaces, calculateOptimizedRoute } from './geoapifyService.js';
import { searchWikipedia, getWikipediaByCoordinates } from './wikipediaService.js';
import { enhancePlaceInfo, generateTourOverview, generateInterestingFacts } from './geminiService.js';
import { optimizeTourRoute, filterAndRankPlaces, estimateTourDuration } from '../utils/tourOptimizer.js';

/**
 * Main function to create a smart walking tour
 */
export async function createWalkingTour(searchQuery) {
  try {
    // Step 1: Geocode the location
    console.log('Geocoding location:', searchQuery);
    const location = await geocodeLocation(searchQuery);

    // Step 2: Search for places in the area
    console.log('Searching for places...');
    const places = await searchPlaces({
      text: searchQuery,
      center: { lat: location.lat, lon: location.lon },
      radius: 3000 // 3km radius
    });

    if (places.length === 0) {
      throw new Error('No places found for this search query');
    }

    console.log(`Found ${places.length} places`);

    // Step 3: Enhance each place with Wikipedia and AI-generated info
    console.log('Enhancing places with additional information...');
    const enhancedPlaces = await Promise.all(
      places.map(async (place) => {
        // Get Wikipedia info
        const wikiInfo = await getWikipediaByCoordinates(
          place.latitude,
          place.longitude,
          500
        );

        // If no nearby Wikipedia article, try searching by name
        const finalWikiInfo = wikiInfo || await searchWikipedia(place.name);

        // Generate AI-enhanced description
        const aiDescription = await enhancePlaceInfo(
          place.name,
          finalWikiInfo,
          place.properties
        );

        // Generate interesting facts
        const interestingFacts = finalWikiInfo
          ? await generateInterestingFacts(place.name, finalWikiInfo.extract)
          : null;

        return {
          ...place,
          wikiInfo: finalWikiInfo,
          aiDescription,
          interestingFacts
        };
      })
    );

    // Step 4: Filter and rank places
    const topPlaces = filterAndRankPlaces(enhancedPlaces, searchQuery, 8);

    // Step 5: Optimize the tour route
    console.log('Optimizing tour route...');
    const optimizedRoute = optimizeTourRoute(topPlaces, {
      lat: location.lat,
      lon: location.lon
    });

    // Step 6: Calculate actual walking route with Geoapify
    console.log('Calculating walking route...');
    let routeInfo = null;
    try {
      routeInfo = await calculateOptimizedRoute(optimizedRoute);
    } catch (error) {
      console.log('Could not calculate detailed route, using estimates');
    }

    // Step 7: Estimate tour duration
    const duration = estimateTourDuration(optimizedRoute);

    // Step 8: Generate tour overview with AI
    console.log('Generating tour overview...');
    const tourOverview = await generateTourOverview(optimizedRoute, searchQuery);

    // Step 9: Assemble the final tour
    const tour = {
      title: `Walking Tour: ${searchQuery}`,
      overview: tourOverview,
      location: {
        name: location.formatted,
        center: {
          lat: location.lat,
          lon: location.lon
        }
      },
      duration: duration,
      places: optimizedRoute.map((place, index) => ({
        order: index + 1,
        ...place
      })),
      route: routeInfo,
      metadata: {
        totalPlaces: optimizedRoute.length,
        estimatedDuration: `${Math.floor(duration.totalMinutes / 60)}h ${duration.totalMinutes % 60}m`,
        totalDistance: `${(duration.totalDistanceMeters / 1000).toFixed(1)} km`
      }
    };

    return tour;
  } catch (error) {
    console.error('Error creating walking tour:', error);
    throw error;
  }
}

/**
 * Get details for a specific place
 */
export async function getPlaceDetails(placeName, latitude, longitude) {
  try {
    // Get Wikipedia info
    let wikiInfo = null;
    if (latitude && longitude) {
      wikiInfo = await getWikipediaByCoordinates(latitude, longitude, 500);
    }

    if (!wikiInfo) {
      wikiInfo = await searchWikipedia(placeName);
    }

    // Generate AI-enhanced description
    const aiDescription = await enhancePlaceInfo(placeName, wikiInfo, null);

    // Generate interesting facts
    const interestingFacts = wikiInfo
      ? await generateInterestingFacts(placeName, wikiInfo.extract)
      : null;

    return {
      name: placeName,
      wikiInfo,
      aiDescription,
      interestingFacts
    };
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
}
