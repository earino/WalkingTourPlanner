/**
 * Centralized Prompt Configuration for AI Services
 *
 * This file contains all prompts used for AI-generated content in the Walking Tour Planner.
 * Prompts are designed using 2025 best practices:
 * - Chain-of-thought reasoning
 * - Few-shot examples
 * - Structured outputs
 * - Source grounding
 * - Explicit constraints
 */

/**
 * PROMPT 1: Place Description Generator
 *
 * Purpose: Generate engaging, factual 2-3 sentence descriptions for tourist attractions
 * Strategy: Uses chain-of-thought to analyze context, then generates structured output
 *
 * Input: placeName, wikiInfo (optional), placeProperties (optional)
 * Output: 2-3 sentences, 150-300 characters, engaging but factual tone
 *
 * Key Features:
 * - Grounds descriptions in provided context (no hallucination)
 * - Avoids generic marketing language
 * - Focuses on unique/historical aspects
 * - Suitable for international tourists
 */
export const ENHANCE_PLACE_INFO = {
  buildPrompt: (placeName, wikiInfo, placeProperties) => {
    const wikiContext = wikiInfo?.extract ? wikiInfo.extract.substring(0, 500) : null;
    const category = placeProperties?.categories?.[0] || 'location';
    const address = placeProperties?.formatted || '';

    return `You are an expert travel writer specializing in creating concise, engaging descriptions for walking tour apps.

<task>
Write a compelling 2-3 sentence description for "${placeName}" that will help tourists understand why this place is worth visiting.
</task>

<context>
Category: ${category}
Location: ${address}
${wikiContext ? `Wikipedia Summary: ${wikiContext}` : 'No Wikipedia data available'}
</context>

<instructions>
1. First, analyze what makes this place unique or historically significant
2. Write 2-3 sentences (150-300 characters total) that are:
   - Factually accurate (use only information from context provided)
   - Engaging and vivid (create a mental image)
   - Specific to THIS place (avoid generic phrases like "beautiful" or "must-see")
   - Written in present tense, active voice
3. Focus on: historical significance, cultural importance, architectural features, or unique stories
4. Avoid: marketing language, superlatives without basis, repetitive phrasing
5. If context is limited, focus on the category/type and location appeal
</instructions>

<examples>
Example 1 (Good):
Input: "Wat Phra Singh" (Buddhist temple)
Output: "Step inside Wat Phra Singh to discover the revered Phra Singh Buddha image, housed in a gilded viharn adorned with 14th-century Lanna murals depicting daily life in ancient Chiang Mai. This royal temple, founded in 1345, remains one of the finest examples of classic Northern Thai temple architecture."

Example 2 (Bad - Too Generic):
Input: "Wat Phra Singh"
Output: "This beautiful temple is a must-see attraction in Chiang Mai. It's very popular with tourists and offers a glimpse into Thai culture."
Why bad: Uses generic phrases, no specific historical details, marketing language

Example 3 (Good - Limited Context):
Input: "Local Market" (No Wikipedia, category: commercial.marketplace)
Output: "This bustling local marketplace pulses with the daily rhythms of neighborhood life, where vendors hawk fresh produce, street food, and handmade crafts. Navigate the narrow aisles for an authentic taste of local commerce away from tourist centers."
</examples>

Now write the description for "${placeName}":`;
  },

  parameters: {
    temperature: 0.7,
    maxTokens: 200
  }
};

/**
 * PROMPT 2: Tour Overview Generator
 *
 * Purpose: Create an engaging 2-3 sentence introduction for the entire walking tour
 * Strategy: Structured approach with Hook → Promise → Details format
 *
 * Input: places (array), location (string), metadata (duration/distance)
 * Output: 2-3 sentences forming complete tour pitch
 *
 * Key Features:
 * - Creates emotional hook in first sentence
 * - Highlights tour's unique value proposition
 * - Includes practical info (distance/duration feel)
 * - Adaptable to tour type (temples vs bars vs museums)
 */
