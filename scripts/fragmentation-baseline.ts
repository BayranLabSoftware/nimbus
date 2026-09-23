/**
 * Step 2 of the round on fragmentation (rules 978 to 981,
 * src/physics/validation/fragmentationRoundRules.ts): the baseline's metrics
 * on every development case, once.
 *
 *   pnpm exec tsx scripts/fragmentation-baseline.ts
 *
 * Runs today's model on the draws rule 978 names, reads each metric as rule
 * 979 says against the table of rule 980, and writes
 * src/physics/validation/fragmentationBaseline.json and
 * docs/FRAGMENTATION_DEV_TABLE.md. Deterministic: no clock, no randomness but
 * the seeds'.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IMPACT_PRESETS,
  simulateImpact,
  type ImpactScenarioInput,
} from '../src/physics/simulate.js';
import { degreesToRadians, deg, kgPerM3, m, mps, rad } from '../src/physics/units.js';
import { CRUSTAL_ROCK_DENSITY } from '../src/physics/constants.js';
import {
  DEV_CASES,
  DEV_TABLE,
  type DevCase,
  type DevRow,
} from '../src/physics/validation/fragmentationDevTable.js';
import { FRAGMENTATION_CLAUSE } from '../src/physics/validation/fragmentationRoundRules.js';
import { LEVEL_B_DRAWS, LEVEL_B_SEED } from '../src/physics/validation/levelBProtocolRules.js';
import { LEVEL_B2_DRAWS, LEVEL_B2_SEED } from '../src/physics/validation/levelBSecondRules.js';
import {
  LEVEL_B_CRATER_EVENTS,
  LEVEL_B_ENTRY_EVENTS,
  LEVEL_B_SEEN_EVENTS,
  type LevelBEvent,
  type LevelBInputValue,
} from '../src/physics/validation/levelBSources.js';
import { LEVEL_B2_ENTRY_EVENTS } from '../src/physics/validation/levelB2Sources.js';
import { FIREBALL_EVENTS } from '../src/physics/validation/fireballSetData.js';
import {
  FIREBALL_BODIES,
  fireballDiameterM,
  fireballEntryAngle,
} from '../src/physics/validation/fireballRules.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = join(ROOT, 'src', 'physics', 'validation', 'fragmentationBaseline.json');
const OUT_MD = join(ROOT, 'docs', 'FRAGMENTATION_DEV_TABLE.md');

// Rules 836, 837 and 859: the engine every level B round ran on.
const platform = `${process.platform}-${process.arch}`;
if (process.version !== 'v22.20.0' || platform !== 'darwin-arm64') {
  console.error(`Refusing to run on ${process.version} ${platform}: v22.20.0 darwin-arm64.`);
  process.exit(2);
}

/** FNV-1a of the seed, then mulberry32: the level B rounds' stream. */
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

/** The level B rounds' draw of one input. */
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

/** A level B event's inputs, in the rounds' order, on its stream. */
function drawnInputs(event: LevelBEvent, seed: string, count: number): ImpactScenarioInput[] {
  const u = stream(seed);
  const out: ImpactScenarioInput[] = [];
  for (let i = 0; i < count; i++) {
    const velocityKmS = draw(event.inputs.velocity.value, u);
    const angleDeg = draw(event.inputs.angle.value, u);
    const diameter = draw(event.inputs.diameter.value, u);
    const density = draw(event.inputs.density.value, u);
    const targetDensity = draw(event.inputs.targetDensity.value, u);
    out.push({
      impactorDiameter: m(diameter),
      impactVelocity: mps(velocityKmS * 1_000),
      impactorDensity: kgPerM3(density),
      targetDensity: kgPerM3(targetDensity),
      impactAngle: degreesToRadians(deg(angleDeg)),
      surfaceGravity: 9.806_65,
    });
  }
  return out;
}

const byName = (events: readonly LevelBEvent[], name: string): LevelBEvent => {
  const e = events.find((x) => x.event === name);
  if (e === undefined) throw new Error(`no event ${name}`);
  return e;
};

