import { useState } from 'react';

const EXAMPLE_QUERIES = [
  'temples in chiang mai old town',
  'museums in paris',
  'churches in rome',
  'parks in central london',
  'street art in berlin'
];

export default function SearchForm({ onSearch, isLoading }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleExampleClick = (example) => {
    setQuery(example);
    onSearch(example);
  };

  return (
    <div className="search-section">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          className="search-input"
          placeholder="e.g., temples in chiang mai old town"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="search-button"
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? 'Creating Tour...' : 'Create Tour'}
        </button>
      </form>

      <div className="search-examples">
        <h3>Try these examples:</h3>
        <div className="example-tags">
          {EXAMPLE_QUERIES.map((example) => (
            <div
              key={example}
              className="example-tag"
              onClick={() => !isLoading && handleExampleClick(example)}
            >
              {example}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
