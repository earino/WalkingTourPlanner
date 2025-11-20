import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenRouter client
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'Walking Tour Planner'
  }
});

// Pre-researched facts for major temples
const TEMPLE_FACTS = {
  'Wat Chedi Luang': 'Founded 1391 by King Saen Muang Ma to house his father\'s ashes. Completed 1475 under King Tilokarat, reaching 85m tall. Housed the Emerald Buddha 1468-1551. Upper 30m collapsed in 1545 earthquake. Reconstructed 1990s with UNESCO/Japanese support.',

  'Wat Phra Singh': 'Founded 1345 by King Pha Yu for his father\'s ashes. Royal temple of first grade (1935). Viharn Lai Kham built with intricate gold leaf work and 1820s murals. Ho Trai library from late 15th century. Bronze standing Buddha cast 1477.',

  'Wat Chiang Man': 'Chiang Mai\'s oldest temple, founded 1296/1297 by King Mengrai. Stone inscription from 1581 records city founding date (April 12, 1296). Chedi Chang Lom features 15 life-sized elephants. Houses ancient Phra Sila Buddha from Sri Lanka (1000+ years old) and crystal Phra Sae Tang Khamani.',

  'Wat Phan Tao': 'Built 1846 as Ho Kham (royal throne hall) for ruler Mahotaraprathet. Moved to current location 1876. All-teak structure 21m long, supported by 28 pillars. Name means "thousand kilns" from furnaces used to cast Buddha images. Closed 2021 for insect damage repairs.',

  'Wat Inthakhin Sadue Muang': 'Houses Chiang Mai\'s city pillar (Inthakin) originally erected by King Mengrai in 1296 at founding of city. Pillar relocated to Wat Chedi Luang in 1800 by King Kawila. "Sadue Muang" means "navel of the city." Now features modern viharn with Lanna Kingdom museum.',

  'Wat Phuak Hong': 'Founded late 15th century. Name means "flight of swans" or refers to "lower ranking nobles" (phuk hong). Distinctive 7-tiered circular chedi (unusual for North Thailand), possibly Yunnanese influence. Contains 52 Buddha niches. Bronze Thai Ping Buddha cast 1494. Viharn rebuilt early 19th century.',

  'Wat Prasat': 'Founded late 15th/early 16th century. Stone inscription at Wat Tapotaram confirms existence during King Yotchiangrai reign (1487-1495). Wooden viharn built 1823 in classic Lanna style. Unique "Ku Lai" meditation chamber configuration. Bronze Buddha from 1590. Laai Kham gold leaf murals.',

  'Wat Lok Moli': 'First mentioned 1367. Founded 14th century to house Burmese monks invited by King Kuena (1355-1385). Royal mausoleum temple. Queen Chiraprapha ruled Lanna 1545-1546. Queen Wisutthithewi\'s ashes interred here (died 1578). Important Mengrai Dynasty burial site.',

  'Wat Muen Ngoen Kong': 'Founded 14th century. Name means "temple of ten thousand piles of money" or "millionaire." Large wooden viharn in Lanna style. Golden chedi surrounded by smaller chedis with Lanna calendar animals. Houses large gold reclining Buddha. Location for Japanese movie "Pool."',

  'Wat Lam Chang': '14th century temple. Name means "temple of the tethered elephant." Historical site where kings\' elephants were kept, bathed, and trained. Never used for work, only royal transport. Four kneeling elephant guardian statues at chedi corners. Life-size elephant statue in courtyard.'
};

/**
 * Generate factual description for a temple
 */
async function generateFactualDescription(templeName, position, totalTemples) {
  try {
    // Check if we have pre-researched facts
    const knownFacts = TEMPLE_FACTS[templeName] || null;

    const prompt = `You are a temple tour guide providing FACTUAL information about Buddhist temples in Chiang Mai.

Temple: ${templeName}
Position in tour: Stop ${position} of ${totalTemples}

${knownFacts ? `VERIFIED FACTS ABOUT THIS TEMPLE:\n${knownFacts}\n\n` : ''}

Generate a 2-3 sentence factual description of this temple.

REQUIREMENTS:
- Focus on FACTS: founding dates, builders, architectural features, historical events
- NO flowery or poetic language ("serene," "tranquil," "whispers of devotion" etc.)
- Include specific details: dates, measurements, names, architectural styles
- Mention notable features: chedis, Buddha images, unique architecture
- If you don't have specific facts, say what's generally known about temples of this era
- Be concise and informative

${knownFacts ? 'Use the verified facts provided above.' : 'Provide factual information if known, otherwise general architectural/historical context.'}

Return ONLY the description text, no preamble.`;

    const response = await openrouter.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    return response.choices[0].message.content.trim();

  } catch (error) {
    console.error(`   AI generation failed for ${templeName}: ${error.message}`);
    return `${templeName} is a Buddhist temple in Chiang Mai's Old Town within the historic moat boundaries.`;
  }
}

/**
 * Main function
 */
async function generateAllDescriptions() {
  console.log('<ï GENERATING FACTUAL TEMPLE DESCRIPTIONS\n');
  console.log('P'.repeat(60));

  // Load tour data
  const tour = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/temple-tour-final.json'), 'utf8'));

  console.log(`Temples to process: ${tour.temples.length}`);
  console.log(`Known facts for: ${Object.keys(TEMPLE_FACTS).length} temples`);
  console.log('');

  const enrichedTemples = [];

  for (let i = 0; i < tour.temples.length; i++) {
    const temple = tour.temples[i];
    const position = i + 1;

    console.log(`[${position}/${tour.temples.length}] ${temple.name}`);

    const description = await generateFactualDescription(temple.name, position, tour.temples.length);

    console.log(`   ${description.substring(0, 80)}...`);
    console.log('');

    enrichedTemples.push({
      ...temple,
      factualDescription: description,
      hasPreResearchedFacts: !!TEMPLE_FACTS[temple.name]
    });

    // Rate limiting
    if (i < tour.temples.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Save results
  const outputData = {
    ...tour,
    temples: enrichedTemples,
    metadata: {
      ...tour.metadata,
      descriptionsGenerated: new Date().toISOString(),
      factualDescriptions: true,
      preResearchedTemples: Object.keys(TEMPLE_FACTS).length
    }
  };

  fs.writeFileSync(
    path.join(__dirname, '../data/temple-tour-factual.json'),
    JSON.stringify(outputData, null, 2)
  );

  console.log('P'.repeat(60));
  console.log(' COMPLETE!\n');
  console.log(`Generated factual descriptions for ${enrichedTemples.length} temples`);
  console.log(`Pre-researched facts used: ${enrichedTemples.filter(t => t.hasPreResearchedFacts).length}`);
  console.log(`\n=¾ Saved to: data/temple-tour-factual.json`);
}

generateAllDescriptions()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
