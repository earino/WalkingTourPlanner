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

    if (features.length > 0) {
      console.log('\nSample results:');
      features.slice(0, 5).forEach((f, i) => {
        const props = f.properties;
        console.log(`${i + 1}. ${props.name || props.formatted}`);
        console.log(`   Categories: ${props.categories?.join(', ') || 'N/A'}`);
        console.log(`   Distance from center: ${props.distance ? Math.round(props.distance) + 'm' : 'N/A'}`);
        if (props.datasource?.raw) {
          console.log(`   OSM tags: ${JSON.stringify(props.datasource.raw).substring(0, 100)}...`);
        }
      });

      // Show category distribution
      const categoryCount = {};
      features.forEach(f => {
        const cats = f.properties.categories || ['unknown'];
        cats.forEach(cat => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
      });
      console.log('\nCategory distribution:');
      Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
          console.log(`  ${cat}: ${count}`);
        });
    }

    return features;
  } catch (error) {
    console.error(`ERROR in ${testName}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}

async function main() {
  console.log('GEOAPIFY TEMPLE SEARCH INVESTIGATION');
  console.log('Location: Chiang Mai Old Town');
  console.log(`Center: ${CENTER_LAT}, ${CENTER_LON}`);
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);

  // Test 1: Current implementation
  await testSearch('Test 1: Current Implementation (as per code)', {
    filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
    categories: 'religion.place_of_worship,tourism.sights,heritage',
    text: 'temples Buddhist wats religious sites historic sacred',
    limit: 100
  });

  // Test 2: Only religion.place_of_worship (should include ALL subtypes)
  await testSearch('Test 2: Only religion.place_of_worship (includes all subtypes)', {
    filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
    categories: 'religion.place_of_worship',
    limit: 100
  });

  // Test 3: Only religion.place_of_worship.buddhism (specific - NARROWER)
  await testSearch('Test 3: Only religion.place_of_worship.buddhism (specific)', {
    filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
    categories: 'religion.place_of_worship.buddhism',
    limit: 100
  });

  // Test 4: No category filter, only text
  await testSearch('Test 4: No category, only text search', {
    filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
    text: 'temple wat',
    limit: 100
  });

  // Test 5: Larger radius
  await testSearch('Test 5: Larger radius (2000m)', {
    filter: `circle:${CENTER_LON},${CENTER_LAT},2000`,
    categories: 'religion.place_of_worship',
    limit: 100
  });

  // Test 6: No text filter
  await testSearch('Test 6: No text filter, only categories', {
    filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
    categories: 'religion.place_of_worship,tourism.sights,heritage',
    limit: 100
  });

  // Test 7: Just parent "religion" category (broadest)
  await testSearch('Test 7: Just parent "religion" category (broadest)', {
    filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
    categories: 'religion',
    limit: 100
  });

  // Test 8: Tourism categories only
  await testSearch('Test 8: Tourism categories only', {
    filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
    categories: 'tourism,tourism.sights,tourism.attraction',
    limit: 100
  });

  // Test 9: Heritage and historical
  await testSearch('Test 9: Heritage and historical', {
    filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
    categories: 'heritage,heritage.monument,heritage.unesco',
    limit: 100
  });

  // Test 10: Very broad search
  await testSearch('Test 10: Very broad - no text, all relevant categories', {
    filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
    categories: 'religion,tourism,heritage',
    limit: 100
  });

  // Test 11: Minimal filter - just circle, no categories
  await testSearch('Test 11: Minimal - just location filter', {
    filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
    limit: 100
  });

  // Test 12: Bounding box instead of circle
  // Old Town approximate bbox
  await testSearch('Test 12: Bounding box of Old Town', {
    filter: `rect:98.9650,18.7930,98.9750,18.8030`,
    categories: 'religion.place_of_worship',
    limit: 100
  });
}

main().catch(console.error);
