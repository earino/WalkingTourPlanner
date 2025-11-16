import axios from 'axios';

const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';

/**
 * Search Wikipedia for articles related to a place name
 */
export async function searchWikipedia(placeName) {
  try {
    const response = await axios.get(WIKIPEDIA_API_URL, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: placeName,
        format: 'json',
        srlimit: 1
      }
    });

    if (response.data.query.search.length > 0) {
      const pageId = response.data.query.search[0].pageid;
      const title = response.data.query.search[0].title;

      // Get extract and thumbnail
      const detailsResponse = await axios.get(WIKIPEDIA_API_URL, {
        params: {
          action: 'query',
          pageids: pageId,
          prop: 'extracts|pageimages|info',
          exintro: true,
          explaintext: true,
          piprop: 'thumbnail',
          pithumbsize: 300,
          inprop: 'url',
          format: 'json'
        }
      });

      const page = detailsResponse.data.query.pages[pageId];

      return {
        title: page.title,
        extract: page.extract,
        url: page.fullurl,
        thumbnail: page.thumbnail?.source || null,
        pageId: pageId
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Wikipedia data:', error.message);
    return null;
  }
}

/**
 * Get Wikipedia article summary by coordinates
 */
export async function getWikipediaByCoordinates(latitude, longitude, radius = 1000) {
  try {
    const response = await axios.get(WIKIPEDIA_API_URL, {
      params: {
        action: 'query',
        list: 'geosearch',
        gscoord: `${latitude}|${longitude}`,
        gsradius: radius,
        gslimit: 1,
        format: 'json'
      }
    });

    if (response.data.query.geosearch.length > 0) {
      const pageId = response.data.query.geosearch[0].pageid;

      // Get extract and details
      const detailsResponse = await axios.get(WIKIPEDIA_API_URL, {
        params: {
          action: 'query',
          pageids: pageId,
          prop: 'extracts|pageimages|info',
          exintro: true,
          explaintext: true,
          piprop: 'thumbnail',
          pithumbsize: 300,
          inprop: 'url',
          format: 'json'
        }
      });

      const page = detailsResponse.data.query.pages[pageId];

      return {
        title: page.title,
        extract: page.extract,
        url: page.fullurl,
        thumbnail: page.thumbnail?.source || null,
        pageId: pageId
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Wikipedia data by coordinates:', error.message);
    return null;
  }
}
