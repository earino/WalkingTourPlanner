/**
 * Deduplicate places based on name similarity and geographic proximity
 */

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity ratio between two strings (0-1, where 1 is identical)
 */
function nameSimilarity(name1, name2) {
  const maxLen = Math.max(name1.length, name2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(name1.toLowerCase(), name2.toLowerCase());
  return 1.0 - (distance / maxLen);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Deduplicate places based on name similarity and proximity
 *
 * @param {Array} places - Array of place objects with name, latitude, longitude
 * @param {Object} options - Deduplication options
 * @returns {Array} - Deduplicated array of places
 */
export function deduplicatePlaces(places, options = {}) {
  const {
    nameSimilarityThreshold = 0.85,  // 85% similar names
    proximityThresholdMeters = 100,   // Within 100m
    requireBothConditions = false     // true = need BOTH similar name AND proximity
  } = options;

  const uniquePlaces = [];
  const duplicateLog = [];

  for (const place of places) {
    let isDuplicate = false;

    for (const existing of uniquePlaces) {
      // Calculate name similarity
      const similarity = nameSimilarity(place.name, existing.name);

      // Calculate geographic distance
      const distance = calculateDistance(
        place.latitude,
        place.longitude,
        existing.latitude,
        existing.longitude
      );

      // Check if it's a duplicate
      const namesSimilar = similarity >= nameSimilarityThreshold;
      const closeProximity = distance <= proximityThresholdMeters;

      const isDuplicateMatch = requireBothConditions
        ? (namesSimilar && closeProximity)
        : (namesSimilar || closeProximity);

      if (isDuplicateMatch) {
        isDuplicate = true;
        duplicateLog.push({
          removed: place.name,
          keptAs: existing.name,
          similarity: similarity.toFixed(2),
          distance: Math.round(distance) + 'm',
          reason: namesSimilar && closeProximity ? 'name+proximity' :
                  namesSimilar ? 'name' : 'proximity'
        });
        break;
      }
    }

    if (!isDuplicate) {
      uniquePlaces.push(place);
    }
  }

  // Log deduplication results
  if (duplicateLog.length > 0) {
    console.log(`\n🔍 DEDUPLICATION: Removed ${duplicateLog.length} duplicates:`);
    duplicateLog.forEach(dup => {
      console.log(`  ❌ "${dup.removed}" → ✓ Kept "${dup.keptAs}"`);
      console.log(`     (${dup.reason}: similarity=${dup.similarity}, distance=${dup.distance})`);
    });
  } else {
    console.log('\n✓ DEDUPLICATION: No duplicates found');
  }

  console.log(`  Result: ${places.length} → ${uniquePlaces.length} unique places`);

  return uniquePlaces;
}
