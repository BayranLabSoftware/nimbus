import { dispersionDecay, dispersionParameter } from './dispersion.js';
import { spreadingFactor } from './spreading.js';
import { bearingFromRupture } from './ruptureGeometry.js';
import { directivityFactor } from './directivity.js';
import { STANDARD_GRAVITY } from '../constants.js';
import type { ElevationGrid } from '../elevation/index.js';
import type { FastMarchingResult } from './fastMarching.js';

/**
 * Tsunami amplitude field on the bathymetric grid.
 *
 * Layered on top of the FMM arrival-time solver, this module turns the
 * scalar T(x, y) field into a scalar A(x, y) field — the long-wave
 * amplitude at every reachable cell. The propagation combines two
 * established approximations:
 *
 *   1. **Green's law** (Lamb 1932 §187, Synolakis & Bernard 2006).
 *      As a long wave moves from depth h₀ at the source to depth h(x)
 *      somewhere downstream, energy conservation along a stream tube
 *      with constant width gives
 *
 *          A(x) / A₀ = (h₀ / h(x))^(1/4)
 *
 *      i.e. amplitude grows as the wave shoals onto shallower water.
 *      This is the dominant driver of run-up enhancement near the
 *      coast, where local depth drops by orders of magnitude.
 *
 *   2. **Radial spreading.** A point source on a flat basin emits
 *      cylindrically; energy scales as 1/r so amplitude scales as
 *      1/√r — the default `spreadingExponent` of 0.5, right for the
 *      long non-dispersive waves of seismic, volcanic and landslide
 *      sources. Impact sources pass the Wünnemann, Collins & Weiss
 *      (2010) rim-wave exponent q_r instead (0.5 on a shallow shelf,
 *      up to 1.2 in the deep ocean — `events/tsunami/wunnemann.ts`),
 *      which folds the faster dispersive decay of short impact waves
 *      into the same radial law. We approximate the ray-path
 *      distance r by `c_avg · T(x)` where c_avg is the geometric mean
 *      of the source and local celerities — exact only for
 *      straight-ray propagation but a first-order improvement on the
 *      no-spread limit.
 *
 * The combined update at every reachable cell is therefore
 *
 *     A(x) = A₀ · (h₀ / h(x))^(1/4) · (R₀ / R(x))^q
 *
 * with R₀ the source cavity radius (the wave is "saturated" inside,
 * so we clamp R(x) ≥ R₀ to avoid divide-by-near-zero blow-ups) and
 * q the spreading exponent. Land cells (h ≤ minDepth) inherit
 * Infinity from the FMM result and are masked out by the renderer.
 *
 * What this model deliberately does NOT do:
 *   - Refraction / focusing along bathymetric ridges. Real ray paths
 *     bend toward shallower water; concentrated focusing can locally
 *     amplify the wave by 5–10×. The FMM gives us only T, not the
 *     gradient of T along characteristics, so we cannot do
 *     proper transport-equation amplitude propagation here.
 *   - Dispersion, beyond what the exponent captures. Long waves are
 *     non-dispersive in the shallow-water limit; intermediate-
 *     frequency components (impact tsunamis with wavelengths ~ basin
 *     depth) disperse measurably over 10 000 km. The Wünnemann
 *     exponent absorbs this for impacts in the constant-depth sense;
 *     the 1/√r default still overstates the far field for any other
 *     short-wavelength source.
 *   - Non-linear wave breaking. The 1/r-shoaling product diverges as
 *     h → 0; we clamp to a 50 m floor.
 *
 * Together these limit the model to a "reasonable popular-science
 * envelope" — within ±factor-2 of full transport-equation solvers
 * over distances ≤ 5 000 km, dominated by the source-amplitude
 * scatter (factor 5–10 for landslide and impact tsunamis).
 *
 * References:
 *   Lamb, H. (1932). "Hydrodynamics" (6th ed.), §187. Cambridge.
 *   Synolakis, C. E. & Bernard, E. N. (2006). "Tsunami science before
 *     and beyond Boxing Day 2004." Phil. Trans. R. Soc. A 364: 2231–2265.
 *   Tinti, S. & Bortolucci, E. (2000). "Energy of water waves
 *     induced by submarine landslides." Pure Appl. Geophys. 157: 281–318.
 */

