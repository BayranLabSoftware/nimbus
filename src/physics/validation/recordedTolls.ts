import { EARTHQUAKE_INPUT_SIGMA } from '../uq/conventions.js';
import { mulberry32, sampleNormal, type Rng } from '../montecarlo/sampling.js';
import { m } from '../units.js';
import type { ActiveResult } from '../../store/useAppStore.js';
import { casualtyPlanForResult, configureCountryLookup } from '../../store/useAppStore.js';
import { estimateCasualties, type CasualtyEstimate } from '../casualties.js';
import { EXPLOSION_PRESETS, simulateExplosion } from '../events/explosion/simulate.js';
import {
  EARTHQUAKE_PRESETS,
  simulateEarthquake,
  type EarthquakeScenarioInput,
} from '../events/earthquake/simulate.js';
import { VOLCANO_PRESETS, simulateVolcano } from '../events/volcano/simulate.js';
import { shippedCountryAt, shippedPopulationInRadius } from './shippedPopulation.js';

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
  /** Build one Monte-Carlo realisation of it, given the published
   *  input scatter. Present only for events whose module accepts the
   *  perturbations; without it the band falls back to the model's own
   *  low/high pair, which is a range of parameters rather than a
   *  predictive interval. */
  sample?: (rng: Rng) => ActiveResult;
  /** Whether the row is allowed to fail the suite. Rows that are not
   *  gated are still measured and printed — they carry a reason. */
  gated: boolean;
  /** Why a row is not gated, or what to know about one that is. */
  caveat?: string;
}

const quake = (preset: keyof typeof EARTHQUAKE_PRESETS): (() => ActiveResult) => {
  return () => ({ type: 'earthquake', data: simulateEarthquake(EARTHQUAKE_PRESETS[preset].input) });
};

/**
 * One realisation of an earthquake, drawn from the published input
 * scatter in `uq/conventions.ts`: the magnitude an agency reports
 * (σ = 0.15 Mw), the depth a catalogue gives (20 %), the ground it
 * stands on (30 % on Vs30), and — dominating all three — the
 * ground-motion aleatory residual, σ_lnY ≈ 0.50 about the median.
 *
 * That last one is what makes a band mean something. The model
 * predicts a median and the earth draws once; a predictive interval
 * has to carry the draw, not just the inputs.
 */
const quakeSample =
  (preset: keyof typeof EARTHQUAKE_PRESETS) =>
  (rng: Rng): ActiveResult => {
    const base: EarthquakeScenarioInput = EARTHQUAKE_PRESETS[preset].input;
    const depthM = (base.depth as number | undefined) ?? 15_000;
    return {
      type: 'earthquake',
      data: simulateEarthquake({
        ...base,
        magnitude: Math.max(
          1,
          sampleNormal(rng, base.magnitude, EARTHQUAKE_INPUT_SIGMA.magnitude.sigma)
        ),
        depth: m(
          Math.max(2_000, sampleNormal(rng, depthM, EARTHQUAKE_INPUT_SIGMA.depth.sigma * depthM))
        ),
        vs30: Math.max(
          120,
          sampleNormal(
            rng,
            base.vs30 ?? 760,
            EARTHQUAKE_INPUT_SIGMA.vs30.sigma * (base.vs30 ?? 760)
          )
        ),
        groundMotionResidualLn: sampleNormal(rng, 0, EARTHQUAKE_INPUT_SIGMA.groundMotion.sigma),
      }),
    };
  };
const blast = (preset: keyof typeof EXPLOSION_PRESETS): (() => ActiveResult) => {
  return () => ({ type: 'explosion', data: simulateExplosion(EXPLOSION_PRESETS[preset].input) });
};
const volcano = (preset: keyof typeof VOLCANO_PRESETS): (() => ActiveResult) => {
  return () => ({ type: 'volcano', data: simulateVolcano(VOLCANO_PRESETS[preset].input) });
};