/** Rule 978: the draws of each case. */
function inputsOf(c: DevCase): { inputs: ImpactScenarioInput[]; drawn: string } {
  switch (c) {
    case '2024 BX1':
    case '2023 CX1':
      return {
        inputs: drawnInputs(
          byName(LEVEL_B_ENTRY_EVENTS, c),
          `${LEVEL_B2_SEED}/${c}`,
          LEVEL_B2_DRAWS
        ),
        drawn: `level B's second round: ${LEVEL_B2_SEED}/${c}, ${String(LEVEL_B2_DRAWS)} draws`,
      };
    case 'Carancas':
      return {
        inputs: drawnInputs(
          byName(LEVEL_B_CRATER_EVENTS, c),
          `${LEVEL_B2_SEED}/${c}`,
          LEVEL_B2_DRAWS
        ),
        drawn: `level B's second round: ${LEVEL_B2_SEED}/${c}, ${String(LEVEL_B2_DRAWS)} draws`,
      };
    case '2022 WJ1':
      return {
        inputs: drawnInputs(
          byName(LEVEL_B2_ENTRY_EVENTS, c),
          `${LEVEL_B2_SEED}/${c}`,
          LEVEL_B2_DRAWS
        ),
        drawn: `level B's second round: ${LEVEL_B2_SEED}/${c}, ${String(LEVEL_B2_DRAWS)} draws`,
      };
    case '2008 TC3':
    case '2018 LA':
      return {
        inputs: drawnInputs(
          byName(LEVEL_B_SEEN_EVENTS, c),
          `${LEVEL_B_SEED}/${c}/scored`,
          LEVEL_B_DRAWS
        ),
        drawn: `level B's first round: ${LEVEL_B_SEED}/${c}/scored, ${String(LEVEL_B_DRAWS)} draws`,
      };
    case 'Chelyabinsk':
      return {
        inputs: [IMPACT_PRESETS.CHELYABINSK.input],
        drawn: "one run at the preset's inputs",
      };
    case 'Tunguska':
      return { inputs: [IMPACT_PRESETS.TUNGUSKA.input], drawn: "one run at the preset's inputs" };
    case '2022 EB5': {
      const row = FIREBALL_EVENTS.find((e) => e.date === '2022-03-11T21:22:45Z');
      const body = FIREBALL_BODIES.find((b) => b.key === 'default');
      if (row === undefined || body === undefined) throw new Error('no CNEOS row for 2022 EB5');
      return {
        inputs: [
          {
            impactorDiameter: m(fireballDiameterM(row.energyKt, row.speedKmS, body.densityKgM3)),
            impactVelocity: mps(row.speedKmS * 1_000),
            impactorDensity: kgPerM3(body.densityKgM3),
            targetDensity: CRUSTAL_ROCK_DENSITY,
            impactAngle: rad(fireballEntryAngle(row)),
            surfaceGravity: 9.806_65,
          },
        ],
        drawn: 'one run at the body I2 reads from its CNEOS row (rule 77)',
      };
    }
  }
}

function quantile(sorted: readonly number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const a = sorted[lo] ?? Number.NaN;
  const b = sorted[hi] ?? Number.NaN;
  return a + (b - a) * (pos - lo);
}

interface Band {
  median: number;
  p5: number;
  p95: number;
  width: number;
}
function band(values: readonly number[]): Band {
  const s = [...values].sort((a, b) => a - b);
  const p5 = quantile(s, 0.05);
  const p95 = quantile(s, 0.95);
  return { median: quantile(s, 0.5), p5, p95, width: p95 - p5 };
}

function shares(values: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return Object.fromEntries(
    Object.entries(out)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, n]) => [k, n / values.length])
  );
}

const row = (c: DevCase, metric: DevRow['metric']): DevRow => {
  const r = DEV_TABLE.find((x) => x.case === c && x.metric === metric);
  if (r === undefined) throw new Error(`no row ${c} ${metric}`);
  return r;
};

/** Rule 979: the distance from the median to the observed interval. */
const miss = (median: number, r: DevRow): number | null =>
  r.observed.kind === 'altitude'
    ? Math.max(0, r.observed.lowM - median, median - r.observed.highM)
    : null;

