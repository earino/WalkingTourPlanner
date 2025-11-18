import { geocodeLocation, searchPlaces, calculateOptimizedRoute } from './geoapifyService.js';
import { parseSearchQuery, rankPlacesByRelevance, generateTourNarrative } from './geminiService.js';
import { optimizeTourRoute, filterAndRankPlaces, estimateTourDuration } from '../utils/tourOptimizer.js';
import { deduplicatePlaces } from '../utils/deduplication.js';

/**
 * Main function to create a smart walking tour
 */
export async function createWalkingTour(searchQuery, maxStops = 7, progressCallback = null, aiModel = 'google/gemini-2.5-flash') {
  // Helper to send progress updates
  const sendProgress = (stage, message, data = {}) => {
    if (progressCallback) progressCallback(stage, message, data);
  };

  // Track which AI services are working
  const serviceStatus = {
    geminiQueryParsing: false,
    geminiDescriptions: 0
  };

  try {
    // ========================================================================
    // PHASE 1: CANDIDATE GATHERING (Goal: 30-100 candidates)
    // ========================================================================

    // Step 1: Parse the search query into structured data using Gemini
    sendProgress('parsing', 'Analyzing your search query...');
    console.log('\n🔍 PHASE 1: CANDIDATE GATHERING');
    console.log('━'.repeat(60));
    console.log('User query:', searchQuery);

    const parsedQuery = await parseSearchQuery(searchQuery, aiModel);

    console.log('\n📋 AI Parse Result:');
    console.log('  Location:', parsedQuery.location);
    console.log('  Place Type:', parsedQuery.placeType);
    console.log('  Categories:', parsedQuery.geoapifyCategory);
    console.log('  Keywords:', parsedQuery.keywords.join(', '));
    console.log('  Radius:', parsedQuery.radius + 'm');
    console.log('  Confidence:', parsedQuery.confidence);

    // Check if Gemini parsing worked (would have extra keywords if it did)
    if (parsedQuery.keywords.length > 1 || parsedQuery.location !== searchQuery) {
      serviceStatus.geminiQueryParsing = true;
    }

    // Step 2: Geocode the extracted location
    sendProgress('geocoding', `Finding ${parsedQuery.location}...`);
    console.log('\n📍 Geocoding:', parsedQuery.location);
    const location = await geocodeLocation(parsedQuery.location);
    console.log('  Coordinates:', `${location.lat}, ${location.lon}`);
    console.log('  Formatted:', location.formatted);

    // Step 3: Search for places in the area using the parsed information
    sendProgress('searching', 'Searching for places nearby...');
    console.log('\n🔎 Geoapify Search:');
    const searchText = parsedQuery.keywords.join(' ');
    console.log('  Text:', searchText);
    console.log('  Categories:', parsedQuery.geoapifyCategory);
    console.log('  Radius:', parsedQuery.radius + 'm');

    const places = await searchPlaces({
      text: searchText,
      placeType: parsedQuery.placeType,
      geoapifyCategory: parsedQuery.geoapifyCategory,  // Use AI-generated category
      center: { lat: location.lat, lon: location.lon },
      radius: parsedQuery.radius
    });

    if (places.length === 0) {
      throw new Error('No places found for this search query');
    }

    console.log('\n✅ PHASE 1 COMPLETE:');
    console.log(`  Found ${places.length} candidates`);
    console.log(`  Target: 30-100 candidates`);
    console.log(`  Status: ${places.length >= 30 && places.length <= 100 ? '✓ GOOD' : places.length < 30 ? '⚠️  TOO FEW' : '⚠️  TOO MANY'}`);

    // Deduplicate places before AI ranking
    const uniquePlaces = deduplicatePlaces(places, {
      nameSimilarityThreshold: 0.85,  // 85% similar = duplicate
      proximityThresholdMeters: 100,  // Within 100m
      requireBothConditions: false    // Either similar name OR close proximity
    });

    sendProgress('found', `Found ${uniquePlaces.length} unique places (${places.length - uniquePlaces.length} duplicates removed)`);

    // ========================================================================
    // PHASE 2: AI RANKING (Goal: Select best N from unique candidates)
    // ========================================================================
    sendProgress('ranking', `AI selecting top ${maxStops} from ${uniquePlaces.length} places...`);
    console.log('\n🤖 PHASE 2: AI RANKING');
    console.log('━'.repeat(60));
    console.log(`  Input: ${uniquePlaces.length} unique candidates`);
    console.log(`  Requested: Top ${maxStops} places`);
    console.log(`  Query: "${searchQuery}"`);

    const selectedPlaces = await rankPlacesByRelevance(searchQuery, uniquePlaces, maxStops, aiModel);

    console.log('\n✅ PHASE 2 COMPLETE:');
    console.log(`  Selected: ${selectedPlaces.length} places`);
    console.log(`  Status: ${selectedPlaces.length === maxStops ? '✓ GOOD' : selectedPlaces.length < maxStops ? '⚠️  TOO FEW' : '⚠️  TOO MANY'}`);
    if (selectedPlaces.length > 0) {
      console.log(`  Top pick: ${selectedPlaces[0].name} (score: ${selectedPlaces[0].aiScore})`);
      console.log(`  Sample: ${selectedPlaces.slice(0, 3).map(p => p.name).join(', ')}`);
    }

    // Step 4: Optimize walking route (TSP) before generating narrative
    sendProgress('optimizing', 'Optimizing walking route with TSP...');
    console.log('Optimizing tour route with TSP...');
    const optimizedRoute = optimizeTourRoute(selectedPlaces, {
      lat: location.lat,
      lon: location.lon
    });

    // Step 6: Calculate actual walking route with Geoapify
    sendProgress('routing', 'Calculating turn-by-turn directions...');
    console.log('\n🗺️  CALCULATING WALKING ROUTE:');
    let routeInfo = null;
    try {
      routeInfo = await calculateOptimizedRoute(optimizedRoute);
      console.log('✅ Route calculated successfully!');
      console.log('  Actual distance:', routeInfo.distance, 'm');
      console.log('  Actual time:', Math.round(routeInfo.time / 60), 'min');
      console.log('  Geometry type:', routeInfo.geometry.type);
      console.log('  Number of legs:', routeInfo.legs?.length || 0);
      if (routeInfo.elevation) {
        console.log('  Elevation gain:', routeInfo.elevation.gain, 'm ⬆️');
        console.log('  Max elevation:', routeInfo.elevation.max, 'm');
        console.log('  Min elevation:', routeInfo.elevation.min, 'm');
      }
    } catch (error) {
      console.log('❌ Routing failed:', error.message);
      console.log('  Falling back to straight-line estimates');
    }

    // Step 5: Calculate tour duration - use actual route if available, otherwise estimate
    let duration;
    if (routeInfo && routeInfo.distance && routeInfo.time) {
      // Use actual route data
      const walkingMinutes = Math.round(routeInfo.time / 60);
      const viewingMinutes = optimizedRoute.length * 20; // 20 min per stop
      duration = {
        totalDistanceMeters: routeInfo.distance,
        totalMinutes: walkingMinutes + viewingMinutes,
        walkingMinutes: walkingMinutes,
        viewingMinutes: viewingMinutes
      };
      console.log('  Using ACTUAL route data for duration calculation');
    } else {
      // Fallback to estimates
      duration = estimateTourDuration(optimizedRoute);
      console.log('  Using ESTIMATED duration (no route data)');
    }

    // ========================================================================
    // PHASE 3: AI ENHANCEMENT (Goal: Rich descriptions for selected places)
    // ========================================================================
    sendProgress('narrative', 'Creating cohesive tour narrative with AI...');
    console.log('\n✨ PHASE 3: AI ENHANCEMENT');
    console.log('━'.repeat(60));
    console.log(`  Input: ${optimizedRoute.length} places (post-optimization)`);
    console.log(`  Tour distance: ${(duration.totalDistanceMeters / 1000).toFixed(1)} km`);
    console.log(`  Tour duration: ${Math.floor(duration.totalMinutes / 60)}h ${duration.totalMinutes % 60}m`);

    const narrative = await generateTourNarrative(
      searchQuery,
      optimizedRoute,
      `${(duration.totalDistanceMeters / 1000).toFixed(1)} km`,
      `${Math.floor(duration.totalMinutes / 60)}h ${duration.totalMinutes % 60}m`,
      aiModel
    );

    console.log('\n✅ PHASE 3 COMPLETE:');
    console.log(`  Generated narrative for ${narrative.places?.length || 0} places`);
    console.log(`  Tour intro: ${narrative.tourIntro?.substring(0, 80)}...`);

    // Step 7: Map narrative back to places
    const narrativePlaces = optimizedRoute.map((place, index) => {
      const narrativePlace = narrative.places?.[index] || {};
      return {
        order: index + 1,
        ...place,
        aiDescription: narrativePlace.description || `Stop ${index + 1}: ${place.name}`,
        transition: narrativePlace.transition || null
      };
    });

    // Step 8: Assemble the final tour
    const tour = {
      title: `Walking Tour: ${searchQuery}`,
      overview: narrative.tourIntro || 'Explore the highlights of this area on a carefully curated walking tour.',
      location: {
        name: location.formatted,
        center: {
          lat: location.lat,
          lon: location.lon
        }
      },
      duration: duration,
      places: narrativePlaces,
      route: routeInfo,
      metadata: {
        totalPlaces: optimizedRoute.length,
        estimatedDuration: `${Math.floor(duration.totalMinutes / 60)}h ${duration.totalMinutes % 60}m`,
        totalDistance: `${(duration.totalDistanceMeters / 1000).toFixed(1)} km`,
        elevationGain: routeInfo?.elevation?.gain || null,
        maxElevation: routeInfo?.elevation?.max || null,
        minElevation: routeInfo?.elevation?.min || null
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
