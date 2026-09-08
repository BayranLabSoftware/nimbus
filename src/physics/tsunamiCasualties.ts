import type { BandEstimate, CasualtyEstimate } from './casualties.js';
import { normalCdf } from './casualties.js';
import type { RunupCell } from './tsunami/runupField.js';

/**
 * The coastal toll of a tsunami.
 *
 * The run-up field gives, for every coastal cell the wave reaches,
 * the shoaled amplitude A arriving at the coast, the plane-beach
 * run-up R it makes, and the arrival time. The water on the land is
 * between the two — the run-up is what a beach does to a wave, the
 * amplitude what arrives, and a kilometre grid knows neither beach
 * nor plain — so the height at the shore is taken as H = √(A · R).
 * On the 2011 Tōhoku coast that is about 9 m where the record shows
 * 8–15 m on the plains and 20–40 m in the rias.
 *
 * The strip the water crosses is the Bretschneider & Wybro (1976)
 * inundation distance X = k · H^(4/3) / n², the form Hills & Mader
 * (1997) used for impact tsunamis, with Manning's roughness n = 0.03
 * for developed coastal land and k = 0.06 for metres: 1.3 km for
 * 9 m, which is the mean the Tōhoku inundation showed over 500 km of
 * coast (561 km²), 9 km for 40 m, capped at ten kilometres (the
 * Sendai plain flooded five). The people in the strip are the
 * coastal land density times its area, and the share that dies
 * follows the flow depth, taken as H/2 on average over a strip that
 * runs from H at the shore to nothing at its edge.
 *
 * Mortality by depth is the log-normal form of every published
 * tsunami and flood fatality function — Koshimura et al. 2009 fitted
 * it to the 2004 Banda Aceh death ratios by inundation depth, Jonkman
 * et al. 2008 reviewed the flood record — with the parameters our own
 * reading of that record: the central pair is a coast with no
 * warning, the low pair a coast that evacuated (the 2011 Tōhoku death
 * ratios, a few per cent at five metres), the high pair Banda Aceh,
 * where the wave took most of the people it reached above five
 * metres.
 *
 * Warning is a matter of time. A coast the wave reaches within half
 * an hour has none — the 2004 Indian Ocean coasts, the Sanriku towns
 * — and gets the no-warning pair; a coast hours away is warned in any
 * modern scenario, the Pacific centres bulletin within minutes of a
 * source and the far coasts empty (Tohoku 2011 killed one person
 * across the Pacific), and from three hours on the central pair is
 * the evacuated one, the low pair a coast that had the whole day. In
 * between the thresholds shift with the logarithm of the arrival
 * time. The high pair, Banda Aceh, holds throughout: the warning that
 * never came.
 *
 * The toll is dated: the cells are binned by arrival time, and the
 * sweep raises the counter as the wave lands, hours after the impact
 * for a far coast. Pure — the coastal density comes from the caller.
 */

export interface TsunamiVulnerability {
  /** Flow depth (m) at which half of the people reached die. */
  theta: number;
  /** Width of the log-normal in ln(depth). */
  beta: number;
}

export const TSUNAMI_VULNERABILITY = {
  /** A coast that evacuated — the 2011 Tōhoku record. */
  low: { theta: 16, beta: 0.8 },
  /** A coast with no warning. */
  mid: { theta: 8, beta: 0.8 },
  /** Banda Aceh 2004. */
  high: { theta: 4, beta: 0.8 },
} as const satisfies Record<'low' | 'mid' | 'high', TsunamiVulnerability>;

/** Fatality rate (0–1) for a flow depth (m). */
export function tsunamiFatalityRate(depthM: number, params: TsunamiVulnerability): number {
  if (!(depthM > 0)) return 0;
  return normalCdf(Math.log(depthM / params.theta) / params.beta);
}

/** Arrival within this (s): no warning reaches the coast. */
export const WARNING_ONSET_S = 30 * 60;
/** Arrival beyond this (s): the coast has been warned and emptied. */
export const WARNING_FULL_S = 3 * 3_600;

/** The vulnerability triple for a coast the wave reaches `arrivalS`
 *  after the source: the no-warning pairs within half an hour, the
 *  evacuated pairs from three hours on, the thresholds doubling on a
 *  log scale in between; Banda Aceh as the high pair throughout. */