const cases = DEV_CASES.map(({ case: c, role }) => {
  const { inputs, drawn } = inputsOf(c);
  const runs = inputs.map((input) => simulateImpact(input));
  const reaches = runs.map((r) => r.entry.regime !== 'COMPLETE_AIRBURST');
  const m1 = band(runs.map((r) => (r.entry.firstFragmentationAltitude as number | undefined) ?? 0));
  const m2 = band(
    runs.map((r) =>
      r.entry.regime === 'COMPLETE_AIRBURST' ? (r.entry.burstAltitude as number) : 0
    )
  );
  const m4 = band(runs.map((r) => r.entry.energyFractionToGround));
  // Not a metric: the model's one breakup (Eq. 11), and m1 read on it where the
  // two-stage law does not cover the body's density — asked of the reviewer.
  const breakup = band(runs.map((r) => r.entry.breakupAltitude as number));
  const uncovered = runs.filter((r) => r.entry.firstFragmentationAltitude === undefined).length;
  const m1OnBreakup = band(
    runs.map((r) => (r.entry.firstFragmentationAltitude ?? r.entry.breakupAltitude) as number)
  );
  const pReach = reaches.filter(Boolean).length / runs.length;
  const m3row = row(c, 'm3');
  const pObserved =
    m3row.observed.kind === 'outcome' ? (m3row.observed.reachesGround ? pReach : 1 - pReach) : null;
  return {
    case: c,
    role,
    drawn,
    draws: runs.length,
    m1: { ...m1, miss: miss(m1.median, row(c, 'm1')), counted: row(c, 'm1').counted },
    m2: { ...m2, miss: miss(m2.median, row(c, 'm2')), counted: row(c, 'm2').counted },
    m3: { reachesGround: pReach, observedOutcome: pObserved, counted: m3row.counted },
    m4: { ...m4, counted: row(c, 'm4').counted },
    diagnostic: {
      breakupEq11: breakup,
      uncoveredByTwoStage: uncovered / runs.length,
      m1OnBreakupWhereUncovered: { ...m1OnBreakup, miss: miss(m1OnBreakup.median, row(c, 'm1')) },
    },
    regimes: shares(runs.map((r) => r.entry.regime)),
    craterStates: shares(runs.map((r) => r.crater.state)),
  };
});

const mean = (xs: readonly number[]): number | null =>
  xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;
const summary = {
  m1MeanMissM: mean(cases.filter((c) => c.m1.counted).map((c) => c.m1.miss ?? 0)),
  /** Not a metric: the same, m1 read on the one breakup where uncovered. */
  m1MeanMissOnBreakupWhereUncoveredM: mean(
    cases.filter((c) => c.m1.counted).map((c) => c.diagnostic.m1OnBreakupWhereUncovered.miss ?? 0)
  ),
  m2MeanMissM: mean(cases.filter((c) => c.m2.counted).map((c) => c.m2.miss ?? 0)),
  m3MeanObservedOutcome: mean(
    cases.filter((c) => c.m3.counted).map((c) => c.m3.observedOutcome ?? 0)
  ),
  m4Counted: cases.filter((c) => c.m4.counted).length,
  /** Rule 981: the outcomes already right of rule 964 (b). */
  rightOutcomes: cases
    .filter(
      (c) => c.m3.counted && (c.m3.observedOutcome ?? 0) >= FRAGMENTATION_CLAUSE.rightOutcomeShare
    )
    .map((c) => c.case),
};

const out = {
  protocol: 'rules 959 to 981, src/physics/validation/fragmentationRoundRules.ts',
  model: 'the baseline of rule 960: the product as it stands after ae80c5d',
  engine: { node: process.version, platform },
  cases,
  summary,
};
writeFileSync(OUT_JSON, `${JSON.stringify(out, null, 2)}\n`);

// The table for the reviewer.
const km = (x: number): string => (x / 1_000).toFixed(1);
const pct = (x: number): string => `${(x * 100).toFixed(1)} %`;
const cell = (s: string): string => s.replace(/\|/g, '\\|');
const observed = (r: DevRow): string =>
  r.observed.kind === 'altitude'
    ? `${km(r.observed.lowM)}–${km(r.observed.highM)} km`
    : r.observed.kind === 'outcome'
      ? r.observed.reachesGround
        ? 'reaches the ground'
        : 'does not reach the ground'
      : '—';
const quality = (r: DevRow): string =>
  r.quality === null
    ? '—'
    : { direct: 'direct', reconstructed: 'reconstructed', modelDependent: 'model-dependent' }[
        r.quality
      ];
const lines: string[] = [
  '# The development table of the round on fragmentation',
  '',
  'Step 2 of the round (rules 959 to 981, `src/physics/validation/fragmentationRoundRules.ts`),',
  'written by `scripts/fragmentation-baseline.ts` from `fragmentationDevTable.ts` (the targets,',
  "fixed before the baseline was computed) and today's model (the baseline of rule 960). Fixed",
  'once for the round: after P runs only columns are added (rule 977). m2 is a proxy: the',
  'brightest flare is not the largest release of energy (rule 974).',
  '',
  '## Targets',
  '',
  '| Case | Role | Metric | Observed | Source and place | Quality of the target | Counted for adoption? |',
  '| --- | --- | --- | --- | --- | --- | --- |',
];
for (const { case: c, role } of DEV_CASES)
  for (const metric of ['m1', 'm2', 'm3', 'm4'] as const) {
    const r = row(c, metric);
    lines.push(
      `| ${c} | ${role} | ${metric} | ${observed(r)} | ${cell(r.source === '' ? '—' : `${r.source}: ${r.where}`)} | ${quality(r)} | ${r.counted ? 'yes' : 'no'} — ${cell(r.reason)} |`
    );
  }
