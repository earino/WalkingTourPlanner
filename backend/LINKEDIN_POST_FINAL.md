# Building a Temple Tour with AI: When Theory Meets Reality

I'm spending the rest of the year in Thailand, building things and enjoying my time with Leigh. I'm currently in Chiang Mai at Yellow, an excellent co-working space in Nimman. Highly recommend both. Leigh and I chose Nimman over the historic Old Town because it's easier for actually living here, but visiting Old Town is incredibly rewarding—it's packed with Buddhist temples. So many that I couldn't help wondering: "What's the optimal strategy for visiting ALL the identifiable temples in Old Town?" Obviously what anyone would do.

So using Claude Code, ChatGPT, and a bunch of APIs I'll detail below, I built a comprehensive walking tour of every Buddhist temple in Chiang Mai's Old Town moat. With AI. In an afternoon. Here's why this turned out to be more technically interesting than I expected, and what it revealed about the gap between algorithmic optimization and real-world constraints.

## Act 1: Defining "Inside the Moat"

**The Challenge:** Chiang Mai's Old Town is bounded by an ancient moat. But what exactly are the boundaries?

"The moat boundaries" is too vague. Geocoding services need precise coordinates. I found historical records with exact corner coordinates:
- NW: Hua Lin Corner (18.795672°N, 98.978594°E)
- NE: Si Phum Corner (18.795250°N, 98.993611°E)
- SE: Katam Corner (18.781306°N, 98.992736°E)
- SW: Ku Hueang Corner (18.781625°N, 98.977986°E)

Claude created a JavaScript utility `isWithinOldTownMoat(lat, lon)` with simple bounding box checking, then generated an interactive Leaflet.js map with pins at each corner.

"Does this look right?"

My response: "nailed it."

This back-and-forth established ground truth: a precise 1.55km × 1.60km rectangle. Everything else built on this foundation.

## Act 2: The Geocoding Disaster

I gave Claude a list of 76 temple names from ChatGPT.

Claude's approach: "I'll geocode all 76 temples using Geoapify API!"

**Result:**
- API success rate: 76/76 (100%)
- Actual accuracy: 26/76 geocoded to EXACTLY the same coordinates
- That coordinate: Generic "Chiang Mai City Municipality" (18.7882778, 98.9858802)

The temples are densely packed in Chiang Mai, but not like that. The API succeeded but returned useless data.

**First fix: "Try Thai script names!"**

Claude attempted geocoding with Thai script (วัดบุปผาราม instead of "Wat Buppharam"). Results:
- Wat Khuan Khama → Found in Phuket (800km away)
- Wat Buppharam → Found in Mae Rim (outside Old Town)
- 9 temples → All matched "TCDC Chiang Mai" cultural center (wrong)

Why it failed: Thai temple names are common across Thailand. Without geographic constraints, you get a different Wat Buppharam in a different city.

**What actually worked:** Me, manually verifying each temple via Google Maps.

**Discoveries:**
- Spelling variations: "Wat Sadeu Muang Inthakin" → Google Maps shows "Wat Inthakhin Sadue Muang" (words completely reordered!)
- Duplicates: "Wat Sai Moon Myanmar" and "Wat Sai Moon Muang" were the SAME temple
- Non-temples: "Wat Yuparaj Wittayalai" turned out to be a high school
- Many temples were legitimately outside the moat boundaries

**Final count:** 31 verified temples (from 76 original). Where "manually validated" means I copy-pasted each name into Google Maps, verified it was actually a temple in Chiang Mai Old Town, gave Claude the corrected spelling or address, and we moved forward.

## Act 3: The Traveling Salesman Problem

Now for the fun math: What's the optimal route through 31 temples?

**Naive brute force approach:**
- Try all possible routes
- Complexity: O(n!) = 31! = 8.2 × 10^33 possible routes
- Computation time: approximately 10^21 years
- For reference: the universe is only 13.8 × 10^9 years old
- **Completely infeasible**

**Our solution: Greedy initialization + 2-opt refinement**

Step 1: Greedy nearest-neighbor (fast but suboptimal)
Step 2: Iterative 2-opt improvement - try reversing segments to reduce distance
Step 3: Test all possible starting temples, keep the best

Complexity: O(n² × iterations × n) ≈ O(n³) - actually computable
Typical convergence: around 100 iterations
Result: Found a 6.83km route vs 15-20km naive routing

**Critical insight:** TSP gives you the SEQUENCE of temples to visit, not the actual walking path between them.

## Act 4: From Math to Reality

**TSP output:** Visit temples in this order: [Temple A, Temple B, Temple C...]

**What's missing:** How do you actually WALK from Temple A to Temple B? TSP uses straight-line distance. Real walking follows streets.

**Enter Geoapify Routing API:**

For each temple pair in our sequence, Geoapify returns:
- Actual street paths (following real roads)
- Turn-by-turn directions with Thai street names
- Elevation changes at each step
- MultiLineString geometry along walkable paths

