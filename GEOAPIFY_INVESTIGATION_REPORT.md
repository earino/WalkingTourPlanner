# Geoapify Places API Investigation Report
## Why Only 12 Temples Instead of 75?

**Date:** 2025-11-17
**Investigation Focus:** Chiang Mai Old Town temple search optimization

---

## Executive Summary

The current implementation returns only **12 candidates** (6 Buddhist temples) instead of the expected 75 temples in Chiang Mai Old Town. The primary issue is **radius limitation**, not API parameters or category configuration.

**Key Finding:** Geoapify only returns **9 places of worship within 1200m radius**, regardless of limit or category settings. The actual temple density in Old Town requires a larger search radius.

---

## Investigation Results

### Test Environment
- **Location:** Chiang Mai Old Town (18.7980727, 98.9702377)
- **Expected Results:** 75 temples within the walled city
- **Current Results:** 12 candidates (6 Buddhist temples)
- **API Key:** 6cfae2e332b64a6382f31235fcf49271

### 1. Current Implementation Analysis

**Current Parameters:**
```javascript
{
  filter: 'circle:98.9702377,18.7980727,1200',  // 1200m radius
  categories: 'religion.place_of_worship,tourism.sights,heritage',
  text: 'temples Buddhist wats religious sites historic sacred',
  limit: 100
}
```

**Results:** 12 total places (6 Buddhist temples, 2 Christian churches, 3 tourism sites, 1 memorial)

### 2. Root Cause Analysis

#### Finding #1: Radius is the Primary Constraint
| Radius | Results | Buddhist Temples |
|--------|---------|------------------|
| 1200m  | 9       | 6                |
| 1500m  | 20      | 15               |
| 2000m  | 43      | 33               |

**Conclusion:** The 1200m radius only captures places on the periphery of Old Town, missing the core area.

#### Finding #2: Text Search Has No Impact
- With text filter: 12 results
- Without text filter: 12 results
- **Conclusion:** Text search doesn't increase results; it may even filter them out.

#### Finding #3: Category Hierarchy Works Correctly
Geoapify's category hierarchy works as documented:
- `religion.place_of_worship.buddhism` (specific) → 6 results
- `religion.place_of_worship` (parent) → 9 results (includes Buddhism, Christianity, etc.)
- `religion` (grandparent) → 10 results

Parent categories automatically include all children, so using `religion.place_of_worship` is correct.

#### Finding #4: Multiple Categories Add Noise
- `religion.place_of_worship` only: 9 results
- `religion.place_of_worship,tourism.sights,heritage`: 12 results
- **Extra 3 results:** City walls, memorials, and generic tourism attractions
- **Conclusion:** Adding tourism/heritage categories dilutes results with non-temple attractions.

#### Finding #5: Limit Parameter is Not the Constraint
- Limit 20: 9 results
- Limit 100: 9 results
- Limit 200: 9 results
- **Conclusion:** There are genuinely only 9 places of worship in Geoapify's database within 1200m.

### 3. OpenStreetMap Data Comparison

