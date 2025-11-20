import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

async function testGeocode() {
  console.log('Testing Geoapify Geocoding API with full error details...');
  console.log('');

  try {
    const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: {
        text: 'The Bronx, New York, USA',
        limit: 5,
        apiKey: GEOAPIFY_API_KEY
      },
      timeout: 10000,
      validateStatus: () => true  // Don't throw on any status
    });

    console.log('Status:', response.status);
    console.log('Status text:', response.statusText);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('');
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ REQUEST ERROR:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
  }
}

testGeocode();
