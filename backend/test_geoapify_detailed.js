import axios from 'axios';

const API_KEY = '6cfae2e332b64a6382f31235fcf49271';
const BASE_URL = 'https://api.geoapify.com/v2/places';

// Chiang Mai Old Town center coordinates
const CENTER_LAT = 18.7980727;
const CENTER_LON = 98.9702377;

async function testWithDetails(testName, params) {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST: ${testName}`);
    console.log(`${'='.repeat(80)}`);

    const response = await axios.get(BASE_URL, {
      params: { ...params, apiKey: API_KEY }
    });

    const features = response.data.features || [];
    console.log(`Results: ${features.length} places found`);

    if (features.length > 0) {
      console.log('\nAll Results:');
      features.forEach((f, i) => {
        const props = f.properties;
        const coords = f.geometry.coordinates;
        const distance = props.distance || calculateDistance(
          CENTER_LAT, CENTER_LON,
          coords[1], coords[0]
        );

        console.log(`\n${i + 1}. ${props.name || props.formatted || 'Unnamed'}`);
        console.log(`   Location: ${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`);
        console.log(`   Distance: ${Math.round(distance)}m from center`);
        console.log(`   Categories: ${props.categories?.join(', ') || 'N/A'}`);
        console.log(`   Place ID: ${props.place_id}`);

        if (props.datasource?.raw) {
          const raw = props.datasource.raw;
          console.log(`   OSM: type=${raw.osm_type}, id=${raw.osm_id}`);
          console.log(`   OSM Tags: amenity=${raw.amenity}, religion=${raw.religion}, building=${raw.building}`);
          if (raw.historic) console.log(`   Historic: ${raw.historic}`);
          if (raw.tourism) console.log(`   Tourism: ${raw.tourism}`);
        }
      });
    }

    return features;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    return [];
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

async function main() {
  console.log('GEOAPIFY DETAILED INVESTIGATION');
  console.log('Comparing results at different radii and limits\n');

  // Test different combinations
  const tests = [
    {
      name: '1200m radius, limit 20 (original default)',
      params: {
        filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
        categories: 'religion.place_of_worship',
        limit: 20
      }
    },
    {
      name: '1200m radius, limit 50',
      params: {
        filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
        categories: 'religion.place_of_worship',
        limit: 50
      }
    },
    {
      name: '1200m radius, limit 100',
      params: {
        filter: `circle:${CENTER_LON},${CENTER_LAT},1200`,
        categories: 'religion.place_of_worship',
        limit: 100
      }
    },
    {
      name: '1500m radius, limit 100',
      params: {
        filter: `circle:${CENTER_LON},${CENTER_LAT},1500`,
        categories: 'religion.place_of_worship',
        limit: 100
      }
    },
    {
      name: '2000m radius, limit 100',
      params: {
        filter: `circle:${CENTER_LON},${CENTER_LAT},2000`,
        categories: 'religion.place_of_worship',
        limit: 100
      }
    }
  ];

  for (const test of tests) {
    await testWithDetails(test.name, test.params);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main().catch(console.error);