/** Floor depth (m) used to clamp the Green's-law denominator near
 *  the shore. The shallow-water approximation ceases to hold below
 *  ~50 m anyway; pushing past it would let A diverge unphysically. */
const MIN_PROPAGATION_DEPTH = 50;

/** Hard cap on the Green's-law shoaling factor. Linear shallow-water
 *  theory predicts arbitrary amplification as h → 0, but in practice
 *  the wave breaks once H/h ≥ 0.78 (McCowan 1894 solitary-wave breaking
 *  criterion). A 4× cap keeps the heatmap honest in the worst case
 *  while leaving the per-cell value still proportional to (h₀/h)^(1/4)
 *  in the regime where the formula holds. */
const SHOALING_CAP = 4;

export interface AmplitudeFieldInput {
  /** Pre-computed FMM arrival-time field. */
  arrivalField: FastMarchingResult;
  /** Same grid passed to the FMM — supplies bathymetric depth. */
  grid: ElevationGrid;
  /** Source amplitude at the cavity rim (m). */
  sourceAmplitudeM: number;
  /** Source cavity radius (m). Used both as the R₀ in the geometric
   *  spreading factor AND as the "inside the source" boundary where
   *  amplitude saturates at the source value. */
  sourceCavityRadiusM: number;
  /** Mean depth at the source (m). Defaults to 1 000 m if not given;
   *  passed in by the orchestrator from the actual scenario. */
  sourceDepthM?: number;
  /** Wavelength of the source disturbance (m). Defaults to twice the
   *  cavity radius, the relation the explosion and impact sources
   *  already use. It decides how fast the wave disperses, which is
   *  the whole difference between a megathrust and a collapse. */
  sourceWavelengthM?: number;
  /** Strike of an elongated source (° from north) and its length
   *  along strike (m). Given together they beam the wave across the
   *  fault instead of radiating it in a circle; omitted, the source
   *  is unoriented and radiates evenly, which is the right answer for
   *  a crater or a collapse. */
  strikeDeg?: number;
  ruptureLengthM?: number;
  /** Where the source is, needed only to take bearings for the beam. */
  sourceLatitude?: number;
  sourceLongitude?: number;
  /** Surface gravity. Defaults to Earth standard. */
  surfaceGravity?: number;
  /** Minimum ocean depth (m) to treat as water — propagated from the
   *  same FMM input so the masks line up. */
  minDepthMeters?: number;
  /** Radial spreading exponent q in A ∝ (R₀ / r)^q. Defaults to 0.5
   *  (cylindrical energy conservation). Impact sources pass the
   *  Wünnemann 2010 rim-wave exponent. Values outside (0, 3] are
   *  clamped. */
  spreadingExponent?: number;
}

export interface AmplitudeField {
  /** Amplitude at each grid cell (m), row-major north-to-south.
   *  Land or unreachable cells get NaN, the heatmap renderer maps
   *  those to fully-transparent pixels. */
  amplitudes: Float32Array;
  nLat: number;
  nLon: number;
  /** Maximum amplitude observed anywhere on the field — handy for
   *  the renderer's colour-scale normalisation. */
  maxAmplitude: number;
}

// The spreading law lives in `spreading.ts`, beside dispersion and
// directivity, so the veil and every published row read the same one.
// Re-exported here because this is where callers found it.
export { spreadingFactor, SPREAD_NORMALISATION } from './spreading.js';

