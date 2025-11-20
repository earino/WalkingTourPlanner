# Building a Temple Pilgrimage with AI: Algorithms Meet Ancient Routes

I’m spending the rest of the year in Thailand, building things and enjoying my time with Leigh. I’m currently enjoying Chiang Mai and enjoying a great co-working space, Yellow in the Nimman. Highly recommend to both. Leigh and I decided to stay out here because it was an easier “living here simulator” than the historic Old Town. However, visiting the Old Town is really rewarding. It’s an amazing space packed with temples. Enough of them, that I couldn’t help but ask myself: “What are the optimal strategies for visiting all of the identifiable temples in Chiang Mai.” Obviously what anyone would do.

So, using Claude Code, Chat-GPT and a bunch of stuff I’ll cover later in this post, I built a comprehensive walking tour of every Buddhist temple in Chiang Mai's Old Town. With AI. In an afternoon. Here's why this was technically interesting to me and what I experienced in this human-AI collaboration.

## Part 1: What Even IS "Inside the Moat"? 🗺️

**The Challenge:** Chiang Mai's Old Town is bounded by an ancient moat. But what are the precise boundaries?

**First attempt:** "The moat boundaries" - too vague. Geocoding services need exact coordinates.

**Solution:** I provided Claude with verified historical corner coordinates:
- NW: Hua Lin Corner (18.795672°N, 98.978594°E)
- NE: Si Phum Corner (18.795250°N, 98.993611°E)
- SE: Katam Corner (18.781306°N, 98.992736°E)
- SW: Ku Hueang Corner (18.781625°N, 98.977986°E)

**Claude created:**
1. JavaScript utility: `isWithinOldTownMoat(lat, lon)` - simple bounding box check
2. Interactive Leaflet.js map with pins at each corner
3. Verification prompt: "Does this look right?"

**My response:** "nailed it." ✅

This back-and-forth established ground truth: a precise 1.55km × 1.60km rectangle. Everything else built on this foundation.

## Part 2: When Geocoding Goes Wrong 🎯

**The Setup:** I gave Claude a list of 76 temple names I got from ChatGPT.

**AI's approach:** "I'll geocode all 76 temples using Geoapify API!"

**Result:** 
- API calls: 76/76 successful ✅
- Actual accuracy: 26/76 geocoded to EXACTLY the same coordinates 😬 The temples are densely packed in Chiang Mai, but not like that.
- Location: Generic "Chiang Mai City Municipality" (18.7882778, 98.9858802)

**First fix attempt:** "Try Thai script names! (วัดบุปผาราม instead of 'Wat Buppharam')"

**Results:**
- Wat Khuan Khama → Found a temple in Phuket (800km away!)
- Wat Buppharam → Found in Mae Rim district (outside old town)
- 9 temples → All matched "TCDC Chiang Mai" cultural center (wrong!)

**Why it failed:** Thai temple names are common across Thailand. Without precise geographic constraints, you get the wrong Wat Buppharam.

**What actually worked:** Me, manually verifying each temple via Google Maps.

**Discoveries:**
- Spelling variations: "Wat Sadeu Muang Inthakin" → Google knows it as "Wat Inthakhin Sadue Muang" (words completely reordered!)
- Non-temples: "Wat Yuparaj Wittayalai" = high school, not a temple!
- Outside moat: Many temples from the original list were legitimately outside the boundaries

**Final count:** 31 verified temples (from 76 original) - all manually validated. Where manually validated means I copy/pasted the name into google, queried, minimally investigated that it was a temple in Chiang Mai, and told Claude we could continue.

## Part 3: The Traveling Salesman Problem 🧮

Now the fun math: **What's the optimal route through 31 temples?**

**Naive brute force:**
- Try all possible routes
- Complexity: O(n!) = 31! = 8.2 × 10³³ possible routes
- Time to compute: ~10²¹ years (universe is only 13.8 × 10⁹ years old)
- **Completely infeasible**

**Our solution: 2-opt algorithm with greedy initialization**

```javascript
// Step 1: Greedy nearest-neighbor (fast, suboptimal)
route = startFromNearestNeighbor(temples);

// Step 2: Iterative 2-opt improvement
while (improved && iterations < 100) {
  for each pair of edges (i, j):
    // Try reversing the segment between i and j
    newRoute = reverse(route, i, j);
    if (distance(newRoute) < distance(route)):
      route = newRoute;
      improved = true;
}

// Step 3: Try ALL temples as starting points
for each temple as startPoint:
  route = optimize(temples, startPoint);
  if (distance(route) < bestDistance):
    bestRoute = route;
```

