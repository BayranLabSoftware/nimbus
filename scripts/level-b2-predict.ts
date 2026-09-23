/**
 * Level B's second round, step 3: the predictions (rules 875 to 880, 903,
 * 904, 919 to 932, src/physics/validation/levelBSecondRules.ts).
 *
 *   git worktree add --detach <dir> 5b6b7a5
 *   pnpm exec tsx scripts/level-b2-predict.ts <dir>
 *
 * Runs the model frozen at LEVEL_B2_FROZEN_MODEL — imported from a checkout
 * of that commit (rule 919) — on the inputs levelB2Sources.ts pins, and on
 * the first round's regression cases (rule 877), LEVEL_B2_DRAWS draws per
 * event from LEVEL_B2_SEED; the same draws again on the standard atmosphere
 * as a sensitivity (rule 924), and Sterlitamak on three grounds (rule 931).
 * Writes levelB2Predictions.json beside the sources. It reads no target value:
 * none of this round is in the repository. Deterministic: no clock, no
 * randomness but the seed's.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEVEL_B2_DIAGNOSTIC_EVENTS,
  LEVEL_B2_ENTRY_EVENTS,
} from '../src/physics/validation/levelB2Sources.js';
import {
  LEVEL_B2_DRAWS,
  LEVEL_B2_FROZEN_MODEL,
  LEVEL_B2_SEED,
  LEVEL_B2_STERLITAMAK_GROUNDS,
} from '../src/physics/validation/levelBSecondRules.js';
import {
  LEVEL_B_CRATER_EVENTS,
  LEVEL_B_ENTRY_EVENTS,
  type LevelBEvent,
  type LevelBInputValue,
} from '../src/physics/validation/levelBSources.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'physics', 'validation', 'levelB2Predictions.json');

const frozenDir = process.argv[2];
if (frozenDir === undefined) {
  console.error('Usage: tsx scripts/level-b2-predict.ts <checkout of the frozen model>');
  process.exit(2);
}
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: frozenDir })
  .toString()
  .trim();
if (!head.startsWith(LEVEL_B2_FROZEN_MODEL)) {
  console.error(`The checkout is at ${head}, not at the frozen model ${LEVEL_B2_FROZEN_MODEL}.`);
  process.exit(2);
}
// Rules 836, 837 and 919: the engine the model is frozen on.
const pinned = 'v22.20.0';
const platform = `${process.platform}-${process.arch}`;
if (process.version !== pinned || platform !== 'darwin-arm64') {
  console.error(
    `Refusing to predict on ${process.version} ${platform}: rule 919 fixes ${pinned} darwin-arm64.`
  );
  process.exit(2);
}

interface FrozenResult {
  entry: {
    regime: string;
    breakupAltitude: number;
    burstAltitude: number;
    firstFragmentationAltitude?: number;
    firstFragmentationMajorShare?: number;
  };
  crater: { finalDiameter: number; depth: number; morphology: string; origin: string };
}
const frozen = (await import(join(resolve(frozenDir), 'src', 'physics', 'simulate.ts'))) as {
  simulateImpact: (input: Record<string, number | string>) => FrozenResult;
};

/** FNV-1a of the seed, then mulberry32: the same stream on every machine. */
function stream(seed: string): () => number {
  let h = 0x811c9dc5;
  for (const c of seed) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let a = h;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function draw(value: LevelBInputValue, u: () => number): number {
  switch (value.kind) {
    case 'fixed':
      return value.value;
    case 'uniform':
      return value.low + (value.high - value.low) * u();
    case 'normal': {
      const u1 = Math.max(u(), Number.MIN_VALUE);
      const u2 = u();
      return value.mean + value.sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
    case 'sin2theta': {
      const a = (2 * value.low * Math.PI) / 180;
      const b = (2 * value.high * Math.PI) / 180;
      const c = Math.cos(a) - u() * (Math.cos(a) - Math.cos(b));
      return (Math.acos(c) / 2) * (180 / Math.PI);
    }
  }
}

interface Draw {
  regime: string;
  origin: string;
  firstFragmentationAltitudeM: number;
  breakupAltitudeM: number;
  burstAltitudeM: number;
  finalDiameterM: number;
  depthM: number;
  morphology: string;
}

interface Options {
  atmosphere?: 'integratedUssa';
  targetDensity?: number;
}

/** The event's draws; the stream depends on the event alone, so every branch
 *  and every ground runs the same inputs (rules 924 and 931). */
function run(event: LevelBEvent, options: Options = {}): Draw[] {
  const u = stream(`${LEVEL_B2_SEED}/${event.event}`);
  const out: Draw[] = [];
  for (let i = 0; i < LEVEL_B2_DRAWS; i++) {
    const velocityKmS = draw(event.inputs.velocity.value, u);
    const angleDeg = draw(event.inputs.angle.value, u);
    const diameter = draw(event.inputs.diameter.value, u);
    const density = draw(event.inputs.density.value, u);
    const targetDraw = draw(event.inputs.targetDensity.value, u);
    const r = frozen.simulateImpact({
      impactorDiameter: diameter,
      impactVelocity: velocityKmS * 1_000,
      impactorDensity: density,
      targetDensity: options.targetDensity ?? targetDraw,
      impactAngle: (angleDeg * Math.PI) / 180,
      surfaceGravity: 9.806_65,
      ...(options.atmosphere === undefined ? {} : { entryAtmosphere: options.atmosphere }),
    });
    out.push({
      regime: r.entry.regime,
      origin: r.crater.origin,
      firstFragmentationAltitudeM: r.entry.firstFragmentationAltitude ?? Number.NaN,
      breakupAltitudeM: r.entry.breakupAltitude,
      burstAltitudeM: r.entry.burstAltitude,
      finalDiameterM: r.crater.finalDiameter,
      depthM: r.crater.depth,
      morphology: r.crater.morphology,
    });
  }
  return out;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return Number.NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return (
    (sorted[lo] ?? Number.NaN) +
    ((sorted[hi] ?? Number.NaN) - (sorted[lo] ?? Number.NaN)) * (pos - lo)
  );
}

function band(values: number[]): { n: number; p5: number; median: number; p95: number } | null {
  const finite = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (finite.length === 0) return null;
  return {
    n: finite.length,
    p5: quantile(finite, 0.05),
    median: quantile(finite, 0.5),
    p95: quantile(finite, 0.95),
  };
}

function shares(values: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  for (const k of Object.keys(out)) out[k] = (out[k] ?? 0) / values.length;
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

function summarise(draws: Draw[]): Record<string, unknown> {
  // Rule 930: E3 is read on the draws that dig no crater.
  const noCrater = draws.filter((d) => d.origin === 'none');
  return {
    regime: shares(draws.map((d) => d.regime)),
    craterOrigin: shares(draws.map((d) => d.origin)),
    morphology: shares(draws.filter((d) => d.origin !== 'none').map((d) => d.morphology)),
    firstFragmentationAltitudeM: band(draws.map((d) => d.firstFragmentationAltitudeM)),
    breakupAltitudeM: band(draws.map((d) => d.breakupAltitudeM)),
    burstAltitudeM: band(draws.map((d) => d.burstAltitudeM)),
    noCraterDraws: noCrater.length,
    burstAltitudeNoCraterM: band(noCrater.map((d) => d.burstAltitudeM)),
    finalDiameterM: band(draws.map((d) => d.finalDiameterM)),
    depthM: band(draws.map((d) => d.depthM)),
    depthOverDiameter: band(
      draws.filter((d) => d.finalDiameterM > 0).map((d) => d.depthM / d.finalDiameterM)
    ),
  };
}

const events: Record<string, Record<string, unknown>> = {};
// Rules 921 and 924: the counted body, on the operative branch and the standard.
for (const e of LEVEL_B2_ENTRY_EVENTS)
  events[e.event] = {
    role: 'counted',
    operative: summarise(run(e)),
    standardAtmosphere: summarise(run(e, { atmosphere: 'integratedUssa' })),
  };
// Rules 922 and 931: Sterlitamak on three grounds, diagnostic.
for (const e of LEVEL_B2_DIAGNOSTIC_EVENTS)
  events[e.event] = {
    role: 'diagnostic',
    grounds: Object.fromEntries(
      LEVEL_B2_STERLITAMAK_GROUNDS.map((g) => [String(g), summarise(run(e, { targetDensity: g }))])
    ),
  };
// Rule 877: the first round's bodies, regression cases on the new model.
for (const e of [...LEVEL_B_ENTRY_EVENTS, ...LEVEL_B_CRATER_EVENTS])
  events[e.event] = { role: 'regression', operative: summarise(run(e)) };

const out = {
  protocol:
    'rules 875 to 880, 903, 904 and 919 to 932, src/physics/validation/levelBSecondRules.ts',
  frozenModel: LEVEL_B2_FROZEN_MODEL,
  engine: { node: process.version, platform },
  seed: LEVEL_B2_SEED,
  draws: LEVEL_B2_DRAWS,
  events,
};
writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.log(`Wrote ${OUT}`);