**The combination:**
1. TSP finds optimal SEQUENCE (minimizes straight-line distance)
2. Geoapify finds walkable PATHS (following streets)
3. Result: Mathematically optimized sequence + practically navigable directions

**Output for the initial "optimal" route:**
- 30 route legs (between 31 temples)
- Approximately 175 turn-by-turn navigation steps
- 11km actual walking distance (vs 6.83km straight-line)
- Only 5m elevation gain (Chiang Mai Old Town is remarkably flat)

## Act 5: The Reality Check

**The problem:** Our "optimal" route started at Wat Pha Khao, which is in the middle of the old town.

**The question:** How do visitors actually GET to Wat Pha Khao?

**The realization:** Real visitors don't teleport to the optimal starting point. They enter Old Town through one of four moat gates.

This meant we needed 4 different tours, each optimized from a realistic entry point.

**First attempt:** Used the moat corner coordinates as gate locations.

**First mistake:** Gates aren't at the corners! They're at the CENTER of each side of the moat. We were starting tours 200-400m away from where visitors actually enter.

**Corrected gate coordinates:**
- North: Chang Phuak Gate (18.795407°, 98.986578°)
- East: Tha Phae Gate (18.788749°, 98.993208°)
- South: Chiang Mai Gate (18.781205°, 98.986598°)
- West: Suan Dok Gate (18.788781°, 98.978186°)

**Lesson:** Verify assumptions about "ground truth" even when you have precise coordinates. Corners are not gates.

## Act 6: The Great Algorithm Showdown

With forced starting points (the gates), we faced a question: **Is 2-opt optimization worth the added complexity?**

**Algorithm 1: Pure Greedy Nearest-Neighbor**
```javascript
function greedyFromStart(temples, startTemple) {
  route = [startTemple];
  current = startTemple;

  while (unvisited.length > 0) {
    nearest = findClosest(current, unvisited);
    route.push(nearest);
    current = nearest;
  }
  return route;
}
```
- Complexity: O(n²)
- Fast, simple, intuitive
- Builds a route with natural geographic flow

**Algorithm 2: Greedy + 2-Opt with Fixed Start**
```javascript
function optimizeWithFixedStart(temples, startTemple) {
  route = greedyFromStart(temples, startTemple);

  // Improve with 2-opt, but keep position 0 fixed
  while (improved) {
    for (i = 1; i < n-1; i++) {      // Start at 1, not 0!
      for (j = i+2; j < n; j++) {
        if (reversing segment [i...j] reduces distance):
          reverse it;
      }
    }
  }
  return route;
}
```
- Complexity: O(n² × iterations) - about 100 iterations typical
- More sophisticated
- Potentially better optimization

**The Hypothesis:** 2-opt should improve routes by around 5-10% based on typical TSP literature.

## The First Test: Theoretical (TSP) Improvement

We measured straight-line TSP distances for both algorithms across all 4 gates:

```
GATE         GREEDY    2-OPT     TSP IMPROVEMENT
North Gate   8.40 km   7.41 km   11.75%
East Gate    8.11 km   7.19 km   11.37%
South Gate   7.80 km   7.20 km   7.78%
West Gate    7.60 km   7.51 km   1.12%

AVERAGE: 8.01% improvement
```

**Initial conclusion:** 2-opt is worth it! Especially for North and East gates.

## The Second Test: Reality (Actual Walking) Check

But wait. TSP optimizes straight-line distance. We care about actual walking distance on real streets.

**The crucial experiment:** For each algorithm and each gate, call Geoapify to get ACTUAL walking distances, then compare.

```
GATE     GREEDY      2-OPT       TSP      ACTUAL
         (actual)    (actual)    IMPROV   IMPROV    DELTA
North    12.75 km    11.61 km    11.75%   8.90%     -2.84pp
East     12.15 km    11.38 km    11.37%   6.35%     -5.02pp
South    12.59 km    11.66 km    7.78%    7.34%     -0.44pp
West     11.22 km    11.41 km    1.12%    -1.71%    -2.83pp

AVERAGE:                         8.01%    5.22%     -2.78pp
```

**The shocking finding:** For the West gate, 2-opt produced a WORSE actual walking route (-1.71%)!

## Why 2-Opt Can Lose in Practice: A Theoretical Explanation

**The core issue:** 2-opt optimizes for Euclidean distance (straight lines). We care about graph distance (walking on streets). These are fundamentally different metrics.

**Simple example on a grid:**

Greedy route: A → B → C → D
- Go north 2 blocks, east 2 blocks, north 1 block
- Straight-line: 5.0 units
- Actual walking: 5 blocks

2-opt "improved" route: A → C → B → D
- Straight-line: 4.7 units (better!)
- But requires: north 3 blocks, backtrack SOUTH 1 block, then east 2 blocks
- Actual walking: 6 blocks (worse!)

**Why this happens:**

1. **Greedy builds directionally consistent routes** - naturally aligns with street grids
2. **2-opt can create backtracking patterns** - looks good on paper, bad on streets
3. **Street networks violate TSP assumptions** - triangle inequality doesn't hold for graph distance