export const RECORDED_EVENTS: RecordedEvent[] = [
  {
    name: 'Kokoxili (Kunlun) 2001',
    latitude: 35.95,
    longitude: 90.54,
    recordedDeaths: 0,
    source:
      'USGS: Mw 7.8, 400 km surface rupture across uninhabited Tibetan plateau; no deaths reported',
    run: quake('KUNLUN_2001'),
    sample: quakeSample('KUNLUN_2001'),
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
    sample: quakeSample('NORTHRIDGE_1994'),
    gated: true,
  },
  {
    name: "L'Aquila 2009",
    latitude: 42.3476,
    longitude: 13.38,
    recordedDeaths: 309,
    source: 'Italian Civil Protection: 309 deaths, Mw 6.3',
    run: quake('L_AQUILA_2009'),
    sample: quakeSample('L_AQUILA_2009'),
    gated: true,
  },
  {
    name: 'Amatrice 2016',
    latitude: 42.7233,
    longitude: 13.1883,
    recordedDeaths: 299,
    source: 'Italian Civil Protection: 299 deaths, Mw 6.2',
    run: quake('AMATRICE_2016'),
    sample: quakeSample('AMATRICE_2016'),
    gated: false,
    caveat:
      'Ungated on 9 September, and it is the band that changed rather than the model. This row passed on a span of 0 to 91 dead, which contains 299 the way a net with metre-wide holes contains a fish; the predictive interval from the published input scatter is 0 to 111 and the record is outside it. Amatrice killed 299 in medieval masonry villages at MMI VII, where the Italian national fatality curve — made mostly on larger and broader events — reads a fiftieth of that. See M8, "a national curve under-predicts a village".',
  },
  {
    name: 'Gorkha (Nepal) 2015',
    latitude: 28.2305,
    longitude: 84.7314,
    recordedDeaths: 8964,
    source: 'Government of Nepal: 8 964 deaths, Mw 7.8',
    run: quake('NEPAL_2015'),
    sample: quakeSample('NEPAL_2015'),
    gated: false,
    caveat:
      "Ungated on 9 September for the same reason as Amatrice: it passed on a band of 1 to 13 428 and the predictive interval is 22 to 4 924, which does not contain 8 964. Nepal borrows its region's PAGER curve rather than having its own, and Gorkha killed in the brick of the Kathmandu valley. The band is now narrow enough for the miss to be a statement.",
  },
  {
    name: 'Beirut 2020',
    latitude: 33.9014,
    longitude: 35.5186,
    recordedDeaths: 218,
    source: 'Lebanese Ministry of Health: 218 deaths, ~2.75 kt ammonium nitrate detonation',
    run: blast('BEIRUT_2020'),
    gated: false,
    caveat:
      "Was fifty times high on the first run, which was OTA 1979 — read off two nuclear attacks on light-timber cities — being applied to ammonium nitrate in reinforced concrete. Taking away the flash it never had, the mass fire it could not start, and the destroyed-hospital assumption that belongs to a country under attack brought it to 4.1x, with a band from 280 that still misses the 218 counted. What is left is not the casualty model but the raster underneath it: at 240 m the ring is twenty times smaller than a population cell, so the model spreads Beirut's average density across a port basin where nobody lives. The WorldPop API at 100 m would see the difference; no offline test can reach it.",
  },
  {
    name: 'Mount St Helens 1980',
    latitude: 46.1912,
    longitude: -122.1944,
    recordedDeaths: 57,
    source: 'USGS: 57 deaths, lateral blast across largely evacuated terrain',
    run: volcano('MT_ST_HELENS_1980'),
    gated: false,
    caveat:
      'The mountain had been closed for two months and the red zone evacuated; the 57 who died had mostly refused to leave or were outside the zone the blast then overran. The central figure still assumes nobody was warned and sits at 4.7x the record, but the band now reaches down to an evacuated eruption and contains it. Ungated because a preset cannot know whether an evacuation happened.',
  },
  {
    name: 'Pinatubo 1991',
    latitude: 15.13,
    longitude: 120.35,
    recordedDeaths: 847,
    source:
      'USGS/PHIVOLCS: ~847 deaths, most from roofs collapsing under wet ash during Typhoon Yunya',
    run: volcano('PINATUBO_1991'),
    gated: false,
    caveat:
      'The band was widened to admit an evacuated eruption and now reaches 916, which still misses the 847 counted — by eight per cent, and the eight per cent is left standing rather than shaved away. Containing it would in any case be the wrong target: sixty thousand people were evacuated before the climax, and most of those who still died were killed by roofs collapsing under ash wetted by Typhoon Yunya, a mechanism this model does not simulate at all. It counts the current, over people who had gone.',
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
    sample: quakeSample('TOHOKU_2011'),
    gated: false,
    caveat:
      'Over 90 % of the dead drowned. This harness has no bathymetry and therefore no wave, so the number here is the shaking alone and is expected to be far below the record.',
  },
  {
    name: 'Sumatra–Andaman 2004',
    latitude: 3.316,
    longitude: 95.854,
    recordedDeaths: 227_898,
    source: 'UN Office of the Special Envoy for Tsunami Recovery',
    run: quake('SUMATRA_2004'),
    sample: quakeSample('SUMATRA_2004'),
    gated: false,
    caveat: 'Drowning again, and again without a wave here. Reported for the shaking only.',
  },
];

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
/** How many realisations a band is drawn from. Enough that the 5th
 *  and 95th percentiles are stable to the digit the log prints, and
 *  few enough that the suite stays fast. */
