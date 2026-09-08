import type { CasualtyEstimate, CasualtyHazard } from './casualties.js';
import { TNT_SPECIFIC_ENERGY } from './constants.js';
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
 * hazard front, within seconds to minutes; that a mass fire takes
 * its toll in the hours after; that the injured keep dying for
 * weeks; and that the tsunami hours later is not in the count at all.
 *
 * This module turns the estimate into a sweep. Every hazard of every
 * band becomes a sweep band with its own timing:
 *
 *   blast        the Kinney–Graham shock front crossing the annulus,
 *                deaths accruing with the area swept;
 *   shaking      the crustal shear wave, the same way;
 *   pyroclastic  the current's front, the lateral blast's front;
 *   thermal      the thermal pulse — everyone in the annulus at once,
 *                over the pulse duration (Glasstone & Dolan 1977
 *                §7.86: t_max ≈ 0.0417 W^0.44 s, W in kt, the pulse
 *                essentially over by 10 t_max);
 *   firestorm    the mass fire, from twenty minutes after the burst
 *                to about six hours (Glasstone & Dolan §7.71, the
 *                Hiroshima fire storm);
 *   delayed      the untreated injured, from the first day to the
 *                first month;
 *   tsunami      the wave landing on each coast at its arrival time,
 *                binned, the water doing its work over the bin.
 *
 * The one assumption of the radial sweeps is that people are spread
 * uniformly within a band: the same assumption the estimate itself
 * makes when it applies one mortality to the whole annulus. Time zero
 * is the impact, the detonation, the rupture, the collapse of the
 * column.
 */

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

/** Mass fire: onset and end after the burst (s). */
export const FIRESTORM_ONSET_S = 20 * 60;
export const FIRESTORM_END_S = 6 * 3_600;

/** Later deaths among the injured: first day to first month (s). */
export const DELAYED_ONSET_S = 86_400;
export const DELAYED_END_S = 30 * 86_400;

/** Duration of the thermal pulse (s) for a yield in joules: ten times
 *  the time of the second radiant maximum, t_max ≈ 0.0417 W^0.44 s
 *  with W in kilotonnes (Glasstone & Dolan 1977 §7.86). A 15 kt burst
 *  is over in about a second and a half; a Chicxulub-class fireball
 *  glows for hours. */
export function thermalPulseDuration(yieldJ: number): number {
  const kt = yieldJ / (TNT_SPECIFIC_ENERGY * 1e6);
  if (!(kt > 0)) return 1;
  return 10 * 0.0417 * kt ** 0.44;
}

/** What an arrival function is told about the band it is timing. */
export interface SweepBandRef {
  key: string;
  hazard: CasualtyHazard;
  innerRadiusM: number;
  outerRadiusM: number;
  /** A dated toll's window (s), for the hazards that arrive as a
   *  time rather than a front — the tsunami's coastal toll. */
  window?: { startS: number; endS: number };
}

/** Arrival time (s) of the hazard at ground range `radiusM` inside the
 *  band `band`. Monotonic in the radius within a band. */
export type ArrivalFunction = (radiusM: number, band: SweepBandRef) => number;

export interface ArrivalInput {
  model: CasualtyEstimate['model'];
  /** Energy driving the air shock and the thermal pulse (J) — blast
   *  model only. For an impact this is the kinetic energy times
   *  `IMPACT_BLAST_COUPLING`, as the rings use; for an explosion the
   *  yield. */
  blastEnergy?: Joules;
  /** Outermost radius the front must reach (m). */
  maxRadiusM: number;
}

/** A ramp in time across an annulus: the hazard reaches the whole
 *  band at once, so its deaths accrue linearly between `startS` and
 *  `endS`. Expressed as an arrival radius-by-radius so the same sweep
 *  machinery (area swept ⇒ deaths) applies: linear in r². */
function rampArrival(startS: number, endS: number): ArrivalFunction {
  return (radiusM, band) => {
    const a0 = band.innerRadiusM * band.innerRadiusM;
    const a1 = band.outerRadiusM * band.outerRadiusM;
    if (!(a1 > a0)) return endS;
    const f = Math.min(1, Math.max(0, (radiusM * radiusM - a0) / (a1 - a0)));
    return startS + (endS - startS) * f;
  };
}

