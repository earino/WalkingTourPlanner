import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchForm from './components/SearchForm';
import TourResults from './components/TourResults';
import Loading from './components/Loading';
import { createTourWithProgress } from './services/api';
import './styles/App.css';

function App() {
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressStage, setProgressStage] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearch = async (query, maxStops = 7, model = 'google/gemini-2.5-flash') => {
    setLoading(true);
    setError(null);
    setTour(null);
    setProgressStage(null);

    // Update URL with search query, maxStops, and model for sharing
    setSearchParams({ q: query, stops: maxStops, model: model });

    try {
      const response = await createTourWithProgress(query, maxStops, model, (progress) => {
        setProgressStage(progress);
      });

      if (response.success) {
        setTour(response.tour);
      } else {
        setError(response.error || 'Failed to create tour');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the tour');
    } finally {
      setLoading(false);
      setProgressStage(null);
    }
  };

  // Auto-trigger search if URL has query parameter
  useEffect(() => {
    const queryParam = searchParams.get('q');
    const stopsParam = searchParams.get('stops');
    const modelParam = searchParams.get('model');
    if (queryParam && !tour && !loading) {
      handleSearch(
        queryParam,
        stopsParam ? parseInt(stopsParam) : 7,
        modelParam || 'google/gemini-2.5-flash'
      );
    }
  }, []); // Only run on mount

  return (
    <div className="app">
      <header className="header">
        <h1>Smart Walking Tour Planner</h1>
        <p>Discover amazing places with AI-powered walking tours</p>
      </header>

      {!tour && <SearchForm onSearch={handleSearch} isLoading={loading} />}

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && <Loading progressStage={progressStage} />}

      {tour && !loading && <TourResults tour={tour} />}
    </div>
  );
}

export default App;
