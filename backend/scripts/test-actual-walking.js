import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateOptimizedRoute } from '../src/services/geoapifyService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load pre-computed routes from algorithm comparison
const comparison = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/algorithm-comparison.json'), 'utf8'));

console.log('ACTUAL WALKING DISTANCE TEST\n');
console.log('Comparing greedy vs 2-opt with REAL Geoapify routing\n');

const results = {};

for (const [gate, data] of Object.entries(comparison)) {
  console.log(gate.toUpperCase() + ' GATE:');
  console.log('  Starting: ' + data.greedy.route[0].name + '\n');
  
  console.log('  Greedy TSP: ' + (data.greedy.distance/1000).toFixed(2) + 'km');
  console.log('  Calling Geoapify...');
  const greedyActual = await calculateOptimizedRoute(data.greedy.route);
  console.log('  Actual walking: ' + (greedyActual.distance/1000).toFixed(2) + 'km\n');
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('  2-opt TSP: ' + (data.optimized.distance/1000).toFixed(2) + 'km');
  console.log('  Calling Geoapify...');
  const optActual = await calculateOptimizedRoute(data.optimized.route);
  console.log('  Actual walking: ' + (optActual.distance/1000).toFixed(2) + 'km\n');
  
  const tspImp = ((data.greedy.distance - data.optimized.distance) / data.greedy.distance * 100);
  const actualImp = ((greedyActual.distance - optActual.distance) / greedyActual.distance * 100);
  
  console.log('  TSP improvement: ' + tspImp.toFixed(2) + '%');
  console.log('  ACTUAL improvement: ' + actualImp.toFixed(2) + '%');
  console.log('  Gap: ' + (tspImp - actualImp).toFixed(2) + ' pp\n');
  
  results[gate] = {
    greedy: { tsp: data.greedy.distance, actual: greedyActual.distance },
    optimized: { tsp: data.optimized.distance, actual: optActual.distance },
    tspImprovement: tspImp,
    actualImprovement: actualImp
  };
  
  await new Promise(r => setTimeout(r, 2000));
}

const avgTsp = Object.values(results).reduce((s,r) => s + r.tspImprovement, 0) / 4;
const avgActual = Object.values(results).reduce((s,r) => s + r.actualImprovement, 0) / 4;

console.log('AVERAGES:');
console.log('  TSP: ' + avgTsp.toFixed(2) + '%');
console.log('  ACTUAL: ' + avgActual.toFixed(2) + '%');
console.log('  Gap: ' + (avgTsp - avgActual).toFixed(2) + ' pp\n');

fs.writeFileSync(path.join(__dirname, '../data/actual-walking-results.json'), JSON.stringify(results, null, 2));
console.log('Saved: data/actual-walking-results.json');
