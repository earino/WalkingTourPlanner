import { geocodeLocation } from './src/services/geoapifyService.js';

async function getOldTownBoundaries() {
  console.log('Geocoding Chiang Mai Old Town to get bounding box...\n');

  try {
    // Try different variations to get the most accurate bounding box
    const queries = [
      'Old Town, Chiang Mai, Thailand',
      'Chiang Mai Old City, Thailand',
      'Ancient City, Chiang Mai, Thailand',
      'Phra Singh, Mueang Chiang Mai, Chiang Mai, Thailand' // Old town district
    ];

    for (const query of queries) {
      console.log(`\n--- Trying: "${query}" ---`);
      const result = await geocodeLocation(query);

      if (result && result.bbox) {
        const [west, south, east, north] = result.bbox;
        console.log(`Location: ${result.formatted}`);
        console.log(`Center: ${result.lat}, ${result.lon}`);
        console.log(`Bounding Box:`);
        console.log(`  West:  ${west}`);
        console.log(`  South: ${south}`);
        console.log(`  East:  ${east}`);
        console.log(`  North: ${north}`);

        // Calculate dimensions
        const width = (east - west) * 111.320 * Math.cos(result.lat * Math.PI / 180);
        const height = (north - south) * 111.320;
        console.log(`\nDimensions:`);
        console.log(`  Width:  ${width.toFixed(2)} km`);
        console.log(`  Height: ${height.toFixed(2)} km`);
      } else {
        console.log('No bounding box returned');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

getOldTownBoundaries();
