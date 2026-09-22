/**
 * The seal of the impacts module — rules 826 to 835 of
 * `physics/validation/impactSealRules.ts`.
 *
 * A sealed reading is what the module answers for one scenario, in four
 * digests: its numbers, its drawing, and its report's text in Italian and in
 * English. The test beside this file recomputes all four at every commit and
 * compares them with exact equality, so that work on another module — or on
 * the code all the modules share — cannot move an impact's answer without the
 * build saying so.
 *
 * A seal is not a validation: it says the answer has not changed, never that
 * it is right. It protects a defect as faithfully as a virtue. The levels that
 * say whether an answer is right sit on top of it.
 *
 * This module sits in `src/seal/` and not under `src/physics/` because it is
 * the one place that reads across the layers on purpose: the headless physics,
 * the map the globe draws, and the text the report prints are one answer to a
 * reader, and a seal that held only the first would let the other two drift.
 * Nothing the browser ships imports it.
 */

import i18next, { type TFunction } from 'i18next';
import en from '../i18n/locales/en.json';
import it from '../i18n/locales/it.json';
import {
  blastCasualtyPlan,
  estimateCasualties,
  type CasualtyEstimate,
  type CasualtyPlan,
} from '../physics/casualties.js';
import { ASTEROID_TAXONOMY, CRUSTAL_ROCK_DENSITY, STANDARD_GRAVITY } from '../physics/constants.js';
import { impactFireballRadius } from '../physics/effects/blastWave.js';
import { mulberry32 } from '../physics/montecarlo/sampling.js';
import {
  IMPACT_PRESETS,
  type ImpactPresetId,
  type ImpactScenarioInput,
  type ImpactScenarioResult,
} from '../physics/simulate.js';
import { degreesToRadians, deg, kgPerM3, m, mps, Pa } from '../physics/units.js';
import { safeRunImpact } from '../physics/validation/safeRun.js';
import {
  availableImpactLayers,
  isFieldLayer,
  type ImpactMapLayer,
} from '../scene/globe/impactFieldMap.js';
import { buildImpactReport, type ImpactReportModel } from '../ui/pages/report/impactReportModel.js';
import { canonicalDigest } from './canonical.js';

/** Rule 827(c): the seed the drawn scenarios come from. */
export const SEAL_SEED = 'impact-seal-v1';

/** Rule 827(b): how many scenarios are drawn, beside the presets. */
export const DRAWN_COUNT = 300;

/**
 * Rule 828(a): the grid the draw reads, which is the range of what a visitor
 * can set in the panel. Fixtures, not constants of the model.
 */
export const SEAL_GRID = {
  /** Bodies that burst in the air (even indices) and bodies that reach the
   *  ground (odd), so both families are present whatever the draw. */
  smallDiameterM: [1, 100] as const,
  largeDiameterM: [100, 20_000] as const,
  /** Earth's escape speed to a head-on long-period comet. */
  velocityMS: [11_000, 72_000] as const,
  /** Grazing to vertical. */
  angleDeg: [5, 90] as const,
  /** The taxonomy the panel offers: a density and a strength together. */
  taxonomy: Object.keys(ASTEROID_TAXONOMY) as (keyof typeof ASTEROID_TAXONOMY)[],
  /** Sedimentary, crystalline, and the crustal rock the presets use. */
  targetDensityKgM3: [2_500, 2_750, CRUSTAL_ROCK_DENSITY] as const,
  /** A shelf sea to the deepest water the input schema accepts. */
  waterDepthM: [20, 11_000] as const,
  /** The basin the wave crosses. */
  meanOceanDepthM: [200, 5_000] as const,
  /** From a beach to well inland. */
  shoreDistanceM: [1_000, 300_000] as const,
} as const;

/**
 * Rule 828(c): the population the casualty plan is run against — a thousand
 * people inside the first band and ten times as many in each band outward.
 * A ladder, not a place: it seals the mortality arithmetic without the seal
 * pretending to know who lives anywhere.
 */
export function populationLadder(bands: number): number[] {
  return Array.from({ length: bands }, (_, i) => 1_000 * 10 ** i);
}

export type SealSite = 'land' | 'coast' | 'sea';

/**
 * The input of a sealed scenario. A mapped type of the product's own input,
 * so that it can be handed to the validator, which takes what a caller
 * supplies and not an input already classified.
 */
export type SealInput = { [K in keyof ImpactScenarioInput]: ImpactScenarioInput[K] };