lines.push(
  '',
  '## The baseline',
  '',
  'm1, m2 and m4 are the median over the draws, with the 5 %–95 % band; the miss is the distance',
  'from the median to the observed interval, none inside it. m3 is the probability the model gives',
  'the observed outcome. An uncounted metric is shown in brackets.',
  '',
  '| Case | Draws | m1 first stage (km) | m1 miss | m2 release, proxy (km) | m2 miss | m3 p(observed) | m4 energy to the ground | Regimes | Crater states | Not a metric: breakup, Eq. 11 (km) | Not a metric: share outside the two-stage law |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
);
const bandKm = (b: Band): string => `${km(b.median)} [${km(b.p5)}–${km(b.p95)}]`;
const wrap = (s: string, counted: boolean): string => (counted ? s : `(${s})`);
const shareText = (x: Record<string, number>): string =>
  Object.entries(x)
    .map(([k, v]) => `${k} ${pct(v)}`)
    .join(', ');
for (const c of cases) {
  lines.push(
    `| ${c.case} | ${c.drawn} | ${wrap(bandKm(c.m1), c.m1.counted)} | ${c.m1.miss === null ? '—' : wrap(km(c.m1.miss), c.m1.counted)} | ${wrap(bandKm(c.m2), c.m2.counted)} | ${c.m2.miss === null ? '—' : wrap(km(c.m2.miss), c.m2.counted)} | ${c.m3.observedOutcome === null ? `— (reaches ${pct(c.m3.reachesGround)})` : wrap(pct(c.m3.observedOutcome), c.m3.counted)} | ${wrap(`${c.m4.median.toPrecision(3)} [${c.m4.p5.toPrecision(3)}–${c.m4.p95.toPrecision(3)}]`, c.m4.counted)} | ${shareText(c.regimes)} | ${shareText(c.craterStates)} | ${bandKm(c.diagnostic.breakupEq11)} | ${pct(c.diagnostic.uncoveredByTwoStage)} |`
  );
}
lines.push(
  '',
  '## What a variant is measured against',
  '',
  `- m1: the mean miss over its ${String(cases.filter((c) => c.m1.counted).length)} counted cases, ${summary.m1MeanMissM === null ? '—' : `${km(summary.m1MeanMissM)} km`}; a variant improves it by lowering it 1 km or more.`,
  `- m2: the mean miss over its ${String(cases.filter((c) => c.m2.counted).length)} counted cases, ${summary.m2MeanMissM === null ? '—' : `${km(summary.m2MeanMissM)} km`}; the same bar.`,
  `- m3: the mean probability of the observed outcome over its ${String(cases.filter((c) => c.m3.counted).length)} counted cases, ${summary.m3MeanObservedOutcome === null ? '—' : pct(summary.m3MeanObservedOutcome)}; a variant improves it when the mean of Δp is 0.10 or more (rule 975).`,
  '- m4: counted on no case; in this round a variant must improve two of m1 to m3.',
  `- Not a metric, asked of the reviewer: where the two-stage law does not cover a body's density (2 500 to 5 000 kg/m³) the model gives it no first stage and breaks it once, at Eq. 11; rule 979 reads its m1 as 0. Read on that one breakup instead, m1's mean miss would be ${summary.m1MeanMissOnBreakupWhereUncoveredM === null ? '—' : `${km(summary.m1MeanMissOnBreakupWhereUncoveredM)} km`} (${cases
    .filter((c) => c.m1.counted && c.diagnostic.uncoveredByTwoStage > 0)
    .map(
      (c) =>
        `${c.case}: ${pct(c.diagnostic.uncoveredByTwoStage)} of the draws uncovered, ${km(c.diagnostic.m1OnBreakupWhereUncovered.median)} km, miss ${km(c.diagnostic.m1OnBreakupWhereUncovered.miss ?? 0)} km`
    )
    .join('; ')}).`,
  `- The outcomes already right (rule 964 (b)), which a variant must keep at 90 % or more: ${summary.rightOutcomes.length === 0 ? 'none' : summary.rightOutcomes.join(', ')}.`,
  ''
);
writeFileSync(OUT_MD, lines.join('\n'));
console.log(`Wrote ${OUT_JSON}`);
console.log(`Wrote ${OUT_MD}`);
