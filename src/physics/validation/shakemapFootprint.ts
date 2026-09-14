import { EARTHQUAKE_PRESETS, simulateEarthquake } from '../events/earthquake/simulate.js';
import { EARTHQUAKE_INPUT_SIGMA } from '../uq/conventions.js';
import { SHAKEMAP_FOOTPRINTS, type ShakemapFootprint } from './shakemapFixtures.js';

/**
 * The shaking footprint against the ShakeMap that recorded it.
 *
 * Lives outside the test so that the suite that pins these residuals
 * and the validation report that publishes them read one computation.
 * A report that re-derived the model's area on its own would be a
 * second answer to the same question, and the day the two disagreed
 * nobody would know which one the model actually gives.
 */

export type MmiThreshold = 7 | 8 | 9;
export const MMI_THRESHOLDS: readonly MmiThreshold[] = [7, 8, 9];

/** Model footprint (km²) at or above a threshold. */
export function modelAreaKm2(footprint: ShakemapFootprint, threshold: MmiThreshold): number {
  const preset = EARTHQUAKE_PRESETS[footprint.preset as keyof typeof EARTHQUAKE_PRESETS];
  return footprintAreaKm2(simulateEarthquake(preset.input), threshold);
}

/** The ground (km²) a simulated earthquake shakes at or above a
 *  threshold, in the shape the simulator draws it. */
export function footprintAreaKm2(
  r: ReturnType<typeof simulateEarthquake>,
  threshold: MmiThreshold
): number {
  const radiusM =
    threshold === 7
      ? (r.shaking.mmi7Radius as number)
      : threshold === 8
        ? (r.shaking.mmi8Radius as number)
        : (r.shaking.mmi9Radius as number);
  if (!(radiusM > 0)) return 0;
  const radiusKm = radiusM / 1000;
  if (!r.isExtendedSource) return Math.PI * radiusKm * radiusKm;
  // An extended source is a stadium: the rupture rectangle grown by
  // the radius on every side, which is the shape the globe draws and
  // the casualty bands count inside.
  const lKm = (r.ruptureLength as number) / 1000;
  const wKm = (r.ruptureWidth as number) / 1000;
  return lKm * wKm + 2 * radiusKm * (lKm + wKm) + Math.PI * radiusKm * radiusKm;
}

export interface FootprintRow {
  name: string;
  threshold: MmiThreshold;
  observedKm2: number;
  modelKm2: number;
  /** Model over record; `Infinity` when the model shakes ground the
   *  event never shook, 1 when neither reaches the threshold. */
  ratio: number;
}

export function compareFootprints(): FootprintRow[] {
  const rows: FootprintRow[] = [];
  for (const f of SHAKEMAP_FOOTPRINTS) {
    for (const threshold of MMI_THRESHOLDS) {
      const observedKm2 = f.areaKm2[threshold];
      const modelKm2 = modelAreaKm2(f, threshold);
      const ratio =
        observedKm2 > 0 ? modelKm2 / observedKm2 : modelKm2 > 0 ? Number.POSITIVE_INFINITY : 1;
      rows.push({ name: f.name, threshold, observedKm2, modelKm2, ratio });
    }
  }
  return rows;
}

/** How fast PGA falls with distance at the ranges these footprints
 *  span: about R^(−0.71). */
export const PGA_DISTANCE_EXPONENT = 0.71;

/**
 * The scatter in ln radius that one sigma of ground motion implies:
 * σ_lnY over the distance exponent, 0.60 / 0.71 ≈ 0.85.
 *
 * A ceiling rather than a target. A footprint is an area, and over an
 * area the within-event part of the scatter partly averages out,
 * while the between-event part moves the whole footprint at once.
 * That part alone implies {@link BETWEEN_EVENT_RADIUS_SCATTER} ≈ 0.49.
 * A model scattering between the two cannot be told apart from the
 * ground; one scattering above the ceiling can.
 */
export const EXPECTED_RADIUS_SCATTER =
  EARTHQUAKE_INPUT_SIGMA.groundMotion.sigma / PGA_DISTANCE_EXPONENT;

/** The between-event part alone: τ = 0.348 for PGA at M ≥ 5.5
 *  (Boore et al. 2014), over the same decay. */
export const BETWEEN_EVENT_RADIUS_SCATTER = 0.348 / PGA_DISTANCE_EXPONENT;

/**
 * What a median model can honestly be held to across the events: being
 * centred, and scattering no more than the ground does.
 *
 * Areas become equivalent radii first — the published scatter is a
 * property of ground motion, which lives in distance. Only bands both
 * the model and the record reach are counted.
 */
export function footprintBias(rows: readonly FootprintRow[]): {
  bands: number;
  /** exp(mean ln radius ratio): 1 is centred. */
  geometricMeanRadiusRatio: number;
  sdLn: number;
  /** |mean| in standard errors of the mean. */
  biasInStandardErrors: number;
} {
  const logs = rows
    .filter((r) => r.observedKm2 > 0 && r.modelKm2 > 0)
    .map((r) => 0.5 * Math.log(r.modelKm2 / r.observedKm2));
  const n = logs.length;
  if (n === 0) return { bands: 0, geometricMeanRadiusRatio: 1, sdLn: 0, biasInStandardErrors: 0 };
  const mean = logs.reduce((a, b) => a + b, 0) / n;
  const sdLn = Math.sqrt(logs.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const standardError = sdLn / Math.sqrt(n);
  return {
    bands: n,
    geometricMeanRadiusRatio: Math.exp(mean),
    sdLn,
    biasInStandardErrors: standardError > 0 ? Math.abs(mean) / standardError : 0,
  };
}

/** Bands the model paints at an intensity the event never reached. */
export function inventedBands(rows: readonly FootprintRow[]): string[] {
  return rows
    .filter((r) => r.observedKm2 <= 0 && r.modelKm2 > 0)
    .map((r) => `${r.name} MMI≥${r.threshold.toString()}`);
}
