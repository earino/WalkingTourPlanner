import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const GEOAPIFY_ROUTING_URL = 'https://api.geoapify.com/v1/routing';

async function testRouting() {
  // Sample waypoints from a typical Chiang Mai Old Town temple tour
  const waypoints = [
    { latitude: 18.799591, longitude: 98.979653, name: 'Temple 1' },
    { latitude: 18.793298, longitude: 98.980604, name: 'Temple 2' },
    { latitude: 18.792181, longitude: 98.977604, name: 'Temple 3' },
    { latitude: 18.788156, longitude: 98.967783, name: 'Temple 4' }
  ];

  console.log('Testing Geoapify Routing API...');
  console.log('API Key:', GEOAPIFY_API_KEY?.substring(0, 20) + '...');
  console.log('Waypoints:', waypoints.length);
  console.log('');

  const waypointsParam = waypoints
    .map(wp => `${wp.latitude},${wp.longitude}`)
    .join('|');

  console.log('Formatted waypoints param:', waypointsParam);
  console.log('');

  try {
    const response = await axios.get(GEOAPIFY_ROUTING_URL, {
      params: {
        waypoints: waypointsParam,
        mode: 'walk',
        details: 'elevation',
        apiKey: GEOAPIFY_API_KEY
      }
    });

    console.log('✅ API CALL SUCCESS!');
    console.log('');
    console.log('Response status:', response.status);
    console.log('Has features?:', !!response.data.features);
    console.log('Features length:', response.data.features?.length);
    console.log('');
    console.log('Full response:', JSON.stringify(response.data, null, 2));

    if (response.data.features && response.data.features.length > 0) {
      console.log('');
      console.log('Route distance:', response.data.features[0].properties.distance, 'meters');
      console.log('Route time:', response.data.features[0].properties.time, 'seconds');
      console.log('Geometry type:', response.data.features[0].geometry.type);
    }

  } catch (error) {
    console.error('❌ ERROR:');
    console.error('');
    console.error('Error message:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status text:', error.response.statusText);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRouting();