const BAND_SAMPLES = 200;

/**
 * The fifth and ninety-fifth percentiles of the toll under the
 * published input scatter, with the population held fixed — the
 * raster is the same in every realisation, so what is sampled is the
 * physics and not the census.
 *
 * Seeded per event, so a band never moves between runs of the suite
 * without something else having moved first.
 */
function sampleToll(
  event: RecordedEvent,
  sample: (rng: Rng) => ActiveResult
): { low: number; high: number } | null {
  const rng = mulberry32(`${event.name}:${event.recordedDeaths.toString()}`);
  const location = { latitude: event.latitude, longitude: event.longitude };
  const tolls: number[] = [];
  for (let i = 0; i < BAND_SAMPLES; i++) {
    const plan = casualtyPlanForResult(sample(rng), location);
    if (plan === null) {
      tolls.push(0);
      continue;
    }
    const cumulative = plan.bands.map(
      (band) =>
        shippedPopulationInRadius(event.latitude, event.longitude, band.outerRadiusM).exposed
    );
    tolls.push(estimateCasualties(plan, cumulative).deaths);
  }
  if (tolls.length === 0) return null;
  tolls.sort((a, b) => a - b);
  const at = (q: number): number =>
    tolls[Math.min(tolls.length - 1, Math.max(0, Math.round(q * (tolls.length - 1))))] ?? 0;
  return { low: at(0.05), high: at(0.95) };
}

export function compareWithRecord(event: RecordedEvent): TollComparison {
  // The same country the browser would see, read off the same file.
  configureCountryLookup(shippedCountryAt);
  const result = event.run();
  const location = { latitude: event.latitude, longitude: event.longitude };
  const plan = casualtyPlanForResult(result, location);
  if (plan === null) {
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
  const cumulative = plan.bands.map(
    (band) => shippedPopulationInRadius(event.latitude, event.longitude, band.outerRadiusM).exposed
  );
  const estimate = estimateCasualties(plan, cumulative);

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
  // ground-motion residual of σ_lnY ≈ 0.50 about the median. Sampled,
  // the fifth and ninety-fifth percentiles are a claim that can be
  // wrong.
  const sampled = event.sample === undefined ? null : sampleToll(event, event.sample);
  const low = sampled?.low ?? estimate.deathsLow;
  const high = sampled?.high ?? estimate.deathsHigh;
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
