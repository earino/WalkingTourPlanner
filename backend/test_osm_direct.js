import axios from 'axios';

// Chiang Mai Old Town center coordinates
const CENTER_LAT = 18.7980727;
const CENTER_LON = 98.9702377;

async function queryOverpass(query, description) {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`OVERPASS QUERY: ${description}`);
    console.log(`${'='.repeat(80)}`);
    console.log('Query:', query.substring(0, 200) + '...');

    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      query,
      {
        headers: { 'Content-Type': 'text/plain' },
        timeout: 30000
      }
    );

    const elements = response.data.elements || [];
    console.log(`\nResults: ${elements.length} items found`);

    if (elements.length > 0) {
      console.log('\nSample results (first 10):');
      elements.slice(0, 10).forEach((el, i) => {
        console.log(`${i + 1}. ${el.tags?.name || 'Unnamed'}`);
        console.log(`   Type: ${el.type} (id: ${el.id})`);
        console.log(`   Tags: amenity=${el.tags?.amenity}, religion=${el.tags?.religion}, building=${el.tags?.building}`);
        if (el.tags?.historic) console.log(`   Historic: ${el.tags.historic}`);
        if (el.tags?.tourism) console.log(`   Tourism: ${el.tags.tourism}`);
        if (el.tags?.heritage) console.log(`   Heritage: ${el.tags.heritage}`);
      });

      // Tag analysis
      const tagStats = {
        amenity: {},
        religion: {},
        building: {},
        tourism: {},
        historic: {}
      };

      elements.forEach(el => {
        if (el.tags?.amenity) tagStats.amenity[el.tags.amenity] = (tagStats.amenity[el.tags.amenity] || 0) + 1;
        if (el.tags?.religion) tagStats.religion[el.tags.religion] = (tagStats.religion[el.tags.religion] || 0) + 1;
        if (el.tags?.building) tagStats.building[el.tags.building] = (tagStats.building[el.tags.building] || 0) + 1;
        if (el.tags?.tourism) tagStats.tourism[el.tags.tourism] = (tagStats.tourism[el.tags.tourism] || 0) + 1;
        if (el.tags?.historic) tagStats.historic[el.tags.historic] = (tagStats.historic[el.tags.historic] || 0) + 1;
      });

      console.log('\nTag Statistics:');
      for (const [category, values] of Object.entries(tagStats)) {
        if (Object.keys(values).length > 0) {
          console.log(`\n  ${category}:`);
          Object.entries(values)
            .sort((a, b) => b[1] - a[1])
            .forEach(([tag, count]) => console.log(`    ${tag}: ${count}`));
        }
      }
    }

    return elements;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    return [];
  }
}

async function main() {
  console.log('OPENSTREETMAP DIRECT QUERY INVESTIGATION');
  console.log('Location: Chiang Mai Old Town');
  console.log(`Center: ${CENTER_LAT}, ${CENTER_LON}`);

  // Query 1: All place_of_worship within 1200m
  await queryOverpass(`
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"](around:1200,${CENTER_LAT},${CENTER_LON});
      way["amenity"="place_of_worship"](around:1200,${CENTER_LAT},${CENTER_LON});
      relation["amenity"="place_of_worship"](around:1200,${CENTER_LAT},${CENTER_LON});
    );
    out body;
    >;
    out skel qt;
  `, 'All place_of_worship within 1200m radius');

  // Query 2: All place_of_worship with religion=buddhist within 1200m
  await queryOverpass(`
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"]["religion"="buddhist"](around:1200,${CENTER_LAT},${CENTER_LON});
      way["amenity"="place_of_worship"]["religion"="buddhist"](around:1200,${CENTER_LAT},${CENTER_LON});
      relation["amenity"="place_of_worship"]["religion"="buddhist"](around:1200,${CENTER_LAT},${CENTER_LON});
    );
    out body;
    >;
    out skel qt;
  `, 'Buddhist temples within 1200m radius');

  // Query 3: Anything tagged with "wat" in the name
  await queryOverpass(`
    [out:json][timeout:25];
    (
      node["name"~"[Ww]at"](around:1200,${CENTER_LAT},${CENTER_LON});
      way["name"~"[Ww]at"](around:1200,${CENTER_LAT},${CENTER_LON});
      relation["name"~"[Ww]at"](around:1200,${CENTER_LAT},${CENTER_LON});
    );
    out body;
    >;
    out skel qt;
  `, 'Anything with "Wat" in name within 1200m');

  // Query 4: Historic + tourism tags
  await queryOverpass(`
    [out:json][timeout:25];
    (
      node["historic"](around:1200,${CENTER_LAT},${CENTER_LON});
      way["historic"](around:1200,${CENTER_LAT},${CENTER_LON});
      node["tourism"="attraction"](around:1200,${CENTER_LAT},${CENTER_LON});
      way["tourism"="attraction"](around:1200,${CENTER_LAT},${CENTER_LON});
    );
    out body;
    >;
    out skel qt;
  `, 'Historic sites and tourism attractions within 1200m');

  // Query 5: Everything within Old Town bounding box
  const bbox = '18.7870,98.9820,18.8020,98.9960'; // Old Town approximate bbox
  await queryOverpass(`
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"](${bbox});
      way["amenity"="place_of_worship"](${bbox});
      relation["amenity"="place_of_worship"](${bbox});
    );
    out body;
    >;
    out skel qt;
  `, 'All place_of_worship in Old Town bbox');

  // Query 6: Larger radius - 2000m
  await queryOverpass(`
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"]["religion"="buddhist"](around:2000,${CENTER_LAT},${CENTER_LON});
      way["amenity"="place_of_worship"]["religion"="buddhist"](around:2000,${CENTER_LAT},${CENTER_LON});
      relation["amenity"="place_of_worship"]["religion"="buddhist"](around:2000,${CENTER_LAT},${CENTER_LON});
    );
    out body;
    >;
    out skel qt;
  `, 'Buddhist temples within 2000m radius');
}

main().catch(console.error);
