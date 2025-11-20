import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

async function testGeocode() {
  console.log('Testing Geoapify Geocoding API...');
  console.log('API Key:', GEOAPIFY_API_KEY?.substring(0, 20) + '...');
  console.log('');

  try {
    const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: {
        text: 'Upper West Side, Manhattan, New York, USA',
        limit: 5,
        apiKey: GEOAPIFY_API_KEY
      },
      timeout: 10000
    });

    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Features found:', response.data.features?.length);
    if (response.data.features?.[0]) {
      const f = response.data.features[0];
      console.log('First result:', f.properties.formatted);
      console.log('Coordinates:', f.geometry.coordinates);
    }
  } catch (error) {
    console.error('❌ ERROR:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status text:', error.response.statusText);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testGeocode();
