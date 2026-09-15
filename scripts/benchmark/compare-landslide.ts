import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LANDSLIDE_PRESETS,
  simulateLandslide,
  type LandslideRegime,
} from '../../src/physics/events/landslide/simulate.js';
import {
  VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL,
  VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBMARINE,
} from '../../src/physics/events/volcano/tsunami.js';
import { m } from '../../src/physics/units.js';
import { sizeBandOf } from '../../src/physics/validation/scorecard.js';
import { printStats, summarise, type Pair } from './stats.js';

/**
 * Track LAND of the benchmark protocol: Nimbus's landslide source
 * amplitude against the impulse-wave method of Heller, Hager & Minor
 * (VAW Mitteilung 4257, 2009; the three-dimensional generation equations,
 * Eqs. 3.26–3.28, with the impulse product parameter of Eq. 3.19).
 *
 *   pnpm exec tsx scripts/benchmark/compare-landslide.ts [<pairs.json>]
 *
 * Heller's method needs the slide's impact velocity, thickness and width,
 * which a Nimbus landslide does not have. They are closed here, and the
 * closure is declared in the report as a deviation:
 *
 * - thickness and width are Nimbus's own characteristic length V^(1/3);
 * - the bulk density is the regime's reference density Nimbus uses;
 * - the impact velocity is not guessed: Heller's first-crest amplitude is
 *   computed across the slide Froude numbers his experiments span,
 *   0.40 ≤ F ≤ 3.40, and Nimbus is compared with the band's centre
 *   (F = √(0.40 · 3.40)) and scored as inside, below or above the band.
 *
 * The grid is run in the subaerial regime, the one Heller's experiments
 * model; the presets keep their own. The method is first held to the
 * manual's worked Example 1 (§5.1: P = 0.64, a₀,c₁ = 14.4 m, a₀,t₁ = 22.7
 * m, a₀,c₂ = 10.1 m).
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WATER_DENSITY = 1_000;
const F_LOW = 0.4;
const F_HIGH = 3.4;
const F_MID = Math.sqrt(F_LOW * F_HIGH);

export interface HellerSlide {
  froude: number;
  thicknessM: number;
  widthM: number;
  volumeM3: number;
  densityKgM3: number;
  angleDeg: number;
  depthM: number;
}

/** Impulse product parameter P (Heller et al. 2009, Eq. 3.19). */
export function impulseProduct(s: HellerSlide): number {
  const S = s.thicknessM / s.depthM;
  const M = (s.densityKgM3 * s.volumeM3) / (WATER_DENSITY * s.widthM * s.depthM ** 2);
  const cosTerm = Math.cos(((6 / 7) * s.angleDeg * Math.PI) / 180);
  return s.froude * S ** 0.5 * M ** 0.25 * cosTerm ** 0.5;
}

/** Initial amplitudes of the first crest, first trough and second crest (Eqs. 3.26–3.28). */
export function initialAmplitudes(s: HellerSlide): { c1: number; t1: number; c2: number } {
  const P = impulseProduct(s);
  const B = s.widthM / s.depthM;
  const cosTerm = Math.cos(((6 / 7) * s.angleDeg * Math.PI) / 180);
  return {
    c1: 0.2 * P ** 0.5 * B ** 0.75 * cosTerm ** 0.25 * s.depthM,
    t1: 0.35 * P ** 0.5 * B ** 0.5 * cosTerm ** 0.5 * s.depthM,
    c2: 0.14 * P ** 0.25 * B ** 0.25 * cosTerm ** 0.25 * s.depthM,
  };
}

/** The manual's Example 1, as the check of this implementation. */
export function exampleOne(): { P: number; c1: number; t1: number; c2: number } {
  const slide: HellerSlide = {
    froude: 58 / Math.sqrt(9.81 * 80),
    thicknessM: 12,
    widthM: 100,
    volumeM3: 220_000,
    densityKgM3: 1_700,
    angleDeg: 40,
    depthM: 80,
  };
  return { P: impulseProduct(slide), ...initialAmplitudes(slide) };
}

interface LandslideCase {
  id: string;
  source: string;
  volumeM3: number;
  slopeAngleDeg: number;
  waterDepthM: number;
}

