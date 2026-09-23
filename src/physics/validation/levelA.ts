/**
 * Level A of the certification plan of 22 September 2026: implementation
 * verified. The impact pipeline held to the reference implementation of the
 * equations it cites — the Earth Impact Effects Program as its authors run it
 * — case by case, on the wide grid `scripts/eiep-grid.py` fixed before any of
 * its answers was read, beside the 83 of `scripts/eiep-reference.py`.
 *
 * The bars are the reviewing astrophysicist's, written here before the grid's
 * answers were read:
 *
 * - ε = |X − ref| / ref for every pair where both answer a number above zero;
 * - under 2 %: excellent;
 * - 2 to 10 %: to be explained in writing, per quantity;
 * - over 10 %: audited, or a documented difference of design — each case
 *   named by a declared cause in {@link LEVEL_A_DIFFERENCES}, or level A is
 *   not met for its quantity;
 * - a constant sign — every pair outside the 2 % on the same side, at least
 *   ten of them — is a possible bug and is flagged, whatever its size.
 *
 * Nothing here moves a number of the model. A difference found is written
 * down or repaired in a round of its own; it is never tuned away here.
 */

import {
  eiepRatios,
  simulateEiepRow,
  type EiepQuantity,
  type EiepRatio,
} from './eiepComparison.js';
import type { EiepRow } from './eiepReference.js';
import type { ImpactScenarioResult } from '../simulate.js';

export const LEVEL_A_BARS = { excellent: 0.02, audit: 0.1 } as const;

export type EpsilonBand = 'excellent' | 'explain' | 'audit';

export function epsilonOf(pair: EiepRatio): number {
  return Math.abs(pair.model / pair.reference - 1);
}

export function bandOf(epsilon: number): EpsilonBand {
  if (epsilon < LEVEL_A_BARS.excellent) return 'excellent';
  if (epsilon <= LEVEL_A_BARS.audit) return 'explain';
  return 'audit';
}

/**
 * A difference of design: a cause, named where it lives, that makes the
 * simulator part from the program on the pairs `applies` selects. Written
 * after the grid was read, and each says so; none moves a number.
 */
export interface LevelADifference {
  readonly id: string;
  readonly quantities: readonly EiepQuantity[];
  /** True where this cause is shown to be at work on the pair — recomputed,
   *  not assumed from a resemblance. */
  readonly applies: (pair: EiepRatio) => boolean;
  /** Why, specifically enough for a reader to check it in the code. */
  readonly why: string;
  /** A defect of this model the difference exposes, where it is one. */
  readonly bug?: string;
}

/** What the program's page states beside the fields `eiepReference.ts` reads
 *  (the wide grid keeps it; the first grid's rows do not have it). */
interface PageExtras {
  readonly craterRadiiM?: readonly number[] | null;
  readonly fragmentEllipseM?: readonly number[] | null;
}

const extras = (row: EiepRow): PageExtras => row as EiepRow & PageExtras;

const simulated = new WeakMap<EiepRow, ImpactScenarioResult>();
function modelOf(row: EiepRow): ImpactScenarioResult {
  let r = simulated.get(row);
  if (r === undefined) {
    r = simulateEiepRow(row);
    simulated.set(row, r);
  }
  return r;
}

const onProgramEquations = new WeakMap<EiepRow, EiepRatio[]>();
function programEquationsPair(pair: EiepRatio): EiepRatio | undefined {
  let pairs = onProgramEquations.get(pair.row);
  if (pairs === undefined) {
    pairs = eiepRatios([pair.row], { entryEquations: 'program' });
    onProgramEquations.set(pair.row, pairs);
  }
  return pairs.find((p) => p.quantity === pair.quantity && p.detail === pair.detail);
}

/**
 * Half the last digit the program prints, per quantity — its answer is an
 * interval that wide around the printed figure. Energies, speeds at the
 * ground and crater dimensions are printed to two significant figures
 * («8.5 x 10 18 Joules», «19.0 km/s», «250.0 meters»); breakup altitudes to
 * the metre; burst altitudes, pressures and winds to three decimals; the
 * map's rings, which fireball and ejecta are read from, unrounded.
 */
function printedHalfUnit(quantity: EiepQuantity, reference: number): number {
  switch (quantity) {
    case 'energy':
    case 'groundVelocity':
    case 'transientDiameter':
    case 'finalDiameter':
    case 'finalDepth':
      return 0.5 * 10 ** (Math.floor(Math.log10(reference)) - 1);
    case 'breakupAltitude':
      return 0.5;
    case 'burstAltitude':
    case 'overpressure':
    case 'airburstOverpressure':
    case 'airburstOverpressureHigh':
    case 'wind':
      return 0.0005;
    case 'fireballRadius':
    case 'ejectaEdge':
      return 0;
  }
}

