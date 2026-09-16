import {
  doseAtSlantRangeRad,
  radiationWeaponFor,
  THERMONUCLEAR_FROM_KT,
  type RadiationSource,
} from '../effects/initialRadiation.js';
import { DOSE_CURVE_RADS, DOSE_CURVES, YARD_M } from '../effects/initialRadiationData.js';
import {
  ARS_THRESHOLD_RAD,
  initialRadiationRadii,
  LD100_RAD,
  LD50_RAD,
} from '../events/explosion/radiation.js';
import { EXPLOSION_PRESETS, type ExplosionScenarioInput } from '../events/explosion/simulate.js';
import {
  chooseRadiationSource,
  DOSE_CANDIDATE,
  DOSE_EXAMPLE_RAD,
  DOSE_IN_PLACE,
  DOSE_MEET_TOLERANCE,
  type DoseTraceChecks,
} from './doseRules.js';

/**
 * Rules 85 to 89 of doseRules.ts, run: the traced figures checked as rule 85
 * asks, the three initial-radiation rings of every explosion preset and of a
 * grid of yields under the fit in place and under the book's figures, and rule
 * 87's choice. One computation for the script that first runs them, the report
 * that prints them and the test that keeps the report honest about them.
 */

const KILOTONS_PER_MEGATON = 1_000;

/** The yields rule 88 prints beside the presets (kt). */
export const DOSE_GRID_KT: readonly number[] = [1, 10, 50, 99, 100, 300, 1_000, 10_000, 20_000];

/** Rule 88: the burst height the grid is read at (m) — a low air burst, above
 *  the 300 feet below which the book corrects towards a surface burst. */
export const DOSE_GRID_HEIGHT_M = 200;

/** Rule 85's checks, read from the traced tables themselves. */
export function doseTraceChecks(): DoseTraceChecks {
  const six =
    DOSE_CURVES.length === 4 &&
    DOSE_CURVES.every(
      ([, , , yields, ranges]) =>
        ranges.length === DOSE_CURVE_RADS.length && ranges.every((r) => r.length === yields.length)
    );
  const risesWithYield = DOSE_CURVES.every(([, , , , ranges]) =>
    ranges.every((row) => row.every((v, i) => i === 0 || v >= (row[i - 1] ?? 0) - 2))
  );
  const neverCrosses = DOSE_CURVES.every(([, , , , ranges]) =>
    ranges.every((row, i) => {
      if (i === 0) return true;
      const above = ranges[i - 1] ?? [];
      return row.every((v, j) => v < (above[j] ?? Infinity));
    })
  );
  const meetsAt100Kt = (['gamma', 'neutron'] as const).every((kind) => {
    const low = DOSE_CURVES.find(([k, w]) => k === kind && w === 'fission')?.[4];
    const high = DOSE_CURVES.find(([k, w]) => k === kind && w === 'thermonuclear')?.[4];
    if (low === undefined || high === undefined) return false;
    return DOSE_CURVE_RADS.every((_, i) => {
      const lowRow = low[i];
      const a = lowRow === undefined ? undefined : lowRow[lowRow.length - 1];
      const b = high[i]?.[0];
      if (a === undefined || b === undefined || b === 0) return false;
      return Math.abs(a / b - 1) <= DOSE_MEET_TOLERANCE;
    });
  });
  // The book's §8.34: 2 000 yards from a 50 kt fission air burst, gamma only.
  const example = doseAtSlantRangeRad('gamma', 50, 2_000 * YARD_M);
  const matchesTheExample = example >= DOSE_EXAMPLE_RAD[0] && example <= DOSE_EXAMPLE_RAD[1];
  return { six, risesWithYield, neverCrosses, meetsAt100Kt, matchesTheExample };
}

export interface DoseRingRow {
  name: string;
  yieldKt: number;
  heightOfBurstM: number;
  weapon: 'fission' | 'thermonuclear';
  /** LD₁₀₀, LD₅₀ and the acute-radiation threshold, in km. */
  inPlaceKm: [number, number, number];
  candidateKm: [number, number, number];
  /** What the book's figures give at the range the fit drew LD₅₀ (rads). */
  doseAtTheFitRad: number;
  /** The yield or the height falls outside what the figures cover. */
  outsideTheFigures: boolean;
}

const radiiKm = (
  yieldKt: number,
  heightM: number,
  source: RadiationSource
): [number, number, number] => {
  const r = initialRadiationRadii(yieldKt / KILOTONS_PER_MEGATON, {
    source,
    heightOfBurstM: heightM,
  });
  return [
    (r.ld100Radius as number) / 1_000,
    (r.ld50Radius as number) / 1_000,
    (r.arsThresholdRadius as number) / 1_000,
  ];
};

function ringRow(name: string, yieldKt: number, heightM: number): DoseRingRow {
  const inPlaceKm = radiiKm(yieldKt, heightM, DOSE_IN_PLACE);
  const fitLd50M = inPlaceKm[1] * 1_000;
  const slant = Math.hypot(fitLd50M, heightM);
  return {
    name,
    yieldKt,
    heightOfBurstM: heightM,
    weapon: radiationWeaponFor(yieldKt),
    inPlaceKm,
    candidateKm: radiiKm(yieldKt, heightM, DOSE_CANDIDATE),
    doseAtTheFitRad:
      doseAtSlantRangeRad('gamma', yieldKt, slant, heightM) +
      doseAtSlantRangeRad('neutron', yieldKt, slant, heightM),
    outsideTheFigures: yieldKt < 1 || yieldKt > 20_000,
  };
}

