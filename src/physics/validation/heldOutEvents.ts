import { DRE_DENSITY } from '../constants.js';
import { simulateEarthquake, type EarthquakeScenarioInput } from '../events/earthquake/simulate.js';
import { simulateVolcano, type VolcanoScenarioInput } from '../events/volcano/simulate.js';
import { m } from '../units.js';
import type { PlumeHeightObservation } from './fixtures.js';
import { globeVeilAt } from './globeVeil.js';
import { HELD_OUT_SOURCES } from './heldOutAnchors.js';
import type { RecordedEvent } from './recordedTolls.js';
import type { RecordedWave } from './recordedWaves.js';

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
 *      (That was the harness's error, found on 14 September 2026 after
 *      these rows had run: for an extended source, Mw 7.5 and above,
 *      the simulator counts the rupture stadium, and the harness now
 *      does too. With no strike set the stadium lies north to south, as
 *      the simulator draws it; only Kaikōura's row moved.)
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
 *
 * The second group, written down the same day and under the same
 * protocol, before any of it was run: the rest of the roadmap's list.
 *
 *   7. A wave: Illapel 2015 at DART 32402. Magnitude, depth and
 *      epicentre as rule 1. The plate interface is the preferred moment
 *      tensor's shallow nodal plane (strike 353°, dip 19°), so the
 *      rupture is a subduction interface with that strike. The buoy's
 *      position and water depth are NOAA NDBC's; range and bearing are
 *      computed on a sphere of 6 371 km. The record is the zero-to-crest
 *      maximum, 10.9 cm (Heidarzadeh et al. 2016) and 11 cm on the
 *      first crest (Tang et al. 2016), and the row accepts a factor of
 *      two either way, fixed before the run: a law of distance alone,
 *      with no bathymetry and no slip distribution, cannot claim better
 *      at a buoy its own papers call near field.
 *   8. Plumes: every IVESPA phase of Grímsvötn 2011 and Calbuco 2015
 *      (Aubry et al. 2021, data CC0), chosen by database ID whatever
 *      they read. The eruption rate is the total erupted mass over the
 *      phase's duration at the model's 2 500 kg/m³; the height is
 *      IVESPA's ash-plume-top best estimate less the vent altitude,
 *      with its uncertainty; a row is inside by the rule the plume rows
 *      already use. Not blind: Mastin's relation is one line, and its
 *      value for these inputs was computed while the sources were being
 *      read, before this file. Taking every phase is what keeps the
 *      check from being a choice.
 *   9. Volcanic tolls: Fuego 2018 and Unzen 1991. The vent is the
 *      Global Volcanism Program's position. The erupted volume is the
 *      bulk volume the sources give for the deposits of the event:
 *      Fuego's pyroclastic-flow deposits in every ravine, 49 × 10⁶ m³
 *      (Ferrés & Escobar Wolf 2018, Table 1; the fall is not measured
 *      there and is not added), and Unzen's 3 June flow, 0.6 × 10⁶ m³
 *      (Nakada & Fujii 1993, as given by Shimizu 2022). The eruption
 *      rate, which does not enter the toll, is Pardini et al. 2019's
 *      mass rate for Fuego, derived from the plume's height, and the
 *      mean discharge of Unzen's four years and three months of
 *      eruption, 2.1 × 10⁸ m³ (Nakada et al. 1999), both as volume at
 *      2 500 kg/m³. No evacuation radius is set: Fuego had no zone in
 *      force, and Unzen's advisory was drawn by district, with no radius
 *      a source gives. The record is dead plus missing in the latest
 *      official count; the confirmed dead are its low end and the
 *      highest official count of dead plus missing its high end.
 *  10. Rules 5 and 6 hold: held out, ungated, no re-tuning, and the
 *      cause of a miss written after the result and marked so.
 *
 * The lahar that reached Armero from Nevado del Ruiz in 1985 was on the
 * same list and is not here: the net has no quantity for how far a
 * lahar runs, and adding one is its own change.
 */

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
    source: HELD_OUT_SOURCES.christchurch,
    run: quake({ magnitude: 6.1, depth: m(5_900), faultType: 'all' }),
    gated: false,
    cause: 'buildingStock',
    caveat:
      'Held out, and a miss: 1 dead against 185, on a band that stopped at 15 on the first run and stops at 34 with the fatality curve’s own scatter drawn, added the same day. Written after the result, as the rules in heldOutEvents.ts require. New Zealand has no fatality curve of its own and borrows its region’s (θ = 37.8, β = 0.36): with all 265 529 people inside the model’s MMI VII ring shaken at MMI IX it would read about nine deaths, so the intensity alone cannot account for the miss. The rings are also a median on reference rock, 1.8 km of MMI VIII for an Mw 6.1. The band draws the shaking and holds the curve fixed, which is the declared gap this row makes visible. On Boore et al. 2014’s rings, adopted on 14 September 2026 by rule 19 of contourLaws.ts, 1 dead on 0 to 20; on the ground the browser reads under its epicentre, Vs30 612 m/s by rule 22 of siteVs30.ts, 1 on 0 to 26.',
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
    source: HELD_OUT_SOURCES.kumamoto,
    run: quake({ magnitude: 7.0, depth: m(10_000), faultType: 'strike-slip' }),
    gated: false,
    caveat:
      'Held out, and inside, on a band that says little: 1 to 12 168 dead on the first run, four orders of magnitude, and 1 to 62 577 with the fatality curve’s own scatter drawn, added the same day, against a record of 49 direct to 273 in all. Written after the result, as the rules in heldOutEvents.ts require. Japan’s own PAGER curve is among the steepest in the table (β = 0.10), so the shift in intensity that one sigma of ground motion makes moves the toll by orders of magnitude. The central estimate, 332, sits between the direct and the total count; the pass is recorded as it came, and it is not evidence of much. On Boore et al. 2014’s rings, adopted on 14 September 2026 by rule 19 of contourLaws.ts, 61 on 0 to 7 777; on the ground the browser reads under its epicentre, Vs30 306 m/s by rule 22 of siteVs30.ts, 198 on 0 to 19 404.',
  },
  {
    name: 'Kaikōura 2016',
    // USGS us1000778i: Mww 7.8, depth 15.1 km. Mww moment tensor: rakes
    // 64° and 128°, both reverse. An extended source in the model; the
    // strike is not set (rule 3).
    latitude: -42.7373,
    longitude: 173.054,
    recordedDeaths: 2,
    source: HELD_OUT_SOURCES.kaikoura,
    run: quake({ magnitude: 7.8, depth: m(15_110), faultType: 'reverse' }),
    gated: false,
    cause: 'belowResolution',
    caveat:
      'Held out, and a miss by two: a band of 0 to 0 on the first run and 0 to 1 with the fatality curve’s own scatter drawn, added the same day, against 2 dead. Written after the result, as the rules in heldOutEvents.ts require. The rings about the epicentre hold 5 231 people, and the curve New Zealand borrows gives them about one twentieth of a death. A rate over a population cannot resolve a handful of deaths, and no band built from one could contain them. Those rings were the harness’s circles; counted as the simulator counts an Mw 7.8, on the rupture stadium, the row reads 1 dead on a band of 0 to 30 and is inside — on the same resolution, one death more or less. On Boore et al. 2014’s rings, adopted on 14 September 2026 by rule 19 of contourLaws.ts, 0 on 0 to 14, and the same on the ground the browser reads under its epicentre, where the slope reads rock, 760 m/s (rule 22 of siteVs30.ts).',
  },
  {
    name: 'Pohang 2017',
    // USGS us2000bnrs: Mww 5.5, depth 10 km. Mww moment tensor: rakes
    // 107.5° and 73.0°, both reverse.
    latitude: 36.0735,
    longitude: 129.28,
    recordedDeaths: 0,
    source: HELD_OUT_SOURCES.pohang,
    run: quake({ magnitude: 5.5, depth: m(10_000), faultType: 'reverse' }),
    gated: false,
    cause: 'buildingStock',
    caveat:
      'Held out, and a miss the other way: 35 dead where nobody died, on a band of 1 to 17 877 on the first run and 1 to 29 628 with the fatality curve’s own scatter drawn, added the same day. Written after the result, as the rules in heldOutEvents.ts require. South Korea has no fatality curve of its own and borrows its region’s, one of the deadliest in the table (θ = 10.3, β = 0.10): inside the model’s MMI VII ring it kills about one in fifteen hundred of 52 188 people, where the city’s buildings killed none. The same steepness is what makes the band four orders of magnitude wide. On Boore et al. 2014’s rings, adopted on 14 September 2026 by rule 19 of contourLaws.ts, 32 on 0 to 12 386, a band that now reaches down to the record of none; on the ground the browser reads under its epicentre, Vs30 509 m/s by rule 22 of siteVs30.ts, 135 on 0 to 36 916.',
  },
  {
    name: 'Durrës (Albania) 2019',
    // USGS us70006d0m: Mww 6.4, depth 22 km. Mww moment tensor: rakes
    // 91.7° and 89.1°, both reverse.
    latitude: 41.5138,
    longitude: 19.5256,
    recordedDeaths: 51,
    source: HELD_OUT_SOURCES.durres,
    run: quake({ magnitude: 6.4, depth: m(22_000), faultType: 'reverse' }),
    gated: false,
    caveat:
      'Held out, and inside: 16 dead against 51, on a band of 1 to 510 on the first run and 1 to 1 425 with the fatality curve’s own scatter drawn, added the same day. Written after the result, as the rules in heldOutEvents.ts require. Albania borrows its region’s curve (θ = 16.2, β = 0.22). The band spans about three orders of magnitude, which is weak evidence, but it is inside the span the gated rows are held to, so this is the first held-out death toll that is not a zero to land inside a band narrow enough to have been wrong. On Boore et al. 2014’s rings, adopted on 14 September 2026 by rule 19 of contourLaws.ts, 3 on 0 to 453; on the ground the browser reads under its epicentre, Vs30 298 m/s by rule 22 of siteVs30.ts, 15 on 0 to 1 833.',
  },
];

