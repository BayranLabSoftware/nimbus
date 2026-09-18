import {
  bandFromPlans,
  exposureCurve,
  populationWithin,
  sampleScenarioPlans,
  samplingFootprints,
  type ExposurePoint,
  type PredictiveBand,
} from '../uq/tollBand.js';
import type { TollBandScatter } from './tollBandRules.js';
import type { ActiveResult } from '../../store/useAppStore.js';
import { casualtyPlanForResult, configureCountryLookup } from '../../store/useAppStore.js';
import {
  estimateCasualties,
  type CasualtyBand,
  type CasualtyEstimate,
  type CasualtyPlan,
} from '../casualties.js';
import { EXPLOSION_PRESETS, simulateExplosion } from '../events/explosion/simulate.js';
import { EARTHQUAKE_PRESETS, simulateEarthquake } from '../events/earthquake/simulate.js';
import { VOLCANO_PRESETS, simulateVolcano } from '../events/volcano/simulate.js';
import { HELD_OUT_EARTHQUAKES, HELD_OUT_VOLCANO_TOLLS } from './heldOutEvents.js';
import { siteVs30 } from './siteVs30.js';
import { NET_SITES } from './siteVs30Data.js';
import {
  shippedCountryAt,
  shippedPopulationInPolygon,
  shippedPopulationInRadius,
  shippedStadiumCounter,
} from './shippedPopulation.js';

/**
 * Events with a recorded death toll, and where the simulator lands.
 *
 * The casualty model can be checked against the world, because the
 * world has already run some of these experiments and counted the
 * dead. This is the list of the ones worth checking and, just as
 * important, the reasons the others are not on it.
 *
 * The test that consumes this asks one question of each row: does the
 * model's own low–high band contain the number that was counted? That
 * is what declaring an uncertainty means. A band that misses is either
 * a wrong model or a dishonest band, and both are worth a red test.
 *
 * Two things the harness cannot do, stated here rather than buried:
 *
 *   - It reads the shipped 2.5′ and 0.125° rasters, not the WorldPop
 *     zonal-statistics API, which is finer over a city and which no
 *     offline test can reach.
 *   - It has no bathymetry, so no wave: the coastal toll is absent.
 *     Events whose dead were drowned are therefore reported and not
 *     gated, and Tōhoku is the obvious one.
 *
 * And one thing it must not pretend: the rasters are 2020. Where the
 * population at the time of the event was materially different the row
 * says so and leaves the gate, because a model cannot be blamed for
 * counting the people who live there now.
 */

export interface RecordedEvent {
  /** Short label for the report. */
  name: string;
  /** Where it happened (° WGS84). */
  latitude: number;
  longitude: number;
  /** The counted dead, and where the count comes from. */
  recordedDeaths: number;
  /** Some counts are themselves a range; the low end, when they are. */
  recordedDeathsLow?: number;
  recordedDeathsHigh?: number;
  source: string;
  /** Build the simulator result for this event. */
  run: () => ActiveResult;
  /** Whether the row is allowed to fail the suite. Rows that are not
   *  gated are still measured and printed — they carry a reason. */
  gated: boolean;
  /** Why a row is not gated, or what to know about one that is. */
  caveat?: string;
  /**
   * What a row's distance from its record is made of, as one of a
   * short list of named causes. The caveat says it in full, in the
   * register a reviewer reads; the cause is what the public
   * validation page groups the rows by and explains in two languages.
   * A row whose band misses its record must carry one — a miss with
   * no named cause is a miss nobody has understood, and
   * `recordedTolls.test.ts` refuses it.
   */
  cause?: TollCause;
}

/** The named causes a toll row can stand at its distance for. */
export type TollCause =
  /** People had left before it arrived, and the model counts everyone
   *  who lived there. */
  | 'evacuation'
  /** A national fatality curve applied to a building stock that is
   *  not the nation's average — village masonry, valley brick. */
  | 'buildingStock'
  /** The population raster is coarser than the footprint. */
  | 'populationRaster'
  /** The dead drowned, and no offline test has the bathymetry the
   *  wave needs: the row is the shaking alone. */
  | 'drownedOffline'
  /** The raster counts who lives there now, not who lived there then. */
  | 'populationChanged'
  /** The map counts where people live, not who was in the footprint at
   *  the hour it struck. */
  | 'occupancy'
  /** The dead were killed by something the model does not simulate. */
  | 'mechanismNotModelled'
  /** A handful of deaths among few people: a fatality rate over a
   *  population rounds them to none. */
  | 'belowResolution'
  /** The intensity rings of a great rupture are a law for a point
   *  stretched along the fault, and paint far more ground at high
   *  intensity than the earthquake shook (docs/ROADMAP.md, M9 move 4). */
  | 'footprint';

