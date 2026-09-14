import { simulateEarthquake, type ContourLaw } from '../events/earthquake/simulate.js';
import { m } from '../units.js';
import type { ShakemapAreas } from './contourLaws.js';
import { isQuiet, QUIET_DEATHS_BELOW, type UnseenEarthquake } from './depthRules.js';
import { centralEstimate, type RecordedEvent } from './recordedTolls.js';

/**
 * Rule 23's earthquakes as the harness runs them: the toll harness's
 * events, the footprints rule 24 scores, and the medians rule 25 counts.
 */

const NCEI = 'NCEI/WDS Global Significant Earthquake Database (doi:10.7289/V5TD9V7K)';

export function unseenEarthquakeEvent(
  row: UnseenEarthquake,
  options: { contourLaw?: ContourLaw; vs30?: number | undefined } = {}
): RecordedEvent {
  const { contourLaw, vs30 } = options;
  const quiet = isQuiet(row);
  return {
    name: `${row.time.slice(0, 10)} ${row.time.slice(11, 16)} UTC, ${row.place}`,
    latitude: row.latitude,
    longitude: row.longitude,
    recordedDeaths: quiet ? 0 : row.deaths,
    ...(quiet
      ? { recordedDeathsHigh: QUIET_DEATHS_BELOW - 1 }
      : row.missing > 0
        ? { recordedDeathsHigh: row.deaths + row.missing }
        : {}),
    source: quiet
      ? `Not in the ${NCEI} (rule 23): fewer than ten dead; origin, magnitude and moment tensor USGS ComCat ${row.comcat}`
      : `${NCEI}, record ${row.ncei.join(' and ')}; origin, magnitude and moment tensor USGS ComCat ${row.comcat}`,
    run: () => ({
      type: 'earthquake',
      data: simulateEarthquake({
        magnitude: row.magnitude,
        depth: m(row.depthKm * 1_000),
        faultType: row.faultType,
        ...(contourLaw === undefined ? {} : { contourLaw }),
        ...(vs30 === undefined ? {} : { vs30 }),
      }),
    }),
    gated: false,
  };
}

/** The set's ShakeMap footprints, in the shape rule 18 scores. */
export function unseenShakemaps(rows: readonly UnseenEarthquake[]): ShakemapAreas[] {
  return rows.map((row) => ({ comcat: row.comcat, maxMmi: row.maxMmi, areaKm2: row.areaKm2 }));
}

/** Rule 25: every quiet earthquake's median toll under one law — the
 *  toll of its median scenario, the harness's central figure. */
export function quietMedianTolls(
  rows: readonly UnseenEarthquake[],
  law: ContourLaw,
  vs30For: (row: UnseenEarthquake) => number | undefined
): number[] {
  return rows
    .filter(isQuiet)
    .map(
      (row) =>
        centralEstimate(unseenEarthquakeEvent(row, { contourLaw: law, vs30: vs30For(row) }))
          ?.deaths ?? 0
    );
}