const HOUR_S = 3_600;
const YEAR_S = 365.25 * 24 * HOUR_S;

/** A volume rate of dense rock from a mass and the time it took. */
const rateFromMass = (massKg: number, durationS: number): number =>
  massKg / durationS / (DRE_DENSITY as number);

const volcano = (input: VolcanoScenarioInput): RecordedEvent['run'] => {
  return () => ({ type: 'volcano', data: simulateVolcano(input) });
};

/** Great circle from the USGS epicentre (31.5729 °S, 71.6744 °W) to
 *  DART 32402 (26.743 °S, 73.983 °W), on a sphere of 6 371 km. */
export const ILLAPEL_TO_DART_32402_M = 581_900;

export const HELD_OUT_WAVES: readonly RecordedWave[] = [
  {
    name: 'Illapel 2015 at DART 32402',
    observed: { low: 0.109 / 2, high: 0.11 * 2, atRangeM: ILLAPEL_TO_DART_32402_M },
    source: HELD_OUT_SOURCES.illapel,
    model: () =>
      globeVeilAt(
        {
          type: 'earthquake',
          data: simulateEarthquake({
            // USGS us20003k7a: Mww 8.3, depth 22.44 km. Preferred moment
            // tensor: 180/71/92 and 353/19/83; the shallow plane is the
            // interface.
            magnitude: 8.3,
            depth: m(22_440),
            faultType: 'reverse',
            subductionInterface: true,
            strikeAzimuthDeg: 353,
          }),
        },
        ILLAPEL_TO_DART_32402_M,
        // The buoy lies at a bearing of 337° from the epicentre, 16° off
        // the strike, over 4 070 m of water.
        { depthM: 4_070, bearingDeg: 337 }
      ),
    gated: false,
    caveat:
      'Held out, and inside: 0.106 m against 10.9 to 11 cm, 0.97×. Written after the result, as the rules in heldOutEvents.ts require. The megathrust uplift factor was set on DART 21413 for Tōhoku; this is the first buoy it was not set on, for an earthquake some fifteen times smaller in moment at under half the distance, and it lands on the record. One buoy, near the source; the rows that would show whether it holds across a basin are still to come.',
  },
];

