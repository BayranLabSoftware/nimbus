/**
 * The shared run of the round on fragmentation's development cases (rules 978
 * to 986 and 995, src/physics/validation/fragmentationRoundRules.ts): the
 * draws, the metrics and the summary, for the baseline
 * (scripts/fragmentation-baseline.ts) and for a variant
 * (scripts/fragmentation-variant.ts) alike.
 */

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
import { DRAG_COEFFICIENT, H_SCALE, RHO_0 } from '../src/physics/effects/entryConstants.js';
import { FIREBALL_EVENTS } from '../src/physics/validation/fireballSetData.js';
import {
  FIREBALL_BODIES,
  fireballDiameterM,
  fireballEntryAngle,
} from '../src/physics/validation/fireballRules.js';

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

export interface Band {
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

export const row = (c: DevCase, metric: DevRow['metric']): DevRow => {
  const r = DEV_TABLE.find((x) => x.case === c && x.metric === metric);
  if (r === undefined) throw new Error(`no row ${c} ${metric}`);
  return r;
};

/** Rules 983 and 984: the distance from a conditional median to the observed
 *  interval, none inside it; none where there is no altitude to read. */
const miss = (b: Band | null, r: DevRow): number | null =>
  b !== null && r.observed.kind === 'altitude'
    ? Math.max(0, r.observed.lowM - b.median, b.median - r.observed.highM)
    : null;

/** A band over the draws in which the event happens, or none. */
const conditional = (values: readonly number[]): Band | null =>
  values.length === 0 ? null : band(values);

/**
 * The development cases run on the draws of rule 978 — on the product as it
 * stands, or with a variant's switches (`overrides`) — and read as rules 979,
 * 983 and 984 say; the summary rule 981 reads.
 */
export function runDevCases(overrides: Partial<ImpactScenarioInput> = {}) {
  const cases = DEV_CASES.map(({ case: c, role }) => {
    const { inputs, drawn } = inputsOf(c);
    const runs = inputs.map((input) => simulateImpact({ ...input, ...overrides }));
    const n = runs.length;
    // Rule 983: the first stage, where the model produces one.
    const firsts = runs
      .map((r) => r.entry.firstFragmentationAltitude as number | undefined)
      .filter((h): h is number => h !== undefined && h > 0);
    const m1 = conditional(firsts);
    // Rule 984: the burst, where the body bursts in the air.
    const bursts = runs
      .filter((r) => r.entry.regime === 'COMPLETE_AIRBURST')
      .map((r) => r.entry.burstAltitude as number);
    const m2 = conditional(bursts);
    const m4 = band(runs.map((r) => r.entry.energyFractionToGround));
    // Rule 983: the single breakup of a body the two-stage law does not cover.
    const single = runs
      .filter((r) => r.entry.firstFragmentationAltitude === undefined)
      .map((r) => r.entry.breakupAltitude as number);
    const pReach = runs.filter((r) => r.entry.regime !== 'COMPLETE_AIRBURST').length / n;
    const m3row = row(c, 'm3');
    const pObserved =
      m3row.observed.kind === 'outcome'
        ? m3row.observed.reachesGround
          ? pReach
          : 1 - pReach
        : null;
    return {
      case: c,
      role,
      drawn,
      draws: n,
      m1: {
        pFirstStage: firsts.length / n,
        altitude: m1,
        miss: miss(m1, row(c, 'm1')),
        counted: row(c, 'm1').counted,
      },
      m2: {
        pBurst: bursts.length / n,
        altitude: m2,
        miss: miss(m2, row(c, 'm2')),
        counted: row(c, 'm2').counted,
      },
      m3: { reachesGround: pReach, observedOutcome: pObserved, counted: m3row.counted },
      m4: { ...m4, counted: row(c, 'm4').counted },
      diagnostic: {
        /** Rule 983: "the altitude of the single breakup", in no mean. */
        singleBreakup: conditional(single),
        shareWithoutFirstStageLaw: single.length / n,
      },
      regimes: shares(runs.map((r) => r.entry.regime)),
      craterStates: shares(runs.map((r) => r.crater.state)),
    };
  });

  const mean = (xs: readonly number[]): number | null =>
    xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;
  const withMiss = (metric: 'm1' | 'm2') =>
    cases.filter((c) => c[metric].counted && c[metric].miss !== null);
  const summary = {
    m1Cases: withMiss('m1').map((c) => c.case),
    m1MeanMissM: mean(withMiss('m1').map((c) => c.m1.miss ?? 0)),
    m2Cases: withMiss('m2').map((c) => c.case),
    m2MeanMissM: mean(withMiss('m2').map((c) => c.m2.miss ?? 0)),
    m3Cases: cases.filter((c) => c.m3.counted).map((c) => c.case),
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
  return { cases, summary };
}

/**
 * Rule 1012: the dynamic pressure at each observed first event of m1, on the
 * model's exponential atmosphere, at the case's nominal inputs (the middle of
 * each input's interval) and Eq. 8's speed — a diagnostic; no phase is
 * assigned by it.
 */
export function firstEventPressures(): { case: DevCase; altitudeM: number; pressurePa: number }[] {
  const nominal = (v: LevelBInputValue): number =>
    v.kind === 'normal' ? v.mean : v.kind === 'fixed' ? v.value : (v.low + v.high) / 2;
  const out: { case: DevCase; altitudeM: number; pressurePa: number }[] = [];
  for (const e of [...LEVEL_B_ENTRY_EVENTS, ...LEVEL_B_SEEN_EVENTS, ...LEVEL_B2_ENTRY_EVENTS]) {
    const r = DEV_TABLE.find((x) => x.case === e.event && x.metric === 'm1');
    if (r?.observed.kind !== 'altitude') continue;
    const z = (r.observed.lowM + r.observed.highM) / 2;
    const v0 = nominal(e.inputs.velocity.value) * 1_000;
    const L0 = nominal(e.inputs.diameter.value);
    const rhoI = nominal(e.inputs.density.value);
    const sinTheta = Math.sin((nominal(e.inputs.angle.value) * Math.PI) / 180);
    const rho = RHO_0 * Math.exp(-z / H_SCALE);
    const v = v0 * Math.exp((-3 * rho * DRAG_COEFFICIENT * H_SCALE) / (4 * rhoI * L0 * sinTheta));
    out.push({ case: r.case, altitudeM: z, pressurePa: rho * v * v });
  }
  return out;
}
