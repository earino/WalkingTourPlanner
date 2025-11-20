import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { geocodeLocation } from '../src/services/geoapifyService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const INPUT_FILE = path.join(__dirname, '../data/temples-raw.json');
const OUTPUT_FILE = path.join(__dirname, '../data/temples-geocoded.json');

// Rate limiting delay (milliseconds)
const DELAY_MS = 150; // ~6-7 requests per second, well within API limits

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Geocode a single temple
 */
async function geocodeTemple(templeName) {
  try {
    // Format query: "Temple Name, Chiang Mai, Thailand"
    const query = `${templeName}, Chiang Mai, Thailand`;
    console.log(`Geocoding: ${templeName}...`);

    const result = await geocodeLocation(query);

    if (result && result.lat && result.lon) {
      return {
        name: templeName,
        query: query,
        latitude: result.lat,
        longitude: result.lon,
        formatted: result.formatted,
        success: true,
        geocodedAt: new Date().toISOString()
      };
    } else {
      console.warn(`  ⚠️  No coordinates found for ${templeName}`);
      return {
        name: templeName,
        query: query,
        success: false,
        error: 'No coordinates returned',
        geocodedAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error(`  ❌ Error geocoding ${templeName}:`, error.message);
    return {
      name: templeName,
      query: `${templeName}, Chiang Mai, Thailand`,
      success: false,
      error: error.message,
      geocodedAt: new Date().toISOString()
    };
  }
}

/**
 * Main geocoding function
 */
async function geocodeAllTemples() {
  console.log('🏯 Chiang Mai Temple Geocoding Script\n');
  console.log('=' .repeat(50));

  // Load raw temple data
  console.log('\n📖 Loading temple list...');
  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  const temples = rawData.temples;
  console.log(`Found ${temples.length} temples to geocode\n`);

  // Check if we should resume from previous run
  let results = [];
  let startIndex = 0;

  if (fs.existsSync(OUTPUT_FILE)) {
    console.log('📋 Found existing geocoding results. Resuming...');
    const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    results = existingData.temples || [];
    startIndex = results.length;
    console.log(`Already geocoded: ${startIndex} temples\n`);
  }

  // Geocode remaining temples
  const templesBatch = temples.slice(startIndex);
  console.log(`🗺️  Geocoding ${templesBatch.length} temples...\n`);

  let successCount = results.filter(t => t.success).length;
  let failureCount = results.filter(t => !t.success).length;

  for (let i = 0; i < templesBatch.length; i++) {
    const temple = templesBatch[i];
    const currentIndex = startIndex + i + 1;

    console.log(`[${currentIndex}/${temples.length}] ${temple}`);

    const result = await geocodeTemple(temple);
    results.push(result);

    if (result.success) {
      console.log(`  ✅ ${result.formatted}`);
      console.log(`     Coordinates: ${result.latitude}, ${result.longitude}`);
      successCount++;
    } else {
      failureCount++;
    }

    // Save progress after each temple
    const outputData = {
      metadata: {
        totalTemples: temples.length,
        geocoded: results.length,
        successful: successCount,
        failed: failureCount,
        lastUpdated: new Date().toISOString()
      },
      temples: results
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));

    // Rate limiting (except for last item)
    if (i < templesBatch.length - 1) {
      await sleep(DELAY_MS);
    }

    console.log('');
  }

  // Final summary
  console.log('=' .repeat(50));
  console.log('\n✨ Geocoding Complete!\n');
  console.log(`Total Temples:     ${temples.length}`);
  console.log(`✅ Successful:     ${successCount}`);
  console.log(`❌ Failed:         ${failureCount}`);
  console.log(`📊 Success Rate:   ${((successCount / temples.length) * 100).toFixed(1)}%`);
  console.log(`\n💾 Results saved to: ${OUTPUT_FILE}`);

  // List failed temples if any
  if (failureCount > 0) {
    console.log('\n⚠️  Failed temples:');
    results.filter(t => !t.success).forEach(t => {
      console.log(`   - ${t.name}: ${t.error}`);
    });
  }
}

// Run the script
geocodeAllTemples().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