export function computeAmplitudeField(input: AmplitudeFieldInput): AmplitudeField {
  const { arrivalField, grid, sourceAmplitudeM, sourceCavityRadiusM } = input;
  const sourceDepth = Math.max(input.sourceDepthM ?? 1_000, MIN_PROPAGATION_DEPTH);
  const g = input.surfaceGravity ?? STANDARD_GRAVITY;
  const minDepth = input.minDepthMeters ?? 10;
  const strikeDeg = input.strikeDeg;
  const ruptureLengthM =
    input.ruptureLengthM !== undefined && Number.isFinite(input.ruptureLengthM)
      ? Math.max(0, input.ruptureLengthM)
      : 0;
  const srcLat = input.sourceLatitude ?? 0;
  const srcLon = input.sourceLongitude ?? 0;
  const dLatDeg = (input.grid.maxLat - input.grid.minLat) / Math.max(input.grid.nLat - 1, 1);
  const dLonDeg = (input.grid.maxLon - input.grid.minLon) / Math.max(input.grid.nLon - 1, 1);
  const sourceWavelengthM =
    input.sourceWavelengthM !== undefined && Number.isFinite(input.sourceWavelengthM)
      ? Math.max(1, input.sourceWavelengthM)
      : Math.max(1, 2 * input.sourceCavityRadiusM);
  // A caller that supplies its own exponent brought its own published
  // far field with it — the Wünnemann rim wave — and that fit already
  // carries its own normalisation. Only the default cylindrical case
  // is normalised here.
  const normaliseSpread = input.spreadingExponent === undefined;
  const q = Number.isFinite(input.spreadingExponent)
    ? Math.min(3, Math.max(0.05, input.spreadingExponent ?? 0.5))
    : 0.5;
  const nCells = arrivalField.nLat * arrivalField.nLon;
  const amplitudes = new Float32Array(nCells);
  amplitudes.fill(NaN);

  const c0 = Math.sqrt(g * sourceDepth);
  let maxAmplitude = sourceAmplitudeM;

  for (let i = 0; i < nCells; i++) {
    const T = arrivalField.arrivalTimes[i];
    if (T === undefined || !Number.isFinite(T)) continue;
    const elevation = grid.samples[i] ?? 0;
    if (elevation >= -minDepth) continue; // land or too shallow
    const h = Math.max(-elevation, MIN_PROPAGATION_DEPTH);
    const cLocal = Math.sqrt(g * h);

    // Green's law shoaling: amplitude grows as (h₀/h)^(1/4).
    // Cap at SHOALING_CAP to honour the McCowan 1894 wave-breaking
    // limit — beyond ~4× the linear shallow-water envelope is not
    // physical, the wave breaks and dissipates instead.
    const shoaling = Math.min((sourceDepth / h) ** 0.25, SHOALING_CAP);

    // Geometric spreading via the FMM travel time. Use the geometric
    // mean of c₀ and c_local as the path-averaged celerity — a
    // monotone interpolant that recovers c₀ at the source and c_local
    // far away (limit cases of a constant-depth ocean).
    const cAvg = Math.sqrt(c0 * cLocal);
    const r = Math.max(cAvg * T, sourceCavityRadiusM);
    const spread = spreadingFactor(sourceCavityRadiusM, r, q, normaliseSpread);

    // Frequency dispersion. The veil used to carry none, because the
    // one factor available was tuned on megathrust wavelengths and
    // would have been wrong for every other source. The parameter
    // knows the wavelength, so a rupture seven hundred kilometres
    // long crosses an ocean untouched while the kilometre-long wave
    // of a flank collapse or a depth charge spreads into its train
    // within a few hundred kilometres — which is the difference
    // between the Sunda Strait reading metres and reading nothing.
    const dispersion = dispersionDecay(
      dispersionParameter({ rangeM: r, depthM: h, wavelengthM: sourceWavelengthM })
    );

    // Directivity. An unoriented source leaves this at one, so a
    // crater or a collapse is unaffected and needs no special case.
    let beam = 1;
    if (strikeDeg !== undefined && ruptureLengthM > 0) {
      const row = Math.floor(i / arrivalField.nLon);
      const col = i % arrivalField.nLon;
      const cellLat = grid.maxLat - row * dLatDeg;
      const cellLon = grid.minLon + col * dLonDeg;
      // From the nearest point of the fault, not from its centre: a
      // cell abreast of a long rupture is square across the strike
      // and takes the full beam, where measured from the epicentre it
      // would look as if it lay off the end.
      beam = directivityFactor({
        bearingDeg: bearingFromRupture(
          { latitude: srcLat, longitude: srcLon, strikeDeg, lengthM: ruptureLengthM },
          cellLat,
          cellLon
        ),
        strikeDeg,
        ruptureLengthM,
        wavelengthM: sourceWavelengthM,
      });
    }

    const A = sourceAmplitudeM * shoaling * spread * dispersion * beam;
    amplitudes[i] = A;
    if (A > maxAmplitude) maxAmplitude = A;
  }

  return {
    amplitudes,
    nLat: arrivalField.nLat,
    nLon: arrivalField.nLon,
    maxAmplitude,
  };
}