/** Rule 88: every explosion preset that draws a radiation ring. */
export function doseRingRows(): DoseRingRow[] {
  return Object.values(EXPLOSION_PRESETS)
    .map((preset) => {
      const input: ExplosionScenarioInput = preset.input;
      return ringRow(
        preset.name,
        input.yieldMegatons * KILOTONS_PER_MEGATON,
        (input.heightOfBurst as number | undefined) ?? 0
      );
    })
    .filter((row) => row.inPlaceKm[1] > 0 || row.candidateKm[1] > 0);
}

/** Rule 88: the same at a grid of yields, all at one low air burst. */
export function doseGridRows(): DoseRingRow[] {
  return DOSE_GRID_KT.map((kt) => ringRow(`${kt.toString()} kt`, kt, DOSE_GRID_HEIGHT_M));
}

/** Rule 87 (c): at a fixed height the three radii keep their order and each
 *  grows with the yield across the figures' span — save where the book changes
 *  weapon at 100 kt and its own two figures step, which rule 85 (d) bounds and
 *  rule 88 prints. */
export function ringsBehave(): boolean {
  let previous: [number, number, number] | null = null;
  let previousKt = 0;
  for (let w = 0; w <= 40; w++) {
    const kt = 10 ** (w / 10); // 1 kt to 10 Mt, ten steps a decade
    const r = radiiKm(kt, DOSE_GRID_HEIGHT_M, DOSE_CANDIDATE);
    if (!(r[0] > 0 && r[0] <= r[1] && r[1] <= r[2])) return false;
    const crossesTheWeapon = previousKt < THERMONUCLEAR_FROM_KT && kt >= THERMONUCLEAR_FROM_KT;
    if (
      previous !== null &&
      !crossesTheWeapon &&
      r.some((v, i) => v < (previous?.[i] ?? 0) - 1e-9)
    ) {
      return false;
    }
    previous = r;
    previousKt = kt;
  }
  return true;
}

/** Rule 88, beside: the book's own reliability on the LD₅₀ ring (km). */
export interface DoseReliabilityRow {
  name: string;
  weapon: 'fission' | 'thermonuclear';
  low: number;
  middle: number;
  high: number;
}

/** The book's own reliability on its figures: a factor of 0.5 to 2 for a
 *  fission weapon, 0.25 to 1.5 for a thermonuclear one. */
export const DOSE_RELIABILITY: Readonly<Record<'fission' | 'thermonuclear', [number, number]>> = {
  fission: [0.5, 2],
  thermonuclear: [0.25, 1.5],
};

export function doseReliabilityRows(rows: readonly DoseRingRow[]): DoseReliabilityRow[] {
  return rows.map((row) => {
    const factor = DOSE_RELIABILITY[row.weapon];
    // A dose read low means the same range carries less than the figure says,
    // so the ring for a fixed dose moves in: dividing the dose the ring is
    // drawn at by the factor is where the book's own reliability puts it.
    return {
      name: row.name,
      weapon: row.weapon,
      low: ringForDoseKm(row, LD50_RAD / factor[0]),
      middle: row.candidateKm[1],
      high: ringForDoseKm(row, LD50_RAD / factor[1]),
    };
  });
}

/** The ground range (km) at which the book's figures reach `doseRad` for one
 *  row's yield and height. */
function ringForDoseKm(row: DoseRingRow, doseRad: number): number {
  let lo = 1;
  let hi = 2e5;
  const at = (r: number): number => {
    const slant = Math.hypot(r, row.heightOfBurstM);
    return (
      doseAtSlantRangeRad('gamma', row.yieldKt, slant, row.heightOfBurstM) +
      doseAtSlantRangeRad('neutron', row.yieldKt, slant, row.heightOfBurstM)
    );
  };
  if (at(lo) < doseRad) return 0;
  for (let i = 0; i < 80; i++) {
    const mid = 0.5 * (lo + hi);
    if (at(mid) > doseRad) lo = mid;
    else hi = mid;
  }
  return (0.5 * (lo + hi)) / 1_000;
}

export interface DoseRunResult {
  trace: DoseTraceChecks;
  presets: DoseRingRow[];
  grid: DoseRingRow[];
  reliability: DoseReliabilityRow[];
  /** Rule 88, beside: the step in the LD₅₀ ring at 100 kt, where the book
   *  changes from its fission figures to its thermonuclear ones. */
  stepAt100Kt: number;
  ringsBehave: boolean;
  decision: ReturnType<typeof chooseRadiationSource>;
  doses: { ld100: number; ld50: number; ars: number };
}

export function runDose(gatePasses = true): DoseRunResult {
  const trace = doseTraceChecks();
  const presets = doseRingRows();
  const grid = doseGridRows();
  const behaves = ringsBehave();
  const below = radiiKm(THERMONUCLEAR_FROM_KT - 1, DOSE_GRID_HEIGHT_M, DOSE_CANDIDATE)[1];
  const above = radiiKm(THERMONUCLEAR_FROM_KT, DOSE_GRID_HEIGHT_M, DOSE_CANDIDATE)[1];
  return {
    trace,
    presets,
    grid,
    reliability: doseReliabilityRows(grid),
    stepAt100Kt: below > 0 ? above / below : 1,
    ringsBehave: behaves,
    decision: chooseRadiationSource({ trace, gatePasses, ringsBehave: behaves }),
    doses: { ld100: LD100_RAD, ld50: LD50_RAD, ars: ARS_THRESHOLD_RAD },
  };
}
