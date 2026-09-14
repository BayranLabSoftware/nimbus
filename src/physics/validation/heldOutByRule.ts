import { DRE_DENSITY } from '../constants.js';
import { simulateEarthquake, type ContourLaw } from '../events/earthquake/simulate.js';
import { m } from '../units.js';
import type { PlumeHeightObservation } from './fixtures.js';
import {
  IVESPA_PLUME_ROWS,
  NCEI_EARTHQUAKE_ROWS,
  RULE_READ_ON,
  type RuleEarthquakeRow,
  type RulePlumeRow,
} from './heldOutByRuleData.js';
import type { RecordedEvent } from './recordedTolls.js';

/**
 * Held-out sets chosen by a rule, not from a list.
 *
 * The held-out rows in heldOutEvents.ts were named one by one, before
 * they were run, and that protects them from being chosen for their
 * result; it does not stop a list from being a sample of what someone
 * happened to think of, and eight rows cannot say whether a band holds
 * nine records in ten. The scorecard's first reading asked for sets
 * chosen by a rule instead (docs/ROADMAP.md, M9 move 0c): every event
 * a public database holds that the rule admits, whatever it reads.
 *
 * The rules, fixed before the model was run on any of these rows, and
 * numbered after the ten in heldOutEvents.ts:
 *
 *  11. Earthquakes: every record of the NCEI/WDS Global Significant
 *      Earthquake Database (doi:10.7289/V5TD9V7K) dated 2008 to 2025
 *      whose magnitude in the database is 6.0 or more and whose focal
 *      depth is 40 km or less, as the hazard-service API returns them
 *      for minYear=2008, maxYear=2025, minEqMagnitude=6, maxEqDepth=40:
 *      409 records, read on 14 September 2026. After 2007, outside the
 *      window PAGER's country curves were fitted on (rule 1's reason).
 *      NCEI's criteria admit an earthquake that did moderate damage
 *      (about a million dollars or more), killed ten or more, reached
 *      magnitude 7.5 or intensity X, or raised a tsunami, so the set
 *      leans towards the damaging: it holds few of the quiet events a
 *      false alarm would show on, and the rate of false alarms it
 *      measures is a floor.
 *  12. Inputs by rules 1 to 3: the ComCat event is the one within two
 *      minutes and 200 km of the database's origin, closest in time (on
 *      the day, closest in distance, where the database gives no time);
 *      a record with no such event is listed and left out, and records
 *      that share one are one row. Without a preferred moment tensor the
 *      fault type is 'all'. The magnitude, depth and epicentre are
 *      ComCat's, even where the database's put the record inside rule 11
 *      and ComCat's would not.
 *  13. The record is the database's deaths field, the earthquake's own
 *      effects — the total field is the one that adds an associated
 *      tsunami's and eruption's, as Tōhoku 2011's 1 474 and 18 423 show
 *      — and zero where none are listed.
 *      Where the database lists missing, the record's high end is the
 *      dead plus the missing.
 *  14. Roles. Held out, except L'Aquila 2009 and Amatrice 2016, which
 *      the shaking contours were chosen with in view (their rows in the
 *      net say how) and which are counted as tuned, apart. Six more have
 *      been run in the net and are not blind — Christchurch 2011,
 *      Kumamoto 2016, Kaikōura 2016, Durrës 2019, Gorkha 2015 and Tōhoku
 *      2011 — and stay in, because leaving out the rows already seen is
 *      a choice as well; the statistics are printed with them and
 *      without them.
 *  15. Eruption columns: every IVESPA phase from 2009 on, in the file
 *      the IVESPA working group published with its 2023 paper
 *      (IVESPA_GRL2023_data.xlsx; Aubry et al. 2021, data CC0): 37 of
 *      134. After the eruptions Mastin et al. 2009 fitted the relation
 *      on, the last of which in their Table 1 is Mount St Helens in March
 *      2005. Inputs and the inside rule are rule 8's, for every phase
 *      whatever its style or morphology. The three phases of Grímsvötn
 *      2011 and Calbuco 2015 are among them and, as rule 8 says, not
 *      blind.
 *  16. What is scored. Earthquakes run through the net's own harness
 *      (compareWithRecord in recordedTolls.ts): the shipped raster
 *      counted in circles about the epicentre, the country's PAGER curve
 *      at the epicentre, the 5–95 % band drawing the ground-motion
 *      residual and the curve's own scatter, inside when the band and
 *      the record overlap. Each set is scored with the scorecard's
 *      statistics (scorecard.ts), on the held-out rows, as a whole and
 *      by the scorecard's size bands — moment magnitude, and for a
 *      column the erupted mass as dense rock at 2 500 kg/m³. A band of
 *      nothing about a record of nothing is inside by construction, so
 *      the share of tolls inside is also given over the rows where the
 *      record or the band's high end is above zero; columns are also
 *      split by IVESPA's plume morphology. Rules 5 and 6 hold: nothing
 *      gated, nothing re-tuned. With four hundred rows no cause is
 *      written per row; what the misses have in common is written after
 *      the result, and says so.
 *
 * Corrected after the first run, and said here rather than folded in:
 * rule 16's harness counted an extended source — Mw 7.5 and above, in
 * the model and in any of a band's realisations — as circles about the
 * epicentre, while the simulator counts the rupture stadium. The
 * harness now counts the stadium (shippedStadiumCounter in
 * shippedPopulation.ts, held to the browser's polygon sum by its test).
 * The model was not changed. The first run's figures, circles and all,
 * stay in docs/SCIENCE.md, "Held out by rule"; the report prints the
 * stadium.
 *
 * This file, the rows it reads (heldOutByRuleData.ts, written by
 * scripts/held-out-by-rule.py) and its test were committed before any
 * row was run through the model; the commit that scores them comes
 * after, and the order is in the history.
 */

