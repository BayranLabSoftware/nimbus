import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isMainThread, parentPort, Worker } from 'node:worker_threads';
import { EARTH_RADIUS } from '../../src/physics/constants.js';
import { simulateEarthquake } from '../../src/physics/events/earthquake/simulate.js';
import { simulateExplosion } from '../../src/physics/events/explosion/simulate.js';
import { simulateLandslide } from '../../src/physics/events/landslide/simulate.js';
import { simulateVolcano } from '../../src/physics/events/volcano/simulate.js';
import { mulberry32 } from '../../src/physics/montecarlo/sampling.js';
import { simulateImpact } from '../../src/physics/simulate.js';
import { airburstReach } from '../../src/physics/effects/airburstBlast.js';
import { J, m, Pa } from '../../src/physics/units.js';
import {
  OVERPRESSURE_BUILDING_COLLAPSE,
  OVERPRESSURE_LIGHT_DAMAGE,
  OVERPRESSURE_WINDOW_BREAK,
} from '../../src/physics/events/impact/damageRings.js';
import { CONTINUITY_TOLERANCE, FIELD_FLOOR } from '../../src/physics/validation/continuityRules.js';
import {
  blastSourceOf,
  explainBlastShrink,
  type BlastSource,
} from '../../src/physics/validation/blastSource.js';
import { searchFieldJump } from '../../src/physics/validation/fieldJump.js';
import { explainMagnitudeFall } from '../../src/physics/validation/magnitudeSource.js';
import { FIELD_JUMP_GATE, FIELD_JUMP_SHARE } from '../../src/physics/validation/fieldJumpRules.js';

/**
 * Track INV of the benchmark protocol: invariants every output must keep,
 * on 5 000 random custom scenarios a hazard drawn over the ranges the
 * custom-input forms accept (seeded, so the same scenarios every run).
 *
 *   pnpm exec tsx scripts/benchmark/invariants.ts [scenarios per hazard] [hazard]
 *
 * - finite: no output is NaN or infinite, and no run throws;
 * - non-negative: radii, runouts, areas, diameters, amplitudes, lengths,
 *   heights, volumes, masses and energies are ≥ 0;
 * - within the antipode: no radius, runout or range is longer than half
 *   the Earth's circumference, and no area larger than the Earth's surface
 *   (a product such as height × range is not a range);
 * - monotone in size: the rings a visitor sees do not shrink when the
 *   impactor, the yield, the magnitude, the erupted volume or the slide
 *   grows by 1 % (magnitude by 0.01), the other inputs held. Since
 *   19 September 2026 an earthquake's list holds the wave as well as the
 *   shaking — the slip, the uplift, the amplitudes near and far, the run-up,
 *   the period and the travel time — because the scorecard's own G5 for waves
 *   from earthquakes read "the earthquake sweep checks the shaking's rings and
 *   not the wave's", and it did;
 * - continuous (rings under a millimetre are not compared, in either
 *   check): the same rings move by less than 5 % when the size grows
 *   by 0.1 % (magnitude by 0.001), a magnitude by less than 0.05 — a
 *   larger jump is a regime switch that is not continuous. For impacts,
 *   since 21 September 2026, a contour is held to that only where the
 *   regime switches, and the field at seven fixed ranges everywhere: a
 *   sample a 0.1 % step moves by more than 1 % is searched for a jump by
 *   halving the step thirty times, and counted only if it has one (rules
 *   621 to 629 of validation/continuityRules.ts, 660 to 666 of
 *   validation/fieldJumpRules.ts).
 *
 * Each scenario runs in a worker thread with a watchdog: three runs that
 * have not returned in two seconds (they take milliseconds) are a run that
 * does not return, and the worker is replaced.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const N = Number(process.argv[2] ?? 5_000);
/** One hazard only, by name; each hazard has its own seed, so its
 *  scenarios are the same either way. */
const ONLY = process.argv[3];
/** Which relation draws a chemical charge's rings, when the sweep is asked to
 *  read a candidate rather than the law in place (rule 180 (c) of
 *  validation/chemicalBlastRules.ts). */
const CHEMICAL_BLAST = process.env.NIMBUS_CHEMICAL_BLAST;
/** Which law draws the air blast of an impact that reaches the ground, when
 *  the sweep is asked to read one (rule 636 of
 *  validation/groundBlastFloorRules.ts). */
const GROUND_BLAST = process.env.NIMBUS_GROUND_BLAST;
/** Which entry equations an impact is read with, when the sweep is asked to
 *  read a candidate rather than the default (rule 678 of
 *  validation/entryPaperAgainRules.ts). */
const ENTRY_EQUATIONS = process.env.NIMBUS_ENTRY_EQUATIONS;
/** Where a complete airburst's flash is placed, when the sweep is asked to
 *  read a candidate (rule 703 of validation/airFlashRules.ts). */
