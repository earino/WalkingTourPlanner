import QRCode from 'qrcode';

/**
 * Generate QR code as Data URL (base64)
 */
export async function generateQRCode(text, options = {}) {
  const {
    width = 200,
    margin = 1,
    errorCorrectionLevel = 'M'
  } = options;

  try {
    const qrDataUrl = await QRCode.toDataURL(text, {
      width,
      margin,
      errorCorrectionLevel,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error.message);
    return null;
  }
}

/**
 * Generate Google Maps navigation URL for a route segment
 */
export function generateGoogleMapsUrl(fromPlace, toPlace) {
  const origin = `${fromPlace.latitude},${fromPlace.longitude}`;
  const destination = `${toPlace.latitude},${toPlace.longitude}`;

  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  const params = new URLSearchParams({
    origin,
    destination,
    travelmode: 'walking'
  });

  return `${baseUrl}&${params.toString()}`;
}

/**
 * Generate Google Maps navigation URL for the full tour
 */
export function generateFullTourMapsUrl(places) {
  if (!places || places.length === 0) return null;

  const origin = `${places[0].latitude},${places[0].longitude}`;
  const destination = `${places[places.length - 1].latitude},${places[places.length - 1].longitude}`;

  // Waypoints are all stops except first and last
  const waypoints = places.length > 2
    ? places.slice(1, -1).map(p => `${p.latitude},${p.longitude}`).join('|')
    : '';

  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  const params = new URLSearchParams({
    origin,
    destination,
    travelmode: 'walking'
  });

  if (waypoints) {
    params.append('waypoints', waypoints);
  }

  return `${baseUrl}&${params.toString()}`;
}

/**
 * Generate QR code for a Google Maps route segment
 */
export async function generateSegmentQRCode(fromPlace, toPlace, options = {}) {
  const mapsUrl = generateGoogleMapsUrl(fromPlace, toPlace);
  return await generateQRCode(mapsUrl, options);
}

/**
 * Generate QR code for the full tour
 */
export async function generateTourQRCode(places, options = {}) {
  const mapsUrl = generateFullTourMapsUrl(places);
  return mapsUrl ? await generateQRCode(mapsUrl, options) : null;
}

/**
 * Generate QR code for the web tour URL
 */
export async function generateWebTourQRCode(tourId, baseUrl = 'http://localhost:5173', options = {}) {
  const webUrl = `${baseUrl}?tour=${tourId}`;
  return await generateQRCode(webUrl, options);
}
