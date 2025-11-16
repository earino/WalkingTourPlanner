import { useState } from 'react';
import SearchForm from './components/SearchForm';
import TourResults from './components/TourResults';
import Loading from './components/Loading';
import { createTour } from './services/api';
import './styles/App.css';

function App() {
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    setTour(null);

    try {
      const response = await createTour(query);
      if (response.success) {
        setTour(response.tour);
      } else {
        setError(response.error || 'Failed to create tour');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the tour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Smart Walking Tour Planner</h1>
        <p>Discover amazing places with AI-powered walking tours</p>
      </header>

      <SearchForm onSearch={handleSearch} isLoading={loading} />

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && <Loading />}

      {tour && !loading && <TourResults tour={tour} />}
    </div>
  );
}

export default App;
