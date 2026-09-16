import {
  impulseWaveAmplitudes,
  outsideTestedRange,
  slideFromVolume,
} from '../effects/impulseWave.js';
import {
  LANDSLIDE_DEFAULT_SLOPE_DEG,
  simulateLandslide,
  type LandslideRegime,
} from '../events/landslide/simulate.js';
import { VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL } from '../events/volcano/tsunami.js';
import { m } from '../units.js';
import { meetsL2, meetsL2AgainstPeak, type SlideWaveReading } from './slideWaveRules.js';
import { SLIDE_WAVE_EVENTS, type SlideWaveEvent } from './slideWaveSetData.js';

/**
 * Rules 120 and 121 of slideWaveRules.ts, run: the wave Nimbus raises at a
 * landslide, against the wave somebody measured at twenty-six of them.
 *
 * **What the catalogue does not give, and this run therefore does not choose.**
 * It says a slide's type and its material, and it does not say whether the
 * slide began above the water or below it. Nimbus's regime is exactly that,
 * and it is worth a factor of eighty in the prefactor — K = 0.4 subaerial
 * against 0.005 submarine. Rather than map one onto the other after seeing the
 * set, which would decide the answer by picking it, the project law is run
 * **both ways** and both are printed. Heller has no such switch: his
 * experiments are a slide entering water from above, so his comparison runs as
 * that and says so.
 *
 * The slope angle: arctan(drop height / sliding distance) where the catalogue
 * gives both, and Nimbus's own default of 20° where it does not. How many rows
 * fall each way is printed.
 */

export interface SlideWaveRow {
  event: SlideWaveEvent;
  /** Rule 120's record: the catalogue's maximum wave height (m), zero where
   *  it gives none. Often a height at a distant gauge. */
  recordM: number;
  /** Rule 122's record: the catalogue's own maximum of wave and run-up (m). */
  peakM: number;
  /** The run-up alone (m), zero where the catalogue gives none. */
  runUpM: number;
  /** The slope used, and whether the catalogue gave it. */
  slopeDeg: number;
  slopeFromCatalogue: boolean;
  /** The project law's source amplitude (m), each regime. An amplitude, not a
   *  height — rule 120. */
  projectSubaerialM: number;
  projectSubmarineM: number;
  /** Heller's crest plus trough (m): a height, which is what the record is. */
  hellerHeightM: number;
  /** Heller's first crest alone (m), printed beside it. */
  hellerCrestM: number;
  /** What the product would draw under heller2009, after the source ceiling. */
  hellerAsDrawnM: number;
  /** Heller's tested ranges this slide falls outside of. */
  outside: string[];
  /** True where the catalogue publishes the slide's width as well, so the
   *  closure did not have to invent it. */
  widthFromCatalogue: boolean;
}

function reading(logs: readonly number[]): SlideWaveReading {
  if (logs.length === 0) return { rows: 0, bias: Number.NaN, sigmaLn: Number.NaN, withinTwo: 0 };
  const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
  const variance =
    logs.length < 2 ? 0 : logs.reduce((a, b) => a + (b - mean) ** 2, 0) / (logs.length - 1);
  return {
    rows: logs.length,
    bias: Math.exp(mean),
    sigmaLn: Math.sqrt(variance),
    withinTwo: logs.filter((x) => Math.abs(x) <= Math.log(2)).length / logs.length,
  };
}

/** The slope a row is run at: the catalogue's where it gives one. */
export function slopeOf(e: SlideWaveEvent): { deg: number; fromCatalogue: boolean } {
  if (e.dropHeightM > 0 && e.slidingDistanceM > 0) {
    const deg = (Math.atan(e.dropHeightM / e.slidingDistanceM) * 180) / Math.PI;
    if (deg > 0 && deg < 90) return { deg, fromCatalogue: true };
  }
  return { deg: LANDSLIDE_DEFAULT_SLOPE_DEG, fromCatalogue: false };
}

function projectAmplitude(e: SlideWaveEvent, slopeDeg: number, regime: LandslideRegime): number {
  const r = simulateLandslide({
    volumeM3: e.volumeM3,
    slopeAngleDeg: slopeDeg,
    meanOceanDepth: m(e.depthM),
    regime,
    waveLaw: 'project',
  });
  return Number(r.tsunami?.sourceAmplitude ?? 0);
}

