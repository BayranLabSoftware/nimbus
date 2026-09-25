import { groundFireballShare } from '../../effects/atmosphericEntry.js';
import { J, m } from '../../units.js';
import { SEISMIC_EFFICIENCY, SEISMIC_EFFICIENCY_RANGE, seismicMagnitude } from './seismic.js';

/**
 * The Rayleigh waves an explosion in the air sends through the ground, as
 * Harkrider, Newton & Flinn (1974) computed them: "Theoretical effect of yield
 * and burst height of atmospheric explosions on Rayleigh wave amplitudes",
 * Geophysical Journal of the Royal Astronomical Society 36, 191–225
 * (doi:10.1111/j.1365-246X.1974.tb03632.x; Caltech's copy is free). Their
 * Table 4 gives, for an energy-injection point source at altitudes of 0.3 to
 * 80 km and yields of 1 kT to 10 MT, the peak amplitude and period of the
 * fundamental Rayleigh mode at 10 000 km over a continental and an oceanic
 * Earth, and the surface-wave magnitude
 *
 *     Ms = log(A/T) + 1.66 log Δ − 0.18      (their p. 216)
 *
 * with A the peak-to-peak amplitude in mμ and Δ the distance in degrees; the
 * table's amplitude is the peak, half the peak-to-peak. B-092: the magnitude
 * of an airburst that the Earth Impact Effects Program reads from the energy
 * the body keeps at its burst falls as the body grows; this is the field's
 * theory of how an airburst actually shakes the ground, from the yield and the
 * height of the burst.
 *
 * Read from the scan of Caltech's copy on 21 September 2026, all 99 rows and
 * both models. Every printed Ms was checked against the two other columns it
 * follows from — Ms recomputed from the amplitude and period by the formula
 * above, and from the "% coupling" by Pomeroy (1963)'s energy, log E_s =
 * 9.4 + 2.14 Ms − 0.054 Ms² (ergs), as the paper defines it
 * (`airburstSeismic.test.ts`). Where two of the three agree against the
 * third, the third is the misprint. Three cells of the Ms columns are not
 * the printed number:
 *
 * - continental, 1.8288 km, 10 000 kT: printed 4.70; the amplitude (600.70 mμ
 *   at 22.7 s) gives 4.79 and the coupling (0.000691 %) 4.82. Read as 4.79.
 * - continental, 10 km, 100 kT: printed 3.68; the amplitude (32.29 mμ at
 *   24.9 s) gives 3.48 and the coupling (0.000388 %) 3.49. Read as 3.48.
 * - oceanic, 0.3048 km, 3 kT: blank in print; the amplitude (0.74 mμ at
 *   18.7 s) gives 1.96 and the coupling (0.000021 %) 1.98. Read as 1.96.
 *
 * The other disagreements are in the amplitude column (four cells) or the
 * coupling column (thirteen), each outvoted by the printed Ms and the other.
 *
 * What the table keeps, and this relation with it: at 3.6576 and 4.8768 km
 * over a continent, 3 MT reads a lower Ms than 1 MT (4.19 against 4.30, 4.23
 * against 4.34), because the peak moves to a period more than twice as long
 * (46.5 and 44.9 s against 17.7 and 22.7 s) and Ms divides by it: the
 * amplitude itself doubles.
 */

/** The table's altitudes (km), as printed: 1 000 to 16 000 ft, then km. */
export const HARKRIDER_ALTITUDES_KM: readonly number[] = [
  0.3048, 1, 1.8288, 3.6576, 4.8768, 10, 18.6, 30.7, 51.2, 66, 80,
];

/** The table's yields (kT). */
export const HARKRIDER_YIELDS_KT: readonly number[] = [1, 3, 10, 30, 100, 300, 1000, 3000, 10000];

export type HarkriderEarth = 'continental' | 'oceanic';

/** Ms, row by altitude and column by yield, with the three readings above. */
export const HARKRIDER_MS: Readonly<Record<HarkriderEarth, readonly (readonly number[])[]>> = {
  continental: [
    [1.82, 2.21, 2.77, 3.18, 3.51, 3.86, 3.89, 4.19, 4.48],
    [2.05, 2.58, 3.04, 3.42, 3.9, 4.13, 4.49, 4.69, 4.87],
    [2.31, 2.58, 3.09, 3.44, 3.84, 4.13, 4.42, 4.65, 4.79],
    [2.11, 2.52, 3.04, 3.44, 3.75, 4.1, 4.3, 4.19, 4.46],
    [2.05, 2.55, 3.0, 3.37, 3.79, 3.99, 4.34, 4.23, 4.51],
    [1.94, 2.38, 2.78, 3.11, 3.48, 3.53, 3.86, 4.14, 4.35],
    [2.54, 2.94, 3.32, 3.57, 3.82, 4.05, 4.27, 4.44, 4.62],
    [2.83, 3.15, 3.38, 3.56, 3.78, 3.98, 4.17, 4.34, 4.51],
    [2.72, 2.94, 3.18, 3.38, 3.58, 3.74, 3.92, 4.08, 4.26],
    [2.75, 2.93, 3.11, 3.27, 3.45, 3.61, 3.79, 3.95, 4.12],
    [2.55, 2.72, 2.9, 3.06, 3.24, 3.4, 3.57, 3.73, 3.91],
  ],
  oceanic: [
    [1.47, 1.96, 2.5, 2.97, 3.41, 3.73, 4.05, 4.4, 4.67],
    [1.72, 2.26, 2.74, 3.08, 3.62, 3.88, 4.28, 4.5, 4.72],
    [1.7, 2.21, 2.74, 3.18, 3.5, 3.86, 4.25, 4.35, 4.62],
    [1.64, 2.07, 2.58, 3.06, 3.49, 3.9, 4.28, 4.56, 4.84],
    [1.74, 2.26, 2.7, 3.14, 3.36, 3.75, 4.18, 4.46, 4.56],
    [1.92, 2.39, 2.78, 3.17, 3.59, 3.63, 3.91, 4.21, 4.45],
    [2.03, 2.45, 2.89, 3.1, 3.37, 3.6, 3.88, 4.04, 4.22],
    [2.15, 2.49, 2.93, 3.27, 3.53, 3.72, 3.95, 4.15, 4.36],
    [2.76, 3.05, 3.32, 3.47, 3.7, 3.86, 4.02, 4.2, 4.39],
    [2.67, 2.85, 3.06, 3.22, 3.39, 3.55, 3.71, 3.87, 4.04],
    [2.33, 2.5, 2.67, 2.83, 3.0, 3.15, 3.33, 3.48, 3.66],
  ],
};