/** The arrival function for a casualty model, hazard by hazard. */
export function arrivalFunctionFor(input: ArrivalInput): ArrivalFunction {
  const energy = input.blastEnergy;
  const shock =
    energy !== undefined && energy > 0 && input.maxRadiusM > 0
      ? // Start well inside the fireball: the front is hypersonic there
        // and the seconds it spends below `start` are negligible.
        buildShockArrival(energy, m(Math.max(1, input.maxRadiusM * 1e-4)), m(input.maxRadiusM))
      : null;
  const thermal = rampArrival(0, thermalPulseDuration(energy ?? 0));
  const firestorm = rampArrival(FIRESTORM_ONSET_S, FIRESTORM_END_S);
  const delayed = rampArrival(DELAYED_ONSET_S, DELAYED_END_S);
  return (radiusM, band) => {
    switch (band.hazard) {
      case 'blast':
        return shock === null ? 0 : shockArrivalAt(shock, m(radiusM));
      case 'thermal':
        return thermal(radiusM, band);
      case 'firestorm':
        return firestorm(radiusM, band);
      case 'delayed':
        return delayed(radiusM, band);
      case 'shaking':
        return radiusM / SHEAR_WAVE_SPEED;
      case 'pyroclastic':
        return radiusM / PYROCLASTIC_FRONT_SPEED;
      case 'lateralBlast':
        return radiusM / LATERAL_BLAST_FRONT_SPEED;
      case 'tsunami': {
        const w = band.window ?? { startS: 0, endS: 0 };
        return rampArrival(w.startS, w.endS)(radiusM, band);
      }
    }
  };
}

export interface SweepBand extends SweepBandRef {
  deaths: number;
  deathsLow: number;
  deathsHigh: number;
  injured: number;
  /** Hazard arrival at the inner edge (s). */
  startS: number;
  /** Hazard arrival at the outer edge (s). */
  endS: number;
  /** Sampled arrival: radius (m) and time (s), both non-decreasing. */
  radii: Float64Array;
  times: Float64Array;
}

export interface CasualtyTimeline {
  model: CasualtyEstimate['model'];
  bands: SweepBand[];
  /** When the last band is fully swept (s). */
  endS: number;
  /** When the last death occurs (s): the end of the last band with
   *  deaths — a month out when later deaths are counted. */
  deathsEndS: number;
  /** When the last prompt death occurs (s). */
  promptDeathsEndS: number;
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
 * Build the sweep. Every hazard of every band becomes a sweep band,
 * sampled at `samplesPerBand` radii between its edges; the arrival
 * function is evaluated at each and forced non-decreasing, so a
 * numerical wobble in the shock integral can never make the front
 * go backwards. The band's prompt injuries ride with its first
 * hazard.
 */
export function buildCasualtyTimeline(
  estimate: CasualtyEstimate,
  arrivalAt: ArrivalFunction,
  samplesPerBand = 32
): CasualtyTimeline {
  const n = Math.max(2, Math.floor(samplesPerBand));
  let endS = 0;
  let deathsEndS = 0;
  let promptDeathsEndS = 0;
  const bands: SweepBand[] = [];
  for (const band of estimate.bands) {
    const inner = Math.max(0, band.innerRadiusM);
    const outer = Math.max(inner, band.outerRadiusM);
    const parts =
      band.byHazard.length > 0
        ? band.byHazard
        : [
            {
              hazard: 'blast' as const,
              deaths: band.deaths,
              deathsLow: band.deathsLow,
              deathsHigh: band.deathsHigh,
            },
          ];
    parts.forEach((part, index) => {
      const ref: SweepBandRef = {
        key: `${band.key}:${part.hazard}`,
        hazard: part.hazard,
        innerRadiusM: inner,
        outerRadiusM: outer,
        ...(band.window !== undefined && { window: band.window }),
      };
      const radii = new Float64Array(n);
      const times = new Float64Array(n);
      let previous = 0;
      for (let i = 0; i < n; i++) {
        const r = inner + ((outer - inner) * i) / (n - 1);
        const raw = arrivalAt(r, ref);
        const t = Math.max(previous, Number.isFinite(raw) ? Math.max(0, raw) : previous);
        radii[i] = r;
        times[i] = t;
        previous = t;
      }
      const startS = times[0] ?? 0;
      const bandEndS = times[n - 1] ?? startS;
      endS = Math.max(endS, bandEndS);
      if (part.deaths > 0) {
        deathsEndS = Math.max(deathsEndS, bandEndS);
        if (part.hazard !== 'delayed') promptDeathsEndS = Math.max(promptDeathsEndS, bandEndS);
      }
      bands.push({
        ...ref,
        deaths: part.deaths,
        deathsLow: part.deathsLow,
        deathsHigh: part.deathsHigh,
        injured: index === 0 ? band.injured : 0,
        startS,
        endS: bandEndS,
        radii,
        times,
      });
    });
  }
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
    promptDeathsEndS,
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

/** Fraction of the band's annulus area the hazard has swept at `timeS`. */
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
 *  in time; equals the timeline's totals from `timeline.endS` on. */
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
