import { DOSE_CURVE_RADS, DOSE_CURVES, YARD_M } from './initialRadiationData.js';

/**
 * The initial nuclear radiation — the gamma rays and neutrons of the first
 * minute — as Glasstone & Dolan give it, or as the project fitted it (rule 86
 * of validation/doseRules.ts).
 *
 * The book draws the dose against slant range and yield in four figures:
 * 8.33a and b for gamma rays and 8.64a and b for neutrons, the "a" of each for
 * fission weapons from 1 to 100 kt and the "b" for thermonuclear weapons of
 * 50 % fission yield from 0.1 to 20 Mt, six curves apiece at 30, 100, 300,
 * 1 000, 3 000 and 10 000 rads in tissue near the body surface.
 * `initialRadiationData.ts` carries all twenty-four as traced from the public
 * scan.
 *
 * Three things about the figures shape what is done with them here. They are
 * drawn for a burst at 290·W^0.4 feet and hold "provided the height of burst
 * exceeds about 300 feet" (§8.37); below that the dose is corrected towards a
 * contact surface burst, by Table 8.37 for gamma rays and by one half for
 * neutrons (§8.65). They give a slant range, so the ring drawn on the ground
 * is √(slant² − height²). And they carry the book's own reliability: a factor
 * of 0.5 to 2 for fission weapons, 0.25 to 1.5 for thermonuclear ones.
 */

export type RadiationSource = 'project' | 'glasstone1977';

/** What a scenario that names no source draws; rules 87 and 88 of
 *  validation/doseRules.ts say what it is. */
export const DEFAULT_RADIATION_SOURCE: RadiationSource = 'project';

/** Which of the book's two weapons a yield is read as. The book draws its
 *  fission figures to 100 kt and its thermonuclear ones from 100 kt, and that
 *  is the split used here. */
export type RadiationWeapon = 'fission' | 'thermonuclear';
export const THERMONUCLEAR_FROM_KT = 100;

export function radiationWeaponFor(yieldKilotons: number): RadiationWeapon {
  return yieldKilotons >= THERMONUCLEAR_FROM_KT ? 'thermonuclear' : 'fission';
}

const FOOT_M = 0.3048;

/** The height the figures are drawn for (m), §8.37: 290·W^0.4 feet. */
export function figureHeightOfBurstM(yieldKilotons: number): number {
  return 290 * Math.pow(Math.max(yieldKilotons, 0), 0.4) * FOOT_M;
}

/** Below this height the book corrects towards a contact surface burst
 *  (§8.37, §8.65): 300 feet. */
export const SURFACE_CORRECTION_BELOW_M = 300 * FOOT_M;

/** Table 8.37, the gamma-ray dose of a contact surface burst as a share of the
 *  figure's: [yield (kt), factor]. The book gives ⅔ from 1 to 50 kt and 1 at
 *  100 kt for Fig. 8.33a, and 1, 1¼, 1½, 2 and 3 at 100, 300 and 700 kt and
 *  2 and 5 to 20 Mt for Fig. 8.33b. */
const TABLE_8_37: readonly (readonly [number, number])[] = [
  [1, 2 / 3],
  [50, 2 / 3],
  [100, 1],
  [300, 1.25],
  [700, 1.5],
  [2_000, 2],
  [5_000, 3],
  [20_000, 3],
];

/** §8.65: "for contact surface bursts, the prompt neutron dose may be taken as
 *  one-half the value for a corresponding air burst". */
const NEUTRON_SURFACE_FACTOR = 0.5;

function interpolateInLogYield(
  table: readonly (readonly [number, number])[],
  yieldKilotons: number
): number {
  const first = table[0];
  const last = table[table.length - 1];
  if (first === undefined || last === undefined) return 1;
  if (yieldKilotons <= first[0]) return first[1];
  if (yieldKilotons >= last[0]) return last[1];
  const w = Math.log10(yieldKilotons);
  for (let i = 1; i < table.length; i++) {
    const lo = table[i - 1];
    const hi = table[i];
    if (lo === undefined || hi === undefined) continue;
    if (w <= Math.log10(hi[0])) {
      const t = (w - Math.log10(lo[0])) / (Math.log10(hi[0]) - Math.log10(lo[0]));
      return lo[1] + t * (hi[1] - lo[1]);
    }
  }
  return last[1];
}

/**
 * The share of the figure's dose that a burst at `heightM` receives, by the
 * book's own rule: one above 300 feet, the contact-surface factor at the
 * ground, and a straight interpolation between (§8.37, §8.65).
 */
export function heightFactor(
  kind: 'gamma' | 'neutron',
  yieldKilotons: number,
  heightM: number
): number {
  const surface =
    kind === 'gamma' ? interpolateInLogYield(TABLE_8_37, yieldKilotons) : NEUTRON_SURFACE_FACTOR;
  if (!(heightM < SURFACE_CORRECTION_BELOW_M)) return 1;
  const t = Math.max(0, heightM) / SURFACE_CORRECTION_BELOW_M;
  return surface + t * (1 - surface);
}