const AIR_FLASH = process.env.NIMBUS_AIR_FLASH;
/** How a complete airburst that bursts below its own fireball radiates, when
 *  the sweep is asked to read a candidate (rule 719 of
 *  validation/lowBurstFlashRules.ts). */
const LOW_BURST_FLASH = process.env.NIMBUS_LOW_BURST_FLASH;
/** What a complete airburst's seismic magnitude is read from, when the sweep
 *  is asked to read a candidate (rule 736 of
 *  validation/airburstSeismicRules.ts). */
const AIRBURST_SEISMIC = process.env.NIMBUS_AIRBURST_SEISMIC;
/** Whether a complete airburst below its own fireball digs, when the sweep is
 *  asked to read a candidate (rule 761 of validation/lowBurstCraterRules.ts). */
const LOW_BURST_CRATER = process.env.NIMBUS_LOW_BURST_CRATER;
/** Rule 688 (c) of validation/blastShrinkSourceRules.ts: read the harness as
 *  it was, with no cause asked of a shrinking ring. */
const NO_CAUSES = process.env.NIMBUS_NO_CAUSES !== undefined;
/** Rule 642 of validation/blastShrinkRules.ts: the seed of a held-out run. */
const SWEEP_SEED_OVERRIDE = process.env.NIMBUS_SWEEP_SEED;
const HALF_CIRCUMFERENCE = Math.PI * (EARTH_RADIUS as number);
const EARTH_SURFACE = 4 * Math.PI * (EARTH_RADIUS as number) ** 2;

export type Json = Record<string, unknown>;

export interface Hazard {
  name: string;
  sample: (u: () => number) => Json;
  grow: (input: Json, factor: number, step: 'monotone' | 'continuity') => Json;
  run: (input: Json) => Json;
  /** Paths of the rings a visitor sees. */
  rings: readonly string[];
  /**
   * Rules 621 to 629 of validation/continuityRules.ts, for a hazard whose
   * domain has been opened: the rings that are CONTOURS (a threshold crossed)
   * are checked for continuity only where the regime switches, as
   * BENCHMARK_PROTOCOL.md defines continuity; the FIELD, at fixed places, is
   * checked everywhere. A hazard without a regime keeps the check it had.
   */
  regime?: (result: Json) => string;
  contours?: readonly string[];
  /**
   * Rule 756 of validation/lowBurstCraterRules.ts: rings read as values whose
   * BIRTH is read as a contour's. On a step where one is born from nothing —
   * under a millimetre for the smaller body, drawn for the larger — it is read
   * only where the regime switches; on every other step it is read as a value,
   * and a move past the tolerance is searched by halving (rule 662).
   */
  births?: readonly string[];
  fields?: readonly { path: string; floor: number }[];
  /**
   * Rules 638 to 646 of validation/blastShrinkRules.ts: the physical cause, if
   * any, under which a ring may shrink as the size grows. A ring a cause
   * explains is printed under it and not counted as a failure.
   */
  explainShrink?: (
    ring: string,
    base: Json,
    grown: Json,
    runAt: (factor: number) => Json
  ) => string | null;
}

const logU = (u: number, lo: number, hi: number): number =>
  Math.exp(Math.log(lo) + u * (Math.log(hi) - Math.log(lo)));
const lin = (u: number, lo: number, hi: number): number => lo + u * (hi - lo);
const pick = <T>(u: number, xs: readonly T[]): T =>
  xs[Math.min(xs.length - 1, Math.floor(u * xs.length))] as T;
const scientific = (u1: number, u2: number, exponents: readonly number[]): number =>
  lin(u1, 1, 9.9) * 10 ** pick(u2, exponents);

/** Rule 640: the threshold of each blast ring the causes are read for. */
const BLAST_RING_THRESHOLD: Readonly<Record<string, number>> = {
  'damage.overpressure5psi': OVERPRESSURE_BUILDING_COLLAPSE,
  'damage.overpressure1psi': OVERPRESSURE_WINDOW_BREAK,
  'damage.lightDamage': OVERPRESSURE_LIGHT_DAMAGE,
};

/** The burst altitude (m) at which the model's own airburst law, at this
 *  yield, carries this threshold farthest: a coarse scan, then a golden
 *  section on the best bracket. */
function optimumBurstAltitude(threshold: number, yieldJ: number, near: number): number {
  const reach = (z: number): number => airburstReach(Pa(threshold), m(z), J(yieldJ), 'low');
  const top = Math.max(3 * near, 60_000);
  let bestK = 0;
  let best = -1;
  for (let k = 0; k <= 200; k++) {
    const r = reach((top * k) / 200);
    if (r > best) {
      best = r;
      bestK = k;
    }
  }
  let a = (top * Math.max(bestK - 1, 0)) / 200;
  let b = (top * Math.min(bestK + 1, 200)) / 200;
  const g = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; i++) {
    const c = b - g * (b - a);
    const d = a + g * (b - a);
    if (reach(c) >= reach(d)) b = d;
    else a = c;
  }
  return (a + b) / 2;
}