/** Whether a model value lies within the interval the program's printed
 *  figure stands for. */
function insidePrinted(quantity: EiepQuantity, model: number, reference: number): boolean {
  return Math.abs(model - reference) <= printedHalfUnit(quantity, reference) * (1 + 1e-9);
}

/**
 * The documented differences — written on 23 September 2026 after the wide
 * grid had been read, and each says so by being here. Every one names its
 * cause where it lives and shows it at work on the pair it covers; none moves
 * a number of the model.
 */
export const LEVEL_A_DIFFERENCES: readonly LevelADifference[] = [
  {
    id: 'entry-paper-equations',
    quantities: [
      'breakupAltitude',
      'burstAltitude',
      'groundVelocity',
      'airburstOverpressure',
      'airburstOverpressureHigh',
      'overpressure',
      'wind',
      'fireballRadius',
    ],
    // Shown at work: the same pair, computed on the program's equations,
    // comes back inside the audit bar.
    applies: (pair) => {
      const p = programEquationsPair(pair);
      return p !== undefined && epsilonOf(p) <= LEVEL_A_BARS.audit;
    },
    why: "The entry runs on the paper's equations since rules 691 to 697 (DEFAULT_ENTRY_EQUATIONS, effects/atmosphericEntry.ts); the program takes twice Eq. 12's I_f in its Eq. 11 (BM-13), so a strong, slow body — the irons at 12 km/s above all — breaks and bursts kilometres lower there, reaches the ground slower, and blasts and burns from another height. On the program's own equations, which the model still computes by name, every such pair is back inside 10 %.",
  },
  {
    id: 'wind-printed-to-a-millimetre-per-second',
    quantities: ['wind'],
    applies: (pair) => {
      // The printed «0.003 m/s» stands for 0.0025 to 0.0035; the pair is
      // inside the audit bar of that interval, on the paper's equations or on
      // the program's.
      const low = (pair.reference - 0.0005) * (1 - LEVEL_A_BARS.audit);
      const high = (pair.reference + 0.0005) * (1 + LEVEL_A_BARS.audit);
      const inside = (v: number): boolean => v >= low && v <= high;
      return inside(pair.model) || inside(programEquationsPair(pair)?.model ?? Number.NaN);
    },
    why: "The program prints the peak wind to three decimals of a metre per second («0.003 m/s»); a thousand kilometres and more from a small burst the whole answer is a digit or two, and every pair here is inside 10 % of the interval its printed figure stands for — for two irons at 12 and 20 km/s only once the entry runs on the program's equations too.",
  },
  {
    id: 'crater-field',
    quantities: ['transientDiameter', 'finalDiameter', 'finalDepth', 'ejectaEdge'],
    applies: (pair) => {
      const ellipse = extras(pair.row).fragmentEllipseM?.[0];
      const transient = pair.row.transientDiameterM;
      if (ellipse === undefined || transient === null || transient === undefined) return false;
      const ratio = pair.model / pair.reference;
      // The program's crater is its largest fragment's: half the whole body's
      // in diameter and depth, 2^(4/3) closer in for the ejecta's edge.
      const expected = pair.quantity === 'ejectaEdge' ? 2 ** (4 / 3) : 2;
      return ellipse > 2 * transient && Math.abs(ratio / expected - 1) < 0.1;
    },
    why: 'Where the fragments of a body that reaches the ground broken land spread wider than the crater it would dig, the program answers «a crater field, not a single crater» and gives the crater of the largest fragment — half the diameter. This model digs one crater of the whole body there, and its ejecta blanket with it. The program is right to call it a field; this model has no crater field for a stony or porous body.',
    bug: 'B-123',
  },
  {
    id: 'iron-crater-by-mass',
    quantities: ['ejectaEdge'],
    applies: (pair) => {
      const origin = modelOf(pair.row).crater.origin;
      return origin === 'strewnField' || origin === 'ironSwarm';
    },
    why: "An iron's crater ends by its mass (rules 764 to 771, B-098; Bland & Artemieva 2006): a strewn field of small craters, or a swarm's. The program's map still draws the blanket of one crater of the whole body at its end speed, which is not the crater this model — or the program's own text — says forms.",
  },
  {
    id: 'low-burst-crater',
    quantities: ['ejectaEdge'],
    applies: (pair) => modelOf(pair.row).crater.origin === 'lowBurst',
    why: 'Below its fireball a low airburst digs with the share 1 − z/R of its mass (rules 756 to 763, B-097); the program draws no such crater, and its map the blanket of another.',
  },
  {
    id: 'program-map-edge',
    quantities: ['ejectaEdge'],
    applies: (pair) => {
      const rim = extras(pair.row).craterRadiiM?.[0];
      return (
        rim !== undefined && Math.abs(pair.reference / rim - 1) < 1e-6 && pair.model > 9_000_000
      );
    },
    why: "The program's map writes its own crater's radius for a blanket ring it would draw past about ten thousand kilometres — a centimetre of a 10 to 30 km body's ejecta reads as ending at the rim, while a decimetre reaches 4 700 km. This model's ring is where the thickness law puts it, beyond 9 000 km.",
  },
];