export const GENERATE_TOUR_OVERVIEW = {
  buildPrompt: (places, location, metadata) => {
    const placesList = places.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    const placeTypes = [...new Set(places.map(p => p.category))].join(', ');
    const duration = metadata?.estimatedDuration || 'several hours';
    const distance = metadata?.totalDistance || 'walkable distance';

    return `You are an expert tour marketing writer who creates compelling tour descriptions.

<task>
Write an engaging 2-3 sentence overview for a walking tour in ${location} that makes people excited to take this tour.
</task>

<tour_details>
Duration: ${duration}
Distance: ${distance}
Number of stops: ${places.length}
Place types: ${placeTypes}

Stops on this tour:
${placesList}
</tour_details>

<instructions>
Structure your overview with this format:
1. HOOK (1 sentence): Create excitement/curiosity about what makes this tour special
2. PROMISE (1 sentence): What visitors will experience/discover/learn
3. DETAILS (optional 1 sentence): Mention standout locations or tour highlights

Writing guidelines:
- Use vivid, sensory language ("discover", "explore", "step into")
- Be specific about what makes THIS tour unique (not generic "walking tour" language)
- Create anticipation without overselling
- Keep total length under 400 characters
- Match tone to tour type (reverent for temples, lively for tapas bars)
</instructions>

<examples>
Example 1 - Temple Tour:
"Journey through the spiritual heart of Chiang Mai's ancient walled city, where centuries-old Buddhist temples tell stories of the Lanna Kingdom's golden age. This carefully curated route connects eight sacred sites—from the oldest temple in the city, Wat Chiang Man (1296), to the gilded spires of Wat Phra Singh—revealing the architectural evolution and enduring faith that shaped Northern Thailand. Expect 4-5 hours of walking punctuated by moments of quiet contemplation."

Example 2 - Tapas Tour:
"Embark on a delicious journey through Salobreña's tapas scene, where Andalusian tradition meets coastal charm in eight carefully selected bars and restaurants. From family-run tabernas serving recipes passed down through generations to modern fusion spots overlooking the Mediterranean, this 3-kilometer route transforms dinner into a cultural adventure. Bring your appetite—each stop offers a taste of Granada's culinary soul."

Example 3 - Museum Tour (BAD):
"This tour takes you to several great museums in Paris. You'll see amazing art and learn interesting facts. It's a wonderful experience for culture lovers."
Why bad: Generic, no specific details, marketing clichés, doesn't create anticipation
</examples>

Now write the tour overview:`;
  },

  parameters: {
    temperature: 0.8,
    maxTokens: 300
  }
};

/**
 * PROMPT 3: Interesting Facts Generator
 *
 * Purpose: Extract 2-3 surprising, lesser-known facts about a place
 * Strategy: Source-grounded extraction to prevent hallucination
 *
 * Input: placeName, context (Wikipedia text)
 * Output: Bullet list of facts with implicit source grounding
 *
 * Key Features:
 * - MUST use only facts from provided context
 * - Prioritizes surprising/unexpected information
 * - Avoids commonly-known facts
 * - Focuses on human interest stories
 */
export const GENERATE_INTERESTING_FACTS = {
  buildPrompt: (placeName, context) => {
    return `You are a knowledgeable tour guide specializing in uncovering fascinating historical details that surprise visitors.

<task>
From the context provided below, extract 2-3 interesting, lesser-known facts about "${placeName}" that would surprise and delight tourists.
</task>

<context>
${context || 'No additional context available'}
</context>

<instructions>
1. ONLY use information explicitly stated in the context above
2. Prioritize facts that are:
   - Surprising or unexpected
   - Human-interest stories (not just dates/numbers)
   - Lesser-known (avoid obvious/famous facts)
   - Specific and concrete (not vague generalities)
3. Format as a bullet list with • prefix
4. Each fact must be ONE sentence, under 150 characters
5. If context lacks interesting details, return just 1-2 facts rather than stretching
6. Do NOT invent or embellish beyond what's in the context
</instructions>

<examples>
Good facts (from context):
• The temple's name "Wat Chang Taem" literally means "Painter's Temple," named after the artisan guild that built it in 1345.
• Despite its small size, the temple houses a 700-year-old teak Buddha that survived three fires and the Burmese invasion of 1558.

Bad facts (too obvious or generic):
• This temple is important to Thai culture. (too vague)
• Built in the 14th century, it features traditional architecture. (obvious from any temple)
• Many tourists visit each year. (not from context, generic)
</examples>

Now extract interesting facts:`;
  },

  parameters: {
    temperature: 0.6,  // Lower temp for factual accuracy
    maxTokens: 250
  }
};

