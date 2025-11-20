# Quick Fix Summary - Geoapify Temple Search

## The Problem
Current search returns only **12 candidates** (6 Buddhist temples) instead of expected 75.

## Root Cause
**Search radius is too small: 1200m only captures 6 temples**

## The Fix
Change **3 parameters** in `/Users/earino/WalkingTourPlanner/backend/src/services/geoapifyService.js`:

### BEFORE:
```javascript
const params = {
  filter: `circle:${query.center.lon},${query.center.lat},${query.radius || 5000}`,
  limit: limit,
  apiKey: GEOAPIFY_API_KEY
};

if (query.text) {
  params.text = query.text;
}

// Multiple categories
params.categories = 'religion.place_of_worship,tourism.sights,heritage';
```

### AFTER:
```javascript
const params = {
  filter: `circle:${query.center.lon},${query.center.lat},${query.radius || 2000}`,  // Change 1: 5000→2000
  limit: limit,
  apiKey: GEOAPIFY_API_KEY
};

// Change 2: REMOVE text search - it doesn't help
// if (query.text) {
//   params.text = query.text;
// }

// Change 3: Simplify categories
params.categories = 'religion.place_of_worship';  // Remove tourism.sights,heritage
```

## Expected Results

| Radius | Buddhist Temples | Notable Temples Included |
|--------|------------------|--------------------------|
| 1200m (OLD) | 6 | Missing Wat Phra Singh, Wat Chedi Luang |
| 2000m (NEW) | 33 | ✅ Includes all major temples |

**Improvement: 450% increase in candidates (6 → 33 temples)**

## Major Temples Now Included
- ✅ Wat Phra Singh - Most important temple in Old Town
- ✅ Wat Chedi Luang - Historic temple with massive chedi
- ✅ Wat Jed Yod - Seven spired temple
- ✅ Wat Lok Molee - Beautiful northern temple
- ✅ Wat Ku Tao - Unique watermelon-shaped chedi
- Plus 28 more temples

## Why This Works

1. **Radius 2000m**: Covers all of Old Town walled city + nearby temples
2. **Remove text filter**: Geoapify's text search doesn't increase results
3. **Simplify categories**:
   - `religion.place_of_worship` automatically includes all worship types
   - Removes tourism noise (city walls, memorials, etc.)
   - Keeps results focused on actual temples

## Implementation Steps

1. Edit `/Users/earino/WalkingTourPlanner/backend/src/services/geoapifyService.js`
2. Make the 3 changes above
3. Test with Chiang Mai Old Town query
4. Verify you get ~33 temples instead of 6

## Why We Still Don't Get All 75 Temples

While we improved from 6 to 33, we still don't reach 75 because:
1. **Geoapify consolidates** temple complexes into single POIs (not duplicates)
2. **OSM coverage**: Not all 75 temples may be in OpenStreetMap
3. **Small temples**: Very small or residential temples may not be tagged
4. **Deduplication**: Multiple buildings within one temple = one POI

**Good news:** 33 temples is MORE than enough for AI to select the best 8-12 for a walking tour.

## See Full Report
For detailed investigation, test results, and alternative options:
→ `/Users/earino/WalkingTourPlanner/GEOAPIFY_INVESTIGATION_REPORT.md`
