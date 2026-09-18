/**
 * The ocean a wave crosses, and the water over the place it started.
 *
 * Thirty scenarios were opened on the product's own report page on 18
 * September 2026 and read one by one. One of them says that a Mw 9.0 on a
 * shelf puts its wave 1 000 km away in 20 h 54 min. That is 13.3 m/s. No
 * tsunami crosses an ocean at thirteen metres a second; a wave in eighteen
 * metres of water does, and eighteen metres is what the store had sampled
 * under the epicentre.
 *
 * `simulateEarthquake` passes `waterDepth` — the water over the source, the
 * number that decides whether the seafloor lifts any water at all — into
 * `seismicTsunamiFromMegathrust` as `basinDepth`, whose own documentation
 * calls it the "mean basin depth" and which carries the celerity, the travel
 * time to 1 000 km, the dominant period and the dispersion of the far-field
 * rows. One number is answering two questions: how deep is the water where
 * the wave is made, and how deep is the ocean it then crosses. They are not
 * the same question and on a shelf they are not the same number.
 *
 * The product does not believe the first answer itself. `extractTsunamiMeta`
 * hands the globe's solver 4 000 m for an earthquake whatever the scenario
 * said, and the solver reads the real bathymetry cell by cell from there. So
 * the picture and the row printed beside it already disagree, and the row is
 * the one that is wrong.
 *
 * The other three families were asked what they do, because four answers to
 * one question is how a thing like this survives: an impact takes a basin
 * depth of its own and caps the water it couples to at 200 m, a volcano's
 * collapse takes the depth of the collapse, and a landslide ignores the depth
 * it is handed. Only the earthquake propagates on the water over its own
 * epicentre.
 *
 * The rules, fixed on 18 September 2026 and numbered after the hundred and
 * eighty-six before them, pushed before anything is measured:
 *
 *  187. **What was looked at.** The thirty reports of 18 September and the
 *       code paths behind them: `events/earthquake/simulate.ts`,
 *       `events/earthquake/seismicTsunami.ts`, `extractTsunamiMeta` and
 *       `tsunami/amplitudeField.ts`, and what the other three families pass.
 *       The travel times, celerities and periods the product prints for a
 *       shelf source and for a deep one, which is the reproduction above. No
 *       record of any wave has been compared with a model number for this
 *       round.
 *
 *  188. **The candidate (`pathBasinDepth`).** The depth a wave travels on
 *       becomes an input of its own, `EarthquakeScenarioInput.basinDepth`,
 *       and the water over the source stops setting it. The source's depth
 *       keeps the job it can answer for — whether the event is submarine at
 *       all, which is the trigger — and nothing else. A caller that knows the
 *       ocean says so; a caller that does not gets the 4 000 m the module has
 *       always defaulted to, which is the number the globe's solver was
 *       already using for the same event. The result publishes the depth it
 *       travelled on, so the row can be read.
 *
 *       The store, which does know, passes the median depth of the sea within
 *       {@link BASIN_SAMPLE_RADIUS_M} of the source on the planetary mosaic —
 *       the same `findNearbyOceanDepth` an impact already uses for its basin,
 *       at a radius chosen because the rows this depth carries are quoted at
 *       1 000 km. Where no mosaic is loaded the default stands.
 *
 *  189. **What decides.** The category error is not a candidate to be scored:
 *       a row that says 13 m/s is wrong whatever a set says. What the guards
 *       decide is that the cure costs nothing that has been read:
 *       (a) no number of `docs/VALIDATION_REPORT.json` moves. No earthquake
 *           preset carries a water depth, so nothing the calibration net or
 *           the wave rows read should change, and the guard is there to prove
 *           it rather than to assume it;
 *       (b) the release gate stays PASS and the suite stays green;
 *       (c) the depth the report prints, the depth the travel time implies
 *           and the depth the globe's veil propagates on are one number,
 *           pinned by a test;
 *       (d) the run-up rule's set (rules 102 to 105) is untouched, because
 *           `runupRun.ts` passes no basin depth and therefore takes the
 *           default it already had.
 *
 *  190. **What is measured, and decides nothing.** The 151 deep-ocean records
 *       BM-05 kept (`benchmark/dart/records.json`, read on 15 September 2026)
 *       carry a distance from the source and the time its crest reached the
 *       buoy. The implied speed, distance over time, is a **lower bound** on
 *       the leading wave's celerity, because a crest lags the first arrival —
 *       so a model slower than that bound is certainly too slow, and one
 *       faster may be right. Printed: the share of records the default basin
 *       is certainly too slow for, the median ratio of model celerity to
 *       implied speed, and the same two numbers for the depth each buoy sits
 *       in. **Nothing is tuned on them.** DART has been read (BM-05), rule 5
 *       forbids tuning on a set that has been read, and the 4 000 m default
 *       is not moved by this round whichever way the reading falls.
 *
 *  191. **What these rules cannot settle.** Two things, named here so they do
 *       not become invisible again:
 *       - the reference depth of the globe's veil. `veilLaw` shoals a wave
 *         from `sourceDepthM`, which is Green's law's reference — the depth
 *         where the source amplitude is defined, that is the water over the
 *         rupture, not the basin — and `extractTsunamiMeta` gives it the
 *         constant 4 000 m for every earthquake. That is a different question
 *         from this one, it moves the rows of the run-up rule, and it wants a
 *         round of its own;
 *       - whether a single depth is the right way to carry a path at all. A
 *         wave that crosses a trench, a rise and a shelf does not travel on a
 *         median; the product's own solver integrates the real bathymetry and
 *         the scalar rows do not. What these rules buy is that the scalar row
 *         is about the ocean rather than about the epicentre.
 */