export const TOLL_CAUSES: readonly TollCause[] = [
  'evacuation',
  'buildingStock',
  'populationRaster',
  'drownedOffline',
  'populationChanged',
  'occupancy',
  'mechanismNotModelled',
  'belowResolution',
  'footprint',
];

const quake = (preset: keyof typeof EARTHQUAKE_PRESETS): (() => ActiveResult) => {
  return () => ({ type: 'earthquake', data: simulateEarthquake(EARTHQUAKE_PRESETS[preset].input) });
};

const blast = (preset: keyof typeof EXPLOSION_PRESETS): (() => ActiveResult) => {
  return () => ({ type: 'explosion', data: simulateExplosion(EXPLOSION_PRESETS[preset].input) });
};
const volcano = (preset: keyof typeof VOLCANO_PRESETS): (() => ActiveResult) => {
  return () => ({ type: 'volcano', data: simulateVolcano(VOLCANO_PRESETS[preset].input) });
};

const NET_ROWS: RecordedEvent[] = [
  {
    name: 'Kokoxili (Kunlun) 2001',
    latitude: 35.95,
    longitude: 90.54,
    recordedDeaths: 0,
    source:
      'USGS: Mw 7.8, 400 km surface rupture across uninhabited Tibetan plateau; no deaths reported',
    run: quake('KUNLUN_2001'),
    gated: true,
    caveat:
      'The zero. A model that cannot produce it has learned to kill people who are not there.',
  },
  {
    name: 'Northridge 1994',
    latitude: 34.213,
    longitude: -118.537,
    recordedDeaths: 57,
    source: 'USGS / California OES: 57 deaths, Mw 6.7 blind thrust under the San Fernando Valley',
    run: quake('NORTHRIDGE_1994'),
    gated: true,
  },
  {
    name: "L'Aquila 2009",
    latitude: 42.3476,
    longitude: 13.38,
    recordedDeaths: 309,
    source: 'Italian Civil Protection: 309 deaths, Mw 6.3',
    run: quake('L_AQUILA_2009'),
    gated: false,
    caveat:
      'Ungated on 14 September 2026, as rule 19 of contourLaws.ts requires of a row that leaves its gate when the rings change: on Boore et al. 2014’s rings it reads 40 dead on a band of 1 to 4 622 against 309 (43 on 2 to 4 642 on the ground the browser reads under its epicentre, Vs30 735 m/s, by rule 22 of siteVs30.ts) — inside, on a band past the three and a half orders of magnitude a gated row may span. On Joyner & Boore 1981’s it read 227 on 4 to 9 480.',
  },
  {
    name: 'Amatrice 2016',
    latitude: 42.7233,
    longitude: 13.1883,
    recordedDeaths: 299,
    source: 'Italian Civil Protection: 299 deaths, Mw 6.2',
    run: quake('AMATRICE_2016'),
    cause: 'buildingStock',
    gated: false,
    caveat:
      'Ungated on 9 September, and it is the band that changed rather than the model. This row passed on a span of 0 to 91 dead, which contains 299 the way a net with metre-wide holes contains a fish; the predictive interval from the published input scatter was 0 to 114, then 0 to 175 once the ground-motion residual was corrected from a misquoted 0.50 to the 0.60 Boore et al. 2014 give, and the record stayed outside both. On 14 September the band also began to draw the fatality curve’s own scatter, Italy’s G of 1.96, and it is 0 to 490 now: the record is inside, on a central estimate of 6, a fiftieth of it. Amatrice killed 299 in medieval masonry villages at MMI VII, where the Italian national fatality curve — made mostly on larger and broader events — reads a fiftieth of that. See M8, "a national curve under-predicts a village". On Boore et al. 2014’s rings, adopted on 14 September 2026 by rule 19 of contourLaws.ts, it reads 1 dead on a band of 0 to 131, and the record is outside again. On the ground the browser reads under its epicentre, Vs30 610 m/s by rule 22 of siteVs30.ts, 1 on 0 to 236.',
  },
  {
    name: 'Gorkha (Nepal) 2015',
    latitude: 28.2305,
    longitude: 84.7314,
    recordedDeaths: 8964,
    source: 'Government of Nepal: 8 964 deaths, Mw 7.8',
    run: quake('NEPAL_2015'),
    cause: 'buildingStock',
    gated: false,
    caveat:
      "Ungated on 9 September for the same reason as Amatrice: it passed on a band of 1 to 13 428, and the predictive interval was 22 to 4 924, then 13 to 6 942 with the ground-motion residual corrected to 0.60, and neither contained 8 964. With the fatality curve's own scatter drawn from 14 September — Nepal's G is 2.5, the widest in PAGER's table — it was 2 to 72 166, which contained the record by spanning almost five orders of magnitude: a statement about how little the curve knows, not a pass. Nepal borrows its region's PAGER curve rather than having its own, and Gorkha killed in the brick of the Kathmandu valley. Until the same day these figures counted a circle about the epicentre, where the simulator counts the rupture stadium an Mw 7.8 is drawn as; counted as the simulator counts it, the row reads 17 699 dead, twice the record, on a band of 118 to 1 255 286 — inside by four orders of magnitude, which is the same statement again. On Boore et al. 2014's rings, adopted on 14 September 2026 by rule 19 of contourLaws.ts, 2 983 on 12 to 735 884. On the ground the browser reads under its epicentre, Vs30 405 m/s by rule 22 of siteVs30.ts, 5 356 on 43 to 934 524.",
  },
  {
    name: 'Beirut 2020',
    latitude: 33.9014,
    longitude: 35.5186,
    recordedDeaths: 218,
    source: 'Lebanese Ministry of Health: 218 deaths, ~2.75 kt ammonium nitrate detonation',
    run: blast('BEIRUT_2020'),
    cause: 'populationRaster',
    gated: false,
    caveat:
      "Was fifty times high on the first run, which was OTA 1979 — read off two nuclear attacks on light-timber cities — being applied to ammonium nitrate in reinforced concrete. Taking away the flash it never had, the mass fire it could not start, and the destroyed-hospital assumption that belongs to a country under attack brought it to 4.1x. On 14 September 2026 the blast itself was corrected — a charge on the ground reflects its blast and acts like twice its yield in the free-air fit the rings use (Takazawa, Kim & Garcés 2023) — and the rings grew by a quarter, taking the row to 6.6x, 1 296 to 1 586 on a predictive interval that is the ten per cent a charge's yield actually varies by (until later that day the interval also drew the charge up to a hundred metres above the quay, and read 1 297 to 2 433). That is the right shape for this row, because what is left is neither scatter in the charge nor the blast but the raster underneath and the conventional mortality bands, which were composed with this row in view and not refitted after the correction: at a few hundred metres the rings are far smaller than a population cell, so the model spreads Beirut's average density across a port basin where nobody lives. The WorldPop API at 100 m would see the difference; no offline test can reach it. On 18 September 2026 the rings moved again, by a few per cent each way: a charge on the ground is now Kingery–Bulmash's own surface burst rather than the free-air fit at twice the yield (rules 177 to 181), and the row reads 1 423 at 6.53x. Nothing was re-tuned for it.",
  },
  {
    name: 'Mount St Helens 1980',
    latitude: 46.1912,
    longitude: -122.1944,
    recordedDeaths: 57,
    source:
      'USGS: 57 deaths; only three were inside the red zone, most in areas that had been considered safe',
    run: volcano('MT_ST_HELENS_1980'),
    cause: 'occupancy',
    gated: false,
    caveat:
      "Not evacuation, and that took a measurement to see. This row was filed under it until 14 September: 264 of the model's 265 dead are in the lateral-blast sector between 11 and 27 km, and the record agrees that the dead were not in the closed zones — only three of the 57 were inside the Red Zone, most in areas that had been considered safe. So the model is right to count that sector as unwarned, and the preset carries no cleared zone. (Until 14 September this note said the preset had been given one; it never was.) What it cannot know is who was in it: the population map puts 586 residents there, and the blast came at 08:32 on a Sunday, into logging land whose crews were not working. The predictive interval is 120 to 692 against 57.",
  },
  {
    name: 'Pinatubo 1991',
    latitude: 15.13,
    longitude: 120.35,
    recordedDeaths: 847,
    source:
      'USGS/PHIVOLCS: ~847 deaths, most from roofs collapsing under wet ash during Typhoon Yunya',
    run: volcano('PINATUBO_1991'),
    cause: 'mechanismNotModelled',
    gated: false,
    caveat:
      "The model now knows the zone was cleared — PHIVOLCS widened it to 40 km before the climax — and reads 82 dead where it read 82 477: the currents' mortality in a cleared zone, measured at Merapi in 2010, over the 91 641 people the map puts inside their reach. It misses the 847 counted from below, and should: most of Pinatubo's dead were killed by roofs collapsing under ash wetted by Typhoon Yunya, and by disease in the evacuation camps, neither of which this model simulates. Rounding the Merapi ratio up to one per cent, as the band's high end does, would land the toll within ten per cent of the record — for the wrong dead.",
  },
  {
    name: 'Hiroshima 1945',
    latitude: 34.3955,
    longitude: 132.4553,
    recordedDeaths: 105_000,
    recordedDeathsLow: 70_000,
    recordedDeathsHigh: 140_000,
    source:
      'Manhattan Engineer District 1946 and later Japanese surveys; the range is the historical dispute',
    run: blast('HIROSHIMA_1945'),
    cause: 'populationChanged',
    gated: false,
    caveat:
      'Hiroshima held about 350 000 people in 1945 and about 1.2 million today; the raster counts the living, so the model must overshoot by roughly that ratio.',
  },
  {
    name: 'Tōhoku 2011',
    latitude: 38.297,
    longitude: 142.373,
    recordedDeaths: 18_500,
    source: 'Japanese National Police Agency: 15 900 dead and 2 500 missing',
    run: quake('TOHOKU_2011'),
    cause: 'footprint',
    gated: false,
    caveat:
      'Over 90 % of the dead drowned. This harness has no bathymetry and therefore no wave, so the number here is the shaking alone, and until 14 September 2026 it was far below the record — 0 dead on a band of 0 to 5 — because the harness counted a circle about an epicentre at sea. Counted as the simulator counts it, on the rupture stadium along the coast, the shaking alone reads 177 033 dead on a band of 2 529 to 2 969 170: nearly ten times the whole record, drowned included, where NCEI gives the earthquake’s own effects 1 474. Inside only because the band spans three orders of magnitude. The intensity rings are Joyner–Boore 1981 stretched along a megathrust, and painted three times the area of MMI VIII that USGS ShakeMap measured and 180 000 km² of MMI IX where it measured none. On Boore et al. 2014’s rings, adopted on 14 September 2026 by rule 19 of contourLaws.ts, the shaking alone reads 4 505 on 7 to 1 042 546: three times NCEI’s count for the earthquake’s own effects, the MMI VIII area 2.5 times the ShakeMap’s, and no MMI IX. On the ground the browser reads under its epicentre, the sea floor’s Vs30 337 m/s by rule 22 of siteVs30.ts, 7 997 on 8 to 1 204 212, with the MMI VIII area 2.8 times the ShakeMap’s.',
  },
  {
    name: 'Sumatra–Andaman 2004',
    latitude: 3.316,
    longitude: 95.854,
    recordedDeaths: 227_898,
    source: 'UN Office of the Special Envoy for Tsunami Recovery',
    run: quake('SUMATRA_2004'),
    cause: 'drownedOffline',
    gated: false,
    caveat:
      'Drowning again, and again without a wave here. Reported for the shaking only: since 14 September 2026 counted on the rupture stadium the simulator draws, 31 427 dead on a band of 1 552 to 329 255, where the circle about the epicentre had counted 1. On Boore et al. 2014’s rings, adopted on 14 September 2026 by rule 19 of contourLaws.ts, 3 449 on 43 to 188 378. On the ground the browser reads under its epicentre, the sea floor’s Vs30 369 m/s by rule 22 of siteVs30.ts, 4 263 on 115 to 277 275: a band that now holds the record, for a figure that is the shaking alone.',
  },
  // Held out of every fit, and written down before they were run:
  // heldOutEvents.ts has the rules they came in under.
  ...HELD_OUT_EARTHQUAKES,
  ...HELD_OUT_VOLCANO_TOLLS,
];

