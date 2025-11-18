import express from 'express';
import { createWalkingTour, getPlaceDetails } from '../services/tourService.js';

const router = express.Router();

/**
 * POST /api/tours/create
 * Create a new walking tour based on search query
 */
router.post('/create', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Query parameter is required'
      });
    }

    console.log(`Creating tour for query: ${query}`);
    const tour = await createWalkingTour(query);

    res.json({
      success: true,
      tour
    });
  } catch (error) {
    console.error('Error creating tour:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create tour'
    });
  }
});

/**
 * GET /api/tours/place-details
 * Get detailed information about a specific place
 */
router.get('/place-details', async (req, res) => {
  try {
    const { name, lat, lon } = req.query;

    if (!name) {
      return res.status(400).json({
        error: 'Place name is required'
      });
    }

    const details = await getPlaceDetails(
      name,
      lat ? parseFloat(lat) : null,
      lon ? parseFloat(lon) : null
    );

    res.json({
      success: true,
      details
    });
  } catch (error) {
    console.error('Error getting place details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get place details'
    });
  }
});

/**
 * GET /api/tours/create-stream
 * Create a tour with real-time progress updates via Server-Sent Events
 */
router.get('/create-stream', async (req, res) => {
  const { query, maxStops, model } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const numStops = maxStops ? parseInt(maxStops) : 7;
  const aiModel = model || 'google/gemini-2.5-flash';

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Progress callback to send updates to client
  const sendProgress = (stage, message, data = {}) => {
    res.write(`data: ${JSON.stringify({ stage, message, ...data })}\n\n`);
  };

  try {
    console.log(`Creating tour with SSE for query: ${query}, max stops: ${numStops}, model: ${aiModel}`);

    // Create tour with progress callbacks
    const tour = await createWalkingTour(query, numStops, sendProgress, aiModel);

    // Send final result
    res.write(`data: ${JSON.stringify({ stage: 'complete', tour })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error creating tour with SSE:', error);
    res.write(`data: ${JSON.stringify({ stage: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