import { m } from '../units.js';
import type { Meters } from '../units.js';

/** Rule 188: the depth a wave travels on when no caller knows better — the
 *  module's own default since it was written, and the number the globe's
 *  solver already used for every earthquake. */
export const DEFAULT_BASIN_DEPTH_M = 4_000;

/** Rule 188: how far around the source the store reads the sea to answer for
 *  the ocean the wave crosses. The rows this depth carries are quoted at
 *  1 000 km, and the planetary mosaic is about 40 km a cell, so this is a
 *  median over a basin and not over a bay. */
export const BASIN_SAMPLE_RADIUS_M = 1_000_000;

/** Rule 188: the shallowest sea the store will call a basin. Below this the
 *  sample is a shelf or a lagoon and the default stands. */
export const BASIN_MIN_DEPTH_M = 200;

/** Rule 190: what a DART record says about the speed of a wave. */
export interface CrestSpeedRow {
  event: string;
  station: string;
  distanceKm: number;
  /** Seconds from the origin to the crest at the buoy. */
  crestAfterS: number;
  /** Distance over time: a lower bound on the leading wave's celerity. */
  impliedSpeed: number;
  /** The water the buoy sits in (m). */
  buoyDepthM: number;
}

/** Rule 190: the reading, over the records kept. */
export interface CrestSpeedReading {
  records: number;
  events: number;
  /** Median of model celerity over the implied speed. */
  medianRatio: number;
  /** The share of records where the model is below the lower bound, and so
   *  certainly too slow. */
  certainlySlowShare: number;
}

/** Long-wave celerity, √(g·h) — the same relation `seismicTsunami.ts` uses,
 *  written here so the reading does not import the thing it reads. */
export function longWaveSpeed(depthM: number): number {
  return Math.sqrt(9.80665 * Math.max(depthM, 1));
}

export function readCrestSpeeds(
  rows: readonly CrestSpeedRow[],
  celerityFor: (row: CrestSpeedRow) => number
): CrestSpeedReading {
  const ratios = rows
    .filter((r) => r.impliedSpeed > 0)
    .map((r) => celerityFor(r) / r.impliedSpeed)
    .sort((a, b) => a - b);
  const middle = ratios[Math.floor(ratios.length / 2)] ?? Number.NaN;
  return {
    records: rows.length,
    events: new Set(rows.map((r) => r.event)).size,
    medianRatio: middle,
    certainlySlowShare:
      ratios.length === 0 ? 0 : ratios.filter((r) => r < 1).length / ratios.length,
  };
}

/** Rule 188: the basin depth a caller's sample gives, or none when the sample
 *  is too shallow to be a basin. Exported so the store and a test ask the
 *  same question. */
export function basinDepthFromSample(sampleM: number | null | undefined): Meters | undefined {
  if (sampleM === null || sampleM === undefined) return undefined;
  if (!Number.isFinite(sampleM) || sampleM < BASIN_MIN_DEPTH_M) return undefined;
  return m(sampleM);
}
