/**
 * Rule 303 of `src/physics/validation/slabStrikeRules.ts`: what the second
 * round of the strike lookup finds for the six presets it is decided on,
 * printed so that the outcome recorded in that file can be reproduced.
 *
 * Needs both sets of tiles, neither of which is committed while the data is an
 * input rather than a file of the project:
 *
 *   pnpm exec tsx scripts/build-faults.ts ~/Desktop/nimbus-datasets/gem_faults.geojson
 *   <venv>/bin/python scripts/build-slab2.py ~/Desktop/nimbus-datasets/slab2/Slab2Distribute_Mar2018
 *   pnpm exec tsx scripts/benchmark/strike-source.ts
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STRIKE_PRESETS,
  PRESET_STRIKE_TOLERANCE_DEG,
  strikeDifferenceDeg,
} from '../../src/physics/validation/faultStrikeRules.js';
import {
  SLAB_DATA_BUDGET,
  interfaceDepthToleranceM,
} from '../../src/physics/validation/slabStrikeRules.js';
import { shippedSlabField } from '../../src/physics/validation/shippedSlab2.js';
import {
  decodeFault,
  faultTileKey,
  type FaultTileIndex,
  type PackedFault,
} from '../../src/physics/events/earthquake/faultLookup.js';
import { chooseStrike } from '../../src/physics/events/earthquake/strikeSource.js';
import {
  EARTHQUAKE_PRESETS,
  simulateEarthquake,
} from '../../src/physics/events/earthquake/simulate.js';

/** Rule 301(c): how many of the six must find a structure. */
const MINIMUM_FOUND = 5;

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const FAULT_DIR = join(ROOT, 'public', 'data', 'faults');
const SLAB_DIR = join(ROOT, 'public', 'data', 'slab2');

const faultIndex = JSON.parse(
  readFileSync(join(FAULT_DIR, 'index.json'), 'utf8')
) as FaultTileIndex;
const field = shippedSlabField();
if (field === null) throw new Error('no slab tiles: run scripts/build-slab2.py first');

const km = (m: number | null | undefined): string =>
  m === null || m === undefined ? '—' : `${(m / 1000).toFixed(0)} km`;

console.log('| preset | Mw | L | pubblicato | trovato | Δ | Δ da nord | sorgente | dettaglio |');
console.log('| --- | --: | --: | --: | --: | --: | --: | --- | --- |');

let found = 0;
let beatsNorth = 0;
let worst = 0;
const missing: string[] = [];

for (const p of STRIKE_PRESETS) {
  const presets = EARTHQUAKE_PRESETS as unknown as Record<
    string,
    { input: Parameters<typeof simulateEarthquake>[0] }
  >;
  const preset = presets[p.preset];
  if (preset === undefined) throw new Error(`no preset ${p.preset}`);
  const sim = simulateEarthquake(preset.input);
  const ruptureLengthM = sim.ruptureLength as number;
  const hypocentreDepthM = (preset.input.depth as number | undefined) ?? 10_000;

  const key = faultTileKey(p.latitude, p.longitude, faultIndex.tileDeg);
  let packed: PackedFault[] = [];
  const tilePath = join(FAULT_DIR, `${key}.json`);
  if (existsSync(tilePath)) {
    packed = (JSON.parse(readFileSync(tilePath, 'utf8')) as { faults: PackedFault[] }).faults;
  }
  const faults = packed.map((f) => decodeFault(f, faultIndex)).filter((f) => f !== null);

  const answer = chooseStrike(
    { latitude: p.latitude, longitude: p.longitude, hypocentreDepthM, ruptureLengthM },
    field,
    faults
  );

  const dNorth = strikeDifferenceDeg(0, p.publishedStrikeDeg);
  const detail =
    answer.source === 'crustal'
      ? `${answer.fault?.name ?? '(senza nome)'}, ${answer.fault?.slipType ?? '?'}, traccia ${km(
          answer.fault?.mappedLengthM
        )} a ${km(answer.fault?.distanceM)}`
      : answer.slab !== null
        ? `slab a ${km(answer.slab.depthM)}, ipocentro a ${km(hypocentreDepthM)}, tolleranza ±${km(
            interfaceDepthToleranceM(answer.slab.depthUncertaintyM)
          )}`
        : (answer.refusal ?? '—');

  if (answer.strikeDeg === null) {
    missing.push(`${p.name} (${answer.refusal ?? 'senza motivo'})`);
    console.log(
      `| ${p.name} | ${preset.input.magnitude.toFixed(1)} | ${km(ruptureLengthM)} | ${p.publishedStrikeDeg.toString()}° | — | — | ${dNorth.toFixed(1)}° | ${answer.source} | ${detail} |`
    );
    continue;
  }
  found += 1;
  const d = strikeDifferenceDeg(answer.strikeDeg, p.publishedStrikeDeg);
  if (d > worst) worst = d;
  if (d < dNorth) beatsNorth += 1;
  console.log(
    `| ${p.name} | ${preset.input.magnitude.toFixed(1)} | ${km(ruptureLengthM)} | ${p.publishedStrikeDeg.toString()}° | ${answer.strikeDeg.toFixed(1)}° | **${d.toFixed(1)}°** | ${dNorth.toFixed(1)}° | ${answer.source} | ${detail} |`
  );
}

// Rule 301(f): what would be shipped.
let total = 0;
let worstTile = 0;
let worstName = '';
for (const name of readdirSync(SLAB_DIR)) {
  const size = statSync(join(SLAB_DIR, name)).size;
  total += size;
  if (name.endsWith('.png') && size > worstTile) {
    worstTile = size;
    worstName = name;
  }
}

console.log('');
console.log(
  `301(a) peggiore Δ = ${worst.toFixed(1)}° contro ${PRESET_STRIKE_TOLERANCE_DEG.toString()}°  ->  ${worst <= PRESET_STRIKE_TOLERANCE_DEG && found > 0 ? 'DENTRO' : 'FUORI'}`
);
console.log(
  `301(b) batte nord su ${beatsNorth.toString()}/${found.toString()}  ->  ${beatsNorth === found && found > 0 ? 'DENTRO' : 'FUORI'}`
);
console.log(
  `301(c) trovate ${found.toString()}/${STRIKE_PRESETS.length.toString()} (minimo ${MINIMUM_FOUND.toString()})  ->  ${found >= MINIMUM_FOUND ? 'DENTRO' : 'FUORI'}`
);
console.log(
  `301(f) ${total.toString()} byte in tutto (limite ${SLAB_DATA_BUDGET.totalBytes.toString()}), tessera peggiore ${worstName} a ${worstTile.toString()} (limite ${SLAB_DATA_BUDGET.perTileBytes.toString()})  ->  ${
    total <= SLAB_DATA_BUDGET.totalBytes && worstTile <= SLAB_DATA_BUDGET.perTileBytes
      ? 'DENTRO'
      : 'FUORI'
  }`
);
if (missing.length > 0) console.log(`senza risposta: ${missing.join('; ')}`);