/**
 * PROMPT 4: Search Query Parser (PHASE 1: CANDIDATE GATHERING)
 *
 * Purpose: Parse natural language to get 30-100 candidate results from Geoapify
 * Strategy: BROAD categories + smart radius + good keywords
 *
 * Input: searchQuery (string)
 * Output: JSON object {location, placeType, keywords, radius, geoapifyCategory, confidence}
 *
 * Key Philosophy:
 * - PHASE 1 GOAL: Cast a WIDE net to get 30-100 candidates
 * - Use BROAD categories (let AI ranking in Phase 2 filter)
 * - Smart radius based on location type
 * - Rich keywords for text search
 * - AI will rank/filter in Phase 2, so be generous here
 */
export const PARSE_SEARCH_QUERY = {
  buildPrompt: (searchQuery) => {
    return `You are an expert at designing Geoapify API queries that return 30-100 relevant candidates for AI ranking.

<critical_mission>
Your job is PHASE 1 of 3: CANDIDATE GATHERING
- PHASE 1 (YOU): Get 30-100 candidates using BROAD categories + smart radius
- PHASE 2 (later): AI ranks these 30-100 down to top 7
- PHASE 3 (later): AI enhances the top 7 with descriptions

YOUR GOAL: Return enough candidates (30-100) for AI to have good choices!
</critical_mission>

<task>
Parse this query to find 30-100 candidates: "${searchQuery}"
</task>

<geoapify_categories>
CATEGORY REFERENCE - SELECT BROAD CATEGORIES THAT GET 30-100 RESULTS:

PARENT CATEGORIES (BROAD - use these!):
- "catering" → ALL food/drink establishments
- "tourism" → ALL tourist attractions
- "religion.place_of_worship" → ALL places of worship
- "entertainment" → ALL entertainment venues
- "commercial" → ALL shops/stores
- "leisure" → ALL parks, recreation

SPECIFIC CATEGORIES (use sparingly, mainly for major cities):
- "catering.restaurant" "catering.bar" "catering.cafe"
- "catering.restaurant.tapas" "catering.restaurant.pizza" etc (VERY specific)
- "entertainment.museum" "entertainment.culture.gallery"
- "religion.place_of_worship.buddhism" "religion.place_of_worship.christianity"
- "tourism.attraction" "tourism.sights" "tourism.sights.castle"
- "tourism.attraction.viewpoint"
- "leisure.park" "leisure.park.garden"
- "commercial.marketplace" "commercial.food_and_drink.bakery"
- "service.beauty.massage"
- "heritage" "building.historic"

GOLDEN RULE FOR CATEGORY SELECTION:
→ **Temples in small area?** Use "religion.place_of_worship,tourism.sights,heritage"
   (Don't just use buddhism - might miss results!)
→ **Pizza anywhere?** Use "catering,catering.restaurant" (let AI find pizza ones)
→ **Historic sites?** Use "tourism,heritage,tourism.sights" (cast wide!)
→ **Museums?** Use "entertainment.museum,tourism.attraction"
→ **WHEN IN DOUBT: GO BROADER** - AI will filter in Phase 2!
</geoapify_categories>

<radius_strategy>
CRITICAL: Determine radius based on LOCATION TYPE, not query length!

**Radius Decision Framework:**
1. **Specific landmark** ("Eiffel Tower", "Grand Palace"): 300-500m
2. **Neighborhood/District** ("Old Town", "Albaicín", "SoHo"): 800-1500m
3. **Small town/village** ("Salobreña", "Rawai"): 2000-3000m
4. **City name only** ("Bangkok", "Paris"): 3000-5000m
5. **Large city** ("Tokyo", "London"): 4000-6000m
6. **Region/area** ("Provence", "Scottish Highlands"): 8000-10000m

**Key insight:** Radius should match the GEOGRAPHY of the location, not the specificity of the query!
- "temples in chiang mai old town" → Old Town is ~1.5km across → use 1200m
- "temples in chiang mai" → City is huge → use 5000m
- "pizza in Salobreña" → Small town ~2km across → use 2500m

**Goal:** Radius should capture the relevant area while getting 30-100 results
</radius_strategy>

<output_schema>
Return ONLY valid JSON in this format:
{
  "location": "Full location name with country",
  "placeType": "Human-readable type",
  "geoapifyCategory": "Geoapify API category string",
  "keywords": ["search", "keywords"],
  "radius": 3000,
  "confidence": 0.95
}
</output_schema>

<extraction_rules>
1. **location**: Full location with country (e.g., "Old Town, Chiang Mai, Thailand")

2. **placeType**: Human-readable (e.g., "temples", "pizza restaurants")

3. **geoapifyCategory**: **USE BROAD CATEGORIES!**
   - Temples? Use: "religion.place_of_worship,tourism.sights,heritage"
   - Food? Use: "catering" or "catering.restaurant"
   - Historic? Use: "tourism,heritage,tourism.sights"
   - **Goal: Get 30-100 results for AI to rank!**

4. **keywords**: 4-7 rich search terms (help find relevant places via text search)

5. **radius**: Match the GEOGRAPHIC SIZE of the location (see radius_strategy above)
   - Analyze: Is this a landmark? Neighborhood? Town? City?
   - Use appropriate radius for that geography type

6. **confidence**: 0-1 score
</extraction_rules>

<examples>
Example 1 - Specific food query:
Input: "tapas bars in granada spain"
Output: {"location": "Granada, Spain", "placeType": "tapas bars", "geoapifyCategory": "catering.restaurant.tapas,catering.bar", "keywords": ["tapas", "bars", "Spanish cuisine", "restaurants"], "radius": 3000, "confidence": 0.95}

Example 1b - Neighborhood-specific query (SMALL RADIUS):
Input: "churches and tapas bars in the albaicín in granada"
Output: {"location": "Albaicín, Granada, Spain", "placeType": "churches and tapas bars", "geoapifyCategory": "religion.place_of_worship.christianity,catering.restaurant.tapas,catering.bar", "keywords": ["churches", "tapas bars", "Albaicín", "historic"], "radius": 900, "confidence": 0.95}

Example 2 - Temple query (BROAD CATEGORIES):
Input: "temples in chiang mai old town"
Output: {"location": "Old Town, Chiang Mai, Thailand", "placeType": "temples", "geoapifyCategory": "religion.place_of_worship,tourism.sights,heritage", "keywords": ["temples", "Buddhist", "wats", "religious sites", "historic", "sacred"], "radius": 1200, "confidence": 0.95}
Reasoning: Old Town is a neighborhood (~1.5km), use 1200m. BROAD categories to catch all temples/heritage sites!

Example 3 - Museum query:
Input: "art museums near the louvre"
Output: {"location": "Louvre, Paris, France", "placeType": "museums", "geoapifyCategory": "entertainment.museum,entertainment.culture.gallery", "keywords": ["museums", "art", "galleries", "culture"], "radius": 1500, "confidence": 0.9}

Example 4 - Historic sites:
Input: "castles and forts in scotland"
Output: {"location": "Scotland, United Kingdom", "placeType": "historic sites", "geoapifyCategory": "tourism.sights.castle,tourism.sights.fort", "keywords": ["castles", "forts", "medieval", "historic"], "radius": 5000, "confidence": 0.85}

Example 5 - Religious architecture:
Input: "churches near the cathedral in granada"
Output: {"location": "Granada Cathedral, Granada, Spain", "placeType": "churches", "geoapifyCategory": "tourism.sights.place_of_worship.church,religion.place_of_worship.christianity", "keywords": ["churches", "cathedrals", "religious architecture"], "radius": 1500, "confidence": 0.95}

Example 6 - Parks and nature:
Input: "parks in central park area"
Output: {"location": "Central Park, New York, USA", "placeType": "parks", "geoapifyCategory": "leisure.park,leisure.park.garden", "keywords": ["parks", "gardens", "green spaces"], "radius": 2000, "confidence": 0.9}

Example 7 - Shopping:
Input: "local markets in marrakech"
Output: {"location": "Marrakech, Morocco", "placeType": "markets", "geoapifyCategory": "commercial.marketplace", "keywords": ["markets", "souks", "shopping", "local goods"], "radius": 3000, "confidence": 0.9}

Example 8 - Specific cuisine:
Input: "sushi restaurants tokyo"
Output: {"location": "Tokyo, Japan", "placeType": "sushi restaurants", "geoapifyCategory": "catering.restaurant.sushi,catering.restaurant.japanese", "keywords": ["sushi", "Japanese cuisine", "restaurants"], "radius": 3000, "confidence": 0.95}

Example 9 - Viewpoints:
Input: "miradores en salobreña"
Output: {"location": "Salobreña, Spain", "placeType": "viewpoints", "geoapifyCategory": "tourism.attraction.viewpoint", "keywords": ["viewpoints", "miradores", "scenic views", "lookouts"], "radius": 3000, "confidence": 0.9}

Example 10 - Cafes:
Input: "coffee shops with wifi in san francisco"
Output: {"location": "San Francisco, USA", "placeType": "coffee shops", "geoapifyCategory": "catering.cafe.coffee,catering.cafe.coffee_shop", "keywords": ["coffee shops", "cafes", "wifi"], "radius": 3000, "confidence": 0.9}

Example 11 - Broad tourism:
Input: "tourist attractions in barcelona"
Output: {"location": "Barcelona, Spain", "placeType": "attractions", "geoapifyCategory": "tourism.attraction,tourism.sights", "keywords": ["attractions", "sights", "landmarks"], "radius": 4000, "confidence": 0.8}

Example 12 - Beach bars:
Input: "chiringuitos almuñecar"
Output: {"location": "Almuñécar, Spain", "placeType": "beach bars", "geoapifyCategory": "catering.restaurant.seafood,catering.bar", "keywords": ["chiringuitos", "beach bars", "seafood", "coastal dining"], "radius": 3000, "confidence": 0.95}

Example 13 - Bakeries:
Input: "bakeries in almuñecar"
Output: {"location": "Almuñécar, Spain", "placeType": "bakeries", "geoapifyCategory": "commercial.food_and_drink.bakery", "keywords": ["bakeries", "pastry", "bread", "baked goods"], "radius": 3000, "confidence": 0.95}

Example 14 - Pharmacies:
Input: "pharmacy near my hotel in bangkok"
Output: {"location": "Bangkok, Thailand", "placeType": "pharmacies", "geoapifyCategory": "commercial.health_and_beauty.pharmacy,healthcare.pharmacy", "keywords": ["pharmacy", "drugstore", "medicine"], "radius": 2000, "confidence": 0.8}

Example 14b - Massage parlors:
Input: "massage in rawai, phuket"
Output: {"location": "Rawai, Phuket, Thailand", "placeType": "massage", "geoapifyCategory": "service.beauty.massage", "keywords": ["massage", "Thai massage", "spa"], "radius": 1500, "confidence": 0.95}

Example 15 - Historic/Roman sites (BROAD search for AI ranking):
Input: "historic almuñecar"
Output: {"location": "Almuñécar, Spain", "placeType": "historic sites", "geoapifyCategory": "tourism.sights,heritage,tourism.sights.archaeological_site,building.historic,tourism.attraction", "keywords": ["historic", "Roman", "ancient", "archaeological"], "radius": 3000, "confidence": 0.85}

Example 16 - Roman/Ancient ruins:
Input: "roman ruins in nimes"
Output: {"location": "Nîmes, France", "placeType": "Roman ruins", "geoapifyCategory": "tourism.sights.archaeological_site,tourism.sights.ruins", "keywords": ["Roman", "ruins", "ancient", "archaeological"], "radius": 3000, "confidence": 0.95}
</examples>

<category_mapping_tips>
- Temples/Wats (Buddhist) → religion.place_of_worship.buddhism
- Churches → religion.place_of_worship.christianity OR tourism.sights.place_of_worship.church
- Mosques → religion.place_of_worship.islam
- Tapas → catering.restaurant.tapas OR catering.fast_food.tapas OR just catering (broad)
- Museums → entertainment.museum
- Art galleries → entertainment.culture.gallery
- Viewpoints/Miradores → tourism.attraction.viewpoint
- Parks → leisure.park
- Markets/Souks → commercial.marketplace
- Historic monuments → tourism.sights.memorial.monument
- Castles → tourism.sights.castle
- For broad searches, use parent categories (catering, tourism, religion)
</category_mapping_tips>

Now parse the query above and return ONLY the JSON:`;
  },

  parameters: {
    temperature: 0.3,
    maxTokens: 350,
    responseFormat: 'json_object'
  }
};