/**
 * An earthquake of the net stands on the ground the browser reads under
 * its epicentre.
 *
 * With no Vs30 typed in, the store gives the simulator Wald & Allen's
 * Vs30 of the slope on the terrain tile under the pick, and until 14
 * September 2026 this harness ran every earthquake on reference rock
 * instead. Rules 20 to 22 of siteVs30.ts measured the browser's ground
 * under every epicentre (siteVs30Data.ts), chose between it, rock and
 * rock under the sea, and kept the browser's; rule 22 puts the harness
 * on it. A row that sets its own Vs30 keeps it.
 */
function onTheBrowsersGround(event: RecordedEvent): RecordedEvent {
  const vs30 = siteVs30(
    'pick',
    NET_SITES.find((site) => site.key === event.name)
  );
  if (vs30 === undefined) return event;
  const run = event.run;
  return {
    ...event,
    run: () => {
      const result = run();
      if (result.type !== 'earthquake' || result.data.inputs.vs30 !== undefined) return result;
      return { type: 'earthquake', data: simulateEarthquake({ ...result.data.inputs, vs30 }) };
    },
  };
}

export const RECORDED_EVENTS: RecordedEvent[] = NET_ROWS.map(onTheBrowsersGround);

export interface TollComparison {
  event: RecordedEvent;
  estimate: CasualtyEstimate | null;
  /** The model's central figure, and its band. */
  deaths: number;
  low: number;
  high: number;
  /** Whether the band contains the recorded number. */
  contains: boolean;
  /** Central figure over the record; Infinity when the record is zero
   *  and the model is not. */
  ratio: number;
}

