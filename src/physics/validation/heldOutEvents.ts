import { simulateEarthquake, type EarthquakeScenarioInput } from '../events/earthquake/simulate.js';
import { m } from '../units.js';
import type { CalibrationAnchor } from './calibrationEnvelope.js';
import type { RecordedEvent } from './recordedTolls.js';

/**
 * Checks held out of every fit, written down before the model was run
 * on them.
 *
 * Until 14 September 2026 no held-out row of the calibration net
 * checked a number the model had to get right: the held-out checks
 * that passed were all records of nothing, and every non-trivial pass
 * was on an event the model had been set on. docs/ROADMAP.md (M9,
 * move 0) listed that day, before any of them had been run, the events
 * that would change it. These are the earthquakes on that list.
 *
 * Why these five. All are after 2007, outside the 1973–2007 window
 * USGS PAGER's country fatality curves were fitted on (Jaiswal & Wald
 * 2010); all are shallow crustal events, the domain of the ground-motion
 * relations the rings are drawn with; none was looked at when those
 * relations were chosen, and nothing in the repository named any of
 * them before this file.
 *
 * The rules, fixed before the first run and applied to every row:
 *
 *   1. Magnitude (Mww), hypocentre depth and epicentre are the USGS
 *      ComCat preferred origin, read on 14 September 2026.
 *   2. The fault type comes from the two nodal planes of the preferred
 *      moment tensor: rake within 30° of 0° or 180° is strike-slip,
 *      between 30° and 150° reverse, between −150° and −30° normal. If
 *      the two planes fall in different bins the fault type is left
 *      unspecified ('all').
 *   3. Nothing else is set — no Vs30, no strike, no subduction flag —
 *      as for the earthquake rows already in the net. Vs30 takes the
 *      reference rock, and the offline harness counts people inside
 *      circles about the epicentre, so a strike could not move a row.
 *   4. The record is the death count of the NCEI/WDS Global Significant
 *      Earthquake Database (NOAA NCEI, doi:10.7289/V5TD9V7K), read on
 *      14 September 2026. Where a published source separates the deaths
 *      the earthquake caused directly from later, disaster-related ones,
 *      the direct count is the low end of the record and the database's
 *      the high end.
 *   5. The role is held out, and no row is gated: a gate that a result
 *      could fail would push someone to change the model or the row to
 *      make a release pass. Every row is measured and printed as it
 *      comes, and the model is not re-tuned on any of them.
 *   6. A row that misses is given its cause after the result is known,
 *      and the caveat says the cause was written afterwards.
 *
 * This file was committed before any of these events was run through
 * the model; the commit that puts them in the net comes after it, and
 * the order is in the history.
 */

const NCEI = 'NCEI/WDS Global Significant Earthquake Database (doi:10.7289/V5TD9V7K)';

const quake = (input: EarthquakeScenarioInput): RecordedEvent['run'] => {
  return () => ({ type: 'earthquake', data: simulateEarthquake(input) });
};

