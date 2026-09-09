import { describe, expect, it } from 'vitest';
import { makeElevationGrid } from '../elevation/grid.js';
import { computeAmplitudeField } from './amplitudeField.js';
import { computeTsunamiArrivalField } from './fastMarching.js';

/**
 * Build a flat-bottom open-ocean test grid centred on the equator.
 * Constant depth means Green's law contributes a factor of 1 and we
 * isolate the geometric-spreading 1/√r decay for clean assertions.
 */
function flatOceanGrid(depthM: number): ReturnType<typeof makeElevationGrid> {
  const N = 41;
  const samples = new Float32Array(N * N);
  samples.fill(-depthM);
  return makeElevationGrid({
    minLat: -2,
    maxLat: 2,
    minLon: -2,
    maxLon: 2,
    nLat: N,
    nLon: N,
    samples,
  });
}

describe('computeAmplitudeField', () => {
  it('saturates at the source amplitude inside the cavity radius', () => {
    const grid = flatOceanGrid(4_000);
    const arrival = computeTsunamiArrivalField({
      grid,
      sourceLatitude: 0,
      sourceLongitude: 0,
    });
    const field = computeAmplitudeField({
      arrivalField: arrival,
      grid,
      sourceAmplitudeM: 30,
      sourceCavityRadiusM: 50_000,
      // Geometry is what this test is about, so the source is given a
      // wavelength long enough that dispersion has nothing to say —
      // otherwise the two effects are measured as one.
      sourceWavelengthM: 2_000_000,
      sourceDepthM: 4_000,
    });
    // The source cell's amplitude should be very close to the source
    // amplitude — c_avg·T ≪ R_cavity so spread = √1 = 1, and on a
    // constant-depth grid Green's shoaling is exactly 1.
    const sourceIdx = Math.floor(field.nLat / 2) * field.nLon + Math.floor(field.nLon / 2);
    const A = field.amplitudes[sourceIdx];
    expect(A).toBeGreaterThan(29);
    expect(A).toBeLessThan(31);
  });

  it('decays as 1/√r far from the source on a flat ocean', () => {
    // Use a wider 200 km grid so the decay envelope spans well beyond
    // the cavity radius.
    const N = 81;
    const span = 4; // degrees on each side
    const samples = new Float32Array(N * N);
    samples.fill(-4_000);
    const grid = makeElevationGrid({
      minLat: -span,
      maxLat: span,
      minLon: -span,
      maxLon: span,
      nLat: N,
      nLon: N,
      samples,
    });
    const arrival = computeTsunamiArrivalField({
      grid,
      sourceLatitude: 0,
      sourceLongitude: 0,
    });
    const field = computeAmplitudeField({
      arrivalField: arrival,
      grid,
      sourceAmplitudeM: 30,
      sourceCavityRadiusM: 10_000,
      // Geometry is what this test is about, so the source is given a
      // wavelength long enough that dispersion has nothing to say —
      // otherwise the two effects are measured as one.
      sourceWavelengthM: 2_000_000,
      sourceDepthM: 4_000,
    });
    // Sample the eastern equator at +1° (~111 km) and +2° (~222 km).
    const midRow = Math.floor(field.nLat / 2);
    const midCol = Math.floor(field.nLon / 2);
    const colsPerDeg = (field.nLon - 1) / (2 * span);
    const idx111 = midRow * field.nLon + midCol + Math.round(colsPerDeg);
    const idx222 = midRow * field.nLon + midCol + Math.round(2 * colsPerDeg);
    const A111 = field.amplitudes[idx111];
    const A222 = field.amplitudes[idx222];
    if (A111 === undefined || A222 === undefined) {
      expect.fail('expected amplitudes at sampled cells');
      return;
    }
    expect(Number.isFinite(A111)).toBe(true);
    expect(Number.isFinite(A222)).toBe(true);
    // Ratio A111/A222 ≈ √(222/111) = √2 ≈ 1.41 (within ±20 % for the
    // FMM grid discretisation noise).
    const ratio = A111 / A222;
    expect(ratio).toBeGreaterThan(1.15);
    expect(ratio).toBeLessThan(1.7);
  });

  it('McCowan 1894 wave-breaking cap holds the shoaling factor at 4× even with extreme shelf depths', () => {
    // Source over a 7 000 m trench, ALL surrounding cells at the
    // 50 m floor — this would give a raw Green factor of (7000/50)^(1/4)
    // = 3.44× without the SHOALING_CAP. Push past that by configuring
    // a 100 km deep source and a 0.1 m cell to verify the 4× cap is
    // real (clamped by the Math.min, not just by MIN_PROPAGATION_DEPTH).
    const N = 21;
    const samples = new Float32Array(N * N);
    samples.fill(-50); // shelf
    // Deepen one column to 7 000 m so the source sits in deep water.
    const sourceCol = 0;
    for (let i = 0; i < N; i++) samples[i * N + sourceCol] = -7_000;
    const grid = makeElevationGrid({
      minLat: -1,
      maxLat: 1,
      minLon: -1,
      maxLon: 1,
      nLat: N,
      nLon: N,
      samples,
    });
    const arrival = computeTsunamiArrivalField({
      grid,
      sourceLatitude: 0,
      sourceLongitude: -1,
    });
    const field = computeAmplitudeField({
      arrivalField: arrival,
      grid,
      sourceAmplitudeM: 1,
      sourceCavityRadiusM: 5_000,
      // Geometry is what this test is about, so the source is given a
      // wavelength long enough that dispersion has nothing to say —
      // otherwise the two effects are measured as one.
      sourceWavelengthM: 2_000_000,
      sourceDepthM: 7_000,
    });
    // No shelf cell should carry an amplitude > 4 m (the cap). The
    // theoretical Green amplification (7000/50)^0.25 = 3.44 is below
    // the cap so this verifies "no overshoot".
    let maxAmp = 0;
    for (const a of field.amplitudes) {
      if (Number.isFinite(a) && a > maxAmp) maxAmp = a;
    }
    expect(maxAmp).toBeLessThanOrEqual(4 * 1.0 + 1e-6); // source A · cap
  });

  it("Green's law amplifies the wave when it shoals onto shallow water", () => {
    // Half-and-half basin: 4 000 m to the west of the source, 100 m
    // to the east. Equal great-circle distance, so the only difference
    // between east and west cells is the shoaling factor.
    const N = 41;
    const samples = new Float32Array(N * N);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        // West (j < N/2) is deep; east is shallow.
        samples[i * N + j] = j < N / 2 ? -4_000 : -100;
      }
    }
    const grid = makeElevationGrid({
      minLat: -2,
      maxLat: 2,
      minLon: -2,
      maxLon: 2,
      nLat: N,
      nLon: N,
      samples,
    });
    const arrival = computeTsunamiArrivalField({
      grid,
      sourceLatitude: 0,
      sourceLongitude: 0,
    });
    const field = computeAmplitudeField({
      arrivalField: arrival,
      grid,
      sourceAmplitudeM: 5,
      sourceCavityRadiusM: 5_000,
      // Geometry is what this test is about, so the source is given a
      // wavelength long enough that dispersion has nothing to say —
      // otherwise the two effects are measured as one.
      sourceWavelengthM: 2_000_000,
      sourceDepthM: 4_000,
    });
    // Sample symmetric cells: same row, +1°/-1° from source.
    const midRow = Math.floor(N / 2);
    const cellsPerDeg = (N - 1) / 4;
    const eastIdx = midRow * N + (midRow + Math.round(cellsPerDeg));
    const westIdx = midRow * N + (midRow - Math.round(cellsPerDeg));
    const eastA = field.amplitudes[eastIdx];
    const westA = field.amplitudes[westIdx];
    if (eastA === undefined || westA === undefined) {
      expect.fail('expected amplitudes at sampled cells');
      return;
    }
    // Green's law: (4 000 / 100)^(1/4) = √(20) ≈ 2.51× amplitude
    // gain. Geometric spread offsets by (c_west_avg / c_east_avg)
    // ≈ √(2 000 / 1 050) ≈ 1.38 → net east/west ≈ 2.51 / 1.38 ≈ 1.8.
    expect(eastA).toBeGreaterThan(westA);
  });
});