export function slideWaveRows(
  events: readonly SlideWaveEvent[] = SLIDE_WAVE_EVENTS
): SlideWaveRow[] {
  return events.map((e) => {
    const { deg, fromCatalogue } = slopeOf(e);
    const closure = slideFromVolume({
      volumeM3: e.volumeM3,
      angleDeg: deg,
      depthM: e.depthM,
      densityKgM3: VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL,
      ...(e.widthM > 0 && { widthM: e.widthM }),
      ...(e.dropHeightM > 0 && { dropHeightM: e.dropHeightM }),
    });
    const a = impulseWaveAmplitudes(closure.slide);
    // `heller2009` when this ran (B-043), with B-042's slow speed and B-039's
    // ceiling on the crest: rerun today it draws the manual's crest as rule
    // 163 of impulseWaveRules.ts has it, and the figures committed for rules
    // 118 to 125 are the record of what ran then.
    const drawn = simulateLandslide({
      volumeM3: e.volumeM3,
      slopeAngleDeg: deg,
      meanOceanDepth: m(e.depthM),
      regime: 'subaerial',
      waveLaw: 'impulseWaveManual',
      ...(e.widthM > 0 && { slideWidthM: e.widthM }),
      ...(e.dropHeightM > 0 && { dropHeightM: e.dropHeightM }),
    });
    return {
      event: e,
      recordM: e.waveHeightM,
      peakM: e.peakHeightM,
      runUpM: e.runUpM,
      slopeDeg: deg,
      slopeFromCatalogue: fromCatalogue,
      projectSubaerialM: projectAmplitude(e, deg, 'subaerial'),
      projectSubmarineM: projectAmplitude(e, deg, 'submarine'),
      hellerHeightM: a.firstCrest + a.firstTrough,
      hellerCrestM: a.firstCrest,
      hellerAsDrawnM: Number(drawn.tsunami?.sourceAmplitude ?? 0),
      outside: outsideTestedRange(closure.slide),
      widthFromCatalogue: e.widthM > 0,
    };
  });
}

export interface SlideWaveResult {
  rows: SlideWaveRow[];
  /** Rule 121's comparison: Heller's height against `Wave h max`. */
  heller: SlideWaveReading;
  hellerMeetsL2: boolean;
  /** Rule 125's comparison, which is the one that decides now: Heller's
   *  height against the catalogue's `Peak height`. */
  againstPeak: SlideWaveReading;
  peakMeetsL2: boolean;
  /** Printed beside it (rule 123): the run-up alone. */
  againstRunUp: SlideWaveReading;
  /** Printed, deciding nothing (rule 120): the project law both ways, an
   *  amplitude against a height. */
  projectSubaerial: SlideWaveReading;
  projectSubmarine: SlideWaveReading;
  /** What the product would actually draw under heller2009, after the source
   *  ceiling of B-039. */
  hellerAsDrawn: SlideWaveReading;
  byWaterBody: { body: string; heller: SlideWaveReading }[];
  slopesFromCatalogue: number;
  widthsFromCatalogue: number;
  outsideAnyRange: number;
}

export function runSlideWave(
  events: readonly SlideWaveEvent[] = SLIDE_WAVE_EVENTS
): SlideWaveResult {
  const rows = slideWaveRows(events);
  const logs = (pick: (r: SlideWaveRow) => number): number[] =>
    rows.filter((r) => pick(r) > 0 && r.recordM > 0).map((r) => Math.log(pick(r) / r.recordM));
  const against = (record: (r: SlideWaveRow) => number): SlideWaveReading =>
    reading(
      rows
        .filter((r) => r.hellerHeightM > 0 && record(r) > 0)
        .map((r) => Math.log(r.hellerHeightM / record(r)))
    );
  const heller = against((r) => r.recordM);
  const againstPeak = against((r) => r.peakM);
  const bodies = [...new Set(rows.map((r) => r.event.waterBody))].sort();
  return {
    rows,
    heller,
    hellerMeetsL2: meetsL2(heller),
    againstPeak,
    peakMeetsL2: meetsL2AgainstPeak(againstPeak),
    againstRunUp: against((r) => r.runUpM),
    projectSubaerial: reading(logs((r) => r.projectSubaerialM)),
    projectSubmarine: reading(logs((r) => r.projectSubmarineM)),
    hellerAsDrawn: reading(logs((r) => r.hellerAsDrawnM)),
    byWaterBody: bodies.map((body) => ({
      body,
      heller: reading(
        rows
          .filter((r) => r.event.waterBody === body && r.hellerHeightM > 0 && r.peakM > 0)
          .map((r) => Math.log(r.hellerHeightM / r.peakM))
      ),
    })),
    slopesFromCatalogue: rows.filter((r) => r.slopeFromCatalogue).length,
    widthsFromCatalogue: rows.filter((r) => r.widthFromCatalogue).length,
    outsideAnyRange: rows.filter((r) => r.outside.length > 0).length,
  };
}
