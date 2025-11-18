import { useState } from 'react';

const EXAMPLE_QUERIES = [
  'temples in chiang mai old town',
  'museums in paris',
  'churches in rome',
  'parks in central london',
  'street art in berlin'
];

const AI_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini Flash ⭐', description: '$0.007/tour - Fast & reliable (default)' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', description: '$0.001/tour - Cheapest option' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: '$0.005/tour - OpenAI quality' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', description: '$0.003/tour - Strong general' }
];

export default function SearchForm({ onSearch, isLoading }) {
  const [query, setQuery] = useState('');
  const [maxStops, setMaxStops] = useState(7);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), maxStops, selectedModel);
    }
  };

  const handleExampleClick = (example) => {
    setQuery(example);
    onSearch(example, maxStops, selectedModel);
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
        <div className="search-controls">
          <label htmlFor="maxStops" className="stops-label">
            Number of stops:
            <select
              id="maxStops"
              value={maxStops}
              onChange={(e) => setMaxStops(parseInt(e.target.value))}
              disabled={isLoading}
              className="stops-select"
            >
              {[...Array(15)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="aiModel" className="stops-label">
            AI Model:
            <select
              id="aiModel"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isLoading}
              className="stops-select"
              style={{ minWidth: '200px' }}
            >
              {AI_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="search-button"
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? 'Creating Tour...' : 'Create Tour'}
          </button>
        </div>
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