/** Where `x` falls among ascending `xs`: the lower node and the fraction to
 *  the next; null outside. */
function bracket(xs: readonly number[], x: number): { i: number; f: number } | null {
  const first = xs[0] ?? Number.NaN;
  const last = xs[xs.length - 1] ?? Number.NaN;
  if (!(x >= first && x <= last)) return null;
  let i = 0;
  while (i < xs.length - 2 && x > (xs[i + 1] ?? Number.POSITIVE_INFINITY)) i++;
  const lo = xs[i] ?? Number.NaN;
  const hi = xs[i + 1] ?? Number.NaN;
  return { i, f: (x - lo) / (hi - lo) };
}

const LOG_YIELDS = HARKRIDER_YIELDS_KT.map(Math.log10);

/**
 * Table 4's Ms for an explosion of `yieldKt` at `altitudeKm` over the given
 * Earth, interpolated linearly in altitude and in the logarithm of the yield
 * between the nodes, which it returns exactly. Null outside the table — below
 * 1 kT or above 10 MT, below 0.3048 or above 80 km — where the paper computed
 * nothing.
 */
export function harkriderMs(
  yieldKt: number,
  altitudeKm: number,
  earth: HarkriderEarth = 'continental'
): number | null {
  const byAltitude = bracket(HARKRIDER_ALTITUDES_KM, altitudeKm);
  const byYield = yieldKt > 0 ? bracket(LOG_YIELDS, Math.log10(yieldKt)) : null;
  if (byAltitude === null || byYield === null) return null;
  const table = HARKRIDER_MS[earth];
  const at = (row: number): number => {
    const r = table[row] ?? [];
    const lo = r[byYield.i] ?? Number.NaN;
    const hi = r[byYield.i + 1] ?? Number.NaN;
    return lo + byYield.f * (hi - lo);
  };
  return at(byAltitude.i) + byAltitude.f * (at(byAltitude.i + 1) - at(byAltitude.i));
}

/**
 * What a complete airburst's seismic magnitude is read from (rules 730 to 738
 * of validation/airburstSeismicRules.ts).
 *
 * - `program`: the kinetic energy the body keeps at its burst, read as an
 *   impact's on the ground (`impactSeismicEnergy`), as the Earth Impact
 *   Effects Program reads it.
 * - `harkrider`: the larger of the air's term — Table 4 above, for the blast
 *   yield at the burst altitude — and the ground's: the program's relation on
 *   the share of the kept energy that reaches the ground below the burst's own
 *   fireball (B-093's share). None where neither covers the burst.
 */
export type AirburstSeismic = 'program' | 'harkrider';

/** What an impact that names no airburst seismic law uses: `harkrider` since
 *  rules 730 to 738. */
export const DEFAULT_AIRBURST_SEISMIC: AirburstSeismic = 'harkrider';

export interface AirburstMagnitudeInput {
  /** The blast yield the airburst's blast rings are drawn from (kT). */
  blastYieldKt: number;
  /** Its burst altitude (m). */
  burstAltitude: number;
  /** The kinetic energy the body keeps at its burst (J). */
  keptEnergy: number;
  /** Whether the burst is over the ocean, where the oceanic model applies. */
  overWater: boolean;
}

export interface AirburstMagnitude {
  magnitude: number;
  /** The range: the ground's term across Collins et al.'s efficiencies, the
   *  air's held. */
  low: number;
  high: number;
  /** Which term decides the magnitude. */
  term: 'air' | 'ground';
}

/** Rule 730: a complete airburst's magnitude under `harkrider`, or null where
 *  neither term covers the burst. */
export function airburstMagnitude(input: AirburstMagnitudeInput): AirburstMagnitude | null {
  const air = harkriderMs(
    input.blastYieldKt,
    input.burstAltitude / 1_000,
    input.overWater ? 'oceanic' : 'continental'
  );
  const onGround =
    groundFireballShare(m(input.burstAltitude), J(input.keptEnergy)) * input.keptEnergy;
  const groundAt = (efficiency: number): number | null =>
    onGround > 0 ? seismicMagnitude(J(onGround), efficiency) : null;
  const ground = groundAt(SEISMIC_EFFICIENCY);
  if (air === null && ground === null) return null;
  const larger = (g: number | null): number =>
    Math.max(air ?? Number.NEGATIVE_INFINITY, g ?? Number.NEGATIVE_INFINITY);
  return {
    magnitude: larger(ground),
    low: larger(groundAt(SEISMIC_EFFICIENCY_RANGE.low)),
    high: larger(groundAt(SEISMIC_EFFICIENCY_RANGE.high)),
    term:
      (air ?? Number.NEGATIVE_INFINITY) >= (ground ?? Number.NEGATIVE_INFINITY) ? 'air' : 'ground',
  };
}