/**
 * PROMPT 5: AI-Powered Place Selection
 *
 * Purpose: Select top N most relevant places from search results
 * Strategy: Semantic understanding of query intent
 *
 * Input: originalQuery (string), places (array), topN (number)
 * Output: Array of just the top N place indices with scores
 *
 * Key Features:
 * - Returns ONLY top N most relevant (not all places)
 * - Smaller JSON response (no truncation errors)
 * - Faster processing
 */
export const RANK_PLACES_BY_RELEVANCE = {
  buildPrompt: (originalQuery, places, topN = 10) => {
    const placesList = places.map((p, i) =>
      `${i}. ${p.name} (${p.category}) - ${p.address}`
    ).join('\n');

    return `You are an expert tour guide selecting the BEST places for a walking tour.

<task>
From the list below, select the TOP ${topN} places that best match: "${originalQuery}"

**CRITICAL LOCATION REQUIREMENT:**
If the query specifies a LOCATION (neighborhood, district, area), you MUST prioritize places whose addresses are actually IN that location.

Examples of location-specific queries:
- "temples in chiang mai old town" → Bias for addresses mentioning Old Town/old city
- "tapas in albaicín granada" → Bias for addresses in Albaicín district
- "museums in paris marais" → Bias for addresses in Le Marais/3rd/4th arrondissement
- "pizza in downtown seattle" → Bias for downtown addresses

Evaluation criteria (in priority order):
1. **LOCATION MATCH** (HIGHEST PRIORITY)
   - Parse the location from the query
   - Check if the place's address semantically matches that location
   - Use your knowledge of geography (districts, neighborhoods, street names)
   - Penalize places clearly outside the specified area

2. Semantic relevance to place type (temples, museums, food, etc.)
3. Tourist appeal and significance
4. Authenticity (prefer authentic local spots over chains)
5. Cultural/historical importance

CRITICAL:
- McDonald's, Starbucks, chain hotels are NEVER relevant unless explicitly requested
- If query says "in [neighborhood]", places in OTHER neighborhoods should score much lower
- Use address details to verify location - don't just match place type
</task>

<places>
${placesList}
</places>

<output_format>
Return ONLY a JSON object with "selections" array containing EXACTLY ${topN} places:
{
  "selections": [
    {"index": 4, "score": 98, "reason": "Traditional sausage stand - perfect match"},
    {"index": 7, "score": 95, "reason": "Historic Würstelstand - authentic Viennese"},
    ...exactly ${topN} total entries...
  ]
}

Sort by score descending. Return ONLY the top ${topN}. Be ruthless - exclude mediocre/chain places.
</output_format>`;
  },

  parameters: {
    temperature: 0.2,
    maxTokens: 1000  // Reduced - only returning top N, not all places
  }
};

