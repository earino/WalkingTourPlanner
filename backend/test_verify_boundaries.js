import { geocodeLocation } from './src/services/geoapifyService.js';

async function verifyBoundaries() {
  console.log('🔍 Verifying Old Town Boundaries\n');
  console.log('Testing known landmarks at the moat edges:\n');

  const landmarks = [
    { name: 'Tha Phae Gate (East)', query: 'Tha Phae Gate, Chiang Mai, Thailand', expectedSide: 'east' },
    { name: 'Chang Phuak Gate (North)', query: 'Chang Phuak Gate, Chiang Mai, Thailand', expectedSide: 'north' },
    { name: 'Chiang Mai Gate (South)', query: 'Chiang Mai Gate, Chiang Mai, Thailand', expectedSide: 'south' },
    { name: 'Suan Dok Gate (West)', query: 'Suan Dok Gate, Chiang Mai, Thailand', expectedSide: 'west' },
    { name: 'Wat Chedi Luang (Center)', query: 'Wat Chedi Luang, Chiang Mai, Thailand', expectedSide: 'center' },
    { name: 'Wat Phra Singh (West-Center)', query: 'Wat Phra Singh, Chiang Mai, Thailand', expectedSide: 'inside' },
    { name: 'Wat Suan Dok (Outside West)', query: 'Wat Suan Dok, Chiang Mai, Thailand', expectedSide: 'outside' },
  ];

  const results = [];

  for (const landmark of landmarks) {
    console.log(`📍 ${landmark.name}`);
    try {
      const result = await geocodeLocation(landmark.query);
      if (result && result.lat && result.lon) {
        console.log(`   Lat: ${result.lat}, Lon: ${result.lon}`);
        console.log(`   Address: ${result.formatted}\n`);
        results.push({
          name: landmark.name,
          expectedSide: landmark.expectedSide,
          lat: result.lat,
          lon: result.lon
        });
      } else {
        console.log(`   ❌ No result\n`);
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Calculate bounding box from the gate coordinates
  console.log('\n' + '='.repeat(60));
  console.log('📊 Analysis:\n');

  const gates = results.filter(r => r.name.includes('Gate'));
  if (gates.length >= 3) {
    const lats = gates.map(g => g.lat);
    const lons = gates.map(g => g.lon);

    const north = Math.max(...lats);
    const south = Math.min(...lats);
    const east = Math.max(...lons);
    const west = Math.min(...lons);

    console.log('Calculated bounding box from gates:');
    console.log(`  North: ${north.toFixed(6)}`);
    console.log(`  South: ${south.toFixed(6)}`);
    console.log(`  East:  ${east.toFixed(6)}`);
    console.log(`  West:  ${west.toFixed(6)}`);

    const width = (east - west) * 111.320 * Math.cos((north + south) / 2 * Math.PI / 180);
    const height = (north - south) * 111.320;

    console.log(`\nDimensions:`);
    console.log(`  Width:  ${width.toFixed(3)} km`);
    console.log(`  Height: ${height.toFixed(3)} km`);

    console.log(`\n📋 Suggested bounding box (with small buffer):`);
    const buffer = 0.001; // ~100m buffer
    console.log(`  North: ${(north + buffer).toFixed(6)}`);
    console.log(`  South: ${(south - buffer).toFixed(6)}`);
    console.log(`  East:  ${(east + buffer).toFixed(6)}`);
    console.log(`  West:  ${(west - buffer).toFixed(6)}`);
  }

  // Check if Wat Suan Dok is outside
  const suanDok = results.find(r => r.name.includes('Suan Dok'));
  if (suanDok && gates.length > 0) {
    const westGate = Math.min(...gates.map(g => g.lon));
    console.log(`\n🏯 Wat Suan Dok (should be OUTSIDE moat):`);
    console.log(`   Longitude: ${suanDok.lon.toFixed(6)}`);
    console.log(`   West gate: ${westGate.toFixed(6)}`);
    console.log(`   Distance from west boundary: ${((suanDok.lon - westGate) * 111.320 * Math.cos(suanDok.lat * Math.PI / 180)).toFixed(3)} km`);
    if (suanDok.lon < westGate) {
      console.log(`   ✅ Correctly outside (west of moat)`);
    } else {
      console.log(`   ⚠️  Appears to be inside or on boundary`);
    }
  }
}

verifyBoundaries().catch(console.error);