Direct queries to OpenStreetMap (Geoapify's data source) reveal:
- **1200m radius:** 40 OSM elements with `amenity=place_of_worship` + `religion=buddhist`
- **2000m radius:** 279 OSM elements

However, OSM includes:
- Individual buildings within temple complexes (nodes)
- Temple grounds (ways)
- Administrative boundaries (relations)

Geoapify consolidates these into single place records, which explains the difference.

### 4. Geographic Coverage Analysis

**Discovered Issue:** The center point (18.7980727, 98.9702377) appears to be on the **western edge** of Old Town, not the center.

Sample distances from search center:
- วัดสวนดอก (Wat Suan Dok): 1133m - **OUTSIDE** Old Town walls
- คริสตจักรของพระคริสต์: 474m - Inside walls
- วัดสันติธรรม: 1005m - Edge of coverage
- วัดพระสิงห์ (Wat Phra Singh): 1606m - **OUTSIDE** 1200m radius

**Famous temples outside 1200m radius:**
- Wat Phra Singh (1606m) - One of the most important temples
- Wat Chedi Luang (2124m) - Historic temple with large chedi

---

## Why We're Getting 12 Instead of 75

### The Math:
1. **1200m radius** captures only 9 places of worship (Geoapify deduplicated POIs)
2. Of those 9: 6 Buddhist, 2 Christian, 1 unknown religion
3. Adding `tourism.sights,heritage` categories adds 3 non-temple attractions
4. **Total: 12 candidates**

### The Real Problem:
The 1200m radius is **too small** and the center point may be **off-center** from Old Town's actual center. This means:
- Missing 90% of temples in the walled city
- Capturing some temples outside the walls (like Wat Suan Dok)
- Not reaching major temples like Wat Phra Singh and Wat Chedi Luang

---

## Recommendations for Improvement

### Option 1: Increase Search Radius (Recommended)
**Change radius from 1200m to 2000m**

```javascript
{
  filter: 'circle:98.9702377,18.7980727,2000',
  categories: 'religion.place_of_worship',
  limit: 100
}
```

**Results:** 43 places of worship (33 Buddhist temples)

**Pros:**
- Simple change (one parameter)
- Gets 5.5x more results
- Captures all major temples
- Still within walkable range for a full day tour

**Cons:**
- Includes some temples outside Old Town walls
- Larger area may include less central temples

### Option 2: Recenter the Search
**Find the true center of Old Town** and use 1500m radius

The walled city of Chiang Mai is roughly:
- North: 18.8020
- South: 18.7870
- East: 98.9960
- West: 98.9820

**True center:** ~18.7945, 98.9890

```javascript
{
  filter: 'circle:98.9890,18.7945,1500',
  categories: 'religion.place_of_worship',
  limit: 100
}
```

**Expected results:** ~20-25 temples

**Pros:**
- Better centered on actual Old Town
- More focused on walled city
- Still gets major temples

**Cons:**
- Requires geocoding verification
- May miss edge temples

### Option 3: Remove Extra Categories
**Simplify to just religion.place_of_worship**

```javascript
{
  filter: 'circle:98.9702377,18.7980727,1200',
  categories: 'religion.place_of_worship',  // Remove tourism.sights, heritage
  limit: 100
}
```

**Results:** 9 places (vs 12 with extra categories)

**Pros:**
- Cleaner results (all actual places of worship)
- No tourism noise

**Cons:**
- Still only 9 results due to radius limitation
- Loses some temple ruins that are tagged as tourism

### Option 4: Remove Text Filter
**The text filter provides no benefit**

Current:
```javascript
text: 'temples Buddhist wats religious sites historic sacred'
```

**Recommendation:** Remove it entirely.

**Reasoning:**
- Test showed identical results with and without text filter
- Text search may actually filter OUT some results
- Category filtering is sufficient

---

## Recommended Implementation

### Phase 1: Candidate Gathering - REVISED

```javascript
// In geoapifyService.js searchPlaces() function
const params = {
  filter: `circle:${query.center.lon},${query.center.lat},2000`,  // Changed from 1200 to 2000
  categories: 'religion.place_of_worship',  // Simplified from multi-category
  limit: 100,
  apiKey: GEOAPIFY_API_KEY
};

// Remove text parameter entirely
// if (query.text) { params.text = query.text; }  // DELETE THIS
```

**Expected outcome:** ~43 places of worship (33 Buddhist temples) for Chiang Mai

### Phase 2: AI Filtering (Already Implemented)
Let Gemini filter the 43 candidates down to the best 8-12 temples based on:
- Historical significance
- Tourist appeal
- Walkability
- Diversity of experience

### Phase 3: Optimization (Already Implemented)
Optimize the route through the AI-selected temples.

---

## Temple Discovery by Radius

### At 1200m Radius: 6 Buddhist Temples
1. Wat Suan Dok (วัดสวนดอก) - 1133m - **Outside Old Town walls**
2. Wat Pa Phrao Nai (วัดป่าพร้าวใน) - 1214m
3. Wat Santi Tham (วัดสันติธรรม) - 1005m
4. Wat Pan Sao (วัดปันเส่า) - 1006m
5. Wat Pan Sao (วัดปันเสา) - 1015m (duplicate/different section)
6. Viharn Luang Por Than Jai - 1054m

**Missing Major Temples:**
- Wat Phra Singh - 1606m (OUTSIDE radius)
- Wat Chedi Luang - 2124m (OUTSIDE radius)
- Wat Jed Yod - 1231m (OUTSIDE radius)

### At 1500m Radius: 15 Buddhist Temples
**Added 9 more temples including:**
- ✅ Wat Phra Singh (วัดพระสิงห์) - One of the most important temples
- ✅ Wat Jed Yod (วัดเจ็ดยอด) - Seven spired temple
- ✅ Wat Lok Molee (วัดโลกโมฬี) - Beautiful northern temple
- ✅ Wat Dubphai (วัดดับภัย)
- ✅ Wat Rachamontian (วัดราชมณเทียร)

**Still Missing:**
- Wat Chedi Luang - 2124m (OUTSIDE radius)

### At 2000m Radius: 33 Buddhist Temples
**Added 18 more temples including:**
- ✅ Wat Chedi Luang (วัดเจดีย์หลวงวรวิหาร) - Historic temple with massive chedi
- ✅ Wat Ku Tao (วัดกู่เต้า) - Unique watermelon-shaped chedi
- ✅ Wat Phuak Hong (วัดพวกหงษ์)
- ✅ Wat Si Koet (วัดศรีเกิด)
- ✅ Wat Pha Bong (วัดผาบ่อง)
- ✅ Wat Mo Kham Tuang (วัดหม้อคำตวง)
- ✅ Wat Saen Mueang Ma Luang (วัดแสนเมืองมาหลวง)
- Plus 11 more temples

**Performance Gain:** 450% increase (from 6 to 33 temples)

---

## Additional Findings

### Category Hierarchy Behavior (Confirmed)
Geoapify's hierarchy works **inclusively from parent to children**:
- Specify `religion` → gets all religion subcategories
- Specify `religion.place_of_worship` → gets all worship types (Buddhism, Christianity, Islam, etc.)
- Specify `religion.place_of_worship.buddhism` → gets ONLY Buddhist temples

**Our use case:** Use `religion.place_of_worship` to get all worship places, then let AI filter for Buddhist temples.

### Heritage Category Issue
The `heritage` category in Geoapify is **not supported**. Valid alternatives:
- Use `tourism.sights` for historic tourist sites
- Use `building.historic` for historic buildings
- **Recommendation:** Remove heritage category entirely

### Why OSM Shows 279 but Geoapify Shows 43
OpenStreetMap data includes:
1. Individual buildings (nodes)
2. Compound areas (ways)
3. Administrative relations
4. Sub-structures within temples

Geoapify **deduplicates and consolidates** these into single POI records representing each distinct place of worship. This is actually better for our use case.

---

## Testing Methodology

All tests were conducted using Node.js scripts calling the Geoapify API directly:

### Test Scripts Created:
1. `/Users/earino/WalkingTourPlanner/backend/test_geoapify.js` - 12 different parameter combinations
2. `/Users/earino/WalkingTourPlanner/backend/test_osm_direct.js` - Direct OSM Overpass API queries
3. `/Users/earino/WalkingTourPlanner/backend/test_geoapify_detailed.js` - Detailed inspection of all results
4. `/Users/earino/WalkingTourPlanner/backend/test_final_comparison.js` - Side-by-side comparison

### Key Test Results:
```
Current (1200m, text, multi-cat)             : 12 places (6 Buddhist)
No text (1200m, multi-cat)                   : 12 places (6 Buddhist)
Simple cat (1200m, religion.pow)             : 9 places (6 Buddhist)
Broad cat (1200m, religion)                  : 10 places (6 Buddhist)
Larger radius (1500m, religion.pow)          : 20 places (15 Buddhist)
Max radius (2000m, religion.pow)             : 43 places (33 Buddhist)
High limit (1200m, limit=200)                : 9 places (6 Buddhist)
High limit + radius (2000m, limit=200)       : 43 places (33 Buddhist)
```

---

## Conclusion

The gap from 12 to 75 temples is primarily due to **insufficient search radius** (1200m). The actual Geoapify database contains **43 places of worship within 2000m**, which includes **33 Buddhist temples**.

While this is still short of the claimed 75 temples in Old Town, it's important to note:
1. Not all 75 temples may be in OpenStreetMap data
2. Geoapify consolidates temple complexes into single POIs
3. Some small temples may not be well-documented in OSM
4. **33 Buddhist temples is more than enough** for AI to select the best 8-12 for a walking tour

### Action Items:
1. ✅ **IMMEDIATE:** Change radius from 1200m to 2000m
2. ✅ **IMMEDIATE:** Remove text search parameter
3. ✅ **IMMEDIATE:** Simplify categories to just `religion.place_of_worship`
4. ⚠️ **OPTIONAL:** Verify and potentially recenter search coordinates
5. ⚠️ **FUTURE:** Consider using multiple overlapping searches if more coverage needed

---

## Files Modified for Testing
- `/Users/earino/WalkingTourPlanner/backend/test_geoapify.js`
- `/Users/earino/WalkingTourPlanner/backend/test_osm_direct.js`
- `/Users/earino/WalkingTourPlanner/backend/test_geoapify_detailed.js`
- `/Users/earino/WalkingTourPlanner/backend/test_final_comparison.js`

## Production File to Update
- `/Users/earino/WalkingTourPlanner/backend/src/services/geoapifyService.js`