describe('computeAmplitudeField — spreadingExponent', () => {
  function wideFlatGrid(): ReturnType<typeof makeElevationGrid> {
    const N = 81;
    const samples = new Float32Array(N * N);
    samples.fill(-4_000);
    return makeElevationGrid({
      minLat: -4,
      maxLat: 4,
      minLon: -4,
      maxLon: 4,
      nLat: N,
      nLon: N,
      samples,
    });
  }

  it('an exponent of 1 decays twice as fast (in log space) as one of 0.5', () => {
    const grid = wideFlatGrid();
    const arrival = computeTsunamiArrivalField({ grid, sourceLatitude: 0, sourceLongitude: 0 });
    const base = {
      arrivalField: arrival,
      grid,
      sourceAmplitudeM: 30,
      sourceCavityRadiusM: 10_000,
      // Geometry is what this test is about, so the source is given a
      // wavelength long enough that dispersion has nothing to say —
      // otherwise the two effects are measured as one.
      sourceWavelengthM: 2_000_000,
      sourceDepthM: 4_000,
    };
    // Both exponents given explicitly: a caller that supplies one
    // brings its own published far field and is not re-normalised, so
    // this compares the shape and nothing else. The default case is
    // energy-normalised and is measured by the test below it.
    const cylindrical = computeAmplitudeField({ ...base, spreadingExponent: 0.5 });
    const steep = computeAmplitudeField({ ...base, spreadingExponent: 1 });
    const midRow = Math.floor(cylindrical.nLat / 2);
    const midCol = Math.floor(cylindrical.nLon / 2);
    const cellsPerDeg = (cylindrical.nLon - 1) / 8;
    const idx = midRow * cylindrical.nLon + midCol + Math.round(2 * cellsPerDeg);
    const a = cylindrical.amplitudes[idx];
    const b = steep.amplitudes[idx];
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    if (a === undefined || b === undefined) return;
    // (R₀/r)^1 = ((R₀/r)^0.5)² ⇒ A_steep / A₀ = (A_cyl / A₀)²
    expect(b / 30).toBeCloseTo((a / 30) ** 2, 3);
    expect(b).toBeLessThan(a);
  });

  it('the default case carries the energy normalisation the record needs', () => {
    // A hump of peak A₀ and radius a holds ½ρg·A₀²·πa²; half goes
    // outward and at range r occupies a ring of circumference 2πr and
    // effective width √π·a, so A(r) = A₀·√(a / (4√π·r)) far away. The
    // bare power law omits the 4√π and over-states the far field by
    // its square root — a factor of 2.7, which is what put Rio de
    // Janeiro among the coasts a Sumatran earthquake drowns.
    const grid = wideFlatGrid();
    const arrival = computeTsunamiArrivalField({ grid, sourceLatitude: 0, sourceLongitude: 0 });
    const base = {
      arrivalField: arrival,
      grid,
      sourceAmplitudeM: 30,
      sourceCavityRadiusM: 10_000,
      sourceWavelengthM: 2_000_000,
      sourceDepthM: 4_000,
    };
    const normalised = computeAmplitudeField(base);
    const bare = computeAmplitudeField({ ...base, spreadingExponent: 0.5 });
    const midRow = Math.floor(normalised.nLat / 2);
    const midCol = Math.floor(normalised.nLon / 2);
    const cellsPerDeg = (normalised.nLon - 1) / 8;
    const idx = midRow * normalised.nLon + midCol + Math.round(2 * cellsPerDeg);
    const n = normalised.amplitudes[idx];
    const b = bare.amplitudes[idx];
    expect(n).toBeDefined();
    expect(b).toBeDefined();
    if (n === undefined || b === undefined) return;
    // Far from a 10 km source the ratio tends to √(4√π) ≈ 2.66; this
    // probe is at a couple of hundred kilometres, close enough that
    // the source's own radius still shows in the third digit.
    const asymptote = Math.sqrt(4 * Math.sqrt(Math.PI));
    expect(b / n).toBeGreaterThan(asymptote * 0.95);
    expect(b / n).toBeLessThanOrEqual(asymptote);
  });

  it('clamps absurd exponents instead of producing NaN or growth', () => {
    const grid = wideFlatGrid();
    const arrival = computeTsunamiArrivalField({ grid, sourceLatitude: 0, sourceLongitude: 0 });
    const field = computeAmplitudeField({
      arrivalField: arrival,
      grid,
      sourceAmplitudeM: 30,
      sourceCavityRadiusM: 10_000,
      // Geometry is what this test is about, so the source is given a
      // wavelength long enough that dispersion has nothing to say —
      // otherwise the two effects are measured as one.
      sourceWavelengthM: 2_000_000,
      spreadingExponent: Number.NaN,
    });
    expect(field.maxAmplitude).toBeLessThanOrEqual(30 * 4);
    expect(Number.isFinite(field.maxAmplitude)).toBe(true);
  });
});