/**
 * Run one event through the same plan builder the application uses,
 * feed it the shipped rasters, and compare the band with the record.
 */
/**
 * The fifth and ninety-fifth percentiles of the toll under the
 * published input scatter, with the population held fixed — the
 * raster is the same in every realisation, so what is sampled is the
 * physics and not the census.
 *
 * The estimator is the one the application ships, in
 * `uq/tollBand.ts`; the only thing that differs here is where the
 * people come from. The browser interpolates a curve from the three
 * or four circles it could afford to query; this harness can afford
 * to query the raster at every radius a realisation asks for, and
 * does. `interpolationCost` below measures what that difference is
 * worth, which is the only way to know the shipped band is a
 * statement about the earth and not about the interpolation.
 *
 * Seeded per event, so a band never moves between runs of the suite
 * without something else having moved first.
 */
export function sampleToll(
  event: RecordedEvent,
  populationAt?: (radiusM: number, band: CasualtyBand) => number,
  curveScatter = true,
  /** What a realisation draws (rules 182 to 186 of tollBandRules.ts). The
   *  guard of rule 184 reads both settings on the same rows. */
  scatter?: TollBandScatter
): PredictiveBand | null {
  const location = { latitude: event.latitude, longitude: event.longitude };
  const result = event.run();
  // An extended source's bands are rupture stadiums, each realisation
  // with its own rupture. The plan builder knows the rupture and the
  // band only its polygon, which survives the copies a band goes
  // through, so the rupture is remembered by the polygon.
  const ruptures = new WeakMap<object, { halfLengthM: number; halfWidthM: number }>();
  const plans = sampleScenarioPlans({
    result,
    planFor: (r) => {
      const plan = casualtyPlanForResult(r, location);
      if (plan !== null && r.type === 'earthquake' && r.data.isExtendedSource) {
        for (const band of plan.bands) {
          if (band.polygon === undefined) continue;
          ruptures.set(band.polygon, {
            halfLengthM: (r.data.ruptureLength as number) / 2,
            halfWidthM: (r.data.ruptureWidth as number) / 2,
          });
        }
      }
      return plan;
    },
    seed: `${event.name}:${event.recordedDeaths.toString()}`,
    curveScatter,
    ...(scatter === undefined ? {} : { scatter }),
  });
  return bandFromPlans(plans, populationAt ?? measuredPopulation(event, result, plans, ruptures));
}

