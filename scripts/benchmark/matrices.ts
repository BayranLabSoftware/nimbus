import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EARTHQUAKE_PRESETS } from '../../src/physics/events/earthquake/simulate.js';
import { EXPLOSION_PRESETS } from '../../src/physics/events/explosion/simulate.js';
import { LANDSLIDE_PRESETS } from '../../src/physics/events/landslide/simulate.js';
import { VOLCANO_PRESETS } from '../../src/physics/events/volcano/simulate.js';
import { mulberry32 } from '../../src/physics/montecarlo/sampling.js';
import { IMPACT_PRESETS } from '../../src/physics/simulate.js';

/**
 * The input matrices of the benchmark campaign (docs/BENCHMARK_PROTOCOL.md).
 *
 * Every case each reference program is asked, written before any of them
 * is asked: the presets of each hazard, a structured grid that walks each
 * input across its range with the others held, and a Latin hypercube over
 * the whole input space with a fixed seed. Deterministic: running this
 * again writes the same files.
 *
 * Usage:
 *   pnpm exec tsx scripts/benchmark/matrices.ts
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'benchmark', 'matrices');

/** A Latin hypercube in [0, 1)^dims, one stratum per sample on each axis. */
function latinHypercube(samples: number, dims: number, seed: string): number[][] {
  const rng = mulberry32(seed);
  const columns = Array.from({ length: dims }, () => {
    const strata = Array.from({ length: samples }, (_, i) => (i + rng.next()) / samples);
    for (let i = strata.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      const tmp = strata[i] ?? 0;
      strata[i] = strata[j] ?? 0;
      strata[j] = tmp;
    }
    return strata;
  });
  return Array.from({ length: samples }, (_, i) => columns.map((c) => c[i] ?? 0));
}

const logBetween = (u: number, lo: number, hi: number): number =>
  Math.exp(Math.log(lo) + u * (Math.log(hi) - Math.log(lo)));
const between = (u: number, lo: number, hi: number): number => lo + u * (hi - lo);
const sig = (x: number, digits = 3): number => Number(x.toPrecision(digits));

// ---------------------------------------------------------------- impacts

type ImpactTarget = 'sedimentary' | 'crystalline' | 'water';

interface ImpactCase {
  id: string;
  source: 'preset' | 'grid' | 'lhs';
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  angleDeg: number;
  target: ImpactTarget;
  /** Water depth for a water target (m). */
  waterDepthM?: number;
  distancesKm: number[];
}

const IMPACT_DISTANCES_KM = [1, 3, 10, 30, 100, 300, 1000, 3000];