export interface SealScenario {
  /** `preset:CHICXULUB` or `drawn:000`. Stable: rule 830's table is read by it. */
  id: string;
  site: SealSite;
  presetName: string | null;
  input: SealInput;
}

function lerp(rng: { next: () => number }, [lo, hi]: readonly [number, number]): number {
  return lo + rng.next() * (hi - lo);
}

function logLerp(rng: { next: () => number }, [lo, hi]: readonly [number, number]): number {
  return Math.exp(Math.log(lo) + rng.next() * (Math.log(hi) - Math.log(lo)));
}

function pick<T>(rng: { next: () => number }, items: readonly T[]): T {
  const item = items[Math.min(items.length - 1, Math.floor(rng.next() * items.length))];
  if (item === undefined) throw new Error('empty choice');
  return item;
}

/**
 * Rule 827: the sealed set — the eight presets at their own inputs, and three
 * hundred drawn scenarios, stratified a hundred on land, a hundred on a coast
 * and a hundred at sea, and within each hundred alternating a body that bursts
 * in the air with one that reaches the ground.
 *
 * The fields are read in the order written here. Changing that order, or the
 * grid, draws a different set — which is a re-seal under rule 833, not a
 * repair.
 */
export function buildSealScenarios(): SealScenario[] {
  const scenarios: SealScenario[] = [];
  for (const key of Object.keys(IMPACT_PRESETS) as ImpactPresetId[]) {
    const preset = IMPACT_PRESETS[key];
    const input: SealInput = preset.input;
    scenarios.push({
      id: `preset:${key}`,
      site: (input.waterDepth ?? 0) > 0 ? 'sea' : 'land',
      presetName: preset.name,
      input,
    });
  }

  const rng = mulberry32(SEAL_SEED);
  for (let i = 0; i < DRAWN_COUNT; i++) {
    const site: SealSite = i < 100 ? 'land' : i < 200 ? 'coast' : 'sea';
    const diameter = logLerp(
      rng,
      i % 2 === 0 ? SEAL_GRID.smallDiameterM : SEAL_GRID.largeDiameterM
    );
    const velocity = lerp(rng, SEAL_GRID.velocityMS);
    const taxonomy = ASTEROID_TAXONOMY[pick(rng, SEAL_GRID.taxonomy)];
    const targetDensity = pick(rng, SEAL_GRID.targetDensityKgM3);
    const angle = lerp(rng, SEAL_GRID.angleDeg);
    const azimuth = rng.next() * 360;
    const waterDepth = logLerp(rng, SEAL_GRID.waterDepthM);
    const meanOceanDepth = logLerp(rng, SEAL_GRID.meanOceanDepthM);
    const shoreDistance = logLerp(rng, SEAL_GRID.shoreDistanceM);

    const body: SealInput = {
      impactorDiameter: m(diameter),
      impactVelocity: mps(velocity),
      impactorDensity: kgPerM3(taxonomy.density),
      targetDensity: kgPerM3(targetDensity),
      impactAngle: degreesToRadians(deg(angle)),
      surfaceGravity: STANDARD_GRAVITY,
      impactorStrength: Pa(taxonomy.strength),
      impactAzimuthDeg: azimuth,
    };
    const input: SealInput =
      site === 'sea'
        ? { ...body, waterDepth: m(waterDepth), meanOceanDepth: m(meanOceanDepth) }
        : site === 'coast'
          ? { ...body, shoreDistance: m(shoreDistance) }
          : body;
    scenarios.push({
      id: `drawn:${i.toString().padStart(3, '0')}`,
      site,
      presetName: null,
      input,
    });
  }
  return scenarios;
}

/**
 * How many readings a ground field is sealed by. The field is a colour at a
 * nominal radius, not an array, so rule 829's "digest of its samples" is the
 * digest of what it paints along a fixed ladder of ranges — its extent in
 * equal steps, both ends included. A colour that moved anywhere between two
 * rungs and nowhere else would pass; the isolines, the colourbar and the
 * extent are sealed exactly, and they are what a reader measures a map by.
 */
export const FIELD_RUNGS = 256;

/**
 * A layer as the seal reads it: the drawing, with the field's function
 * replaced by the digest of what it paints.
 */
