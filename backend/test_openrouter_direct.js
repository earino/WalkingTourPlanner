import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'Walking Tour Planner'
  }
});

async function testModel(modelName) {
  console.log(`Testing ${modelName}...`);
  console.log('API Key:', process.env.OPENROUTER_API_KEY?.substring(0, 20) + '...');
  console.log('');

  try {
    const completion = await openrouter.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'user',
          content: 'Parse this search: temples in chiang mai old town. Return JSON with {location, placeType, radius}'
        }
      ],
      temperature: 0.3,
      max_tokens: 350,
      response_format: { type: 'json_object' }
    });

    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(completion, null, 2));
  } catch (error) {
    console.error('❌ ERROR CAUGHT:');
    console.error('');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('');

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response statusText:', error.response.statusText);
      console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }

    if (error.error) {
      console.error('Error object:', JSON.stringify(error.error, null, 2));
    }

    console.error('');
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  }
}

const modelToTest = process.argv[2] || 'meta-llama/llama-3.3-70b-instruct:free';
testModel(modelToTest);