function impactMatrix(): ImpactCase[] {
  const cases: ImpactCase[] = [];
  for (const [key, preset] of Object.entries(IMPACT_PRESETS)) {
    const input = preset.input as unknown as Record<string, number | undefined>;
    const water = (input.waterDepth ?? 0) > 0;
    cases.push({
      id: `imp-preset-${key}`,
      source: 'preset',
      diameterM: input.impactorDiameter ?? 0,
      densityKgM3: input.impactorDensity ?? 3000,
      velocityKmS: (input.impactVelocity ?? 0) / 1000,
      angleDeg: sig(((input.impactAngle ?? 0) * 180) / Math.PI, 4),
      target: water
        ? 'water'
        : (input.targetDensity ?? 2500) >= 2700
          ? 'crystalline'
          : 'sedimentary',
      ...(water ? { waterDepthM: input.waterDepth ?? 0 } : {}),
      distancesKm: IMPACT_DISTANCES_KM,
    });
  }
  const base = { densityKgM3: 3000, velocityKmS: 20, angleDeg: 45, target: 'sedimentary' as const };
  let n = 0;
  const grid = (c: Omit<ImpactCase, 'id' | 'source' | 'distancesKm'>): void => {
    cases.push({
      id: `imp-grid-${String(++n).padStart(3, '0')}`,
      source: 'grid',
      ...c,
      distancesKm: IMPACT_DISTANCES_KM,
    });
  };
  for (const d of [1, 3, 10, 30, 100, 300, 1000, 3000, 10000, 30000])
    grid({ ...base, diameterM: d });
  for (const d of [30, 300, 3000]) {
    for (const v of [11.2, 15, 25, 40, 70]) grid({ ...base, diameterM: d, velocityKmS: v });
    for (const a of [10, 20, 30, 60, 90]) grid({ ...base, diameterM: d, angleDeg: a });
  }
  for (const d of [10, 100, 1000]) {
    for (const rho of [1000, 1500, 2000, 5000, 8000])
      grid({ ...base, diameterM: d, densityKgM3: rho });
  }
  for (const d of [100, 1000, 10000]) grid({ ...base, diameterM: d, target: 'crystalline' });
  for (const d of [100, 1000]) {
    for (const h of [50, 500, 2000, 5000])
      grid({ ...base, diameterM: d, target: 'water', waterDepthM: h });
  }
  latinHypercube(120, 6, 'benchmark-2026-09-15-impact').forEach((u, i) => {
    const t = u[4] ?? 0;
    const target: ImpactTarget = t < 1 / 3 ? 'sedimentary' : t < 2 / 3 ? 'crystalline' : 'water';
    cases.push({
      id: `imp-lhs-${String(i + 1).padStart(3, '0')}`,
      source: 'lhs',
      diameterM: sig(logBetween(u[0] ?? 0, 1, 20000)),
      velocityKmS: sig(between(u[1] ?? 0, 11.2, 72)),
      angleDeg: sig(between(u[2] ?? 0, 5, 90)),
      densityKgM3: sig(logBetween(u[3] ?? 0, 1000, 8000)),
      target,
      ...(target === 'water' ? { waterDepthM: sig(logBetween(u[5] ?? 0, 10, 6000)) } : {}),
      distancesKm: IMPACT_DISTANCES_KM,
    });
  });
  return cases;
}

// --------------------------------------------------------------- explosions

interface NuclearCase {
  id: string;
  source: 'preset' | 'grid';
  yieldKt: number;
  heightOfBurstM: number;
  /** Ranges for the programs that answer at a range (km). */
  rangesKm: number[];
}

const NUCLEAR_RANGES_KM = [0.5, 1, 2, 5, 10, 20, 50, 100];

function nuclearMatrix(): NuclearCase[] {
  const cases: NuclearCase[] = [];
  for (const [key, preset] of Object.entries(EXPLOSION_PRESETS)) {
    const input = preset.input as unknown as Record<string, unknown>;
    if (input.chargeType === 'chemical') continue;
    cases.push({
      id: `nuc-preset-${key}`,
      source: 'preset',
      yieldKt: sig((input.yieldMegatons as number) * 1000, 4),
      heightOfBurstM: (input.heightOfBurst as number | undefined) ?? 0,
      rangesKm: NUCLEAR_RANGES_KM,
    });
  }
  let n = 0;
  for (const kt of [0.01, 0.1, 1, 10, 20, 100, 500, 1000, 5000, 20000, 50000]) {
    // A surface burst, and an air burst at 200 m scaled to the yield's
    // cube root — a low air burst, not an optimum any program computes.
    for (const hob of [0, sig(200 * Math.cbrt(kt))]) {
      cases.push({
        id: `nuc-grid-${String(++n).padStart(3, '0')}`,
        source: 'grid',
        yieldKt: kt,
        heightOfBurstM: hob,
        rangesKm: NUCLEAR_RANGES_KM,
      });
    }
  }
  return cases;
}

interface ChemicalCase {
  id: string;
  source: 'preset' | 'grid';
  chargeKgTnt: number;
  /** Scaled distances Z = R / W^(1/3) (m/kg^(1/3)) for a surface burst. */
  scaledDistances: number[];
}