export function vulnerabilityAt(arrivalS: number): {
  low: TsunamiVulnerability;
  mid: TsunamiVulnerability;
  high: TsunamiVulnerability;
} {
  const t = Math.max(0, Number.isFinite(arrivalS) ? arrivalS : 0);
  const f =
    t <= WARNING_ONSET_S
      ? 0
      : t >= WARNING_FULL_S
        ? 1
        : Math.log(t / WARNING_ONSET_S) / Math.log(WARNING_FULL_S / WARNING_ONSET_S);
  const beta = TSUNAMI_VULNERABILITY.mid.beta;
  return {
    low: { theta: TSUNAMI_VULNERABILITY.low.theta * 2 ** f, beta },
    mid: { theta: TSUNAMI_VULNERABILITY.mid.theta * 2 ** f, beta },
    high: TSUNAMI_VULNERABILITY.high,
  };
}

/** The strip never runs farther inland than this (m). */
export const MAX_INUNDATION_M = 10_000;
/** Below this height at the shore (m) the water wets the beach and
 *  kills nobody. */
export const MIN_LETHAL_RUNUP_M = 1;
/** Manning's roughness of developed coastal land (Bretschneider &
 *  Wybro 1976: 0.015 for smooth ground, 0.07 for forest). */
export const MANNING_ROUGHNESS = 0.03;
/** The Bretschneider–Wybro constant for X and R in metres. */
export const INUNDATION_K = 0.06;

/** How far inland the water reaches (m) for a run-up R (m):
 *  X = k · R^(4/3) / n², capped at `MAX_INUNDATION_M`. */
export function inundationDistance(runupM: number): number {
  if (!(runupM > 0)) return 0;
  return Math.min(
    MAX_INUNDATION_M,
    (INUNDATION_K * runupM ** (4 / 3)) / (MANNING_ROUGHNESS * MANNING_ROUGHNESS)
  );
}

/** Mean flow depth (m) over a strip that starts at H and ends dry. */
export function meanFlowDepth(shoreHeightM: number): number {
  return 0.5 * Math.max(0, shoreHeightM);
}

/** The water height at the shore (m): the geometric mean of the
 *  shoaled amplitude arriving at the coast and the plane-beach run-up
 *  it makes. Without an amplitude, half the run-up. */
export function shoreHeight(runupM: number, amplitudeM: number | undefined): number {
  if (!(runupM > 0)) return 0;
  if (amplitudeM === undefined || !(amplitudeM > 0)) return 0.5 * runupM;
  return Math.sqrt(Math.min(amplitudeM, runupM) * runupM);
}

export interface TsunamiCoastCell extends RunupCell {
  /** Land population density around the cell (people per km²). */
  densityPerKm2: number;
}

export interface TsunamiCasualtyEstimate {
  /** People inside the inundation strips. */
  exposed: number;
  deaths: number;
  deathsLow: number;
  deathsHigh: number;
  /** First and last arrival among the cells that kill anyone (s). */
  firstArrivalS: number;
  lastArrivalS: number;
  /** The toll binned by arrival time, oldest first. */
  bands: BandEstimate[];
  /** Coastal cells counted. */
  cellCount: number;
}

/** Arrival-time bins of the toll: enough to date it, few enough to read. */
const ARRIVAL_BINS = 12;

/**
 * The coastal toll from run-up cells with a coastal density each.
 * Cells without an arrival time are dated at time zero.
 */
