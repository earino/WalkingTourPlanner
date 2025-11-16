import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Enhance place information using Gemini Flash
 */
export async function enhancePlaceInfo(placeName, wikiInfo, placeProperties) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a knowledgeable tour guide. Provide a brief, engaging description (2-3 sentences) about ${placeName}.

${wikiInfo ? `Wikipedia info: ${wikiInfo.extract?.substring(0, 500)}` : ''}

${placeProperties ? `Additional info: ${JSON.stringify(placeProperties, null, 2)}` : ''}

Make it interesting and informative for tourists. Focus on historical significance, cultural importance, or unique features.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error enhancing place info:', error.message);
    return null;
  }
}

/**
 * Generate tour overview using Gemini Flash
 */
export async function generateTourOverview(places, location) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const placesList = places.map((p, i) => `${i + 1}. ${p.name}`).join('\n');

    const prompt = `You are a tour guide creating an overview for a walking tour in ${location}.

The tour includes these stops:
${placesList}

Write a brief, enthusiastic 2-3 sentence overview that highlights what makes this tour special and what visitors will experience. Make it engaging and informative.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating tour overview:', error.message);
    return 'Explore the highlights of this area on a carefully curated walking tour.';
  }
}

/**
 * Generate interesting facts about a place
 */
export async function generateInterestingFacts(placeName, context) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a knowledgeable tour guide. Provide 2-3 interesting, lesser-known facts about ${placeName}.

${context ? `Context: ${context}` : ''}

Format as a bullet list. Keep each fact concise (one sentence). Focus on historical tidbits, cultural significance, or unique features that most tourists wouldn't know.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating interesting facts:', error.message);
    return null;
  }
}
