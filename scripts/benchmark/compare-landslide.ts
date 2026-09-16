import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LANDSLIDE_PRESETS,
  simulateLandslide,
  type LandslideRegime,
} from '../../src/physics/events/landslide/simulate.js';
import {
  IMPULSE_WAVE_EXAMPLE_ONE_MANUAL,
  IMPULSE_WAVE_TESTED,
  IMPULSE_WAVE_WATER_DENSITY,
  impulseProduct,
  impulseWaveAmplitudes,
  impulseWaveExampleOne,
  type ImpulseWaveSlide,
} from '../../src/physics/effects/impulseWave.js';
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
 *
 * Since 16 September 2026 the equations are not written here: they are
 * `src/physics/effects/impulseWave.ts`, where `impulseWave.test.ts` holds them
 * to that same Example 1 on every CI run, and this script imports them.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WATER_DENSITY = IMPULSE_WAVE_WATER_DENSITY;
const [F_LOW, F_HIGH] = IMPULSE_WAVE_TESTED.froude;
const F_MID = Math.sqrt(F_LOW * F_HIGH);

/** Heller's equations now live in `src/physics/effects/impulseWave.ts`, where a
 *  test in CI holds them to the manual's Example 1 (rule L1 of
 *  docs/GOLD_STANDARD.md). This script imports them, so the reference Nimbus is
 *  scored against and the relation Nimbus could draw are the same code and
 *  cannot drift apart. */
export type HellerSlide = ImpulseWaveSlide;
export { impulseProduct };
export const initialAmplitudes = (s: HellerSlide): { c1: number; t1: number; c2: number } => {
  const a = impulseWaveAmplitudes(s);
  return { c1: a.firstCrest, t1: a.firstTrough, c2: a.secondCrest };
};
export const exampleOne = (): { P: number; c1: number; t1: number; c2: number } => {
  const e = impulseWaveExampleOne();
  return { P: e.impulseProduct, c1: e.firstCrest, t1: e.firstTrough, c2: e.secondCrest };
};

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
    const span = (v: number, r: readonly [number, number], name: string): string | null =>
      v < r[0] || v > r[1] ? name : null;
    const outside = [
      span(S, IMPULSE_WAVE_TESTED.relativeThickness, 'S'),
      span(M, IMPULSE_WAVE_TESTED.relativeMass, 'M'),
      span(B, IMPULSE_WAVE_TESTED.relativeWidth, 'B'),
      span(c.slopeAngleDeg, IMPULSE_WAVE_TESTED.angleDeg, 'α'),
      span(P, IMPULSE_WAVE_TESTED.impulseProduct, 'P'),
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
  const resultsDir = join(ROOT, 'benchmark', 'results');
  mkdirSync(resultsDir, { recursive: true });
  // A name nothing has taken: the campaign's record is never written over.
  const stamp = new Date().toISOString().slice(0, 10);
  let out = join(resultsDir, 'landslide.json');
  for (let n = 0; existsSync(out); n++) {
    out = join(
      resultsDir,
      n === 0 ? `landslide-${stamp}.json` : `landslide-${stamp}-${n.toString()}.json`
    );
  }
  writeFileSync(
    out,
    `${JSON.stringify({ track: 'LAND', reference: 'Heller, Hager & Minor 2009 (VAW 4257), 3D generation equations', exampleOne: { computed: check, manual: { P: IMPULSE_WAVE_EXAMPLE_ONE_MANUAL.impulseProduct, c1: IMPULSE_WAVE_EXAMPLE_ONE_MANUAL.firstCrest, t1: IMPULSE_WAVE_EXAMPLE_ONE_MANUAL.firstTrough, c2: IMPULSE_WAVE_EXAMPLE_ONE_MANUAL.secondCrest } }, froudeBand: [F_LOW, F_HIGH], stats }, null, 1)}\n`
  );
  const pairsOut = process.argv[2];
  if (pairsOut !== undefined) writeFileSync(pairsOut, JSON.stringify(pairs));
  console.log('Example 1', check);
  printStats(stats);
}
