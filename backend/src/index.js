import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tourRoutes from './routes/tourRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/tours', tourRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Walking Tour Planner API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/tours/health',
      createTour: 'POST /api/tours/create',
      placeDetails: 'GET /api/tours/place-details'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Walking Tour Planner API is running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}`);
  console.log(`💡 Health check: http://localhost:${PORT}/api/tours/health\n`);

  // Check for required environment variables
  if (!process.env.GEOAPIFY_API_KEY) {
    console.warn('⚠️  WARNING: GEOAPIFY_API_KEY is not set');
  }
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY is not set');
  }
});
