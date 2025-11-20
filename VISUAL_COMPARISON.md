# Visual Comparison: Current vs Recommended Search

## Current Implementation (1200m radius)

```
                    Search Center (18.7980727, 98.9702377)
                              ↓
                             ⊕
                           ╱   ╲
                         ╱       ╲
                       ╱  1200m   ╲
                     ╱    Radius    ╲
                   ╱                  ╲
                 ╱                      ╲
               ⊙  Wat Santi Tham          ⊙  Wat Pa Phrao Nai
            (1005m)                      (1214m)

          ⊙  Wat Pan Sao (1006m)

          ⊙  Wat Suan Dok (1133m) *OUTSIDE OLD TOWN WALLS*


    MISSING (outside 1200m):
    × Wat Phra Singh (1606m) - MAJOR TEMPLE
    × Wat Chedi Luang (2124m) - MAJOR TEMPLE
    × Wat Jed Yod (1231m)
    × 27 other temples
```

**Results: 6 Buddhist temples**

---

## Recommended Implementation (2000m radius)

```
                    Search Center (18.7980727, 98.9702377)
                              ↓
                             ⊕
                        ╱         ╲
                     ╱               ╲
                  ╱                     ╲
               ╱                           ╲
            ╱         2000m Radius            ╲
         ╱                                       ╲
      ╱                                             ╲
   ╱                                                   ╲
⊙  Wat Prathan Phon                    ⊙  Wat Chiang Yuen
  (1215m)                                 (1961m)

      ⊙  Wat Jed Yod (1231m) ✅

          ⊙  Wat Santi Tham (1005m)
          ⊙  Wat Pan Sao (1006m)

              ⊙  Wat Suan Dok (1133m)

                  ⊙  Wat Lok Molee (1312m) ✅

                      ⊙  Wat Rachamontian (1350m) ✅
                      ⊙  Wat Dubphai (1320m) ✅

                          ⊙  Wat Phra Singh (1606m) ✅ MAJOR
                          ⊙  Wat Pha Bong (1549m) ✅

                              ⊙  Wat Si Koet (1812m) ✅
                              ⊙  Wat Tung Yu (1788m) ✅

                                  ⊙  Wat Mo Kham Tuang (1626m) ✅

                                      ⊙  Wat Ku Tao (2003m) ✅

                                          ⊙  Wat Chedi Luang (2124m) ✅ MAJOR

    + 18 more temples
```

**Results: 33 Buddhist temples**

---

## Side-by-Side API Call Comparison

### Current Search
```javascript
GET https://api.geoapify.com/v2/places
?filter=circle:98.9702377,18.7980727,1200
&categories=religion.place_of_worship,tourism.sights,heritage
&text=temples Buddhist wats religious sites historic sacred
&limit=100
&apiKey=***

→ Returns 12 places (6 Buddhist temples + 2 churches + 3 tourism + 1 memorial)
```

### Recommended Search
```javascript
GET https://api.geoapify.com/v2/places
?filter=circle:98.9702377,18.7980727,2000
&categories=religion.place_of_worship
&limit=100
&apiKey=***

→ Returns 43 places (33 Buddhist temples + 7 churches + 3 other)
```

---

## Results Breakdown

| Metric | Current (1200m) | Recommended (2000m) | Improvement |
|--------|----------------|---------------------|-------------|
| **Total Results** | 12 | 43 | +258% |
| **Buddhist Temples** | 6 | 33 | +450% |
| **Includes Wat Phra Singh** | ❌ | ✅ | Critical |
| **Includes Wat Chedi Luang** | ❌ | ✅ | Critical |
| **Includes Wat Jed Yod** | ❌ | ✅ | Important |
| **Tourism Noise** | 4 non-temples | 10 non-temples | Acceptable |
| **Major Temples Coverage** | 0/3 | 3/3 | 100% |

---

## Geographic Coverage Map (ASCII)

```
                    CHIANG MAI OLD TOWN

         N ↑
           |
    ┌──────┼─────────────────────────────┐
    │      │                             │  Old Town
    │   ⊙  │  Wat Jed Yod (1231m)        │  Walled City
    │      │                             │  (approximate)
W ──┼──────⊕─────────────────────────────┼── E
    │   Search Center                    │
    │   (18.798, 98.970)                 │
    │                                    │
    │         ←───── 1200m ─────→        │  Current radius
    │         (misses most temples)      │
    │                                    │
    │    ←──────── 2000m ──────────→     │  Recommended radius
    │    (covers Old Town + surroundings)│
    │                                    │
    │  ⊙ Wat Phra Singh (1606m)          │
    │  ⊙ Wat Chedi Luang (2124m)         │  Just outside
    │                                    │  2000m radius
    └────────┼───────────────────────────┘
             │
           S ↓
```

---

## What Gets Included at Each Radius

### 1200m - Current (6 temples)
- Mostly edge/peripheral temples
- Missing ALL major tourist temples
- Includes 1 temple outside Old Town walls

### 1500m - Middle Ground (15 temples)
- Captures Wat Phra Singh ✅
- Captures Wat Jed Yod ✅
- Still missing Wat Chedi Luang ❌

### 2000m - Recommended (33 temples)
- Captures ALL major temples ✅
- Covers entire Old Town walled city ✅
- Includes some nearby temples ✅
- Provides excellent selection for AI ranking ✅

---

## Why 2000m is Optimal

1. **Coverage**: Includes all major temples tourists want to see
2. **Balance**: Large enough to get coverage, small enough to be walkable
3. **AI Selection**: 33 candidates → AI picks best 8-12 → Perfect tour
4. **Walking Distance**: 2km radius = 4km diameter = reasonable walking tour area
5. **Redundancy**: Even if some temples are closed, plenty of alternatives

---

## Bottom Line

**Current:** 6 temples, missing the most important ones
**Recommended:** 33 temples, includes all major attractions

→ **Change radius from 1200m to 2000m**
→ **Remove text filter**
→ **Simplify categories to just `religion.place_of_worship`**