export type RuleRole = 'heldOut' | 'tuned';

/** ComCat events the shaking contours were chosen with in view (rule 14). */
export const RULE_TUNED_EARTHQUAKES: Readonly<Record<string, string>> = {
  usp000gvtu: "L'Aquila 2009",
  us10006g7d: 'Amatrice 2016',
};

/** ComCat events already run in the net, so not blind (rule 14). */
export const RULE_SEEN_EARTHQUAKES: Readonly<Record<string, string>> = {
  usp000huvq: 'Christchurch 2011',
  us20005iis: 'Kumamoto 2016',
  us1000778i: 'Kaikōura 2016',
  us70006d0m: 'Durrës (Albania) 2019',
  us20002926: 'Gorkha (Nepal) 2015',
  official20110311054624120_30: 'Tōhoku 2011',
};

/** IVESPA phases already in the net under rule 8, so not blind. */
export const RULE_SEEN_PLUMES: readonly string[] = ['GRI2011_01', 'CAL2015_01', 'CAL2015_02'];

export interface RuleEarthquake {
  row: RuleEarthquakeRow;
  event: RecordedEvent;
  role: RuleRole;
  seen: boolean;
}

export interface RulePlume {
  row: RulePlumeRow;
  observation: PlumeHeightObservation;
  /** Erupted mass as dense rock, m³: the scorecard's size axis. */
  volumeM3: number;
  role: RuleRole;
  seen: boolean;
}

const HOUR_S = 3_600;
const NCEI = 'NCEI/WDS Global Significant Earthquake Database (doi:10.7289/V5TD9V7K)';

/** A row as the net's toll harness runs it; `contourLaw` for rule 19,
 *  which runs the candidates on the same rows. */
export function ruleEarthquakeEvent(
  row: RuleEarthquakeRow,
  contourLaw?: ContourLaw
): RecordedEvent {
  return {
    // ComCat's time to the minute: the database lists some places twice
    // on one day, a foreshock and its mainshock.
    name: `${row.time.slice(0, 10)} ${row.time.slice(11, 16)} UTC, ${row.place}`,
    latitude: row.latitude,
    longitude: row.longitude,
    recordedDeaths: row.deaths,
    ...(row.missing > 0 ? { recordedDeathsHigh: row.deaths + row.missing } : {}),
    source: `${NCEI}, record ${row.nceiIds.join(' and ')}, read ${RULE_READ_ON}; origin, magnitude and moment tensor USGS ComCat ${row.comcat}`,
    run: () => ({
      type: 'earthquake',
      data: simulateEarthquake({
        magnitude: row.magnitude,
        depth: m(row.depthKm * 1_000),
        faultType: row.faultType,
        ...(contourLaw === undefined ? {} : { contourLaw }),
      }),
    }),
    gated: false,
  };
}

function plumeObservation(row: RulePlumeRow): PlumeHeightObservation {
  return {
    event: `${row.volcano} ${row.start.slice(0, 10)} (${row.ivespa})`,
    volumeEruptionRate: row.temKg / (row.durationH * HOUR_S) / (DRE_DENSITY as number),
    observedPlumeHeightKm: row.plumeTopKmAsl - row.ventAltitudeM / 1_000,
    toleranceKm: row.plumeTopUncertaintyKm,
    source: `IVESPA ${row.ivespa} (Aubry et al. 2021, data CC0), as published in IVESPA_GRL2023_data.xlsx`,
    gated: false,
  };
}

export const RULE_EARTHQUAKES: readonly RuleEarthquake[] = NCEI_EARTHQUAKE_ROWS.map((row) => ({
  row,
  event: ruleEarthquakeEvent(row),
  role: row.comcat in RULE_TUNED_EARTHQUAKES ? 'tuned' : 'heldOut',
  seen: row.comcat in RULE_SEEN_EARTHQUAKES,
}));

export const RULE_PLUMES: readonly RulePlume[] = IVESPA_PLUME_ROWS.map((row) => ({
  row,
  observation: plumeObservation(row),
  volumeM3: row.temKg / (DRE_DENSITY as number),
  role: 'heldOut',
  seen: RULE_SEEN_PLUMES.includes(row.ivespa),
}));