/**
 * PROMPT 6: Cohesive Tour Narrative Generator
 *
 * Purpose: Generate flowing narrative for entire tour with transitions
 * Strategy: One-shot generation aware of sequence and flow
 *
 * Input: originalQuery, orderedPlaces (post-TSP), routeInfo
 * Output: Structured JSON with intro + place descriptions + transitions
 *
 * Key Features:
 * - Generates ALL content in one call (faster!)
 * - Aware of walking sequence
 * - Includes transitions between places
 * - Builds narrative arc (beginning → middle → end)
 * - Context from previous places
 */
export const GENERATE_TOUR_NARRATIVE = {
  buildPrompt: (originalQuery, orderedPlaces, totalDistance, totalDuration) => {
    const placesList = orderedPlaces.map((p, i) =>
      `${i + 1}. ${p.name} (${p.category}) at ${p.address}`
    ).join('\n');

    return `You are an expert tour guide creating a cohesive walking tour narrative.

<task>
Create a flowing, engaging narrative for this walking tour based on: "${originalQuery}"

The tour visits ${orderedPlaces.length} places in THIS specific order (optimized for walking):
${placesList}

Total walking distance: ${totalDistance}
Estimated duration: ${totalDuration}
</task>

<requirements>
1. **Tour Introduction** (2-3 sentences):
   - Hook that captures the tour's essence
   - Sets expectations for what visitors will experience
   - References the specific area/theme

2. **For each place** (in order):
   - **Description** (3-5 sentences): What makes this place special, historical/cultural significance, vivid details
   - **Transition** (1-2 sentences, except last place): Walking directions + sensory experience + anticipation for next place

3. **Narrative Flow**:
   - Build a story arc across the tour
   - Reference previous places ("After the temple's serenity...")
   - Create sense of journey and discovery
   - Use sensory details (sights, sounds, atmosphere)
   - Vary sentence structure and pacing

4. **Avoid**:
   - Generic phrases ("must-see", "beautiful", "amazing")
   - Repetitive structure
   - Isolated descriptions (connect them!)
</requirements>

<output_format>
Return ONLY valid JSON:
{
  "tourIntro": "Your walking tour introduction here...",
  "places": [
    {
      "order": 1,
      "description": "We begin at [place name], where [specific compelling detail]...",
      "transition": "A leisurely 5-minute stroll south brings us to..."
    },
    {
      "order": 2,
      "description": "...",
      "transition": "..."
    },
    ...
    {
      "order": ${orderedPlaces.length},
      "description": "Our journey concludes at...",
      "transition": null
    }
  ]
}
</output_format>

Now generate the tour narrative:`;
  },

  parameters: {
    temperature: 0.8,  // Higher for creative narrative
    maxTokens: 4000  // Increased for richer narratives
  }
};

/**
 * Export all prompts as a single object for easy access
 */
export const PROMPTS = {
  enhancePlaceInfo: ENHANCE_PLACE_INFO,
  generateTourOverview: GENERATE_TOUR_OVERVIEW,
  generateInterestingFacts: GENERATE_INTERESTING_FACTS,
  parseSearchQuery: PARSE_SEARCH_QUERY,
  rankPlacesByRelevance: RANK_PLACES_BY_RELEVANCE,
  generateTourNarrative: GENERATE_TOUR_NARRATIVE
};