const SCALED_DISTANCES = [0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30, 40];

function chemicalMatrix(): ChemicalCase[] {
  const cases: ChemicalCase[] = [];
  for (const [key, preset] of Object.entries(EXPLOSION_PRESETS)) {
    const input = preset.input as unknown as Record<string, unknown>;
    if (input.chargeType !== 'chemical') continue;
    cases.push({
      id: `chem-preset-${key}`,
      source: 'preset',
      chargeKgTnt: sig((input.yieldMegatons as number) * 1e9, 4),
      scaledDistances: SCALED_DISTANCES,
    });
  }
  let n = 0;
  for (const w of [1, 10, 100, 1000, 1e4, 1e5, 1e6]) {
    cases.push({
      id: `chem-grid-${String(++n).padStart(3, '0')}`,
      source: 'grid',
      chargeKgTnt: w,
      scaledDistances: SCALED_DISTANCES,
    });
  }
  return cases;
}

// -------------------------------------------------------------- earthquakes

interface EarthquakeCase {
  id: string;
  source: 'preset' | 'grid';
  magnitude: number;
  faultType: 'strike-slip' | 'normal' | 'reverse' | 'all';
  depthKm: number;
  vs30: number;
  subductionInterface: boolean;
  distancesKm: number[];
}

const EQ_DISTANCES_KM = [0, 1, 2, 5, 10, 20, 30, 50, 75, 100, 150, 200, 300];

function earthquakeMatrix(): EarthquakeCase[] {
  const cases: EarthquakeCase[] = [];
  for (const [key, preset] of Object.entries(EARTHQUAKE_PRESETS)) {
    const input = preset.input as unknown as Record<string, unknown>;
    cases.push({
      id: `eq-preset-${key}`,
      source: 'preset',
      magnitude: input.magnitude as number,
      faultType: (input.faultType as EarthquakeCase['faultType'] | undefined) ?? 'all',
      depthKm: ((input.depth as number | undefined) ?? 15_000) / 1000,
      vs30: 760,
      subductionInterface: input.subductionInterface === true,
      distancesKm: EQ_DISTANCES_KM,
    });
  }
  let n = 0;
  for (const magnitude of [5, 5.5, 6, 6.5, 7, 7.5, 8]) {
    for (const faultType of ['strike-slip', 'normal', 'reverse'] as const) {
      for (const depthKm of [5, 10, 20, 35]) {
        for (const vs30 of [180, 300, 500, 760]) {
          cases.push({
            id: `eq-grid-${String(++n).padStart(3, '0')}`,
            source: 'grid',
            magnitude,
            faultType,
            depthKm,
            vs30,
            subductionInterface: false,
            distancesKm: EQ_DISTANCES_KM,
          });
        }
      }
    }
  }
  return cases;
}

// ---------------------------------------------------------------- tsunamis

interface TsunamiCase {
  id: string;
  source: 'grid';
  kind: 'gaussian' | 'megathrust';
  basinDepthM: number;
  /** Gaussian hump: peak (m) and e-folding radius (km). */
  amplitudeM?: number;
  radiusKm?: number;
  /** Megathrust: moment magnitude; geometry from Nimbus's own scaling. */
  magnitude?: number;
  gaugesKm: number[];
}

function tsunamiMatrix(): TsunamiCase[] {
  const cases: TsunamiCase[] = [];
  let n = 0;
  for (const basinDepthM of [1000, 4000]) {
    for (const amplitudeM of [1, 5, 20]) {
      for (const radiusKm of [20, 50, 100]) {
        cases.push({
          id: `tsu-gauss-${String(++n).padStart(3, '0')}`,
          source: 'grid',
          kind: 'gaussian',
          basinDepthM,
          amplitudeM,
          radiusKm,
          gaugesKm: [100, 200, 500, 1000, 2000, 3000],
        });
      }
    }
  }
  for (const magnitude of [7.5, 8, 8.5, 9, 9.5]) {
    cases.push({
      id: `tsu-mega-${String(magnitude).replace('.', '')}`,
      source: 'grid',
      kind: 'megathrust',
      basinDepthM: 4000,
      magnitude,
      gaugesKm: [100, 300, 1000, 3000],
    });
  }
  return cases;
}

