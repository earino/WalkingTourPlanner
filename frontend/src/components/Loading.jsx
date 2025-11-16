export default function Loading() {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <p className="loading-text">Creating your perfect tour...</p>
      <p className="loading-subtext">
        Searching locations, optimizing routes, and gathering information
      </p>
    </div>
  );
}