/** Rules 639 and 640: why an impact's blast ring shrank, if physics says. */
export function explainImpactBlastShrink(ring: string, base: Json, grown: Json): string | null {
  const threshold = BLAST_RING_THRESHOLD[ring];
  if (threshold === undefined) return null;
  const e0 = base.entry as Json | undefined;
  const e1 = grown.entry as Json | undefined;
  if (e0 === undefined || e1 === undefined) return null;
  // (i) the height of burst.
  if (e0.regime === 'COMPLETE_AIRBURST' && e1.regime === 'COMPLETE_AIRBURST') {
    const z0 = Number(e0.burstAltitude);
    const z1 = Number(e1.burstAltitude);
    const w1 = Number(e1.blastYieldMegatons) * 4.184e15;
    const zOpt = optimumBurstAltitude(threshold, w1, Math.max(z0, z1));
    if (Math.abs(z1 - zOpt) > Math.abs(z0 - zOpt)) return 'height of burst';
  }
  // (ii) from the air to the ground.
  if (Number(e1.energyFractionToGround) > Number(e0.energyFractionToGround))
    return 'from the air to the ground';
  return null;
}

export const HAZARDS: readonly Hazard[] = [
  {
    name: 'impact',
    sample: (u) => {
      const water = u() < 1 / 3;
      const input: Json = {
        // The form takes 0.001 to 100 000 km.
        impactorDiameter: logU(u(), 1, 1e8),
        impactVelocity: lin(u(), 1, 72) * 1_000,
        impactorDensity: lin(u(), 500, 10_000),
        targetDensity: lin(u(), 1_000, 5_000),
        impactAngle: (lin(u(), 5, 90) * Math.PI) / 180,
        impactAzimuthDeg: lin(u(), 0, 359),
      };
      const depth = logU(u(), 1, 11_000);
      if (water) input.waterDepth = depth;
      return input;
    },
    grow: (input, f) => ({ ...input, impactorDiameter: (input.impactorDiameter as number) * f }),
    // Rule 636: the sweep runs under a named ground blast when asked to.
    run: (input) =>
      simulateImpact({
        ...input,
        ...(GROUND_BLAST === undefined ? {} : { groundBlast: GROUND_BLAST }),
        ...(ENTRY_EQUATIONS === undefined ? {} : { entryEquations: ENTRY_EQUATIONS }),
        ...(AIR_FLASH === undefined ? {} : { airFlash: AIR_FLASH }),
        ...(LOW_BURST_FLASH === undefined ? {} : { lowBurstFlash: LOW_BURST_FLASH }),
        ...(AIRBURST_SEISMIC === undefined ? {} : { airburstSeismic: AIRBURST_SEISMIC }),
        ...(LOW_BURST_CRATER === undefined ? {} : { lowBurstCrater: LOW_BURST_CRATER }),
      } as never) as unknown as Json,
    // Rules 683 to 690 of validation/blastShrinkSourceRules.ts: a blast ring
    // that shrinks is explained when its source moved it without a step
    // (`blastSource.ts`). Rules 638 to 646 read two causes here and were
    // refused; `explainImpactBlastShrink` is theirs, kept for the record.
    explainShrink: (ring, base, grown, runAt) => {
      const sourceOf = (r: Json): BlastSource => blastSourceOf(r as never);
      // Rule 735 of validation/airburstSeismicRules.ts: an airburst's
      // magnitude read from the air asks its source, as a blast ring does.
      if (ring === 'seismic.magnitude') {
        const seismic = base.seismic as Json | undefined;
        const magnitude = seismic?.magnitude;
        if (seismic?.magnitudeSource !== 'air' || typeof magnitude !== 'number') return null;
        const inputs = base.inputs as Json | undefined;
        const overWater =
          ((inputs?.waterDepth as number | undefined) ?? 0) > 0 &&
          !(((inputs?.shoreDistance as number | undefined) ?? 0) > 0);
        return explainMagnitudeFall(
          magnitude,
          sourceOf(base),
          sourceOf(grown),
          overWater ? 'oceanic' : 'continental',
          (k) => sourceOf(runAt(k)),
          1.01
        );
      }
      const threshold = BLAST_RING_THRESHOLD[ring];
      const before = (base.damage as Json | undefined)?.[ring.replace('damage.', '')];
      if (threshold === undefined || typeof before !== 'number') return null;
      return explainBlastShrink(
        threshold,
        before,
        sourceOf(base),
        sourceOf(grown),
        (k) => sourceOf(runAt(k)),
        1.01
      );
    },
    // Rule 623: an impact's regime is its entry regime with its crater's
    // morphology.
    regime: (r) => {
      const entry = r.entry as Json | undefined;
      const crater = r.crater as Json | undefined;
      return `${String(entry?.regime)}|${String(crater?.morphology)}`;
    },
    // Rule 622: the contours, the ranges where a threshold is crossed.
    contours: [
      'damage.craterRim',
      'damage.thirdDegreeBurn',
      'damage.secondDegreeBurn',
      'damage.overpressure5psi',
      'damage.overpressure1psi',
      'damage.lightDamage',
      'ejecta.blanketEdge1m',
      'ejecta.blanketEdge1mm',
    ],
    // Rule 756 of validation/lowBurstCraterRules.ts: the final crater, a value
    // whose birth from nothing is read as a contour's.
    births: ['crater.finalDiameter'],
    // Rules 624 and 625: the field at seven fixed ranges, with its floors.
    fields: [1, 3, 10, 30, 100, 300, 1000].flatMap((km) => [
      { path: `field.overpressureAt${String(km)}km`, floor: FIELD_FLOOR.overpressurePa },
      { path: `field.thermalExposureAt${String(km)}km`, floor: FIELD_FLOOR.thermalExposureJm2 },
    ]),
    rings: [
      'damage.craterRim',
      'damage.thirdDegreeBurn',
      'damage.secondDegreeBurn',
      'damage.overpressure5psi',
      'damage.overpressure1psi',
      'damage.lightDamage',
      'crater.finalDiameter',
      'ejecta.blanketEdge1m',
      'ejecta.blanketEdge1mm',
      'seismic.magnitude',
      'tsunami.amplitudeAt1000km',
      // The wave a visitor is shown: the program's since rule 153 of
      // validation/impactTsunamiRules.ts, under the rim wave's old names.
      'tsunami.amplitudeAt1000kmWunnemann',
      'tsunami.amplitudeAt5000kmWunnemann',
      'tsunami.amplitudeAt5000kmDispersed',
      'tsunami.runupAt1000km',
    ],
  },
  {
    name: 'explosion',
    sample: (u) => {
      const chemical = u() < 0.2;
      const placement = u();
      const input: Json = {
        yieldMegatons: logU(u(), 1e-4, 1e4),
        chargeType: chemical ? 'chemical' : 'nuclear',
        windSpeed: lin(u(), 0, 120),
        windDirectionDeg: lin(u(), 0, 359),
      };
      // A candidate law can be swept beside the one in place, in the same
      // session, which is what a guard on the invariants names (the protocol's
      // Conduct, 16 September 2026): NIMBUS_CHEMICAL_BLAST=kingeryBulmash.
      if (CHEMICAL_BLAST !== undefined) input.chemicalBlast = CHEMICAL_BLAST;
      const hob = lin(u(), 0, 50_000);
      const depth = logU(u(), 1, 11_000);
      if (placement < 0.2) input.heightOfBurst = 0;
      else if (placement < 0.8) input.heightOfBurst = hob;
      else {
        input.heightOfBurst = -depth;
        input.waterDepth = depth * lin(u(), 1, 3);
      }
      return input;
    },
    grow: (input, f) => ({ ...input, yieldMegatons: (input.yieldMegatons as number) * f }),
    run: (input) => simulateExplosion(input as never) as unknown as Json,
    rings: [
      'blast.overpressure5psiRadiusHob',
      'blast.overpressure1psiRadiusHob',
      'blast.lightDamageRadiusHob',
      'thermal.thirdDegreeBurnRadius',
      'thermal.secondDegreeBurnRadius',
      'thermal.firstDegreeBurnRadius',
      'firestorm.ignitionRadius',
      'firestorm.sustainRadius',
      'radiation.ld50Radius',
      'radiation.ld100Radius',
      'radiation.arsThresholdRadius',
      'crater.apparentDiameter',
    ],
  },
  {
    name: 'earthquake',
    sample: (u) => {
      const input: Json = {
        magnitude: lin(u(), 3, 10),
        depth: lin(u(), 0, 700) * 1_000,
        vs30: logU(u(), 100, 2_000),
        faultType: pick(u(), ['strike-slip', 'reverse', 'normal', 'all']),
        subductionInterface: u() < 0.2,
      };
      const water = u() < 0.3;
      const depth = logU(u(), 10, 8_000);
      if (water) input.waterDepth = depth;
      return input;
    },
    grow: (input, _f, step) => ({
      ...input,
      magnitude: (input.magnitude as number) + (step === 'monotone' ? 0.01 : 0.001),
    }),
    run: (input) => simulateEarthquake(input as never) as unknown as Json,
    rings: [
      'shaking.mmi7Radius',
      'shaking.mmi8Radius',
      'shaking.mmi9Radius',
      'shaking.liquefactionRadius',
      'ruptureLength',
      // The field, not only its contours, from 19 September 2026. Every
      // continuity failure this sweep has ever found in the earthquake family
      // is a contour's radius, and a contour's radius is not the model: it is
      // where a threshold is crossed, and its conditioning blows up in two
      // places. At the onset of a ring the crossing moves like the square root
      // of the excess, so the first millimetres of a ring are a vertical
      // tangent; and for a source three hundred kilometres down, an epicentral
      // radius of fourteen kilometres changes the hypocentral distance by four
      // hundred metres in three hundred kilometres, so a thousandth of a
      // magnitude has to be absorbed by a fifteen per cent move in the radius.
      // These four accelerations and two intensities are the field itself at
      // fixed places, which is what continuity is a property of: if they hold
      // and the contours jump, the jump is the contour's conditioning and not
      // a regime switch in the physics.
      'shaking.pgaAt20km',
      'shaking.pgaAt100km',
      'shaking.pgaAt20kmNGA',
      'shaking.pgaAt100kmNGA',
      'shaking.mmiAtEpicenter',
      'shaking.mmiAtEpicenterEurope',
      // The wave, from 19 September 2026. Until then this sweep read an
      // earthquake's shaking and not the sea it moves, which is what the
      // scorecard's G5 for waves from earthquakes said in its own words:
      // "the earthquake sweep checks the shaking's rings and not the wave's".
      // A path that is absent — three scenarios in ten are put in water — is
      // skipped, as every absent path is. The travel time and the celerity are
      // in: they should not move with the magnitude at all, and a sweep that
      // sees them move has found something.
      'tsunami.meanSlip',
      'tsunami.seafloorUplift',
      'tsunami.ruptureWidth',
      'tsunami.sourceWavelength',
      'tsunami.dominantPeriod',
      'tsunami.initialAmplitude',
      'tsunami.amplitudeAt1000km',
      'tsunami.amplitudeAt5000km',
      'tsunami.amplitudeAt1000kmDispersed',
      'tsunami.amplitudeAt5000kmDispersed',
      'tsunami.amplitudeAt1000kmToward',
      'tsunami.amplitudeAt5000kmToward',
      'tsunami.runupAt1000km',
      'tsunami.inundationDistanceAt1000km',
      'tsunami.travelTimeTo1000km',
    ],
  },
  {
    name: 'volcano',
    sample: (u) => {
      const input: Json = {
        volumeEruptionRate: scientific(u(), u(), [3, 4, 5, 6, 7, 8, 9]),
        totalEjectaVolume: scientific(u(), u(), [7, 8, 9, 10, 11, 12, 13]),
        windSpeed: lin(u(), 0, 60),
        windDirectionDegrees: lin(u(), 0, 359),
      };
      const lahar = logU(u(), 1e5, 1e10);
      const evacuation = lin(u(), 0, 200) * 1_000;
      if (u() < 0.3) input.laharVolume = lahar;
      if (u() < 0.3) input.evacuationRadiusM = evacuation;
      return input;
    },
    grow: (input, f) => ({
      ...input,
      volumeEruptionRate: (input.volumeEruptionRate as number) * f,
      totalEjectaVolume: (input.totalEjectaVolume as number) * f,
    }),
    run: (input) => simulateVolcano(input as never) as unknown as Json,
    rings: [
      'plumeHeight',
      'pyroclasticRunout',
      'pyroclasticRunoutEnergyLine',
      'ashfallArea1mm',
      'windAdvectedAshfall.area',
      'windAdvectedAshfall.downwindRange',
    ],
  },
  {
    name: 'landslide',
    sample: (u) => {
      const input: Json = {
        volumeM3: scientific(u(), u(), [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
        regime: pick(u(), ['subaerial', 'submarine']),
        slopeAngleDeg: lin(u(), 1, 89),
        meanOceanDepth: u() < 0.1 ? 0 : lin(u(), 0, 11_000),
      };
      const basin = logU(u(), 1e5, 1e11);
      const factor = lin(u(), 0.1, 10);
      const footprint = logU(u(), 1e3, 1e11);
      if (u() < 0.2) {
        input.confinedBasinArea = basin;
        input.confinementDynamicFactor = factor;
      }
      if (u() < 0.2) input.slideFootprintArea = footprint;
      return input;
    },
    grow: (input, f) => ({ ...input, volumeM3: (input.volumeM3 as number) * f }),
    run: (input) => simulateLandslide(input as never) as unknown as Json,
    rings: [
      'tsunami.sourceAmplitude',
      'tsunami.amplitudeAt100km',
      'tsunami.amplitudeAt1000km',
      'characteristicLength',
    ],
  },
];

/** The number at a dotted path of a result, or NaN. */
function numberAt(result: Json, path: string): number {
  const v = path.split('.').reduce<unknown>((o, k) => (o as Json | undefined)?.[k], result);
  return typeof v === 'number' ? v : NaN;
}

function leaves(value: unknown, path: string, out: Map<string, number>): void {
  if (typeof value === 'number') {
    out.set(path, value);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => leaves(v, `${path}[${i.toString()}]`, out));
    return;
  }
  for (const [k, v] of Object.entries(value)) {
    if (path === '' && k === 'inputs') continue;
    leaves(v, path === '' ? k : `${path}.${k}`, out);
  }
}

const NON_NEGATIVE = /(radius|runout|area|diameter|amplitude|length|height|volume|mass|energy)$/i;
const DISTANCE = /(radius|runout|range)$/i;
const AREA = /area$/i;

interface Tally {
  count: number;
  examples: { input: Json; detail: string }[];
}

export interface Finding {
  key: string;
  input: Json;
  detail: string;
}

/** Every invariant of one scenario, in the worker; exported for the tests of
 *  the harness's own reading (rule 761 of validation/lowBurstCraterRules.ts). */
export function checkScenario(hazard: Hazard, input: Json): Finding[] {
  const found: Finding[] = [];
  const fail = (key: string, at: Json, detail: string): void => {
    found.push({ key, input: at, detail });
  };
  const base = new Map<string, number>();
  let baseResult: Json;
  try {
    baseResult = hazard.run(input);
    leaves(baseResult, '', base);
  } catch (e) {
    fail('finite: the run throws', input, String(e).slice(0, 200));
    return found;
  }
  for (const [path, v] of base) {
    const field = path.replace(/\[\d+\]/g, '[]');
    if (Number.isNaN(v)) fail(`finite: NaN at ${field}`, input, `${path} = NaN`);
    else if (!Number.isFinite(v))
      fail(`finite: infinite at ${field}`, input, `${path} = ${v.toString()}`);
    const key = path.split('.').pop() ?? path;
    if (NON_NEGATIVE.test(key) && v < 0)
      fail(`non-negative: ${field}`, input, `${path} = ${v.toString()}`);
    if (
      DISTANCE.test(key) &&
      !/times/i.test(key) &&
      Number.isFinite(v) &&
      v > HALF_CIRCUMFERENCE + 1
    )
      fail(`within the antipode: ${field}`, input, `${path} = ${(v / 1_000).toFixed(0)} km`);
    if (AREA.test(key) && Number.isFinite(v) && v > EARTH_SURFACE)
      fail(`within the Earth's surface: ${field}`, input, `${path} = ${v.toExponential(3)} m²`);
  }
  for (const [step, factor, check] of [
    ['monotone', 1.01, 'monotone'],
    ['continuity', 1.001, 'continuous'],
  ] as const) {
    const grownInput = hazard.grow(input, factor, step);
    const grown = new Map<string, number>();
    let grownResult: Json;
    try {
      grownResult = hazard.run(grownInput);
      leaves(grownResult, '', grown);
    } catch (e) {
      fail('finite: the run throws', grownInput, String(e).slice(0, 200));
      continue;
    }
    // Rule 623: whether the step crossed a regime, for a hazard that has one.
    const regimeSwitched =
      hazard.regime === undefined ? true : hazard.regime(baseResult) !== hazard.regime(grownResult);
    for (const ring of hazard.rings) {
      const a = base.get(ring);
      const b = grown.get(ring);
      if (a === undefined || b === undefined || !Number.isFinite(a) || !Number.isFinite(b))
        continue;
      // Below a millimetre a ring is not drawn, and its digits are rounding.
      if (Math.max(Math.abs(a), Math.abs(b)) < 1e-3) continue;
      if (check === 'monotone' && b < a * (1 - 1e-9) - 1e-9) {
        const cause = NO_CAUSES
          ? null
          : (hazard.explainShrink?.(ring, baseResult, grownResult, (k) =>
              hazard.run(hazard.grow(input, k, step))
            ) ?? null);
        if (cause === null)
          fail(`monotone in size: ${ring}`, input, `${a.toPrecision(6)} → ${b.toPrecision(6)}`);
        else
          fail(`explained, ${cause}: ${ring}`, input, `${a.toPrecision(6)} → ${b.toPrecision(6)}`);
      }
      if (check === 'continuous') {
        // A magnitude is a logarithm: its jump is measured in units, not as a share.
        const scale = ring.endsWith('magnitude') ? 1 : Math.max(Math.abs(a), Math.abs(b));
        const jumped = scale > 0 && Math.abs(b - a) / scale > 0.05;
        const detail = `${a.toPrecision(6)} → ${b.toPrecision(6)}`;
        if (hazard.regime === undefined) {
          if (jumped) fail(`continuous: ${ring}`, input, detail);
        } else {
          // Rule 627: the check as it was, read in the same run, beside the
          // check as corrected — a count carried from another day measures
          // whatever else happened in between.
          if (jumped) fail(`continuous, as it was: ${ring}`, input, detail);
          const isContour = hazard.contours?.includes(ring) ?? false;
          // Rule 756 of validation/lowBurstCraterRules.ts: a value born from
          // nothing on this step is read as a contour at its birth is.
          const isValueBorn = hazard.births?.includes(ring) ?? false;
          const bornHere = isValueBorn && Math.abs(a) < 1e-3;
          if (jumped && (!(isContour || bornHere) || regimeSwitched)) {
            // Rule 735 of validation/airburstSeismicRules.ts: a magnitude that
            // moves that much is searched by halving, as rule 662 searches a
            // field sample; a steep one is printed apart and G5 does not read it.
            // Rule 756: so is a value whose birth is read as a contour's.
            const found =
              ring.endsWith('magnitude') || isValueBorn
                ? searchFieldJump(
                    (k: number): number => {
                      try {
                        return numberAt(hazard.run(hazard.grow(input, k, step)), ring);
                      } catch {
                        return NaN;
                      }
                    },
                    1,
                    factor,
                    a,
                    b,
                    // A share of the value's scale, as rule 662's; a magnitude's
                    // scale is one unit.
                    FIELD_JUMP_SHARE * scale
                  )
                : null;
            if (found?.kind === 'steep')
              fail(
                `steep, not a jump (${isValueBorn ? 'crater' : 'magnitude'}): ${ring}`,
                input,
                `${detail}, continuous below ${String(found.depth)} halvings`
              );
            else
              fail(
                `continuous: ${ring}`,
                input,
                `${detail}${isContour || bornHere ? ' (regime switch)' : ''}${found === null ? '' : `, ${found.kind === 'jump' ? `a jump at ×${found.at.toPrecision(12)}` : `unresolved: ${found.why}`}`}`
              );
          }
        }
      }
    }
    // Rule 624: the field, at fixed places, everywhere — read since rules 660
    // to 666 of validation/fieldJumpRules.ts as the limit continuity is.
    if (check === 'continuous' && hazard.fields !== undefined) {
      for (const { path, floor } of hazard.fields) {
        const a = base.get(path);
        const b = grown.get(path);
        if (a === undefined || b === undefined || !Number.isFinite(a) || !Number.isFinite(b))
          continue;
        // Rule 625: below its floor in both runs a sample is not compared.
        if (Math.max(Math.abs(a), Math.abs(b)) < floor) continue;
        const scale = Math.max(Math.abs(a), Math.abs(b));
        const moved = Math.abs(b - a) / scale;
        const detail = `${a.toPrecision(6)} → ${b.toPrecision(6)}${regimeSwitched ? ' (regime switch)' : ''}`;
        // Rule 663: the field as rule 624 read it, printed beside the search.
        if (moved > CONTINUITY_TOLERANCE)
          fail(`continuous (field), as rule 624 read it: ${path}`, input, detail);
        // Rule 662: a sample the step moves by more than the gate is searched.
        if (moved <= FIELD_JUMP_GATE) continue;
        const valueAt = (k: number): number => {
          try {
            return numberAt(hazard.run(hazard.grow(input, k, step)), path);
          } catch {
            return NaN;
          }
        };
        const found = searchFieldJump(valueAt, 1, factor, a, b, FIELD_JUMP_SHARE * scale);
        if (found.kind === 'steep')
          fail(
            `steep, not a jump (field): ${path}`,
            input,
            `${detail}, continuous below ${String(found.depth)} halvings`
          );
        else
          fail(
            `continuous (field): ${path}`,
            input,
            `${detail}, ${found.kind === 'jump' ? `a jump at ×${found.at.toPrecision(12)}` : `unresolved: ${found.why}`}`
          );
      }
    }
  }
  return found;
}

/** Rule 664 of validation/fieldJumpRules.ts, rule 683 of
 *  validation/blastShrinkSourceRules.ts and rule 735 of
 *  validation/airburstSeismicRules.ts: the keys G5 does not read. */
export const NOT_READ_BY_G5 = [
  'continuous, as it was',
  'continuous (field), as rule 624 read it',
  'steep, not a jump (field)',
  'explained, ',
  // Rule 735 of validation/airburstSeismicRules.ts.
  'steep, not a jump (magnitude)',
  // Rule 756 of validation/lowBurstCraterRules.ts.
  'steep, not a jump (crater)',
] as const;

/** How long a scenario's three runs may take before they count as not returning. */
const WATCHDOG_MS = 2_000;

class Runner {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;

  private start(): Promise<void> {
    // The worker loads this file through tsx, as the main thread did.
    const worker = new Worker(
      `import('tsx/esm/api').then(({ register }) => { register(); return import(${JSON.stringify(import.meta.url)}); });`,
      { eval: true }
    );
    this.worker = worker;
    this.ready = new Promise((resolveReady) => {
      worker.once('message', () => {
        resolveReady();
      });
    });
    return this.ready;
  }

  async check(hazard: string, input: Json): Promise<Finding[] | 'timeout'> {
    if (this.worker === null) await this.start();
    await this.ready;
    const worker = this.worker;
    if (worker === null) throw new Error('the worker did not start');
    return new Promise((resolveCheck) => {
      const timer = setTimeout(() => {
        worker.removeAllListeners('message');
        void worker.terminate();
        this.worker = null;
        resolveCheck('timeout');
      }, WATCHDOG_MS);
      worker.once('message', (found: Finding[]) => {
        clearTimeout(timer);
        resolveCheck(found);
      });
      worker.postMessage({ hazard, input });
    });
  }

  async stop(): Promise<void> {
    if (this.worker !== null) await this.worker.terminate();
  }
}

async function main(): Promise<void> {
  const report: Record<string, Record<string, Tally>> = {};
  const scenarios: Record<string, number> = {};
  const runner = new Runner();
  for (const hazard of HAZARDS.filter((h) => ONLY === undefined || h.name === ONLY)) {
    // Rule 642: a run may be asked for a seed no run has used.
    const rng = mulberry32(SWEEP_SEED_OVERRIDE ?? `benchmark-2026-09-15-inv-${hazard.name}`);
    const u = (): number => rng.next();
    const tallies: Record<string, Tally> = {};
    const fail = (key: string, input: Json, detail: string): void => {
      const t = (tallies[key] ??= { count: 0, examples: [] });
      t.count += 1;
      if (t.examples.length < 5) t.examples.push({ input, detail });
    };
    for (let n = 0; n < N; n++) {
      const input = hazard.sample(u);
      const found = await runner.check(hazard.name, input);
      if (found === 'timeout') {
        fail(
          `finite: the run does not return within ${(WATCHDOG_MS / 1_000).toString()} s`,
          input,
          ''
        );
        continue;
      }
      for (const f of found) fail(f.key, f.input, f.detail);
    }
    report[hazard.name] = tallies;
    scenarios[hazard.name] = N;
    const failures = Object.values(tallies).reduce((s, t) => s + t.count, 0);
    // Rule 664 of validation/fieldJumpRules.ts: what G5 reads leaves out the
    // checks as they were, printed beside the corrected ones, and the field
    // the search found continuous.
    const read = Object.entries(tallies)
      .filter(([key]) => !NOT_READ_BY_G5.some((prefix) => key.startsWith(prefix)))
      .reduce((s, [, t]) => s + t.count, 0);
    console.log(
      `${hazard.name}: ${N.toString()} scenarios, ${failures.toString()} invariant failures` +
        (read === failures ? '' : `, ${read.toString()} read by G5`)
    );
    for (const [key, t] of Object.entries(tallies).sort((a, b) => b[1].count - a[1].count)) {
      console.log(
        `  ${t.count.toString().padStart(5)}  ${key}  e.g. ${t.examples[0]?.detail ?? ''}`
      );
    }
  }
  await runner.stop();
  // The campaign's own file is a record of what was run on 15 September 2026
  // and is not overwritten: a later sweep writes beside it, named by its day.
  // Until 16 September this wrote straight over it.
  const resultsDir = join(ROOT, 'benchmark', 'results');
  mkdirSync(resultsDir, { recursive: true });
  // A name nothing has taken: the day, then the day and a number. A sweep
  // never writes over a sweep: the file is created exclusively, so two sweeps
  // that end together cannot both take the name they both found free.
  const stamp = new Date().toISOString().slice(0, 10);
  const body = `${JSON.stringify({ track: 'INV', scenariosPerHazard: scenarios, watchdogMs: WATCHDOG_MS, failures: report }, null, 1)}\n`;
  let out = join(resultsDir, 'invariants.json');
  for (let n = 0; ; n++) {
    if (!existsSync(out)) {
      try {
        writeFileSync(out, body, { flag: 'wx' });
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      }
    }
    out = join(
      resultsDir,
      n === 0 ? `invariants-${stamp}.json` : `invariants-${stamp}-${n.toString()}.json`
    );
  }
  console.error(`wrote ${out}`);
}

/** Run the sweep only when this file IS the command, not when another module
 *  imports {@link HAZARDS} from it. Until 21 September 2026 the check was
 *  `isMainThread` alone, so importing the samplers ran all 25 000 scenarios
 *  as a side effect and wrote a results file nobody asked for. */
const entry = process.argv[1];
const isEntryModule = entry !== undefined && import.meta.url === pathToFileURL(entry).href;

if (isMainThread && isEntryModule) {
  await main();
} else if (!isMainThread) {
  const port = parentPort;
  if (port !== null) {
    port.on('message', ({ hazard, input }: { hazard: string; input: Json }) => {
      const h = HAZARDS.find((x) => x.name === hazard);
      port.postMessage(h === undefined ? [] : checkScenario(h, input));
    });
    port.postMessage('ready');
  }
}