export const HELD_OUT_PLUMES: readonly PlumeHeightObservation[] = [
  {
    event: 'Grímsvötn 2011',
    volumeEruptionRate: rateFromMass(7.29e11, 27 * HOUR_S),
    observedPlumeHeightKm: 16 - 1.45,
    toleranceKm: 4,
    source: HELD_OUT_SOURCES.grimsvotn,
    gated: false,
  },
  {
    event: 'Calbuco 2015 (22 April)',
    volumeEruptionRate: rateFromMass(1.01e11, 1.5 * HOUR_S),
    observedPlumeHeightKm: 20 - 2.003,
    toleranceKm: 3,
    source: HELD_OUT_SOURCES.calbuco,
    gated: false,
  },
  {
    event: 'Calbuco 2015 (23 April)',
    volumeEruptionRate: rateFromMass(2.81e11, 6.12 * HOUR_S),
    observedPlumeHeightKm: 21 - 2.003,
    toleranceKm: 3,
    source: HELD_OUT_SOURCES.calbuco,
    gated: false,
  },
];

export const HELD_OUT_VOLCANO_TOLLS: readonly RecordedEvent[] = [
  {
    name: 'Fuego 2018',
    latitude: 14.4748,
    longitude: -90.8806,
    recordedDeaths: 430,
    recordedDeathsLow: 201,
    recordedDeathsHigh: 445,
    source: HELD_OUT_SOURCES.fuego,
    run: volcano({
      // Pardini et al. 2019, Table 1: 1.17 × 10⁷ kg/s over the ~2.5 h
      // climax, from the plume's height.
      volumeEruptionRate: 1.17e7 / (DRE_DENSITY as number),
      totalEjectaVolume: 49e6,
    }),
    gated: false,
    caveat:
      'Held out, and inside for the wrong reasons: 187 dead against 201 to 445. Written after the result, as the rules in heldOutEvents.ts require. The model’s current is a disc 3.7 km round the summit, L = 10 · V^⅓ on 49 × 10⁶ m³ with a project mobility, and the raster puts 207 people inside it. The current that killed ran 11.7 km down the Las Lajas ravine; a disc reaching as far would hold about 110 000. A reach three times short and a footprint that is a disc rather than a ravine land near the record by cancelling, and a pass made of them is not evidence.',
  },
  {
    name: 'Unzen 1991',
    latitude: 32.761,
    longitude: 130.299,
    recordedDeaths: 43,
    recordedDeathsLow: 40,
    recordedDeathsHigh: 43,
    source: HELD_OUT_SOURCES.unzen,
    run: volcano({
      volumeEruptionRate: 2.1e8 / (4.25 * YEAR_S),
      totalEjectaVolume: 0.6e6,
    }),
    gated: false,
    cause: 'occupancy',
    caveat:
      'Held out, and a miss: 10 dead against 40 to 43. Written after the result, as the rules in heldOutEvents.ts require. The model’s current reaches 0.84 km from the summit, where the raster puts 12 residents; the flow ran 3.2 km and its surge about 4, four times as far. And the 43 were mostly not residents: journalists, firefighters and police, with four taxi drivers and three volcanologists, inside a valley its residents had been advised to leave. A map of where people live cannot hold them, and a longer reach alone would not have found them.',
  },
];