export const HELD_OUT_EARTHQUAKES: readonly RecordedEvent[] = [
  {
    name: 'Christchurch 2011',
    // USGS usp000huvq: Mww 6.1, depth 5.9 km. Preferred moment tensor
    // (W-phase CMT): rakes 156° and 33°, one plane strike-slip and the
    // other reverse, so the fault type is left unspecified.
    latitude: -43.583,
    longitude: 172.68,
    recordedDeaths: 185,
    source: `${NCEI}, event 9779: 185 deaths; USGS usp000huvq, Mww 6.1`,
    run: quake({ magnitude: 6.1, depth: m(5_900), faultType: 'all' }),
    gated: false,
    cause: 'buildingStock',
    caveat:
      'Held out, and a miss: 1 dead against 185, on a band that stops at 15. Written after the result, as the rules in heldOutEvents.ts require. New Zealand has no fatality curve of its own and borrows its region’s (θ = 37.8, β = 0.36): with all 265 529 people inside the model’s MMI VII ring shaken at MMI IX it would read about nine deaths, so the intensity alone cannot account for the miss. The rings are also a median on reference rock, 1.8 km of MMI VIII for an Mw 6.1. The band draws the shaking and holds the curve fixed, which is the declared gap this row makes visible.',
  },
  {
    name: 'Kumamoto 2016',
    // USGS us20005iis: Mww 7.0, depth 10 km. Mww moment tensor: rakes
    // −151° and −26°, both strike-slip.
    latitude: 32.7906,
    longitude: 130.7543,
    recordedDeaths: 273,
    recordedDeathsLow: 49,
    recordedDeathsHigh: 273,
    source: `${NCEI}, event 10177: 273 deaths, which include the disaster-related; 49 caused directly by building collapse and landslides (Fire and Disaster Management Agency, 1 July 2016, in Goda et al. 2016, Front. Built Environ. 2: 19); USGS us20005iis, Mww 7.0`,
    run: quake({ magnitude: 7.0, depth: m(10_000), faultType: 'strike-slip' }),
    gated: false,
    caveat:
      'Held out, and inside, on a band that says little: 1 to 12 168 dead, four orders of magnitude, against a record of 49 direct to 273 in all. Written after the result, as the rules in heldOutEvents.ts require. Japan’s own PAGER curve is among the steepest in the table (β = 0.10), so the shift in intensity that one sigma of ground motion makes moves the toll by orders of magnitude. The central estimate, 332, sits between the direct and the total count; the pass is recorded as it came, and it is not evidence of much.',
  },
  {
    name: 'Kaikōura 2016',
    // USGS us1000778i: Mww 7.8, depth 15.1 km. Mww moment tensor: rakes
    // 64° and 128°, both reverse. An extended source in the model; the
    // strike is not set (rule 3).
    latitude: -42.7373,
    longitude: 173.054,
    recordedDeaths: 2,
    source: `${NCEI}, event 10206: 2 deaths; USGS us1000778i, Mww 7.8`,
    run: quake({ magnitude: 7.8, depth: m(15_110), faultType: 'reverse' }),
    gated: false,
    cause: 'belowResolution',
    caveat:
      'Held out, and a miss by two: a band of 0 to 0 against 2 dead. Written after the result, as the rules in heldOutEvents.ts require. The rings about the epicentre hold 5 231 people, and the curve New Zealand borrows gives them about one twentieth of a death. A rate over a population cannot resolve a handful of deaths, and no band built from one could contain them.',
  },
  {
    name: 'Pohang 2017',
    // USGS us2000bnrs: Mww 5.5, depth 10 km. Mww moment tensor: rakes
    // 107.5° and 73.0°, both reverse.
    latitude: 36.0735,
    longitude: 129.28,
    recordedDeaths: 0,
    source: `${NCEI}, event 10277: no deaths recorded, 90 injured; USGS us2000bnrs, Mww 5.5`,
    run: quake({ magnitude: 5.5, depth: m(10_000), faultType: 'reverse' }),
    gated: false,
    cause: 'buildingStock',
    caveat:
      'Held out, and a miss the other way: 35 dead where nobody died, on a band of 1 to 17 877. Written after the result, as the rules in heldOutEvents.ts require. South Korea has no fatality curve of its own and borrows its region’s, one of the deadliest in the table (θ = 10.3, β = 0.10): inside the model’s MMI VII ring it kills about one in fifteen hundred of 52 188 people, where the city’s buildings killed none. The same steepness is what makes the band four orders of magnitude wide.',
  },
  {
    name: 'Durrës (Albania) 2019',
    // USGS us70006d0m: Mww 6.4, depth 22 km. Mww moment tensor: rakes
    // 91.7° and 89.1°, both reverse.
    latitude: 41.5138,
    longitude: 19.5256,
    recordedDeaths: 51,
    source: `${NCEI}, event 10461: 51 deaths; USGS us70006d0m, Mww 6.4`,
    run: quake({ magnitude: 6.4, depth: m(22_000), faultType: 'reverse' }),
    gated: false,
    caveat:
      'Held out, and inside: 16 dead against 51, on a band of 1 to 510. Written after the result, as the rules in heldOutEvents.ts require. Albania borrows its region’s curve (θ = 16.2, β = 0.22). The band spans nearly three orders of magnitude, which is weak evidence, but it is inside the span the gated rows are held to, so this is the first held-out death toll that is not a zero to land inside a band narrow enough to have been wrong.',
  },
];

const HELD_OUT_HOW =
  "Chosen on 14 September 2026 in docs/ROADMAP.md (M9, move 0) before the model was run on it, and put in the net under the rules in heldOutEvents.ts: after PAGER's 1973–2007 fitting window, not looked at when the ring relations were chosen, inputs from the USGS ComCat origin and moment tensor, record from the NCEI significant-earthquake database, no gate, no re-tuning.";

/** Their anchors, with the role each carries and why. */
export const HELD_OUT_EARTHQUAKE_ANCHORS: readonly CalibrationAnchor[] = [
  { name: 'Christchurch 2011', value: 6.1 },
  { name: 'Kumamoto 2016', value: 7.0 },
  { name: 'Kaikōura 2016', value: 7.8 },
  { name: 'Pohang 2017', value: 5.5 },
  { name: 'Durrës (Albania) 2019', value: 6.4 },
].map(
  ({ name, value }): CalibrationAnchor => ({
    name,
    eventType: 'earthquake',
    value,
    quantities: ['toll'],
    gated: [],
    source: HELD_OUT_EARTHQUAKES.find((e) => e.name === name)?.source ?? NCEI,
    use: { toll: { role: 'heldOut', how: HELD_OUT_HOW } },
  })
);