/**
 * The people inside each footprint a realisation asks for, read off the
 * raster: a circle about the epicentre, or the rupture stadium the
 * simulator counts for an extended source. Until 14 September 2026 the
 * stadium was counted as the circle of its contour radius, and an
 * offshore megathrust's stadium, which runs along the coast, as a
 * circle at sea.
 */
function measuredPopulation(
  event: RecordedEvent,
  result: ActiveResult,
  plans: readonly CasualtyPlan[],
  ruptures: WeakMap<object, { halfLengthM: number; halfWidthM: number }>
): (radiusM: number, band: CasualtyBand) => number {
  const circle = (radiusM: number): number =>
    shippedPopulationInRadius(event.latitude, event.longitude, radiusM).exposed;
  if (result.type !== 'earthquake') return circle;
  let reachM = 0;
  for (const plan of plans) {
    for (const band of plan.bands) {
      const rupture = band.polygon === undefined ? undefined : ruptures.get(band.polygon);
      if (rupture === undefined) continue;
      reachM = Math.max(reachM, rupture.halfLengthM + rupture.halfWidthM + band.outerRadiusM);
    }
  }
  if (reachM <= 0) return circle;
  const stadium = shippedStadiumCounter(
    event.latitude,
    event.longitude,
    result.data.inputs.strikeAzimuthDeg ?? 0,
    reachM
  );
  return (radiusM, band) => {
    const rupture = band.polygon === undefined ? undefined : ruptures.get(band.polygon);
    return rupture === undefined
      ? circle(radiusM)
      : stadium(rupture.halfLengthM, rupture.halfWidthM, radiusM);
  };
}