**Results:**
- Complexity: O(n² × iterations) ≈ O(n² × 100) - actually computable!
- Convergence: ~100 iterations per starting point
- **Found optimal 6.83km route** (vs. ~15-20km naive routing)
- All 31 starting points tested, best one selected

**But here's the key insight:** TSP gives you the SEQUENCE of temples, not the actual walking path!

## Part 4: TSP + Real-World Routing = Magic ✨

**TSP output:** Visit temples in this order: [A, B, C, D, E...]

**Missing:** How do you actually WALK from A to B?

**Enter Geoapify Routing API:**

For each temple pair, Geoapify returns:
- Actual street paths (not straight lines!)
- Turn-by-turn directions: "Turn left onto ถนนอินทวโรรส (36m)"
- Elevation changes at each step
- MultiLineString geometry following real roads

**The magic combination:**
1. TSP finds mathematically optimal SEQUENCE (minimizes crow-flies distance)
2. Geoapify finds actually walkable PATHS (following streets)
3. Result: Practically navigable AND mathematically optimized!

**Output:**
- 44 route legs (between 31 temples)
- 178 turn-by-turn navigation steps
- 10.92km actual walking distance
- Only 5m elevation gain (super flat!)

## Part 5: The Real-World Constraint Revelation 🚪

**The "Optimal" Illusion:**

Our TSP algorithm found the mathematically perfect route: 6.83km starting at Wat Pha Khao.

**Problem:** Wat Pha Khao is in the middle of the old town. How do visitors GET there?

**The realization:** Real visitors don't teleport to the optimal starting point. They enter through one of 4 moat gates:
- **North:** Chang Phuak Gate (18.795407°, 98.986578°)
- **East:** Tha Phae Gate (18.788749°, 98.993208°)
- **South:** Chiang Mai Gate (18.781205°, 98.986598°)
- **West:** Suan Dok Gate (18.788781°, 98.978186°)

**This meant:** We needed 4 different optimal tours, each starting from a realistic entry point.

**First mistake:** We used moat CORNER coordinates (NW, NE, SE, SW) instead of the actual GATE locations (center of each side). Result: starting temples were 200-400m away from actual gates!

**Lesson learned:** Verify assumptions about "ground truth" even when you have precise coordinates.

## Part 6: Greedy vs 2-Opt - A Quantitative Exploration 📊

**The Question:** For routes with forced start points, is 2-opt optimization worth the added complexity?

**The Setup:**

We implemented two algorithms:

**Algorithm 1: Greedy Nearest-Neighbor**
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
- Fast and simple
- But potentially suboptimal

**Algorithm 2: Greedy + 2-Opt with Fixed Start**
```javascript
function optimizeWithFixedStart(temples, startTemple) {
  route = greedyFromStart(temples, startTemple);

  // Improve with 2-opt, keeping position 0 fixed
  while (improved) {
    for (i = 1; i < n-1; i++) {      // Start at 1, not 0!
      for (j = i+2; j < n; j++) {
        if (reversing segment [i...j] reduces distance):
          reverse it;
          improved = true;
      }
    }
  }
  return route;
}
```
- Complexity: O(n² × iterations)
- ~100 iterations typical
- Potentially better routes

**The Experiment:**

For each of the 4 gates, we measured:
- Greedy distance
- Greedy+2opt distance
- Improvement percentage

**The Results:**

```
GATE           GREEDY    GREEDY+2OPT   IMPROVEMENT
─────────────────────────────────────────────────
North Gate     7.90 km   6.98 km       11.75% ⭐
East Gate      7.77 km   6.88 km       11.37% ⭐
South Gate     7.80 km   7.20 km       7.78%
West Gate      7.60 km   7.51 km       1.12%

AVERAGE IMPROVEMENT: 8.01%
```

**The Verdict:** 2-opt is absolutely worth it!

**Why the variation?**
- North & East gates: 11%+ improvement (greedy made poor early choices)
- South gate: ~8% improvement (greedy was decent)
- West gate: ~1% improvement (greedy was already quite good, or local optimum)

