import type { BandEstimate, CasualtyEstimate } from './casualties.js';
import { normalCdf } from './casualties.js';
import { RUNUP_EVALUATION_DEPTH_M } from './tsunami/runupField.js';
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
 * Warning is a matter of time, but of two times and not one. What a
 * coast has is the wave's travel time minus however long it takes a
 * warning to be issued and delivered, and the second of those is a
 * fact about the basin rather than about the wave. The Pacific
 * centres bulletin within minutes and Japan's within three, so a
 * Pacific coast hours from a source is empty when the water arrives:
 * Tōhoku 2011 killed one person across the whole ocean. The Indian
 * Ocean in 2004 had no system at all. Its far coasts had two hours of
 * travel time and no warning whatsoever, and Sri Lanka and India lost
 * more than fifty thousand people between them at distances where the
 * Pacific would have been evacuated twice over.
 *
 * So the lead time is max(0, arrival − issue), and the vulnerability
 * follows that rather than the arrival: none within half an hour of
 * lead, evacuated from three hours of lead on, the thresholds
 * doubling on a log scale between. A basin with no system has an
 * infinite issue time, every coast has zero lead however far it is,
 * and the model stops handing 2004 a warning that did not exist. The
 * high pair, Banda Aceh, holds throughout: the warning that never
 * came.
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

/** Lead time under this (s): no warning is any use to the coast. */
export const WARNING_ONSET_S = 30 * 60;
/** Lead time beyond this (s): the coast has been warned and emptied. */
export const WARNING_FULL_S = 3 * 3_600;

/**
 * How long after the source a warning reaches a coast (s).
 *
 * `modern` is the operating case: the Pacific centre bulletins within
 * minutes, Japan's within three, and since 2006 the Indian Ocean has
 * a system of its own; ten minutes is the round number that covers
 * them. `none` is a basin without one, and it is not a historical
 * curiosity — it is the 2004 Indian Ocean, where the difference
 * between the two is most of the dead.
 */
export const WARNING_ISSUE_S = {
  modern: 10 * 60,
  none: Number.POSITIVE_INFINITY,
} as const;

/** The lead time a coast actually has: travel time less the time the
 *  warning takes to arrive, and never negative. */
export function warningLeadS(arrivalS: number, issueS: number): number {
  if (!Number.isFinite(issueS)) return 0;
  const t = Math.max(0, Number.isFinite(arrivalS) ? arrivalS : 0);
  return Math.max(0, t - Math.max(0, issueS));
}

/** The vulnerability triple for a coast with `leadS` of warning: the
 *  no-warning pairs under half an hour, the evacuated pairs from
 *  three hours on, the thresholds doubling on a log scale in between;
 *  Banda Aceh as the high pair throughout. */
export function vulnerabilityAt(leadS: number): {
  low: TsunamiVulnerability;
  mid: TsunamiVulnerability;
  high: TsunamiVulnerability;
} {
  const t = Math.max(0, Number.isFinite(leadS) ? leadS : 0);
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

/**
 * McCowan's (1894) breaking index: a solitary wave breaks once its
 * height reaches this fraction of the water depth. Already the
 * ceiling on the shoaling in `amplitudeField.ts`; here it is what
 * says how deep the water is when the wave arrives at the shore.
 */
export const BREAKING_INDEX = 0.78;

/**
 * The water height at the shore (m), from the amplitude the wave
 * field reports and the run-up the beach makes of it.
 *
 * The field stops at fifty metres of water, because the shallow-water
 * equations it is built on give out below that. The wave does not
 * stop there. Green's law carries it the rest of the way, A ∝ h^(−¼),
 * and McCowan says how far the rest of the way is: the wave breaks
 * when its height reaches 0.78 of the depth. Solving the two together
 * removes the depth and leaves
 *
 *     H = (d·γ)^(1/5) · A^(4/5)
 *
 * with d the fifty metres the field stopped at and γ the breaking
 * index — about 2.1·A^(4/5), so a wave arriving at three metres
 * stands at five and a half, and one arriving at one metre stands at
 * two. There is no free parameter in it: both numbers are already in
 * the model, one as the field's floor and one as its shoaling cap.
 *
 * Until 9 September 2026 this was the amplitude itself, hedged
 * against the run-up through a trust factor of one — and since the
 * run-up is almost always larger, the hedge chose the amplitude every
 * time and the last fifty metres of water were dropped.
 *
 * The run-up is still the ceiling. A cliff coast makes little of a
 * big wave, and where Synolakis returns less than Green's law does,
 * Synolakis is the one that knows about the beach.
 */
export function shoreHeight(runupM: number, amplitudeM: number | undefined): number {
  if (!(runupM > 0)) return 0;
  if (amplitudeM === undefined || !(amplitudeM > 0)) return 0.5 * runupM;
  const shoaled =
    (RUNUP_EVALUATION_DEPTH_M * BREAKING_INDEX) ** 0.2 * Math.max(amplitudeM, 0) ** 0.8;
  return Math.min(runupM, shoaled);
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
export interface TsunamiCasualtyOptions {
  /** How long after the source a warning reaches the coast (s).
   *  Defaults to {@link WARNING_ISSUE_S.modern}; pass
   *  {@link WARNING_ISSUE_S.none} for a basin that had no system. */
  warningIssueS?: number;
  /** How many arrival bins the toll is dated into. */
  bins?: number;
}

export function estimateTsunamiCasualties(
  cells: readonly TsunamiCoastCell[],
  options: TsunamiCasualtyOptions = {}
): TsunamiCasualtyEstimate {
  const bins = options.bins ?? ARRIVAL_BINS;
  const issueS = options.warningIssueS ?? WARNING_ISSUE_S.modern;
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
    const vulnerability = vulnerabilityAt(warningLeadS(arrival, issueS));
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
      // The wave has no later deaths of its own in this model, so the
      // two are the same number here.
      promptMortality: b.people > 0 ? b.d / b.people : 0,
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