/** The people inside a band's own footprint, polygon or circle. */
function footprintPopulation(
  event: RecordedEvent,
  radiusM: number,
  polygon: CasualtyBand['polygon']
): number {
  return polygon === undefined
    ? shippedPopulationInRadius(event.latitude, event.longitude, radiusM).exposed
    : shippedPopulationInPolygon(polygon).exposed;
}

/**
 * The population curve the browser would build for this event: one
 * measured point per band of the median plan, and nothing else,
 * because that is all the lookups it can afford.
 */
export function shippedExposureCurve(event: RecordedEvent): ExposurePoint[] {
  const location = { latitude: event.latitude, longitude: event.longitude };
  const result = event.run();
  const plan = casualtyPlanForResult(result, location);
  if (plan === null) return [];
  const plans = sampleScenarioPlans({
    result,
    planFor: (r) => casualtyPlanForResult(r, location),
    seed: `${event.name}:${event.recordedDeaths.toString()}`,
  });
  const footprints = [
    ...plan.bands.map((b) => ({ radiusM: b.outerRadiusM, polygon: b.polygon })),
    ...samplingFootprints(plans),
  ];
  return exposureCurve(
    footprints.map((f) => ({
      radiusM: f.radiusM,
      exposed: footprintPopulation(event, f.radiusM, f.polygon),
    }))
  );
}

/** Below this many dead at the band's high end, the measured and the
 *  interpolated bands differ by fewer people than live in one cell of
 *  the raster both read — so their ratio measures the raster, not the
 *  interpolation. Sumatra's shaking-only row is the case: 43 against
 *  115. The same holds for either end on its own: Pohang 2017, held
 *  out, reads 1 dead measured against 3 interpolated at its low end
 *  and 17 877 against 12 816 at its high one, and only the second is a
 *  statement about the interpolation. */
export const INTERPOLATION_COMPARABLE_DEATHS = 100;

/**
 * Rows whose interpolation cost is past the gate and declared rather
 * than hidden, each with what it is. The report prints their factors
 * like every other row's.
 *
 * None today. Gorkha was declared when Boore et al. 2014's rings were
 * adopted, its browser band stopping at about half the measured high
 * end, and came back under the gate (1.56×) when the harness moved to
 * the browser's ground the same day.
 */
export const INTERPOLATION_DECLARED: Readonly<Record<string, string>> = {};

export interface InterpolationCost {
  event: RecordedEvent;
  /** The band with the raster queried at every sampled radius. */
  measured: { low: number; high: number };
  /** The band the browser builds: a curve from its few lookups. */
  interpolated: { low: number; high: number };
  /** How far apart the two ends are, as factors ≥ 1. */
  lowFactor: number;
  highFactor: number;
  /** False when too few dead at the high end for either ratio to mean
   *  anything. */
  comparable: boolean;
  /** Whether the low end, on its own, has dead enough to compare. */
  lowComparable: boolean;
}