/**
 * What the 2–10 % band leaves open, in words, for every quantity where
 * `explainBandCause` answers `open` — written on 23 September 2026 after the
 * wide grid was read. Below the audit bar, and printed as open.
 */
export const LEVEL_A_OPEN: Readonly<Partial<Record<EiepQuantity, string>>> = {};

export interface LevelASummary {
  quantity: EiepQuantity;
  pairs: number;
  medianPercent: number;
  p90Percent: number;
  maxPercent: number;
  excellent: number;
  explain: number;
  audit: number;
  /** Audits no documented difference covers. */
  unexplained: number;
  /** Pairs outside the excellent band on each side. */
  above: number;
  below: number;
  constantSign: boolean;
  /** The 2–10 % band's readings, by the cause shown at work on each. */
  explainBy: Record<string, number>;
}

export interface LevelARun {
  cases: number;
  /** Cases the program itself failed on (its own answer). */
  programFailed: number;
  /** Cases the simulator could not run, with its message. */
  modelFailed: { row: EiepRow; error: string }[];
  pairs: EiepRatio[];
  summaries: LevelASummary[];
  /** Every pair over the audit bar, with the difference that covers it. */
  audits: { pair: EiepRatio; epsilon: number; difference: string | null }[];
}

function quantile(sorted: readonly number[], q: number): number {
  return sorted[Math.round(q * (sorted.length - 1))] ?? Number.NaN;
}

/**
 * A crater's gap from the radius the program's own map carries unrounded —
 * its printed diameters are rounded to two figures, its map's are not. The
 * depth is read from the final diameter it is computed from. On the first
 * grid, whose rows keep no map, the gap from the printed interval instead.
 * Null where the quantity is not a crater's.
 */
function unroundedCraterEpsilon(pair: EiepRatio): number | null {
  if (
    pair.quantity !== 'transientDiameter' &&
    pair.quantity !== 'finalDiameter' &&
    pair.quantity !== 'finalDepth'
  )
    return null;
  const radii = extras(pair.row).craterRadiiM;
  const final = radii?.[0];
  const transient = radii?.[1];
  if (final === undefined || transient === undefined) {
    // The first grid's rows keep no map: the gap from the interval the
    // printed figure stands for, which is where the map's radii put the rest.
    const half = printedHalfUnit(pair.quantity, pair.reference);
    const low = pair.reference - half;
    const high = pair.reference + half;
    if (pair.model >= low && pair.model <= high) return 0;
    return pair.model < low ? 1 - pair.model / low : pair.model / high - 1;
  }
  const crater = modelOf(pair.row).crater;
  switch (pair.quantity) {
    case 'transientDiameter':
      return Math.abs((crater.transientDiameter as number) / (2 * transient) - 1);
    case 'finalDiameter':
    case 'finalDepth':
      return Math.abs((crater.finalDiameter as number) / (2 * final) - 1);
    default:
      return null;
  }
}

/**
 * Why a reading of the 2–10 % band parts from the program, shown on the pair:
 * `printed` where the model lies within the interval the program's printed
 * figure stands for; `entry` where on the program's own equations it lies
 * within 2 % or within that interval; `unrounded` where a crater lies within
 * 2 % of the radius the program's own map carries unrounded (written after
 * the wide grid was read: 56 crater readings sat past the printed interval,
 * all below it, and against the map's radii every one is within 2 %); a
 * documented difference's id where one other than the entry's is at work;
 * `open` where nothing yet explains it — printed as such, below the audit bar.
 */
