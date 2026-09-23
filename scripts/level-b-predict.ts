/**
 * Level B, step 3: the predictions (rules 855 to 874,
 * src/physics/validation/levelBProtocolRules.ts).
 *
 *   git worktree add --detach <dir> 2c2c2f5
 *   pnpm exec tsx scripts/level-b-predict.ts <dir>
 *
 * Runs the model frozen at LEVEL_B_FROZEN_MODEL — imported from a checkout of
 * that commit, whatever this repository holds by then (rule 859) — on the
 * inputs levelBSources.ts pins, LEVEL_B_DRAWS draws per event from
 * LEVEL_B_SEED, and writes levelBPredictions.json beside the sources. It
 * reads no target value: there is none in the repository to read (rule
 * 855(3)). Deterministic: no clock, no randomness but the seed's.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEVEL_B_CARANCAS_STRESS_MASS_KG,
  LEVEL_B_DRAWS,
  LEVEL_B_FROZEN_MODEL,
  LEVEL_B_SEED,
} from '../src/physics/validation/levelBProtocolRules.js';
import {
  LEVEL_B_CONSISTENCY_EVENTS,
  LEVEL_B_CRATER_EVENTS,
  LEVEL_B_ENTRY_EVENTS,
  LEVEL_B_SEEN_EVENTS,
  type LevelBEvent,
  type LevelBInputValue,
} from '../src/physics/validation/levelBSources.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'physics', 'validation', 'levelBPredictions.json');

const frozenDir = process.argv[2];
if (frozenDir === undefined) {
  console.error('Usage: tsx scripts/level-b-predict.ts <checkout of the frozen model>');
  process.exit(2);
}
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: frozenDir })
  .toString()
  .trim();
if (!head.startsWith(LEVEL_B_FROZEN_MODEL)) {
  console.error(`The checkout is at ${head}, not at the frozen model ${LEVEL_B_FROZEN_MODEL}.`);
  process.exit(2);
}
// Rules 836, 837 and 859: the engine the model is frozen on.
const pinned = 'v22.20.0';
const platform = `${process.platform}-${process.arch}`;
if (process.version !== pinned || platform !== 'darwin-arm64') {
  console.error(
    `Refusing to predict on ${process.version} ${platform}: rule 859 fixes ${pinned} darwin-arm64.`
  );
  process.exit(2);
}

interface FrozenResult {
  entry: { regime: string; breakupAltitude: number; burstAltitude: number };
  crater: { finalDiameter: number; depth: number; morphology: string; origin: string };
}
const frozen = (await import(join(resolve(frozenDir), 'src', 'physics', 'simulate.ts'))) as {
  simulateImpact: (input: Record<string, number>) => FrozenResult;
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
      // Box–Muller; the second deviate is discarded so each input takes two
      // numbers of the stream, always.
      const u1 = Math.max(u(), Number.MIN_VALUE);
      const u2 = u();
      return value.mean + value.sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
    case 'sin2theta': {
      // Inverse of F(θ) = (cos 2a − cos 2θ) / (cos 2a − cos 2b).
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
  breakupAltitudeM: number;
  burstAltitudeM: number;
  finalDiameterM: number;
  depthM: number;
  morphology: string;
}

type Override = Partial<Record<'angleDeg' | 'massKg', () => number>>;

function run(event: LevelBEvent, label: string, override: Override = {}): Draw[] {
  const u = stream(`${LEVEL_B_SEED}/${event.event}/${label}`);
  const out: Draw[] = [];
  for (let i = 0; i < LEVEL_B_DRAWS; i++) {
    // A fixed order of inputs, so that every draw takes the stream alike.
    const velocityKmS = draw(event.inputs.velocity.value, u);
    const angleDraw = draw(event.inputs.angle.value, u);
    const diameterDraw = draw(event.inputs.diameter.value, u);
    const density = draw(event.inputs.density.value, u);
    const targetDensity = draw(event.inputs.targetDensity.value, u);
    const angleDeg = override.angleDeg?.() ?? angleDraw;
    const mass = override.massKg?.();
    const diameter =
      mass === undefined ? diameterDraw : Math.cbrt((6 * mass) / (Math.PI * density));
    const r = frozen.simulateImpact({
      impactorDiameter: diameter,
      impactVelocity: velocityKmS * 1_000,
      impactorDensity: density,
      targetDensity,
      impactAngle: (angleDeg * Math.PI) / 180,
      surfaceGravity: 9.806_65,
    });
    out.push({
      regime: r.entry.regime,
      origin: r.crater.origin,
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
  return {
    regime: shares(draws.map((d) => d.regime)),
    craterOrigin: shares(draws.map((d) => d.origin)),
    morphology: shares(draws.filter((d) => d.origin !== 'none').map((d) => d.morphology)),
    breakupAltitudeM: band(draws.map((d) => d.breakupAltitudeM)),
    burstAltitudeM: band(draws.map((d) => d.burstAltitudeM)),
    finalDiameterM: band(draws.map((d) => d.finalDiameterM)),
    depthM: band(draws.map((d) => d.depthM)),
    depthOverDiameter: band(
      draws.filter((d) => d.finalDiameterM > 0).map((d) => d.depthM / d.finalDiameterM)
    ),
  };
}

const events: Record<string, Record<string, unknown>> = {};
for (const e of [...LEVEL_B_ENTRY_EVENTS, ...LEVEL_B_SEEN_EVENTS, ...LEVEL_B_CRATER_EVENTS])
  events[e.event] = { scored: summarise(run(e, 'scored')) };

// Rule 872: Carancas's stress run, the mass widened to 1–27 t.
const carancas = LEVEL_B_CRATER_EVENTS.find((e) => e.event === 'Carancas');
if (carancas !== undefined) {
  const [lo, hi] = LEVEL_B_CARANCAS_STRESS_MASS_KG;
  const u = stream(`${LEVEL_B_SEED}/Carancas/stress-mass`);
  events.Carancas = {
    ...events.Carancas,
    stressMass: summarise(run(carancas, 'stress', { massKg: () => lo + (hi - lo) * u() })),
  };
}

// Rule 869: Meteor Crater's ensemble, and its nominal 45° apart.
for (const e of LEVEL_B_CONSISTENCY_EVENTS)
  events[e.event] = {
    scored: summarise(run(e, 'scored')),
    nominal45: summarise(run(e, 'nominal45', { angleDeg: () => 45 })),
  };

const out = {
  protocol: 'rules 855 to 874, src/physics/validation/levelBProtocolRules.ts',
  frozenModel: LEVEL_B_FROZEN_MODEL,
  engine: { node: process.version, platform },
  seed: LEVEL_B_SEED,
  draws: LEVEL_B_DRAWS,
  note: 'The model enters to sea level: it takes no elevation of the ground (Carancas lies at 3 800 m).',
  events,
};
writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.log(`Wrote ${OUT}`);
