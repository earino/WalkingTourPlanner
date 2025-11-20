/**
 * Chiang Mai Old Town Moat Boundaries
 *
 * Precise corner coordinates of the moat:
 * - NW Corner (Hua Lin Corner / Jaeng Hua Rin): 18.795672° N, 98.978594° E
 * - NE Corner (Si Phum Corner / Jaeng Si Phum): 18.795250° N, 98.993611° E
 * - SE Corner (Katam Corner / Jaeng Katam): 18.781306° N, 98.992736° E
 * - SW Corner (Ku Hueang Corner / Jaeng Ku Hueang): 18.781625° N, 98.977986° E
 *
 * Dimensions: ~1.6km × 2.0km (matching historical records)
 */

// Store the exact corner coordinates
export const MOAT_CORNERS = {
  northwest: { lat: 18.795672, lon: 98.978594, name: 'Hua Lin Corner (Jaeng Hua Rin)' },
  northeast: { lat: 18.795250, lon: 98.993611, name: 'Si Phum Corner (Jaeng Si Phum)' },
  southeast: { lat: 18.781306, lon: 98.992736, name: 'Katam Corner (Jaeng Katam)' },
  southwest: { lat: 18.781625, lon: 98.977986, name: 'Ku Hueang Corner (Jaeng Ku Hueang)' }
};

// Bounding box derived from exact corner coordinates
export const OLD_TOWN_MOAT_BBOX = {
  west: 98.977986,   // SW/NW corners
  south: 18.781306,  // SE corner (southernmost)
  east: 98.993611,   // NE corner (easternmost)
  north: 18.795672   // NW corner (northernmost)
};

/**
 * Check if a coordinate is within the Chiang Mai Old Town moat area
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} - True if the coordinate is within the moat boundaries
 */
export function isWithinOldTownMoat(lat, lon) {
  return (
    lon >= OLD_TOWN_MOAT_BBOX.west &&
    lon <= OLD_TOWN_MOAT_BBOX.east &&
    lat >= OLD_TOWN_MOAT_BBOX.south &&
    lat <= OLD_TOWN_MOAT_BBOX.north
  );
}

/**
 * Get a human-readable description of the moat boundaries
 * @returns {string} - Description of the boundaries
 */
export function getMoatBoundariesDescription() {
  const width = (OLD_TOWN_MOAT_BBOX.east - OLD_TOWN_MOAT_BBOX.west) * 111.320 * Math.cos(18.781 * Math.PI / 180);
  const height = (OLD_TOWN_MOAT_BBOX.north - OLD_TOWN_MOAT_BBOX.south) * 111.320;

  return `Chiang Mai Old Town Moat Area
    Bounding Box: [${OLD_TOWN_MOAT_BBOX.west}, ${OLD_TOWN_MOAT_BBOX.south}, ${OLD_TOWN_MOAT_BBOX.east}, ${OLD_TOWN_MOAT_BBOX.north}]
    Approximate dimensions: ${width.toFixed(2)} km × ${height.toFixed(2)} km`;
}
