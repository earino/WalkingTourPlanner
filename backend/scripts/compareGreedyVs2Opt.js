import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function calculateDistance(p1, p2) {
  const R = 6371000;
  const lat1Rad = p1.latitude * Math.PI / 180;
  const lat2Rad = p2.latitude * Math.PI / 180;
  const deltaLat = (p2.latitude - p1.latitude) * Math.PI / 180;
  const deltaLon = (p2.longitude - p1.longitude) * Math.PI / 180;

  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateRouteDistance(route) {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += calculateDistance(route[i], route[i + 1]);
  }
  return total;
}

function greedyFromStart(temples, startTemple) {
  const route = [startTemple];
  const remaining = temples.filter(t => t.id !== startTemple.id);
  let current = startTemple;

  while (remaining.length > 0) {
    let nearest = null;
    let minDist = Infinity;

    remaining.forEach(temple => {
      const dist = calculateDistance(current, temple);
      if (dist < minDist) {
        minDist = dist;
        nearest = temple;
      }
    });

    route.push(nearest);
    const idx = remaining.indexOf(nearest);
    remaining.splice(idx, 1);
    current = nearest;
  }

  return route;
}

function twoOptSwap(route, i, j) {
  const newRoute = route.slice(0, i + 1);
  const reversed = route.slice(i + 1, j + 1).reverse();
  const remaining = route.slice(j + 1);
  return [...newRoute, ...reversed, ...remaining];
}

function twoOptWithFixedStart(inputRoute) {
  let route = [...inputRoute];
  let improved = true;
  let iterations = 0;
  const maxIterations = 100;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 1; i < route.length - 1; i++) {
      for (let j = i + 2; j < route.length; j++) {
        const newRoute = twoOptSwap(route, i, j);
        const currentDist = calculateRouteDistance(route);
        const newDist = calculateRouteDistance(newRoute);

        if (newDist < currentDist) {
          route = newRoute;
          improved = true;
        }
      }
    }
  }

  return route;
}

async function compareAlgorithms() {
  console.log('>ê GREEDY VS GREEDY+2OPT COMPARISON\n');
  console.log('='.repeat(70));

  const tourData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/temple-tour-factual.json'), 'utf8'));
  const temples = tourData.temples;

  const gates = {
    north: { name: 'Chang Phuak (North)', temple: 'Wat Mai Tang' },
    east: { name: 'Tha Phae (East)', temple: 'Wat Lam Chang' },
    south: { name: 'Chiang Mai (South)', temple: 'Wat Sai Moon Muang' },
    west: { name: 'Suan Dok (West)', temple: 'Wat Phuak Hong' }
  };

  const results = {};

  for (const [key, gate] of Object.entries(gates)) {
    console.log('\n' + gate.name.toUpperCase());
    console.log('-'.repeat(70));

    const startTemple = temples.find(t => t.name === gate.temple);
    console.log('Starting: ' + startTemple.name + '\n');

    const greedyRoute = greedyFromStart(temples, startTemple);
    const greedyDist = calculateRouteDistance(greedyRoute);

    console.log('GREEDY:');
    console.log('  Route: ' + greedyRoute[0].name + ' -> ... -> ' + greedyRoute[greedyRoute.length-1].name);
    console.log('  Distance: ' + (greedyDist / 1000).toFixed(3) + ' km');

    const improvedRoute = twoOptWithFixedStart(greedyRoute);
    const improvedDist = calculateRouteDistance(improvedRoute);
    const improvement = ((greedyDist - improvedDist) / greedyDist * 100);

    console.log('\nGREEDY + 2-OPT:');
    console.log('  Route: ' + improvedRoute[0].name + ' -> ... -> ' + improvedRoute[improvedRoute.length-1].name);
    console.log('  Distance: ' + (improvedDist / 1000).toFixed(3) + ' km');
    console.log('  Improvement: ' + improvement.toFixed(2) + '%');
    console.log('  Start check: ' + (improvedRoute[0].name === startTemple.name ? ' Correct' : ' BROKEN'));

    results[key] = {
      gate: gate.name,
      greedy: { distance: greedyDist, route: greedyRoute },
      optimized: { distance: improvedDist, route: improvedRoute },
      improvement: improvement
    };
  }

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY:\n');

  const avgImprovement = Object.values(results).reduce((s, r) => s + r.improvement, 0) / 4;

  Object.entries(results).forEach(([k, r]) => {
    console.log(k.padEnd(8) + ': ' + r.improvement.toFixed(2) + '% improvement');
  });

  console.log('\nAverage: ' + avgImprovement.toFixed(2) + '%');

  if (avgImprovement > 5) {
    console.log('\n VERDICT: 2-opt is worth it! (' + avgImprovement.toFixed(1) + '% avg improvement)');
  } else if (avgImprovement > 1) {
    console.log('\n> VERDICT: Modest improvement (' + avgImprovement.toFixed(1) + '%)');
  } else {
    console.log('\nL VERDICT: Greedy is good enough (<1% improvement)');
  }

  fs.writeFileSync(path.join(__dirname, '../data/algorithm-comparison.json'), JSON.stringify(results, null, 2));
  console.log('\n=¾ Saved: data/algorithm-comparison.json\n');
}

compareAlgorithms().catch(err => console.error(err));
