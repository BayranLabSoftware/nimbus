import type { CasualtyEstimate } from './casualties.js';
import { buildShockArrival, shockArrivalAt } from './effects/blastWave.js';
import type { Joules } from './units.js';
import { m } from './units.js';

/**
 * When do the deaths happen?
 *
 * The casualty estimate is a total: the people inside each hazard
 * band times a mortality. The globe, though, shows the event
 * unfolding, and a total that appears all at once hides the one fact
 * worth learning — that prompt effects kill at the speed of the
 * hazard front, within seconds to minutes, while the tsunami hours
 * later is not in the count at all.
 *
 * This module turns the estimate into a sweep. A front crosses each
 * band; its arrival time at radius r comes from the physics of the
 * hazard — the Kinney–Graham shock front for blast, the crustal shear
 * wave for shaking, the observed front speeds of pyroclastic currents
 * and lateral blasts — and the band's deaths accrue in proportion to
 * the annulus area the front has swept. The single assumption is that
 * people are spread uniformly within a band: the same assumption the
 * estimate itself makes when it applies one mortality to the whole
 * annulus. Time zero is the impact, the detonation, the rupture, the
 * collapse of the column.
 */

/** Arrival time (s) of the hazard front at ground range `radiusM` for
 *  the band `bandKey`. Monotonic in the radius. */
export type ArrivalFunction = (radiusM: number, bandKey: string) => number;

/** Crustal shear-wave speed (m/s). PREM puts Vs between 3.2 km/s in the
 *  upper crust and 3.9 km/s in the lower crust (Dziewonski & Anderson
 *  1981); the damaging S and surface waves travel at about this speed. */
export const SHEAR_WAVE_SPEED = 3_500;

/** Pyroclastic density current front speed (m/s): ≈ 100 km/h, the
 *  value the cascade timeline uses for the runout onset. */
export const PYROCLASTIC_FRONT_SPEED = 30;

/** Lateral-blast front speed (m/s). The 18 May 1980 Mt St Helens blast
 *  cleared 27 km in about a minute (Kieffer 1981); the cascade timeline
 *  stamps its onset at 400 m/s and this sweep uses the same figure. */
export const LATERAL_BLAST_FRONT_SPEED = 400;

export interface ArrivalInput {
  model: CasualtyEstimate['model'];
  /** Energy driving the air shock (J) — blast model only. For an
   *  impact this is the kinetic energy times `IMPACT_BLAST_COUPLING`,
   *  as the rings use; for an explosion the yield. */
  blastEnergy?: Joules;
  /** Outermost radius the front must reach (m). */
  maxRadiusM: number;
}

/** The arrival function for a casualty model. */
export function arrivalFunctionFor(input: ArrivalInput): ArrivalFunction {
  switch (input.model) {
    case 'blast': {
      const energy = input.blastEnergy;
      if (energy === undefined || !((energy as number) > 0) || !(input.maxRadiusM > 0)) {
        return () => 0;
      }
      // Start well inside the fireball: the front is hypersonic there
      // and the seconds it spends below `start` are negligible.
      const start = Math.max(1, input.maxRadiusM * 1e-4);
      const arrival = buildShockArrival(energy, m(start), m(input.maxRadiusM));
      return (radiusM) => shockArrivalAt(arrival, m(radiusM));
    }
    case 'shaking':
      return (radiusM) => radiusM / SHEAR_WAVE_SPEED;
    case 'pyroclastic':
      return (radiusM, bandKey) =>
        radiusM /
        (bandKey === 'lateralBlast' ? LATERAL_BLAST_FRONT_SPEED : PYROCLASTIC_FRONT_SPEED);
  }
}

export interface SweepBand {
  key: string;
  innerRadiusM: number;
  outerRadiusM: number;
  deaths: number;
  deathsLow: number;
  deathsHigh: number;
  injured: number;
  /** Front arrival at the inner edge (s). */
  startS: number;
  /** Front arrival at the outer edge (s). */
  endS: number;
  /** Sampled front: radius (m) and arrival (s), both non-decreasing. */
  radii: Float64Array;
  times: Float64Array;
}

export interface CasualtyTimeline {
  model: CasualtyEstimate['model'];
  bands: SweepBand[];
  /** When the last band is fully swept (s). */
  endS: number;
  /** When the last death occurs (s): the end of the outermost band
   *  with a non-zero mortality. */
  deathsEndS: number;
  deaths: number;
  deathsLow: number;
  deathsHigh: number;
  injured: number;
}

