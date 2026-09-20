/**
 * The run of rules 555 to 562: what the 408 non-monotone impact rings are.
 *
 *   pnpm exec tsx scripts/benchmark/impact-monotonicity.ts
 */
import { airburstReach } from '../../src/physics/effects/airburstBlast.js';
import { mulberry32 } from '../../src/physics/montecarlo/sampling.js';
import {
  GROWTH,
  THE_408,
  THE_OTHER_SIXTEEN,
} from '../../src/physics/validation/impactMonotonicityRules.js';
import { SWEEP_SEED } from '../../src/physics/validation/physicalInvariantRules.js';
import { m, type Joules, type Pascals } from '../../src/physics/units.js';
import { HAZARDS, type Json } from './invariants.js';

const SCENARIOS = Number(process.env.NIMBUS_INV_SCENARIOS ?? 5_000);
const RINGS = Object.keys(THE_408);

const impact = HAZARDS.find((h) => h.name === 'impact');
if (impact === undefined) throw new Error('no impact hazard');

const get = (o: unknown, p: string): number | undefined => {
  const v = p.split('.').reduce<unknown>((a, k) => (a as Json | undefined)?.[k], o);
  return typeof v === 'number' ? v : undefined;
};
const regimeOf = (o: unknown): string | undefined => {
  const v = (o as { entry?: { regime?: unknown } }).entry?.regime;
  return typeof v === 'string' ? v : undefined;
};

/** The burst geometry the ring is laid on: the altitude for a burst in the
 *  air, the virtual source otherwise. Higher is further from the ground. */
const geometry = (o: unknown): number | undefined =>
  regimeOf(o) === 'COMPLETE_AIRBURST'
    ? get(o, 'entry.burstAltitude')
    : get(o, 'entry.virtualBurstAltitude');

// ---- rule 556(a): does the burst geometry fall in every one? ----------
let shrinks = 0;
const byRing = new Map<string, number>();
let geometryFell = 0;
let geometryHeld = 0;
let geometryRose = 0;
let yieldRose = 0;
let yieldFell = 0;
const counterexamples: string[] = [];

const rng = mulberry32(SWEEP_SEED('impact'));
const u = (): number => rng.next();
for (let i = 0; i < SCENARIOS; i++) {
  const input = impact.sample(u);
  let a: Json;
  let b: Json;
  try {
    a = impact.run(input);
    b = impact.run(impact.grow(input, GROWTH, 'monotone'));
  } catch {
    continue;
  }
  for (const ring of RINGS) {
    const r0 = get(a, ring);
    const r1 = get(b, ring);
    if (r0 === undefined || r1 === undefined) continue;
    if (Math.max(Math.abs(r0), Math.abs(r1)) < 1e-3) continue;
    if (!(r1 < r0 * (1 - 1e-9) - 1e-9)) continue;
    shrinks++;
    byRing.set(ring, (byRing.get(ring) ?? 0) + 1);

    const g0 = geometry(a);
    const g1 = geometry(b);
    if (g0 === undefined || g1 === undefined) {
      geometryHeld++;
      counterexamples.push(`${ring}: no burst geometry to read (regime ${String(regimeOf(a))})`);
      continue;
    }
    if (g1 < g0) geometryFell++;
    else if (g1 > g0) {
      geometryRose++;
      counterexamples.push(
        `${ring}: ring ${r0.toPrecision(6)} → ${r1.toPrecision(6)} but geometry ROSE ${g0.toPrecision(6)} → ${g1.toPrecision(6)} (${String(regimeOf(a))})`
      );
    } else {
      geometryHeld++;
      counterexamples.push(
        `${ring}: ring ${r0.toPrecision(6)} → ${r1.toPrecision(6)} with geometry UNCHANGED at ${g0.toPrecision(6)} (${String(regimeOf(a))})`
      );
    }

    const y0 = get(a, 'entry.blastYieldMegatons');
    const y1 = get(b, 'entry.blastYieldMegatons');
    if (y0 !== undefined && y1 !== undefined) {
      if (y1 > y0) yieldRose++;
      else yieldFell++;
    }
  }
}

console.log(`Rules 555 to 562 — ${String(SCENARIOS)} impacts, the sweep's own seed\n`);
console.log(`rings that shrink when the impactor grows by 1 %: ${String(shrinks)}`);
for (const ring of RINGS) {
  console.log(
    `  ${ring.padEnd(28)} ${String(byRing.get(ring) ?? 0).padStart(4)}   (the report carries ${String(THE_408[ring as keyof typeof THE_408])})`
  );
}
console.log(`\nrule 556(a): the burst geometry, in each of those ${String(shrinks)}`);
console.log(`  fell     ${String(geometryFell).padStart(5)}`);
console.log(`  unchanged${String(geometryHeld).padStart(5)}`);
console.log(`  ROSE     ${String(geometryRose).padStart(5)}`);
console.log(`  556(a) ${geometryFell === shrinks ? 'HOLDS' : 'FAILS'}`);
if (counterexamples.length > 0) {
  console.log('  counterexamples:');
  for (const c of counterexamples.slice(0, 8)) console.log(`    ${c}`);
  if (counterexamples.length > 8)
    console.log(`    … and ${String(counterexamples.length - 8)} more`);
}
console.log(`\n  and the blast yield: rose ${String(yieldRose)}, fell ${String(yieldFell)}`);

// ---- rule 556(b): at a held geometry, does the yield always win? ------
console.log('\nrule 556(b): the same rings, with the burst geometry HELD');
const THRESHOLDS: readonly (readonly [string, number])[] = [
  ['5 psi', 34_474],
  ['1 psi', 6_895],
  ['light damage', 2_000],
];
let checked = 0;
let broke = 0;
const brokeAt: string[] = [];
const rng2 = mulberry32('rules-555-to-562-held-geometry');
for (let i = 0; i < 20_000; i++) {
  const altitudeM = rng2.next() ** 2 * 60_000;
  const yieldJ = Math.exp(Math.log(4.184e12) + rng2.next() * Math.log(1e9));
  for (const [name, pa] of THRESHOLDS) {
    const r0 = airburstReach(pa as Pascals, m(altitudeM), yieldJ as Joules);
    const r1 = airburstReach(pa as Pascals, m(altitudeM), (yieldJ * 1.03) as Joules);
    if (!((r0 as number) > 0) && !((r1 as number) > 0)) continue;
    checked++;
    if ((r1 as number) < (r0 as number) * (1 - 1e-12)) {
      broke++;
      if (brokeAt.length < 6)
        brokeAt.push(
          `${name} at ${altitudeM.toFixed(0)} m, ${(yieldJ / 4.184e15).toPrecision(4)} Mt: ${(r0 as number).toPrecision(8)} → ${(r1 as number).toPrecision(8)}`
        );
    }
  }
}
console.log(`  pairs checked: ${String(checked)}`);
console.log(`  a 3 % larger yield gave a SMALLER ring: ${String(broke)}`);
console.log(`  556(b) ${broke === 0 ? 'HOLDS' : 'FAILS'}`);
for (const b of brokeAt) console.log(`    ${b}`);

console.log('\nrule 559: what is left over and is not diagnosed here');
for (const [k, v] of Object.entries(THE_OTHER_SIXTEEN))
  console.log(`  ${String(v).padStart(3)}  ${k}`);
