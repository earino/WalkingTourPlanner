import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { optimizeTourRoute, estimateTourDuration } from '../src/utils/tourOptimizer.js';
import { calculateOptimizedRoute } from '../src/services/geoapifyService.js';
import { generateTourNarrative } from '../src/services/geminiService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../data/temples-in-moat.json');
const OUTPUT_FILE = path.join(__dirname, '../data/temple-tour.json');

console.log('<� Chiang Mai Temple Tour Generator\n');
console.log('P'.repeat(60));

// Load temples in moat
const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
const temples = data.templesInMoat;

console.log(`\nLoaded ${temples.length} temples within Old Town moat`);
console.log('\nStep 1: Preparing temple data...');

// Convert to format expected by tour optimizer
const places = temples.map((temple, index) => ({
  id: `temple-${index}`,
  name: temple.name,
  latitude: temple.latitude,
  longitude: temple.longitude,
  address: temple.formatted,
  category: 'religion.place_of_worship.buddhism',
  properties: {
    geocoded: temple.geocodedAt,
    withinMoat: temple.withinMoat
  }
}));

console.log(`   Prepared ${places.length} temples for optimization`);

console.log('\nStep 2: Optimizing route with TSP algorithm...');
console.log(`  This will try different starting points to minimize walking distance`);

// Find the optimal route using TSP
const optimizedRoute = optimizeTourRoute(places);

console.log(`   Optimized route found!`);
console.log(`    Starting temple: ${optimizedRoute[0].name}`);
console.log(`    Ending temple: ${optimizedRoute[optimizedRoute.length - 1].name}`);

console.log('\nStep 3: Calculating actual walking route...');

let routeInfo = null;
try {
  routeInfo = await calculateOptimizedRoute(optimizedRoute);
  console.log('   Walking route calculated!');
  console.log(`    Total distance: ${(routeInfo.distance / 1000).toFixed(2)} km`);
  console.log(`    Walking time: ${Math.round(routeInfo.time / 60)} minutes`);
  if (routeInfo.elevation) {
    console.log(`    Elevation gain: ${routeInfo.elevation.gain}m`);
  }
} catch (error) {
  console.log(`  �  Routing failed: ${error.message}`);
  console.log('     Using estimated distances instead');
}

console.log('\nStep 4: Calculating tour statistics...');

// Calculate duration
let duration;
if (routeInfo && routeInfo.distance && routeInfo.time) {
  const walkingMinutes = Math.round(routeInfo.time / 60);
  const viewingMinutes = optimizedRoute.length * 20; // 20 min per temple
  duration = {
    totalDistanceMeters: routeInfo.distance,
    totalMinutes: walkingMinutes + viewingMinutes,
    walkingMinutes: walkingMinutes,
    viewingMinutes: viewingMinutes
  };
} else {
  duration = estimateTourDuration(optimizedRoute, 4, 20);
}

const hours = Math.floor(duration.totalMinutes / 60);
const minutes = duration.totalMinutes % 60;

console.log(`   Tour statistics calculated`);
console.log(`    Total time: ${hours}h ${minutes}m`);
console.log(`    Walking: ${Math.round(duration.walkingMinutes)}m`);
console.log(`    Viewing: ${duration.viewingMinutes}m (${optimizedRoute.length} temples � 20m)`);
console.log(`    Distance: ${(duration.totalDistanceMeters / 1000).toFixed(2)} km`);

console.log('\nStep 5: Generating AI descriptions...');

const narrative = await generateTourNarrative(
  'Complete temple tour of Chiang Mai Old Town (within the moats)',
  optimizedRoute,
  `${(duration.totalDistanceMeters / 1000).toFixed(1)} km`,
  `${hours}h ${minutes}m`,
  'google/gemini-2.0-flash-exp:free'
);

console.log('   AI narrative generated');
console.log(`    Tour intro: ${narrative.tourIntro.substring(0, 100)}...`);

console.log('\nStep 6: Assembling final tour...');

// Map narrative to temples
const enrichedTemples = optimizedRoute.map((temple, index) => {
  const narrativePlace = narrative.places?.[index] || {};
  return {
    order: index + 1,
    ...temple,
    aiDescription: narrativePlace.description || `Stop ${index + 1}: ${temple.name}`,
    transition: narrativePlace.transition || null
  };
});

// Create tour object
const tour = {
  title: 'Complete Temple Tour of Chiang Mai Old Town',
  subtitle: 'All Temples Within the Ancient Moat',
  overview: narrative.tourIntro || 'Explore all the historic Buddhist temples within Chiang Mai\'s ancient moat walls.',
  location: {
    name: 'Chiang Mai Old Town (Within Moat)',
    center: {
      lat: 18.7883,
      lon: 98.9853
    },
    boundaries: data.metadata.moatBoundaries
  },
  duration: duration,
  temples: enrichedTemples,
  route: routeInfo,
  metadata: {
    totalTemples: optimizedRoute.length,
    estimatedDuration: `${hours}h ${minutes}m`,
    totalDistance: `${(duration.totalDistanceMeters / 1000).toFixed(2)} km`,
    elevationGain: routeInfo?.elevation?.gain || null,
    maxElevation: routeInfo?.elevation?.max || null,
    minElevation: routeInfo?.elevation?.min || null,
    startingTemple: optimizedRoute[0].name,
    endingTemple: optimizedRoute[optimizedRoute.length - 1].name,
    createdAt: new Date().toISOString()
  },
  multiDay: hours >= 8 ? {
    recommended: true,
    days: Math.ceil(hours / 6),
    hoursPerDay: Math.ceil(hours / Math.ceil(hours / 6))
  } : null
};

// Save tour
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tour, null, 2));

console.log('   Tour assembled and saved');

console.log('\nP'.repeat(60));
console.log('( TEMPLE TOUR GENERATION COMPLETE!\n');

console.log('=� TOUR SUMMARY:');
console.log(`   Title: ${tour.title}`);
console.log(`   Temples: ${tour.metadata.totalTemples}`);
console.log(`   Distance: ${tour.metadata.totalDistance}`);
console.log(`   Duration: ${tour.metadata.estimatedDuration}`);
console.log(`   Starting: ${tour.metadata.startingTemple}`);
console.log(`   Ending: ${tour.metadata.endingTemple}`);

if (tour.multiDay) {
  console.log(`\n�  MULTI-DAY TOUR RECOMMENDED:`);
  console.log(`   This tour is best split into ${tour.multiDay.days} days`);
  console.log(`   ~${tour.multiDay.hoursPerDay} hours per day`);
}

console.log(`\n=� Saved to: ${OUTPUT_FILE}`);
console.log('\n Done!\n');
