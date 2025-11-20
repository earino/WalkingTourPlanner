import axios from 'axios';

const API_KEY = '6cfae2e332b64a6382f31235fcf49271';
const BASE_URL = 'https://api.geoapify.com/v2/places';

// Chiang Mai Old Town center coordinates
const CENTER_LAT = 18.7980727;
const CENTER_LON = 98.9702377;

async function showTemples(radius) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        filter: `circle:${CENTER_LON},${CENTER_LAT},${radius}`,
        categories: 'religion.place_of_worship',
        limit: 100,
        apiKey: API_KEY
      }
    });

    const features = response.data.features || [];
    const buddhistTemples = features.filter(f =>
      f.properties.categories?.includes('religion.place_of_worship.buddhism')
    );

    console.log(`\n${'='.repeat(80)}`);
    console.log(`BUDDHIST TEMPLES WITHIN ${radius}m RADIUS`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Total places of worship: ${features.length}`);
    console.log(`Buddhist temples: ${buddhistTemples.length}\n`);

    buddhistTemples.forEach((f, i) => {
      const coords = f.geometry.coordinates;
      const props = f.properties;
      const distance = Math.round(
        calculateDistance(CENTER_LAT, CENTER_LON, coords[1], coords[0])
      );

      // Get English name if available
      const thaiName = props.name || 'Unnamed';
      const englishName = props.datasource?.raw?.['name:en'] || '';

      console.log(`${(i + 1).toString().padStart(2)}. ${thaiName}`);
      if (englishName) {
        console.log(`    ${englishName}`);
      }
      console.log(`    Distance: ${distance}m | Coords: ${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`);
    });

    return buddhistTemples.length;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return 0;
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
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
  console.log('CHIANG MAI OLD TOWN - BUDDHIST TEMPLES BY RADIUS');
  console.log('Search Center: 18.7980727, 98.9702377');

  const count1200 = await showTemples(1200);
  await new Promise(r => setTimeout(r, 1000));

  const count1500 = await showTemples(1500);
  await new Promise(r => setTimeout(r, 1000));

  const count2000 = await showTemples(2000);

  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`1200m radius: ${count1200} Buddhist temples`);
  console.log(`1500m radius: ${count1500} Buddhist temples (+${count1500 - count1200} more)`);
  console.log(`2000m radius: ${count2000} Buddhist temples (+${count2000 - count1500} more)`);
  console.log(`\nIncrease from 1200m to 2000m: ${count2000 - count1200} additional temples (${Math.round((count2000 - count1200) / count1200 * 100)}% increase)`);
}

main().catch(console.error);