// ---------------------------------------------------------------- volcanoes

interface VolcanoCase {
  id: string;
  source: 'preset' | 'grid';
  volumeEruptionRate: number;
  totalEjectaVolume: number;
  windSpeed: number;
  downwindKm: number[];
}

const DOWNWIND_KM = [5, 10, 20, 50, 100, 200, 500];

function volcanoMatrix(): VolcanoCase[] {
  const cases: VolcanoCase[] = [];
  for (const [key, preset] of Object.entries(VOLCANO_PRESETS)) {
    const input = preset.input as unknown as Record<string, number | undefined>;
    cases.push({
      id: `vol-preset-${key}`,
      source: 'preset',
      volumeEruptionRate: input.volumeEruptionRate ?? 0,
      totalEjectaVolume: input.totalEjectaVolume ?? 0,
      windSpeed: input.windSpeed ?? 10,
      downwindKm: DOWNWIND_KM,
    });
  }
  let n = 0;
  for (const totalEjectaVolume of [1e7, 1e8, 1e9, 1e10, 1e11]) {
    for (const volumeEruptionRate of [1e3, 1e4, 1e5, 1e6]) {
      for (const windSpeed of [5, 15, 30]) {
        cases.push({
          id: `vol-grid-${String(++n).padStart(3, '0')}`,
          source: 'grid',
          volumeEruptionRate,
          totalEjectaVolume,
          windSpeed,
          downwindKm: DOWNWIND_KM,
        });
      }
    }
  }
  return cases;
}

// --------------------------------------------------------------- landslides

interface LandslideCase {
  id: string;
  source: 'preset' | 'grid';
  volumeM3: number;
  slopeAngleDeg: number;
  waterDepthM: number;
}

function landslideMatrix(): LandslideCase[] {
  const cases: LandslideCase[] = [];
  for (const [key, preset] of Object.entries(LANDSLIDE_PRESETS)) {
    const input = preset.input as unknown as Record<string, unknown>;
    if (input.regime !== 'subaerial' || ((input.meanOceanDepth as number | undefined) ?? 0) <= 0)
      continue;
    cases.push({
      id: `land-preset-${key}`,
      source: 'preset',
      volumeM3: input.volumeM3 as number,
      slopeAngleDeg: (input.slopeAngleDeg as number | undefined) ?? 30,
      waterDepthM: input.meanOceanDepth as number,
    });
  }
  let n = 0;
  for (const volumeM3 of [1e5, 1e6, 1e7, 1e8, 1e9]) {
    for (const slopeAngleDeg of [20, 35, 50]) {
      for (const waterDepthM of [20, 100, 400]) {
        cases.push({
          id: `land-grid-${String(++n).padStart(3, '0')}`,
          source: 'grid',
          volumeM3,
          slopeAngleDeg,
          waterDepthM,
        });
      }
    }
  }
  return cases;
}

// -------------------------------------------------------------------- write

function write(name: string, rows: unknown[]): void {
  const file = join(OUT, `${name}.json`);
  writeFileSync(file, `${JSON.stringify(rows, null, 1)}\n`);
  console.error(`${name}: ${rows.length.toString()} cases → ${file}`);
}

mkdirSync(OUT, { recursive: true });
write('impact', impactMatrix());
write('nuclear', nuclearMatrix());
write('chemical', chemicalMatrix());
write('earthquake', earthquakeMatrix());
write('tsunami', tsunamiMatrix());
write('volcano', volcanoMatrix());
write('landslide', landslideMatrix());
