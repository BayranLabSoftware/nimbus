import {
  FIRST_DEGREE_BURN_FLUENCE,
  SECOND_DEGREE_BURN_FLUENCE,
  THIRD_DEGREE_BURN_FLUENCE,
} from '../constants.js';
import { BURN_CURVES, BURN_CURVE_YIELDS_KT } from './burnExposureData.js';
import { BURN_PROBABILITY_CURVES, BURN_PROBABILITY_YIELDS_KT } from './burnProbabilityData.js';

/**
 * The radiant exposure that burns exposed skin — a fixed one, or the one
 * Glasstone & Dolan's own curves give for the yield (rule 81 of
 * validation/burnRules.ts).
 *
 * The project has drawn its burn rings at 8, 5 and 2 cal/cm² whatever the
 * explosion. The book does not: the exposure that burns grows with the yield,
 * because a bigger explosion spreads the same heat over a longer pulse and the
 * skin sheds more of it while it arrives. Its Figure 12.64 (page 564 of the
 * 1977 edition) draws the exposure required to produce a burn of each degree on
 * each of three skin pigmentations, from 1 kt to 10 Mt — "Radiant exposure
 * required to produce skin burns for different skin pigmentations", with no
 * probability attached to a curve. Its neighbour 12.65 draws the same thing as
 * probabilities, 50 % of an average exposed population on the solid lines and
 * 18 % and 82 % on the broken ones, and is not what is read here. `burnExposureData.ts` carries those nine
 * curves as traced from the public scan.
 */

export type BurnDegree = 'first' | 'second' | 'third';
export type BurnSkin = 'light' | 'medium' | 'dark';

/** Which exposure the rings are drawn at: the project's fixed fluences, the
 *  book's Figure 12.64 (the exposure a burn needs, by pigmentation), or its
 *  Figure 12.65 (the exposure at which a share of an average unshielded
 *  population has one). Rules 114 to 117 of validation/burnProbabilityRules.ts
 *  say what separates the last two, and that no measurement can. */
export type BurnExposureSource = 'project' | 'glasstone1977' | 'glasstone1977probability';

/** What a scenario that names no source draws: Figure 12.65's 50 % lines,
 *  adopted on 16 September 2026 by rule 117 of
 *  validation/burnProbabilityRules.ts — a ring where half an average unshielded
 *  population takes the burn. Figure 12.64, which rule 82 of burnRules.ts
 *  adopted earlier the same day, stays reachable as `glasstone1977`. An impact
 *  names `project` for itself (rule 81): the curves are a nuclear fireball's
 *  pulse. */
export const DEFAULT_BURN_EXPOSURE: BurnExposureSource = 'glasstone1977probability';

/** The skin the book's curves are read at where a scenario names none: the
 *  middle of the figure's three, the one drawn for a skin neither light nor
 *  dark. It is not an average over pigmentations — the figure draws no such
 *  curve — and rule 83 of validation/burnRules.ts prints the other two beside
 *  it so the spread is visible. */
export const DEFAULT_BURN_SKIN: BurnSkin = 'medium';

/** One calorie per square centimetre, in joules per square metre. */
export const JOULES_PER_CAL_CM2 = 4.184e4;

const JOULES_PER_KILOTON = 4.184e12;

const PROJECT_FLUENCE: Readonly<Record<BurnDegree, number>> = {
  first: FIRST_DEGREE_BURN_FLUENCE,
  second: SECOND_DEGREE_BURN_FLUENCE,
  third: THIRD_DEGREE_BURN_FLUENCE,
};

const CURVE = new Map<string, readonly number[]>(
  BURN_CURVES.map(([degree, skin, values]) => [`${degree}:${skin}`, values])
);

/**
 * The book's radiant exposure (cal/cm²) for one degree, skin and yield,
 * interpolated in the logarithm of the yield between the points traced from
 * the figure and held flat beyond its ends, where the figure says nothing.
 */