export function explainBandCause(pair: EiepRatio): string {
  if (insidePrinted(pair.quantity, pair.model, pair.reference)) return 'printed';
  const onProgram = programEquationsPair(pair);
  if (
    onProgram !== undefined &&
    (epsilonOf(onProgram) < LEVEL_A_BARS.excellent ||
      insidePrinted(pair.quantity, onProgram.model, onProgram.reference))
  )
    return 'entry';
  const unrounded = unroundedCraterEpsilon(pair);
  if (unrounded !== null && unrounded < LEVEL_A_BARS.excellent) return 'unrounded';
  const difference = LEVEL_A_DIFFERENCES.find(
    (d) =>
      d.id !== 'entry-paper-equations' && d.quantities.includes(pair.quantity) && d.applies(pair)
  );
  return difference?.id ?? 'open';
}

export function summariseLevelA(pairs: readonly EiepRatio[]): LevelASummary[] {
  const quantities = [...new Set(pairs.map((p) => p.quantity))];
  return quantities.map((quantity) => {
    const own = pairs.filter((p) => p.quantity === quantity);
    const eps = own.map(epsilonOf).sort((a, b) => a - b);
    let excellent = 0;
    let explain = 0;
    let audit = 0;
    let unexplained = 0;
    let above = 0;
    let below = 0;
    const explainBy: Record<string, number> = {};
    for (const p of own) {
      const e = epsilonOf(p);
      const b = bandOf(e);
      if (b === 'excellent') excellent++;
      else if (b === 'explain') {
        explain++;
        const cause = explainBandCause(p);
        explainBy[cause] = (explainBy[cause] ?? 0) + 1;
      } else {
        audit++;
        if (!LEVEL_A_DIFFERENCES.some((d) => d.quantities.includes(quantity) && d.applies(p)))
          unexplained++;
      }
      if (b !== 'excellent') {
        if (p.model > p.reference) above++;
        else below++;
      }
    }
    return {
      quantity,
      pairs: own.length,
      medianPercent: quantile(eps, 0.5) * 100,
      p90Percent: quantile(eps, 0.9) * 100,
      maxPercent: (eps[eps.length - 1] ?? Number.NaN) * 100,
      excellent,
      explain,
      audit,
      unexplained,
      above,
      below,
      constantSign: above + below >= 10 && (above === 0 || below === 0),
      explainBy,
    };
  });
}

function finish(
  rows: readonly EiepRow[],
  pairs: EiepRatio[],
  modelFailed: { row: EiepRow; error: string }[],
  programFailed: number
): LevelARun {
  const audits = pairs
    .map((pair) => ({ pair, epsilon: epsilonOf(pair) }))
    .filter((a) => bandOf(a.epsilon) === 'audit')
    .map((a) => ({
      ...a,
      difference:
        LEVEL_A_DIFFERENCES.find((d) => d.quantities.includes(a.pair.quantity) && d.applies(a.pair))
          ?.id ?? null,
    }));
  return {
    cases: rows.length,
    programFailed,
    modelFailed,
    pairs,
    summaries: summariseLevelA(pairs),
    audits,
  };
}

/** One case: its pairs, or why the simulator could not run it. */
function readCase(
  row: EiepRow,
  pairs: EiepRatio[],
  modelFailed: { row: EiepRow; error: string }[]
): void {
  try {
    pairs.push(...eiepRatios([row]));
  } catch (e) {
    modelFailed.push({ row, error: String(e).slice(0, 200) });
  }
}

/** The whole comparison, in one go — for the validation report's generator. */
export function runLevelASync(rows: readonly EiepRow[]): LevelARun {
  const pairs: EiepRatio[] = [];
  const modelFailed: { row: EiepRow; error: string }[] = [];
  let programFailed = 0;
  for (const row of rows) {
    if (row.error !== null) programFailed++;
    else readCase(row, pairs, modelFailed);
  }
  return finish(rows, pairs, modelFailed, programFailed);
}

/**
 * The same comparison, awaiting `step` every 25 cases so that a caller in a
 * test worker can hand its event loop back (a synchronous minute makes
 * vitest's worker miss its runner — the CI of da51c86).
 */
export async function runLevelA(
  rows: readonly EiepRow[],
  step: () => Promise<void> = () => Promise.resolve()
): Promise<LevelARun> {
  const pairs: EiepRatio[] = [];
  const modelFailed: { row: EiepRow; error: string }[] = [];
  let programFailed = 0;
  for (const [i, row] of rows.entries()) {
    if (i % 25 === 0) await step();
    if (row.error !== null) programFailed++;
    else readCase(row, pairs, modelFailed);
  }
  return finish(rows, pairs, modelFailed, programFailed);
}