In Euclidean space: distance(A,B) + distance(B,C) ≥ distance(A,C) always

On street networks: streetDist(A,B) + streetDist(B,C) might be LESS than streetDist(A,C) if the direct route requires a major detour!

**The West gate case:** Greedy's simpler path happened to align perfectly with Chiang Mai's street layout in that area. 2-opt's mathematical "improvement" forced awkward turns that added distance on real streets.

**Is 2-opt worth using?**

On average, yes: 5.22% real-world improvement across 4 gates. But it's not guaranteed. For 3 out of 4 gates it helped (6-9% improvement). For 1 gate it hurt (-1.71%).

**The ideal solution** would optimize directly on the street network graph, but that would require calling the routing API for every potential edge during optimization—computationally prohibitive with thousands of API calls.

## AI Building AI Tools

Meta moment: I used Claude (Anthropic's AI) to build a tour generator that queries Gemini (Google's AI) for temple descriptions.

**First attempt:** "Generate descriptions for all 31 temples at once"
- Result: Malformed JSON (AI model overwhelmed)

**Solution:** Batch processing
- Split into 4 batches of approximately 10 temples
- 3-second delays between batches for rate limiting
- Each batch given context about its position in the overall tour
- Success rate: 100%

**Second challenge:** The descriptions were too flowery.

"Our spiritual odyssey begins at this tranquil sanctuary where ancient whispers echo through time..."

Not enough factual information!

**The fix:**
- Pre-researched 10 major temples via Wikipedia (founding dates, measurements, historical events)
- Set temperature to 0.3 (more factual, less creative)
- Explicit prompt: "NO flowery language. Include: founding dates, measurements, royal patrons, architectural styles"

**Result:** "Founded 1391 by King Saen Muang Ma for his father's ashes, completed 1475 at 85m tall, housed the Emerald Buddha 1468-1551, upper 30m collapsed in 1545 earthquake, reconstructed 1990s with UNESCO support."

## The Human-AI Collaboration

**What AI excelled at:**
- Geocoding 76 temples in minutes via API calls
- TSP optimization (efficiently searching 10^33 possible routes)
- Orchestrating multiple APIs (Geoapify routing for 4 different tours)
- Generating 31 factual descriptions in batches
- Creating interactive Leaflet.js visualizations

**Where humans were essential:**
- Validation: "26 temples have identical coordinates—that's wrong"
- Domain knowledge: "That's a school, not a temple!"
- Spelling corrections: Finding "Wat Inthakhin Sadue Muang" when AI searched "Wat Sadeu Muang Inthakin" (words reordered)
- Real-world constraints: "Visitors enter through gates, not random middle points"
- Aesthetic judgment: "Less poetry, more founding dates"
- Ground truth verification: "Those are moat corners, not gate centers"

Neither could have built this alone efficiently. AI can't validate its own output against reality. Humans can't optimize 31! routes or orchestrate parallel API calls at scale.

## Key Learnings

**1. Successful API calls ≠ successful results**
76/76 geocoding calls succeeded, but 26 returned useless data. Success metrics can be misleading.

**2. Optimizing the wrong metric produces wrong results**
TSP predicted 8% improvement, actual walking showed 5.22%. One gate got worse. Theory and practice diverge when your optimization metric differs from your actual objective.

**3. Real-world constraints invalidate "optimal" solutions**
The mathematically perfect route starting in the middle of town is useless if visitors enter from edges.

**4. Ground truth requires verification at every level**
Even with "verified historical coordinates," we confused corners with gates and started tours in the wrong places.

**5. Sometimes simpler is better**
West gate's greedy route outperformed the "optimized" 2-opt route because its straightforward path aligned better with the street network.

## The Result

Live interactive temple pilgrimage tours:
https://earino.github.io/WalkingTourPlanner/chiang-mai-temple-tour.html

**Features:**
- Choose your starting gate (North/East/South/West)
- 31 hand-verified temples with factual historical descriptions
- Greedy+2opt optimized sequences (5.22% average improvement in actual walking)
- 11.22-12.75km per tour depending on gate and algorithm
- 170+ turn-by-turn walking directions per route
- Click "Navigate Here" opens Google Maps from your current location
- 4 different tour variants optimized for realistic entry points

**Tech Stack:**
- Geoapify API (geocoding & routing)
- TSP with greedy initialization + 2-opt refinement
- OpenRouter + Gemini 2.5 Flash (AI descriptions, temperature 0.3)
- Leaflet.js (interactive maps)
- GitHub Actions (auto-deployment)
- Claude Code (AI pair programmer)

Built collaboratively in an afternoon.

**Try the tour:** https://earino.github.io/WalkingTourPlanner/chiang-mai-temple-tour.html

**Source code:** https://github.com/earino/WalkingTourPlanner

The gap between algorithmic optimization and real-world walking distance taught me more about the limits of mathematical modeling than I expected. Sometimes the "optimal" solution isn't optimal at all.

---

#AI #SoftwareEngineering #HumanAICollaboration #TSP #Algorithms #TravelTech #ChiangMai #MachineLearning
