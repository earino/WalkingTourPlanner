export default function PlaceCard({ place, index }) {
  return (
    <div className="place-card">
      <div className="place-header">
        <div className="place-number">{index + 1}</div>
        <div className="place-info">
          <h3 className="place-name">{place.name}</h3>
          <p className="place-address">{place.address}</p>
        </div>
      </div>

      {place.aiDescription && (
        <p className="place-description">
          {place.aiDescription}
        </p>
      )}

      {place.wikiInfo && (
        <div className="place-wiki">
          <h4>About from Wikipedia</h4>
          <p>
            {place.wikiInfo.extract?.substring(0, 300)}
            {place.wikiInfo.extract?.length > 300 ? '...' : ''}
          </p>
          {place.wikiInfo.url && (
            <a
              href={place.wikiInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="place-wiki-link"
            >
              Read more on Wikipedia →
            </a>
          )}
        </div>
      )}

      {place.interestingFacts && (
        <div className="place-facts">
          <h4>Interesting Facts</h4>
          <div className="place-facts-content">
            {place.interestingFacts}
          </div>
        </div>
      )}
    </div>
  );
}