export function burnExposureCalPerCm2(
  degree: BurnDegree,
  yieldKilotons: number,
  skin: BurnSkin = DEFAULT_BURN_SKIN
): number {
  const values = CURVE.get(`${degree}:${skin}`);
  const yields = BURN_CURVE_YIELDS_KT;
  const first = values?.[0];
  const last = values?.[values.length - 1];
  if (values === undefined || first === undefined || last === undefined) {
    return PROJECT_FLUENCE[degree] / JOULES_PER_CAL_CM2;
  }
  if (!(yieldKilotons > 0)) return first;
  const w = Math.log10(yieldKilotons);
  for (let i = 1; i < yields.length; i++) {
    const lo = yields[i - 1];
    const hi = yields[i];
    const vlo = values[i - 1];
    const vhi = values[i];
    if (lo === undefined || hi === undefined || vlo === undefined || vhi === undefined) continue;
    if (w <= Math.log10(lo)) return i === 1 ? first : vlo;
    if (w <= Math.log10(hi)) {
      const t = (w - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo));
      return vlo + t * (vhi - vlo);
    }
  }
  return last;
}

/**
 * The fluence (J/m²) a burn ring of `degree` is drawn at, for a scenario of
 * `yieldJoules` under `source`.
 */
export function burnFluenceThreshold(
  degree: BurnDegree,
  yieldJoules: number,
  source: BurnExposureSource = DEFAULT_BURN_EXPOSURE,
  skin: BurnSkin = DEFAULT_BURN_SKIN
): number {
  if (source === 'project') return PROJECT_FLUENCE[degree];
  const yieldKilotons = yieldJoules / JOULES_PER_KILOTON;
  if (source === 'glasstone1977probability') {
    return burnProbabilityCalPerCm2(degree, yieldKilotons, 'half') * JOULES_PER_CAL_CM2;
  }
  return burnExposureCalPerCm2(degree, yieldKilotons, skin) * JOULES_PER_CAL_CM2;
}

/** Which of Figure 12.65's three lines for a degree: the 18 % line, the 50 %
 *  line the ring is drawn at, or the upper line — 82 % for the first and
 *  second degrees, 100 % for the third, which is the curve the figure draws
 *  (rule 115 of validation/burnProbabilityRules.ts). */
export type BurnShare = 'low' | 'half' | 'high';

/** The share each line carries, by degree. The upper line of the third degree
 *  is the figure's 100 % curve and is declared as such rather than read as an
 *  82 % one. */
export function burnShareFraction(degree: BurnDegree, share: BurnShare): number {
  if (share === 'low') return 0.18;
  if (share === 'half') return 0.5;
  return PROBABILITY.get(degree)?.upper ?? 0.82;
}

/**
 * The radiant exposure (cal/cm²) at which `share` of an average unshielded
 * population taking no evasive action has a burn of `degree`, at this yield —
 * Figure 12.65, interpolated in the logarithm of the yield between the traced
 * points and held flat beyond the figure's ends, exactly as 12.64's are.
 *
 * Pigmentation has no meaning here: what 12.64 offers as three skins, 12.65
 * offers as one population with a spread, and no reading of one figure gives
 * both (rule 116).
 */
export function burnProbabilityCalPerCm2(
  degree: BurnDegree,
  yieldKilotons: number,
  share: BurnShare
): number {
  const row = PROBABILITY.get(degree);
  if (row === undefined) return PROJECT_FLUENCE[degree] / JOULES_PER_CAL_CM2;
  const values = share === 'low' ? row.low : share === 'half' ? row.half : row.high;
  return interpolateInLogYield(values, BURN_PROBABILITY_YIELDS_KT, yieldKilotons);
}

const PROBABILITY = new Map(
  BURN_PROBABILITY_CURVES.map(([degree, upper, low, half, high]) => [
    degree as BurnDegree,
    { upper, low, half, high },
  ])
);

/** Held flat below the first point and above the last, where the figure says
 *  nothing; log-linear between. */
function interpolateInLogYield(
  values: readonly number[],
  yields: readonly number[],
  yieldKilotons: number
): number {
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  if (!(yieldKilotons > 0)) return first;
  const w = Math.log10(yieldKilotons);
  for (let i = 1; i < yields.length; i++) {
    const lo = yields[i - 1];
    const hi = yields[i];
    const vlo = values[i - 1];
    const vhi = values[i];
    if (lo === undefined || hi === undefined || vlo === undefined || vhi === undefined) continue;
    if (w <= Math.log10(lo)) return i === 1 ? first : vlo;
    if (w <= Math.log10(hi)) {
      const t = (w - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo));
      return vlo + t * (vhi - vlo);
    }
  }
  return last;
}
