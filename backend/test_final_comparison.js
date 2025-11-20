import axios from 'axios';

const API_KEY = '6cfae2e332b64a6382f31235fcf49271';
const BASE_URL = 'https://api.geoapify.com/v2/places';

// Chiang Mai Old Town center coordinates
const CENTER_LAT = 18.7980727;
const CENTER_LON = 98.9702377;

async function testSearch(testName, params) {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST: ${testName}`);
    console.log(`${'='.repeat(80)}`);
    console.log('Parameters:', JSON.stringify(params, null, 2));

    const response = await axios.get(BASE_URL, {
      params: { ...params, apiKey: API_KEY }
    });

    const features = response.data.features || [];
    console.log(`\nResults: ${features.length} places found`);

    // Count Buddhist temples
    const buddhistTemples = features.filter(f =>
      f.properties.categories?.includes('religion.place_of_worship.buddhism')
    );
    console.log(`Buddhist temples: ${buddhistTemples.length}`);

    return features.length;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('FINAL COMPARISON TEST');
  console.log('Testing category hierarchy and radius impact\n');

  const results = {};

  // Test 1: Current implementation with text filter
  results['Current (1200m, text, multi-cat)'] = await testSearch(
    'Current Implementation',
    {
      filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
      categories: 'religion.place_of_worship,tourism.sights,heritage',
      text: 'temples Buddhist wats religious sites historic sacred',
      limit: 100
    }
  );

  // Test 2: No text filter
  results['No text (1200m, multi-cat)'] = await testSearch(
    'Same but NO text filter',
    {
      filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
      categories: 'religion.place_of_worship,tourism.sights,heritage',
      limit: 100
    }
  );

  // Test 3: Just religion.place_of_worship
  results['Simple cat (1200m, religion.pow)'] = await testSearch(
    'Just religion.place_of_worship',
    {
      filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
      categories: 'religion.place_of_worship',
      limit: 100
    }
  );

  // Test 4: Parent category "religion"
  results['Broad cat (1200m, religion)'] = await testSearch(
    'Broadest - just "religion"',
    {
      filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
      categories: 'religion',
      limit: 100
    }
  );

  // Test 5: Larger radius
  results['Larger radius (1500m, religion.pow)'] = await testSearch(
    'Larger radius 1500m',
    {
      filter: `circle:${CENTER_LON},${CENTER_LAT},1500`,
      categories: 'religion.place_of_worship',
      limit: 100
    }
  );

  // Test 6: Even larger radius
  results['Max radius (2000m, religion.pow)'] = await testSearch(
    'Max practical radius 2000m',
    {
      filter: `circle:${CENTER_LON},${CENTER_LAT},2000`,
      categories: 'religion.place_of_worship',
      limit: 100
    }
  );

  // Test 7: Try limit=200 with 1200m
  results['High limit (1200m, limit=200)'] = await testSearch(
    'High limit at 1200m',
    {
      filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
      categories: 'religion.place_of_worship',
      limit: 200
    }
  );

  // Test 8: Try limit=200 with 2000m
  results['High limit + radius (2000m, limit=200)'] = await testSearch(
    'High limit + large radius',
    {
      filter: `circle:${CENTER_LON},${CENTER_LAT},2000`,
      categories: 'religion.place_of_worship',
      limit: 200
    }
  );

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY OF RESULTS');
  console.log(`${'='.repeat(80)}`);
  for (const [test, count] of Object.entries(results)) {
    console.log(`${test.padEnd(45)}: ${count} places`);
  }
}

main().catch(console.error);
