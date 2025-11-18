export default function Loading({ progressStage }) {
  const getStageMessage = () => {
    if (!progressStage) {
      return {
        title: 'Creating your perfect tour...',
        subtitle: 'Initializing search...'
      };
    }

    const stageMessages = {
      parsing: {
        title: 'Analyzing your search...',
        subtitle: 'Understanding what you\'re looking for'
      },
      geocoding: {
        title: 'Finding location...',
        subtitle: progressStage.message || 'Pinpointing coordinates'
      },
      searching: {
        title: 'Searching for places...',
        subtitle: 'Casting a wide net to find the best spots'
      },
      found: {
        title: progressStage.message || 'Found places!',
        subtitle: 'Analyzing results'
      },
      ranking: {
        title: 'AI ranking places...',
        subtitle: progressStage.message || 'Determining most relevant spots'
      },
      enhancing: {
        title: 'Enhancing with AI...',
        subtitle: progressStage.message || 'Gathering rich descriptions'
      },
      optimizing: {
        title: 'Optimizing route...',
        subtitle: 'Planning the perfect walking path'
      },
      routing: {
        title: 'Calculating directions...',
        subtitle: 'Creating turn-by-turn guidance'
      },
      finalizing: {
        title: 'Almost done...',
        subtitle: 'Creating tour overview'
      }
    };

    return stageMessages[progressStage.stage] || {
      title: 'Creating your perfect tour...',
      subtitle: progressStage.message || 'Processing...'
    };
  };

  const { title, subtitle } = getStageMessage();

  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <p className="loading-text">{title}</p>
      <p className="loading-subtext">{subtitle}</p>
    </div>
  );
}
