/**
 * Rule 294 of `src/physics/validation/faultStrikeRules.ts`: what the strike
 * lookup finds for the six presets the round is decided on, printed so that
 * the outcome recorded in that file can be reproduced.
 *
 * Needs the tiles `scripts/build-faults.ts` writes into
 * `public/data/faults/`, which are not committed while the candidate stands
 * refused. Build them first:
 *
 *   pnpm exec tsx scripts/build-faults.ts <gem_active_faults_harmonized.geojson>
 *   pnpm exec tsx scripts/benchmark/fault-strike.ts
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STRIKE_PRESETS,
  PRESET_STRIKE_TOLERANCE_DEG,
  PRESET_MINIMUM_FOUND,
  strikeDifferenceDeg,
} from '../../src/physics/validation/faultStrikeRules.js';
import {
  decodeFault,
  faultTileKey,
  findFault,
  type FaultTileIndex,
  type PackedFault,
} from '../../src/physics/events/earthquake/faultLookup.js';
import {
  EARTHQUAKE_PRESETS,
  simulateEarthquake,
} from '../../src/physics/events/earthquake/simulate.js';

const DIR = join(fileURLToPath(new URL('../..', import.meta.url)), 'public', 'data', 'faults');
const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8')) as FaultTileIndex;

console.log('| preset | L (km) | pubblicato | trovato | Δ | Δ da nord | faglia | tipo | dist |');
console.log('| --- | --: | --: | --: | --: | --: | --- | --- | --: |');

let found = 0;
let worst = 0;
const missing: string[] = [];
let beatsNorth = 0;

for (const p of STRIKE_PRESETS) {
  const presets = EARTHQUAKE_PRESETS as unknown as Record<
    string,
    { input: Parameters<typeof simulateEarthquake>[0] }
  >;
  const preset = presets[p.preset];
  if (preset === undefined) throw new Error(`no preset ${p.preset}`);
  const sim = simulateEarthquake(preset.input);
  const L = sim.ruptureLength as number;
  const key = faultTileKey(p.latitude, p.longitude, index.tileDeg);
  let packed: PackedFault[] = [];
  try {
    packed = (
      JSON.parse(readFileSync(join(DIR, `${key}.json`), 'utf8')) as { faults: PackedFault[] }
    ).faults;
  } catch {
    packed = [];
  }
  const faults = packed.map((f) => decodeFault(f, index)).filter((f) => f !== null);
  const match = findFault(faults, p.latitude, p.longitude, L);
  const dNorth = strikeDifferenceDeg(0, p.publishedStrikeDeg);
  if (match === null) {
    missing.push(p.name);
    console.log(
      `| ${p.name} | ${(L / 1000).toFixed(0)} | ${p.publishedStrikeDeg.toString()}° | — | — | ${dNorth.toFixed(1)}° | nessuna in portata | tessera ${key}, ${faults.length.toString()} faglie | — |`
    );
    continue;
  }
  found += 1;
  const d = strikeDifferenceDeg(match.strikeDeg, p.publishedStrikeDeg);
  if (d > worst) worst = d;
  if (d < dNorth) beatsNorth += 1;
  console.log(
    `| ${p.name} | ${(L / 1000).toFixed(0)} | ${p.publishedStrikeDeg.toString()}° | ${match.strikeDeg.toFixed(1)}° | **${d.toFixed(1)}°** | ${dNorth.toFixed(1)}° | ${match.name ?? '(senza nome)'} | ${match.slipType} | ${(match.distanceM / 1000).toFixed(0)} km |`
  );
}

console.log('');
console.log(
  `292(a) peggiore Δ = ${worst.toFixed(1)}° contro ${PRESET_STRIKE_TOLERANCE_DEG.toString()}°  ->  ${worst <= PRESET_STRIKE_TOLERANCE_DEG ? 'DENTRO' : 'FUORI'}`
);
console.log(
  `292(b) batte nord su ${beatsNorth.toString()}/${found.toString()}  ->  ${beatsNorth === found ? 'DENTRO' : 'FUORI'}`
);
console.log(
  `292(c) trovate ${found.toString()}/${STRIKE_PRESETS.length.toString()} (minimo ${PRESET_MINIMUM_FOUND.toString()})  ->  ${found >= PRESET_MINIMUM_FOUND ? 'DENTRO' : 'FUORI'}`
);
if (missing.length > 0) console.log(`senza faglia: ${missing.join(', ')}`);