function describeLayer(layer: ImpactMapLayer): Record<string, unknown> {
  const { field, ...rest } = layer;
  if (field === null) return { ...rest, field: null };
  const readings: unknown[] = [];
  for (let i = 0; i < FIELD_RUNGS; i++) {
    const range = field.minRangeM + ((field.maxRangeM - field.minRangeM) * i) / (FIELD_RUNGS - 1);
    readings.push([field.colorAt(range), field.hatchedAt?.(range) ?? null]);
  }
  return {
    ...rest,
    field: {
      family: field.family,
      minRangeM: field.minRangeM,
      maxRangeM: field.maxRangeM,
      rungs: FIELD_RUNGS,
      samples: canonicalDigest(readings, `${layer.id}.field.samples`),
    },
  };
}

function describeLayers(layers: ImpactMapLayer[]): Record<string, unknown>[] {
  return layers.map(describeLayer);
}

/** The report as the seal reads it: its figures carry the same layers. */
function describeReport(report: ImpactReportModel): Record<string, unknown> {
  return {
    ...report,
    figures: report.figures.map((figure) => ({
      number: figure.number,
      layer: describeLayer(figure.layer),
    })),
  };
}

export interface SealTranslators {
  it: TFunction;
  en: TFunction;
}

/** The two languages the report is sealed in. */
export async function sealTranslators(): Promise<SealTranslators> {
  const make = async (lng: 'it' | 'en'): Promise<TFunction> => {
    const instance = i18next.createInstance();
    await instance.init({
      resources: { en: { translation: en }, it: { translation: it } },
      lng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
    return instance.t.bind(instance);
  };
  return { it: await make('it'), en: await make('en') };
}

/**
 * Where the report places a sealed scenario, and when it was run. Fixed: a
 * seal that read the clock would break itself every second, and one that read
 * a different place every run would seal the place.
 */
const REPORT_PLACE = { latitude: 21.4, longitude: -89.5 } as const;
const REPORT_AT = Date.UTC(2026, 8, 22, 8, 0, 0);

/** Rule 830: the short table that says what moved when a digest moves. */
export interface SealKeyNumbers {
  energyMt: number;
  regime: string;
  burstAltitudeM: number;
  craterOrigin: string;
  transientCraterM: number;
  finalCraterM: number;
  overpressure5psiM: number;
  overpressure1psiM: number;
  thirdDegreeBurnM: number;
  ejecta1mM: number;
  ejecta1mmM: number;
  seismicMagnitude: number | null;
  waveSourceM: number | null;
  waveAt1000kmM: number | null;
  deaths: number | null;
  layers: number;
  isolines: number;
  reportRows: number;
}

export interface SealReading {
  id: string;
  site: SealSite;
  input: Record<string, unknown>;
  digests: {
    numbers: string;
    drawing: string;
    textIt: string;
    textEn: string;
  };
  keys: SealKeyNumbers;
}

function casualties(result: ImpactScenarioResult): {
  plan: CasualtyPlan | null;
  estimate: CasualtyEstimate | null;
} {
  const plan = blastCasualtyPlan({
    blastEnergy: result.impactor.kineticEnergy,
    overpressure5psiRadius: result.damage.overpressure5psi,
    overpressure1psiRadius: result.damage.overpressure1psi,
    thirdDegreeBurnRadius: result.damage.thirdDegreeBurn,
    secondDegreeBurnRadius: result.damage.secondDegreeBurn,
    firestormRadius: result.firestorm.sustainRadius,
    fireballRadius: impactFireballRadius(result.impactor.kineticEnergy),
  });
  if (plan === null) return { plan: null, estimate: null };
  return { plan, estimate: estimateCasualties(plan, populationLadder(plan.bands.length)) };
}

/**
 * Rule 826: the four digests of one scenario, and rule 830's table.
 *
 * A scenario the input schema refuses is sealed too — the refusal is an answer
 * the product gives, and a commit that turned a refusal into a result would be
 * exactly the kind of change this is here to catch.
 */
export function readScenario(scenario: SealScenario, t: SealTranslators): SealReading {
  const run = safeRunImpact(scenario.input);
  const inputText = canonicalDigest(scenario.input, `${scenario.id}.input`);
  if (!run.ok) {
    return {
      id: scenario.id,
      site: scenario.site,
      input: { ...scenario.input, digest: inputText },
      digests: {
        numbers: canonicalDigest({ refused: run.validation }, `${scenario.id}.numbers`),
        drawing: canonicalDigest(null),
        textIt: canonicalDigest(null),
        textEn: canonicalDigest(null),
      },
      keys: {
        energyMt: Number.NaN,
        regime: 'refused',
        burstAltitudeM: Number.NaN,
        craterOrigin: 'refused',
        transientCraterM: Number.NaN,
        finalCraterM: Number.NaN,
        overpressure5psiM: Number.NaN,
        overpressure1psiM: Number.NaN,
        thirdDegreeBurnM: Number.NaN,
        ejecta1mM: Number.NaN,
        ejecta1mmM: Number.NaN,
        seismicMagnitude: null,
        waveSourceM: null,
        waveAt1000kmM: null,
        deaths: null,
        layers: 0,
        isolines: 0,
        reportRows: 0,
      },
    };
  }

  const result = run.result;
  const toll = casualties(result);
  const layers = {
    it: availableImpactLayers(result, { t: t.it, language: 'it' }),
    en: availableImpactLayers(result, { t: t.en, language: 'en' }),
  };
  const report = {
    it: buildImpactReport(result, {
      t: t.it,
      language: 'it',
      location: REPORT_PLACE,
      evaluatedAt: REPORT_AT,
      timeZone: 'UTC',
      presetName: scenario.presetName,
      uncertaintyKey: null,
      casualties: null,
      nearest: null,
      extras: { bathymetricTsunami: false, monteCarlo: false, predictiveBand: false },
    }),
    en: buildImpactReport(result, {
      t: t.en,
      language: 'en',
      location: REPORT_PLACE,
      evaluatedAt: REPORT_AT,
      timeZone: 'UTC',
      presetName: scenario.presetName,
      uncertaintyKey: null,
      casualties: null,
      nearest: null,
      extras: { bathymetricTsunami: false, monteCarlo: false, predictiveBand: false },
    }),
  };

  const isolines = layers.en.reduce((n, layer) => n + layer.isolines.length, 0);
  const reportRows = report.en.groups.reduce((n, group) => n + group.rows.length, 0);

  return {
    id: scenario.id,
    site: scenario.site,
    input: { ...scenario.input, digest: inputText },
    digests: {
      numbers: canonicalDigest(
        { validation: run.validation, result, casualties: toll },
        `${scenario.id}.numbers`
      ),
      drawing: canonicalDigest(
        { it: describeLayers(layers.it), en: describeLayers(layers.en) },
        `${scenario.id}.drawing`
      ),
      textIt: canonicalDigest(describeReport(report.it), `${scenario.id}.textIt`),
      textEn: canonicalDigest(describeReport(report.en), `${scenario.id}.textEn`),
    },
    keys: {
      energyMt: result.impactor.kineticEnergyMegatons,
      regime: result.entry.regime,
      burstAltitudeM: result.entry.burstAltitude,
      craterOrigin: result.crater.origin,
      transientCraterM: result.crater.transientDiameter,
      finalCraterM: result.crater.finalDiameter,
      overpressure5psiM: result.damage.overpressure5psi,
      overpressure1psiM: result.damage.overpressure1psi,
      thirdDegreeBurnM: result.damage.thirdDegreeBurn,
      ejecta1mM: result.ejecta.blanketEdge1m,
      ejecta1mmM: result.ejecta.blanketEdge1mm,
      seismicMagnitude: result.seismic.magnitude,
      waveSourceM: result.tsunami?.rimWaveSourceAmplitude ?? null,
      waveAt1000kmM: result.tsunami?.amplitudeAt1000kmWunnemann ?? null,
      deaths: toll.estimate?.deaths ?? null,
      layers: layers.en.filter((layer) => isFieldLayer(layer.id)).length,
      isolines,
      reportRows,
    },
  };
}

/** Every sealed reading, in the order of rule 827. */
export function readSeal(t: SealTranslators): SealReading[] {
  return buildSealScenarios().map((scenario) => readScenario(scenario, t));
}

/** Rule 833: why the seal was taken, one line per re-seal. */
export interface SealReason {
  date: string;
  commit: string;
  openedBy: string;
  moved: string;
}

/**
 * Rule 836: the engine a seal was read on. A digest to the bit is a digest of
 * what one engine answers: ICU formats the report's numbers and dates, and V8
 * gives a Math function its last bit, and both change between Node versions.
 */
export interface SealEngine {
  /** `process.version`, which fixes V8 and the ICU Node ships with. */
  node: string;
  /** The ICU the numbers and dates were formatted with. */
  icu: string;
  /** Recorded, not compared (rule 836). */
  platform: string;
}

/** The engine this process runs on. */
export function currentEngine(): SealEngine {
  return {
    node: process.version,
    icu: process.versions.icu ?? 'none',
    platform: `${process.platform}-${process.arch}`,
  };
}

export interface SealFile {
  seed: string;
  engine: SealEngine;
  reasons: SealReason[];
  readings: SealReading[];
}