/**
 * What the product's interpolation costs on one event: the band with
 * the population measured at every radius a realisation asks for,
 * against the band read off the curve the browser can afford.
 *
 * One computation for the test that gates it and the report that
 * publishes it.
 */
export function interpolationCost(event: RecordedEvent): InterpolationCost | null {
  // On the physics alone. The fatality curve's scatter multiplies a
  // realisation's exact and interpolated toll by the same factor, so it
  // says nothing about the interpolation — and drawn, it lifts rows over
  // the comparable threshold without the population having changed.
  const exact = sampleToll(event, undefined, false);
  const curve = shippedExposureCurve(event);
  const approx = sampleToll(event, (r) => populationWithin(curve, r), false);
  if (exact === null || approx === null || exact.high.deaths <= 0) return null;
  const factor = (a: number, b: number): number => {
    const x = Math.max(a, 1);
    const y = Math.max(b, 1);
    return x > y ? x / y : y / x;
  };
  return {
    event,
    measured: { low: exact.low.deaths, high: exact.high.deaths },
    interpolated: { low: approx.low.deaths, high: approx.high.deaths },
    lowFactor: factor(exact.low.deaths, approx.low.deaths),
    highFactor: factor(exact.high.deaths, approx.high.deaths),
    comparable: exact.high.deaths >= INTERPOLATION_COMPARABLE_DEATHS,
    lowComparable: exact.low.deaths >= INTERPOLATION_COMPARABLE_DEATHS,
  };
}

/**
 * The toll of the median scenario alone, as compareWithRecord computes
 * it before it draws a band: for counts that need the central figure of
 * many events and not their bands (rule 25 of depthRules.ts). Null
 * where the result has no casualty plan.
 */
export function centralEstimate(event: RecordedEvent): CasualtyEstimate | null {
  configureCountryLookup(shippedCountryAt);
  const result = event.run();
  const plan = casualtyPlanForResult(result, {
    latitude: event.latitude,
    longitude: event.longitude,
  });
  if (plan === null) return null;
  const cumulative = plan.bands.map((band) =>
    footprintPopulation(event, band.outerRadiusM, band.polygon)
  );
  return estimateCasualties(plan, cumulative);
}

export function compareWithRecord(event: RecordedEvent): TollComparison {
  const estimate = centralEstimate(event);
  if (estimate === null) {
    return {
      event,
      estimate: null,
      deaths: 0,
      low: 0,
      high: 0,
      contains: event.recordedDeaths === 0,
      ratio: 0,
    };
  }

  // The band: a predictive interval where there is one to build, and
  // the model's own low/high pair where there is not.
  //
  // That pair is a range of *parameters* — the gentlest and harshest
  // vulnerability curves in the table — and it spans three to five
  // orders of magnitude, so a row containing the record proves almost
  // nothing. Northridge used to pass its gate with 13 to 139 037.
  //
  // What a band should be is the spread the published input scatter
  // actually produces: the magnitude an agency reports, the depth a
  // catalogue gives, the ground underneath, and above all the
  // ground-motion residual of σ_lnY ≈ 0.60 about the median. Sampled,
  // the fifth and ninety-fifth percentiles are a claim that can be
  // wrong.
  const sampled = sampleToll(event);
  const low = sampled?.low.deaths ?? estimate.deathsLow;
  const high = sampled?.high.deaths ?? estimate.deathsHigh;
  const record = event.recordedDeaths;
  const recordLow = event.recordedDeathsLow ?? record;
  const recordHigh = event.recordedDeathsHigh ?? record;
  // The bands overlap: the model's range and the record's range are
  // not disjoint. For a single recorded number that reduces to the
  // model's band containing it.
  const contains = low <= recordHigh && high >= recordLow;
  return {
    event,
    estimate,
    deaths: estimate.deaths,
    low,
    high,
    contains,
    ratio:
      record > 0 ? estimate.deaths / record : estimate.deaths === 0 ? 1 : Number.POSITIVE_INFINITY,
  };
}