const CURVE = new Map(
  DOSE_CURVES.map(([kind, weapon, figure, yields, ranges]) => [
    `${kind}:${weapon}`,
    { figure, yields, ranges },
  ])
);

/** The slant range (yards) at which one figure puts `doseRad`, at this yield.
 *  Interpolated in the logarithm of the yield, held flat past the figure's
 *  ends where it says nothing. */
function rangeOfCurve(
  kind: 'gamma' | 'neutron',
  weapon: RadiationWeapon,
  index: number,
  yieldKilotons: number
): number {
  const curve = CURVE.get(`${kind}:${weapon}`);
  const row = curve?.ranges[index];
  const yields = curve?.yields;
  if (curve === undefined || row === undefined || yields === undefined) return 0;
  const first = row[0];
  const last = row[row.length - 1];
  if (first === undefined || last === undefined) return 0;
  if (!(yieldKilotons > 0)) return first;
  const w = Math.log10(yieldKilotons);
  for (let i = 1; i < yields.length; i++) {
    const lo = yields[i - 1];
    const hi = yields[i];
    const vlo = row[i - 1];
    const vhi = row[i];
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
 * The dose (rads) one radiation delivers at a slant range, from the figure for
 * this yield's weapon. Between two curves the dose is interpolated in its own
 * logarithm against the range, which is how the book's own worked example
 * reads them (§8.34); beyond the outermost curve it falls on with the same
 * slope, and inside the innermost it rises on with that one, so the answer is
 * always a number and the caller can see it left the figure.
 */
export function doseAtSlantRangeRad(
  kind: 'gamma' | 'neutron',
  yieldKilotons: number,
  slantRangeM: number,
  heightM?: number
): number {
  const weapon = radiationWeaponFor(yieldKilotons);
  const yards = slantRangeM / YARD_M;
  const n = DOSE_CURVE_RADS.length;
  const range = (i: number): number => rangeOfCurve(kind, weapon, i, yieldKilotons);
  const dose = (i: number): number => DOSE_CURVE_RADS[i] ?? 0;
  const between = (i: number, j: number): number => {
    const ri = range(i);
    const rj = range(j);
    if (ri === rj) return dose(i);
    const t = (yards - rj) / (ri - rj);
    const li = Math.log10(dose(i));
    const lj = Math.log10(dose(j));
    return 10 ** (lj + t * (li - lj));
  };
  let raw: number;
  if (yards >= range(0)) raw = between(0, 1);
  else if (yards <= range(n - 1)) raw = between(n - 2, n - 1);
  else {
    raw = dose(n - 1);
    for (let i = 1; i < n; i++) {
      if (yards >= range(i)) {
        raw = between(i - 1, i);
        break;
      }
    }
  }
  const factor = heightM === undefined ? 1 : heightFactor(kind, yieldKilotons, heightM);
  return Math.max(0, raw * factor);
}

/** Gamma rays and neutrons together, in rads. The book warns that the same
 *  number of rads of neutrons is often worth more biologically than of gamma
 *  rays (§8.65, §12.97); no such weight is applied here. */
export function initialRadiationDoseRad(
  yieldKilotons: number,
  slantRangeM: number,
  heightM?: number
): number {
  return (
    doseAtSlantRangeRad('gamma', yieldKilotons, slantRangeM, heightM) +
    doseAtSlantRangeRad('neutron', yieldKilotons, slantRangeM, heightM)
  );
}

/**
 * The slant range (m) at which the initial radiation reaches `doseRad`, found
 * by bisection: both components fall with range, so their sum does too and the
 * answer is unique.
 */
export function slantRangeForDoseM(
  doseRad: number,
  yieldKilotons: number,
  heightM?: number
): number {
  if (!(doseRad > 0) || !(yieldKilotons > 0)) return 0;
  const at = (r: number): number => initialRadiationDoseRad(yieldKilotons, r, heightM);
  let lo = 1;
  let hi = 200 * YARD_M;
  while (at(hi) > doseRad && hi < 2e5) hi *= 1.5;
  if (at(hi) > doseRad) return hi;
  if (at(lo) < doseRad) return 0;
  for (let i = 0; i < 80; i++) {
    const mid = 0.5 * (lo + hi);
    if (at(mid) > doseRad) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

/**
 * The ground range (m) at which the initial radiation reaches `doseRad` for a
 * burst of `yieldKilotons` at `heightM`. The figures give a slant range, so
 * the ring on the ground is √(slant² − height²); where the slant range does
 * not reach the ground, the ring is nothing.
 */
export function groundRangeForDoseM(doseRad: number, yieldKilotons: number, heightM = 0): number {
  const slant = slantRangeForDoseM(doseRad, yieldKilotons, heightM);
  const h = Math.max(0, heightM);
  return slant > h ? Math.sqrt(slant * slant - h * h) : 0;
}