**Unexpected finding:** The West gate's greedy route happened to be near-optimal already, while North and East gates benefited dramatically from 2-opt refinement.

**Computational cost:** ~100 iterations × O(n²) per gate = negligible on modern hardware for n=31.

**Conclusion:** For forced-start TSP, greedy initialization + 2-opt refinement provides meaningful optimization (8% average) with minimal computational overhead. The improvement varies by starting point, suggesting some entry points have "easier" optimization landscapes than others.

## Part 7: AI Building AI Tools 🤖²

Meta moment: I used Claude (Anthropic) to build a tour generator that queries Gemini (Google) for descriptions.

**First attempt:** "Generate descriptions for 31 temples"
- Result: Malformed JSON (AI overwhelmed)

**Solution:** Batch processing
```javascript
for (let i = 0; i < 31; i += 10) {
  batch = temples.slice(i, i + 10);
  narrative = await gemini.generateNarrative(batch);
  await sleep(3000); // Rate limiting
}
```
- 4 batches of ~10 temples each
- 3-second delays between batches  
- Success rate: 100%

**Second challenge:** Descriptions too flowery
- "Our spiritual odyssey begins at this tranquil sanctuary where ancient whispers..."
- Not enough FACTS!

**Fix:** Research + temperature tuning
```javascript
// Pre-researched 10 major temples via Wikipedia
const facts = {
  'Wat Chedi Luang': 'Founded 1391 by King Saen Muang Ma, 85m tall, collapsed 1545 earthquake...'
};

// Low temperature = more factual
generateDescription(temple, {
  temperature: 0.3,
  prompt: 'NO flowery language. Include: founding dates, measurements, royal patrons...'
});
```

**Result:** "Founded 1391 by King Saen Muang Ma for his father's ashes, completed 1475 at 85m tall, housed the Emerald Buddha 1468-1551, upper 30m collapsed in 1545 earthquake, reconstructed 1990s with UNESCO support."

## Part 8: The Human-AI Dance 💃🤖

**What AI crushed:**
- Geocoding 76 temples in minutes
- TSP optimization (tested 31! possible routes efficiently)
- API orchestration (Geoapify routing for 4 different tours)
- Generated 31 factual descriptions in batches
- Created interactive Leaflet.js visualizations

**Where humans were essential:**
- Validation: "26 temples have identical coordinates - that's wrong"
- Domain knowledge: "That's a school, not a temple!"
- Spelling corrections: Finding "Wat Inthakhin Sadue Muang" when AI searched "Wat Sadeu Muang Inthakin"
- Real-world constraints: "Visitors enter through gates, not random temples"
- Aesthetic judgment: "Less poetry, more founding dates please"

**Neither could have built this alone efficiently.**

AI can't validate its own output against ground truth. Humans can't optimize 31! routes or query 4 routing APIs in parallel. **Collaboration wins.**

## The Result

Live interactive temple pilgrimage tours:
🌐 https://earino.github.io/WalkingTourPlanner/chiang-mai-temple-tour.html

**Features:**
- Choose your starting gate (North/East/South/West)
- 31 verified temples with factual historical descriptions
- Greedy+2opt optimized routes (8% better than pure greedy)
- 11.38-11.66km per tour (depending on gate)
- 170+ turn-by-turn walking directions per route
- Click "Navigate Here" → opens Google Maps from your location
- 4 different tour variants, each optimized for its entry point

**Tech Stack:**
- Geoapify API (geocoding & routing)
- TSP 2-opt algorithm (route optimization)
- OpenRouter + Gemini (AI descriptions)
- Leaflet.js (interactive maps)
- GitHub Actions (auto-deployment)
- Claude Code (AI pair programmer)

## Key Takeaways

1. **AI amplifies at scale** - Can't manually geocode 76 temples or solve TSP
2. **Humans validate reality** - AI can't catch "same coordinates" errors or know local context
3. **Real-world constraints matter** - "Optimal" route that starts in the middle is useless
4. **Iteration is everything** - We tried 4 different geocoding strategies
5. **The result exceeds what either could build alone**

Built collaboratively in an afternoon. Try it: https://earino.github.io/WalkingTourPlanner/chiang-mai-temple-tour.html

Code: https://github.com/earino/WalkingTourPlanner

#AI #SoftwareEngineering #HumanAICollaboration #TSP #MachineLearning #TravelTech #ChiangMai
