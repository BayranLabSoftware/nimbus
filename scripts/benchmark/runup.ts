import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchGlobalBathymetricMosaic } from '../../src/scene/terrainSampling.js';
import { makeTerrariumCache, terrariumTile } from '../../src/physics/validation/terrariumTiles.js';
import { runRunup } from '../../src/physics/validation/runupRun.js';
import { RUNUP_BIAS_BOUND, RUNUP_SIGMA_BOUND } from '../../src/physics/validation/runupRules.js';

/**
 * Rules 102 to 105 of src/physics/validation/runupRules.ts, run once and
 * printed: every event of the set put through the product's own earthquake
 * and its own bathymetric wave, and T2 read for the first time.
 *
 *   pnpm exec tsx scripts/benchmark/runup.ts <terrarium cache dir> [<out.json>]
 *
 * The cache holds the sixteen planetary terrarium tiles; an empty directory
 * makes the run fetch them once from AWS Terrain Tiles and keep them.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cacheDir = process.argv[2];
if (cacheDir === undefined) {
  console.error('usage: runup.ts <terrarium cache dir> [<out.json>]');
  process.exit(2);
}
const cache = makeTerrariumCache(cacheDir);
const t0 = Date.now();
const grid = await fetchGlobalBathymetricMosaic(
  async (z, x, y) => (await terrariumTile(cache, z, x, y)).samples as Float32Array
);
console.log(
  `mosaic ${grid.nLat.toString()} x ${grid.nLon.toString()} in ${(Date.now() - t0).toString()} ms; tiles ${cache.hits.toString()} cached, ${cache.fetched.toString()} fetched`
);

const t1 = Date.now();
const run = runRunup(grid);
console.log(`${run.events.length.toString()} events in ${((Date.now() - t1) / 1000).toFixed(1)} s`);

const pc = (x: number): string => `${(100 * x).toFixed(0)} %`;
const r = run.overall;
console.log('');
console.log('rule 104, T2 read:');
console.log(
  `  bins ${r.bins.toString()} over ${r.events.toString()} events, ${r.observations.toString()} observations`
);
console.log(`  unmatched observations (no coastal cell within 50 km): ${r.unmatched.toString()}`);
console.log(
  `  bias ${r.bias.toFixed(3)}× (bound ${RUNUP_BIAS_BOUND.toString()}), sigma_ln ${r.sigmaLn.toFixed(3)} (bound ${RUNUP_SIGMA_BOUND.toString()}), within x2 ${pc(r.withinTwo)}`
);
console.log(`  meets T2: ${String(run.meetsBar)}`);
const sh = run.overallShore;
console.log(
  `  beside, deciding nothing — the shore height on the same bins: bias ${sh.bias.toFixed(3)}x, sigma_ln ${sh.sigmaLn.toFixed(3)}, within x2 ${pc(sh.withinTwo)}`
);
console.log('');
console.log('by NCEI measurement type (bins of one type only):');
for (const t of run.byType) {
  if (t.reading.bins < 10) continue;
  console.log(
    `  type ${t.typeId.toString().padStart(2)}  bins ${t.reading.bins.toString().padStart(4)}  run-up bias ${t.reading.bias.toFixed(3)}  sigma ${t.reading.sigmaLn.toFixed(3)}  |  shore bias ${t.shore.bias.toFixed(3)}  sigma ${t.shore.sigmaLn.toFixed(3)}`
  );
}
console.log('');
console.log('the ten events with the most bins:');
for (const e of [...run.events].sort((a, b) => b.bins - a.bins).slice(0, 10)) {
  console.log(
    `  ${e.event.year.toString()} M${e.event.magnitude.toFixed(1)} ${e.event.name.slice(0, 26).padEnd(26)} bins ${e.bins.toString().padStart(4)}  A0 ${e.sourceAmplitudeM.toFixed(2)} m  bias ${Number.isFinite(e.bias) ? e.bias.toFixed(2) : '—'}`
  );
}
if (run.silent.length > 0) {
  console.log('');
  console.log(
    `events that raised no wave: ${run.silent.map((e) => `${e.year.toString()} M${e.magnitude.toFixed(1)}`).join(', ')}`
  );
}

const out = process.argv[3];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