export function comparePairs(): Pair[] {
  const cases = JSON.parse(
    readFileSync(join(ROOT, 'benchmark', 'matrices', 'landslide.json'), 'utf8')
  ) as LandslideCase[];
  const pairs: Pair[] = [];
  for (const c of cases) {
    const presetKey = c.id.startsWith('land-preset-') ? c.id.slice('land-preset-'.length) : null;
    const preset =
      presetKey === null
        ? undefined
        : LANDSLIDE_PRESETS[presetKey as keyof typeof LANDSLIDE_PRESETS];
    const regime: LandslideRegime = preset?.input.regime ?? 'subaerial';
    const r = simulateLandslide({
      ...(preset?.input ?? {}),
      volumeM3: c.volumeM3,
      slopeAngleDeg: c.slopeAngleDeg,
      meanOceanDepth: m(c.waterDepthM),
      regime,
    });
    const nimbus = (r.tsunami?.sourceAmplitude as number | undefined) ?? 0;
    const side = Math.cbrt(c.volumeM3);
    const density =
      (preset?.input as { slideDensity?: number } | undefined)?.slideDensity ??
      (regime === 'subaerial'
        ? VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL
        : VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBMARINE);
    const slide = (froude: number): HellerSlide => ({
      froude,
      thicknessM: side,
      widthM: side,
      volumeM3: c.volumeM3,
      densityKgM3: density,
      angleDeg: c.slopeAngleDeg,
      depthM: c.waterDepthM,
    });
    const low = initialAmplitudes(slide(F_LOW)).c1;
    const high = initialAmplitudes(slide(F_HIGH)).c1;
    const mid = initialAmplitudes(slide(F_MID)).c1;
    const S = side / c.waterDepthM;
    const M = (density * c.volumeM3) / (WATER_DENSITY * side * c.waterDepthM ** 2);
    const B = side / c.waterDepthM;
    const P = impulseProduct(slide(F_MID));
    const outside = [
      S < 0.15 || S > 0.6 ? 'S' : null,
      M < 0.25 || M > 1 ? 'M' : null,
      B < 0.83 || B > 5 ? 'B' : null,
      c.slopeAngleDeg < 30 ? 'α' : null,
      P < 0.13 || P > 2.08 ? 'P' : null,
    ].filter((x): x is string => x !== null);
    const base = {
      track: 'LAND',
      caseId: c.id,
      source: c.source === 'preset' ? ('preset' as const) : ('custom' as const),
      band: sizeBandOf('landslide', c.volumeM3),
      cls: 'C' as const,
      bin:
        outside.length === 0 ? "inside Heller's tested range" : `outside on ${outside.join(', ')}`,
    };
    if (c.waterDepthM <= 0) continue;
    pairs.push({
      ...base,
      quantity: 'firstCrestAmplitudeAtBandCentre',
      detail: `${regime}; Heller band ${low.toPrecision(3)}–${high.toPrecision(3)} m`,
      nimbus,
      reference: mid,
    });
    pairs.push({
      ...base,
      quantity: 'insideHellerBand',
      detail: nimbus < low ? 'below' : nimbus > high ? 'above' : 'inside',
      nimbus: nimbus < low ? -1 : nimbus > high ? 1 : 0,
      reference: 0,
      categorical: true,
    });
  }
  return pairs;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const check = exampleOne();
  const pairs = comparePairs();
  const stats = summarise(pairs);
  mkdirSync(join(ROOT, 'benchmark', 'results'), { recursive: true });
  writeFileSync(
    join(ROOT, 'benchmark', 'results', 'landslide.json'),
    `${JSON.stringify({ track: 'LAND', reference: 'Heller, Hager & Minor 2009 (VAW 4257), 3D generation equations', exampleOne: { computed: check, manual: { P: 0.64, c1: 14.4, t1: 22.7, c2: 10.1 } }, froudeBand: [F_LOW, F_HIGH], stats }, null, 1)}\n`
  );
  const pairsOut = process.argv[2];
  if (pairsOut !== undefined) writeFileSync(pairsOut, JSON.stringify(pairs));
  console.log('Example 1', check);
  printStats(stats);
}
