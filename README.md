# Smart Walking Tour Planner

An intelligent web application that creates optimized walking tours using AI and multiple APIs. Simply enter a search query like "temples in chiang mai old town" and get a complete walking tour with route optimization, Wikipedia information, and AI-generated insights.

## Features

- **Smart Search**: Natural language search for places (e.g., "museums in paris")
- **AI-Powered Content**: Uses Google Gemini Flash to generate engaging descriptions and interesting facts
- **Route Optimization**: Calculates the most efficient walking route between locations
- **Wikipedia Integration**: Fetches detailed information and links for each place
- **Interactive Map**: Beautiful map visualization with numbered markers and route lines
- **Mobile-First Design**: Responsive, modern UI that works great on all devices

## Tech Stack

### Backend
- Node.js + Express
- Geoapify API (geocoding, place search, routing)
- Wikipedia API (place information)
- Google Gemini Flash (AI-generated content)

### Frontend
- React + Vite
- Leaflet (interactive maps)
- Modern CSS with gradient designs

## Prerequisites

Before you begin, you'll need to obtain API keys for:

1. **Geoapify API**: Sign up at [https://www.geoapify.com/](https://www.geoapify.com/)
   - Free tier: 3,000 requests/day
   - Used for: geocoding, place search, and routing

2. **Google Gemini API**: Get your key at [https://ai.google.dev/](https://ai.google.dev/)
   - Free tier available
   - Used for: AI-generated descriptions and facts

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd WalkingTourPlanner
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=3001
GEOAPIFY_API_KEY=your_geoapify_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

## Running the Application

### Start the Backend

```bash
cd backend
npm start
```

The backend will start on `http://localhost:3001`

For development with auto-reload:
```bash
npm run dev
```

### Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### Access the Application

Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter a search query in natural language:
   - "temples in chiang mai old town"
   - "museums in paris"
   - "churches in rome"
   - "parks in central london"

2. Click "Create Tour" or press Enter

3. Wait while the app:
   - Geocodes your location
   - Searches for relevant places
   - Fetches Wikipedia information
   - Generates AI descriptions and facts
   - Optimizes the walking route

4. Explore your tour:
   - View the route on the interactive map
   - Read AI-generated descriptions
   - Click Wikipedia links for detailed information
   - See interesting facts about each place

## API Endpoints

### Backend

- `GET /` - API information
- `GET /api/tours/health` - Health check
- `POST /api/tours/create` - Create a new tour
  - Body: `{ "query": "your search query" }`
- `GET /api/tours/place-details` - Get place details
  - Params: `name`, `lat`, `lon`

## Project Structure

```
WalkingTourPlanner/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── tourRoutes.js
│   │   ├── services/
│   │   │   ├── geoapifyService.js
│   │   │   ├── wikipediaService.js
│   │   │   ├── geminiService.js
│   │   │   └── tourService.js
│   │   ├── utils/
│   │   │   └── tourOptimizer.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchForm.jsx
│   │   │   ├── TourMap.jsx
│   │   │   ├── PlaceCard.jsx
│   │   │   ├── TourResults.jsx
│   │   │   └── Loading.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   └── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## How It Works

1. **Geocoding**: The search query is geocoded to find the center point
2. **Place Search**: Geoapify API searches for relevant places within a radius
3. **Information Gathering**: For each place:
   - Wikipedia API fetches article information
   - Gemini AI generates engaging descriptions
   - Gemini AI creates interesting facts
4. **Route Optimization**: A greedy nearest-neighbor algorithm optimizes the walking route
5. **Route Calculation**: Geoapify routing API calculates the actual walking path
6. **Presentation**: Results are displayed on an interactive map with detailed information

## Customization

### Adjust Search Radius

In `backend/src/services/tourService.js`:
```javascript
const places = await searchPlaces({
  text: searchQuery,
  center: { lat: location.lat, lon: location.lon },
  radius: 3000 // Change this value (in meters)
});
```

### Change Number of Places

In `backend/src/services/tourService.js`:
```javascript
const topPlaces = filterAndRankPlaces(enhancedPlaces, searchQuery, 8); // Change this number
```

### Modify Walking Speed Estimation

In `backend/src/utils/tourOptimizer.js`:
```javascript
export function estimateTourDuration(route, walkingSpeedKmh = 4, visitTimeMinutes = 15) {
  // Adjust walkingSpeedKmh and visitTimeMinutes
}
```

## Troubleshooting

### API Key Issues
- Make sure your `.env` file is in the `backend` directory
- Restart the backend after adding API keys
- Check that API keys are valid and have sufficient quota

### CORS Issues
- Ensure the backend is running on port 3001
- Check that the frontend proxy is configured correctly in `vite.config.js`

### Map Not Displaying
- Check browser console for errors
- Ensure Leaflet CSS is loaded
- Verify internet connection (maps require external resources)

### No Places Found
- Try a more specific search query
- Include a location in your query
- Check that the Geoapify API key is valid

## Future Enhancements

- Save and share tours
- Custom starting points
- Time-based filtering (museums open now)
- User reviews and ratings
- Multi-day tour planning
- Public transportation options
- Offline map caching
- Tour difficulty ratings
- Photo galleries for each place

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See LICENSE file for details.

## Acknowledgments

- [Geoapify](https://www.geoapify.com/) for geocoding and routing APIs
- [Wikipedia](https://www.wikipedia.org/) for place information
- [Google Gemini](https://ai.google.dev/) for AI-generated content
- [Leaflet](https://leafletjs.com/) for map visualization
- [OpenStreetMap](https://www.openstreetmap.org/) for map tiles
