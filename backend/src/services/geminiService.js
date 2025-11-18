import OpenAI from 'openai';
import { PROMPTS } from '../config/prompts.js';

/**
 * Initialize OpenRouter client with OpenAI SDK
 */
function getOpenRouter() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    timeout: 180 * 1000,  // 180 seconds (3 min) - needed for cold start
    maxRetries: 2,  // Retry up to 2 times on network errors
    defaultHeaders: {
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Walking Tour Planner'
    }
  });
}

/**
 * Enhance place information using Gemini Flash
 */
export async function enhancePlaceInfo(placeName, wikiInfo, placeProperties) {
  try {
    const openrouter = getOpenRouter();
    const config = PROMPTS.enhancePlaceInfo;
    const prompt = config.buildPrompt(placeName, wikiInfo, placeProperties);

    const completion = await openrouter.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: config.parameters.temperature,
      max_tokens: config.parameters.maxTokens
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error enhancing place info:', error.message);
    // Fallback: Create basic description from place properties
    if (placeProperties && placeProperties.name) {
      const category = placeProperties.categories?.[0]?.replace(/\./g, ' ') || 'attraction';
      return `${placeName} is a ${category} in the area${placeProperties.formatted ? `, located at ${placeProperties.formatted}` : ''}.`;
    }
    return null;
  }
}

/**
 * Generate tour overview using Gemini Flash
 */
export async function generateTourOverview(places, location, metadata) {
  try {
    const openrouter = getOpenRouter();
    const config = PROMPTS.generateTourOverview;
    const prompt = config.buildPrompt(places, location, metadata);

    const completion = await openrouter.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: config.parameters.temperature,
      max_tokens: config.parameters.maxTokens
    });

    return completion.choices[0].message.content;
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
    const openrouter = getOpenRouter();
    const config = PROMPTS.generateInterestingFacts;
    const prompt = config.buildPrompt(placeName, context);

    const completion = await openrouter.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: config.parameters.temperature,
      max_tokens: config.parameters.maxTokens
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating interesting facts:', error.message);
    return null;
  }
}

/**
 * Parse natural language search query into structured data
 */
export async function parseSearchQuery(searchQuery, model = 'google/gemini-2.5-flash') {
  try {
    const openrouter = getOpenRouter();
    const config = PROMPTS.parseSearchQuery;
    const prompt = config.buildPrompt(searchQuery);

    const completion = await openrouter.chat.completions.create({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: config.parameters.temperature,
      max_tokens: config.parameters.maxTokens,
      response_format: { type: 'json_object' }
    });

    const text = completion.choices[0].message.content;
    const parsedQuery = JSON.parse(text);
    console.log('Parsed query:', JSON.stringify(parsedQuery, null, 2));

    return parsedQuery;
  } catch (error) {
    console.error('CRITICAL: Query parsing failed:', error.message);
    throw new Error(`Query parsing failed: ${error.message}`);
  }
}

/**
 * Rank places by relevance to original search query using AI
 */
export async function rankPlacesByRelevance(originalQuery, places, topN = 10, model = 'google/gemini-2.5-flash') {
  const startTime = Date.now();
  try {
    if (!places || places.length === 0) return [];

    const openrouter = getOpenRouter();
    const config = PROMPTS.rankPlacesByRelevance;
    const prompt = config.buildPrompt(originalQuery, places, topN);

    console.log(`  🤖 Calling ${model}...`);
    const completion = await openrouter.chat.completions.create({
      model: model,
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: config.parameters.temperature,
      max_tokens: config.parameters.maxTokens,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0].message.content;
    const result = JSON.parse(text);

    // Extract selections array
    const selections = result.selections || [];

    if (selections.length !== topN) {
      console.warn(`Expected ${topN} selections, got ${selections.length}`);
    }

    // Map selections back to places with scores
    const selectedPlaces = selections.map(sel => ({
      ...places[sel.index],
      aiScore: sel.score,
      aiReason: sel.reason
    }));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ✅ AI ranking completed in ${elapsed}s`);
    console.log(`AI selected ${selectedPlaces.length} places from ${places.length}, top: ${selectedPlaces[0]?.name} (score: ${selectedPlaces[0]?.aiScore})`);
    return selectedPlaces;
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error('CRITICAL: AI ranking failed - NO FALLBACK!');
    console.error(`Error after ${elapsed}s:`, error.message);
    console.error('Error type:', error.constructor.name);
    console.error('Error code:', error.code);
    console.error('Original query:', originalQuery);
    console.error('Number of places:', places.length);
    console.error('Model:', model);
    throw new Error(`AI ranking FAILED for "${originalQuery}": ${error.message}. Cannot continue with unranked results.`);
  }
}

/**
 * Generate cohesive tour narrative for all places in sequence
 */
export async function generateTourNarrative(originalQuery, orderedPlaces, totalDistance, totalDuration, model = 'google/gemini-2.5-flash') {
  try {
    const openrouter = getOpenRouter();
    const config = PROMPTS.generateTourNarrative;
    const prompt = config.buildPrompt(originalQuery, orderedPlaces, totalDistance, totalDuration);

    const completion = await openrouter.chat.completions.create({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: config.parameters.temperature,
      max_tokens: config.parameters.maxTokens,
      response_format: { type: 'json_object' }
    });

    const text = completion.choices[0].message.content;
    const narrative = JSON.parse(text);

    const numPlaces = narrative.places ? narrative.places.length : 0;
    console.log(`Generated cohesive narrative for ${numPlaces} places`);
    return narrative;
  } catch (error) {
    console.error('CRITICAL: Tour narrative generation failed!');
    console.error('Error:', error.message);
    throw new Error(`Tour narrative failed: ${error.message}`);
  }
}
