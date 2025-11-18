import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Create a new walking tour
 */
export async function createTour(query) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/tours/create`, {
      query
    });
    return response.data;
  } catch (error) {
    console.error('Error creating tour:', error);
    throw new Error(error.response?.data?.error || 'Failed to create tour');
  }
}

/**
 * Create tour with real-time progress updates via Server-Sent Events
 */
export function createTourWithProgress(query, maxStops = 7, model = 'google/gemini-2.5-flash', onProgress) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const encodedModel = encodeURIComponent(model);
    const eventSource = new EventSource(`${API_BASE_URL}/api/tours/create-stream?query=${encodedQuery}&maxStops=${maxStops}&model=${encodedModel}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.stage === 'complete') {
          eventSource.close();
          resolve({ success: true, tour: data.tour });
        } else if (data.stage === 'error') {
          eventSource.close();
          reject(new Error(data.error));
        } else {
          // Progress update
          if (onProgress) onProgress(data);
        }
      } catch (error) {
        eventSource.close();
        reject(error);
      }
    };

    eventSource.onerror = (error) => {
      eventSource.close();
      reject(new Error('Connection lost'));
    };
  });
}

/**
 * Get place details
 */
export async function getPlaceDetails(name, lat, lon) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/tours/place-details`, {
      params: { name, lat, lon }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting place details:', error);
    throw new Error(error.response?.data?.error || 'Failed to get place details');
  }
}