export interface CasualtySample {
  timeS: number;
  deaths: number;
  deathsLow: number;
  deathsHigh: number;
  injured: number;
}

/**
 * Build the sweep. Each band is sampled at `samplesPerBand` radii
 * between its edges; the arrival function is evaluated at each and
 * forced non-decreasing, so a numerical wobble in the shock integral
 * can never make the front go backwards.
 */
export function buildCasualtyTimeline(
  estimate: CasualtyEstimate,
  arrivalAt: ArrivalFunction,
  samplesPerBand = 32
): CasualtyTimeline {
  const n = Math.max(2, Math.floor(samplesPerBand));
  let endS = 0;
  let deathsEndS = 0;
  const bands: SweepBand[] = estimate.bands.map((band) => {
    const radii = new Float64Array(n);
    const times = new Float64Array(n);
    const inner = Math.max(0, band.innerRadiusM);
    const outer = Math.max(inner, band.outerRadiusM);
    let previous = 0;
    for (let i = 0; i < n; i++) {
      const r = inner + ((outer - inner) * i) / (n - 1);
      const raw = arrivalAt(r, band.key);
      const t = Math.max(previous, Number.isFinite(raw) ? Math.max(0, raw) : previous);
      radii[i] = r;
      times[i] = t;
      previous = t;
    }
    const startS = times[0] ?? 0;
    const bandEndS = times[n - 1] ?? startS;
    endS = Math.max(endS, bandEndS);
    if (band.deaths > 0 || band.mortality > 0) deathsEndS = Math.max(deathsEndS, bandEndS);
    return {
      key: band.key,
      innerRadiusM: inner,
      outerRadiusM: outer,
      deaths: band.deaths,
      deathsLow: band.deathsLow,
      deathsHigh: band.deathsHigh,
      injured: band.injured,
      startS,
      endS: bandEndS,
      radii,
      times,
    };
  });
  // Totals are the sum of the bands, so the sweep lands exactly on
  // them; the estimate rounds each band and its totals separately and
  // can differ from this sum by a person per band.
  const total = (pick: (band: SweepBand) => number): number =>
    bands.reduce((acc, band) => acc + pick(band), 0);
  return {
    model: estimate.model,
    bands,
    endS,
    deathsEndS,
    deaths: total((b) => b.deaths),
    deathsLow: total((b) => b.deathsLow),
    deathsHigh: total((b) => b.deathsHigh),
    injured: total((b) => b.injured),
  };
}

/** Front radius (m) inside a band at time `timeS`, by linear
 *  interpolation on the sampled arrival curve. */
function frontRadiusAt(band: SweepBand, timeS: number): number {
  const { radii, times } = band;
  const n = radii.length;
  if (n === 0) return band.innerRadiusM;
  if (timeS <= (times[0] ?? 0)) return radii[0] ?? band.innerRadiusM;
  if (timeS >= (times[n - 1] ?? 0)) return radii[n - 1] ?? band.outerRadiusM;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((times[mid] ?? 0) <= timeS) lo = mid;
    else hi = mid;
  }
  const t0 = times[lo] ?? 0;
  const t1 = times[hi] ?? t0;
  const r0 = radii[lo] ?? 0;
  const r1 = radii[hi] ?? r0;
  const span = t1 - t0;
  return span > 0 ? r0 + ((r1 - r0) * (timeS - t0)) / span : r1;
}

/** Fraction of the band's annulus area the front has swept at `timeS`. */
export function sweptFraction(band: SweepBand, timeS: number): number {
  if (timeS >= band.endS) return 1;
  if (timeS <= band.startS) return 0;
  const a0 = band.innerRadiusM * band.innerRadiusM;
  const a1 = band.outerRadiusM * band.outerRadiusM;
  if (!(a1 > a0)) return 1;
  const r = frontRadiusAt(band, timeS);
  return Math.min(1, Math.max(0, (r * r - a0) / (a1 - a0)));
}

/** The toll so far at `timeS` seconds after time zero. Non-decreasing
 *  in time; equals the estimate's totals from `timeline.endS` on. */
export function casualtiesAtTime(timeline: CasualtyTimeline, timeS: number): CasualtySample {
  let deaths = 0;
  let deathsLow = 0;
  let deathsHigh = 0;
  let injured = 0;
  for (const band of timeline.bands) {
    const f = sweptFraction(band, timeS);
    if (f <= 0) continue;
    deaths += band.deaths * f;
    deathsLow += band.deathsLow * f;
    deathsHigh += band.deathsHigh * f;
    injured += band.injured * f;
  }
  return { timeS, deaths, deathsLow, deathsHigh, injured };
}