export function estimateTsunamiCasualties(
  cells: readonly TsunamiCoastCell[],
  bins = ARRIVAL_BINS
): TsunamiCasualtyEstimate {
  interface CellToll {
    arrivalS: number;
    people: number;
    deaths: number;
    deathsLow: number;
    deathsHigh: number;
  }
  const tolls: CellToll[] = [];
  for (const cell of cells) {
    const height = shoreHeight(cell.runupM, cell.amplitudeM);
    if (!(height >= MIN_LETHAL_RUNUP_M) || !(cell.densityPerKm2 > 0)) continue;
    const strip = inundationDistance(height);
    const areaKm2 = (cell.spacingM * strip) / 1e6;
    const people = cell.densityPerKm2 * areaKm2;
    if (!(people > 0)) continue;
    const depth = meanFlowDepth(height);
    const arrival =
      cell.arrivalS !== undefined && Number.isFinite(cell.arrivalS) ? cell.arrivalS : 0;
    const vulnerability = vulnerabilityAt(arrival);
    tolls.push({
      arrivalS: Math.max(0, arrival),
      people,
      deaths: people * tsunamiFatalityRate(depth, vulnerability.mid),
      deathsLow: people * tsunamiFatalityRate(depth, vulnerability.low),
      deathsHigh: people * tsunamiFatalityRate(depth, vulnerability.high),
    });
  }
  const empty: TsunamiCasualtyEstimate = {
    exposed: 0,
    deaths: 0,
    deathsLow: 0,
    deathsHigh: 0,
    firstArrivalS: 0,
    lastArrivalS: 0,
    bands: [],
    cellCount: cells.length,
  };
  if (tolls.length === 0) return empty;

  const first = Math.min(...tolls.map((t) => t.arrivalS));
  const last = Math.max(...tolls.map((t) => t.arrivalS));
  // Log-spaced bins between the first and the last arrival; a single
  // arrival instant is one bin.
  const n = Math.max(1, Math.min(bins, tolls.length));
  const edges: number[] = [];
  const logFirst = Math.log1p(first);
  const logLast = Math.log1p(last);
  for (let i = 0; i <= n; i++) {
    edges.push(last > first ? Math.expm1(logFirst + ((logLast - logFirst) * i) / n) : first);
  }
  const binOf = (t: number): number => {
    if (!(last > first)) return 0;
    for (let i = 0; i < n; i++) if (t < (edges[i + 1] ?? last)) return i;
    return n - 1;
  };
  const sums = Array.from({ length: n }, () => ({ people: 0, d: 0, dl: 0, dh: 0 }));
  for (const t of tolls) {
    const b = sums[binOf(t.arrivalS)];
    if (b === undefined) continue;
    b.people += t.people;
    b.d += t.deaths;
    b.dl += t.deathsLow;
    b.dh += t.deathsHigh;
  }
  const bands: BandEstimate[] = [];
  let exposed = 0;
  let deaths = 0;
  let deathsLow = 0;
  let deathsHigh = 0;
  sums.forEach((b, i) => {
    if (!(b.people > 0)) return;
    exposed += b.people;
    deaths += b.d;
    deathsLow += b.dl;
    deathsHigh += b.dh;
    const startS = edges[i] ?? first;
    // A bin's wave lands over the bin; the last edge is the last arrival
    // itself, and the water takes a while to do its work: ten minutes.
    const endS = Math.max(edges[i + 1] ?? last, startS + 600);
    bands.push({
      key: `tsunami${i.toString()}`,
      innerRadiusM: 0,
      outerRadiusM: 1,
      hazards: ['tsunami'],
      window: { startS, endS },
      population: Math.round(b.people),
      mortality: b.people > 0 ? b.d / b.people : 0,
      deaths: Math.round(b.d),
      deathsLow: Math.round(b.dl),
      deathsHigh: Math.round(b.dh),
      promptDeaths: Math.round(b.d),
      delayedDeaths: 0,
      injured: 0,
      byHazard: [
        {
          hazard: 'tsunami',
          deaths: Math.round(b.d),
          deathsLow: Math.round(b.dl),
          deathsHigh: Math.round(b.dh),
        },
      ],
    });
  });
  return {
    exposed: Math.round(exposed),
    deaths: Math.round(deaths),
    deathsLow: Math.round(deathsLow),
    deathsHigh: Math.round(deathsHigh),
    firstArrivalS: first,
    lastArrivalS: last,
    bands,
    cellCount: cells.length,
  };
}

/**
 * Add the coastal toll to an estimate — an impact's blast toll, an
 * earthquake's shaking toll — or make one of it alone, for a
 * submarine landslide whose only hazard is the wave.
 */
export function mergeTsunamiCasualties(
  base: CasualtyEstimate | null,
  tsunami: TsunamiCasualtyEstimate
): CasualtyEstimate {
  const b: CasualtyEstimate = base ?? {
    model: 'tsunami',
    exposed: 0,
    deaths: 0,
    deathsLow: 0,
    deathsHigh: 0,
    promptDeaths: 0,
    delayedDeaths: 0,
    delayedDeathsLow: 0,
    delayedDeathsHigh: 0,
    injured: 0,
    bands: [],
  };
  return {
    ...b,
    exposed: b.exposed + tsunami.exposed,
    deaths: b.deaths + tsunami.deaths,
    deathsLow: b.deathsLow + tsunami.deathsLow,
    deathsHigh: b.deathsHigh + tsunami.deathsHigh,
    promptDeaths: b.promptDeaths + tsunami.deaths,
    tsunamiDeaths: tsunami.deaths,
    tsunamiDeathsLow: tsunami.deathsLow,
    tsunamiDeathsHigh: tsunami.deathsHigh,
    bands: [...b.bands.filter((band) => !band.hazards.includes('tsunami')), ...tsunami.bands],
  };
}
