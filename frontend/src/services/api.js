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
