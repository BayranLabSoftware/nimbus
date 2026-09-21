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
import { CONTINUITY_TOLERANCE, FIELD_FLOOR } from '../../src/physics/validation/continuityRules.js';

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
 *   larger jump is a regime switch that is not continuous.
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
  fields?: readonly { path: string; floor: number }[];
}

const logU = (u: number, lo: number, hi: number): number =>
  Math.exp(Math.log(lo) + u * (Math.log(hi) - Math.log(lo)));
const lin = (u: number, lo: number, hi: number): number => lo + u * (hi - lo);
const pick = <T>(u: number, xs: readonly T[]): T =>
  xs[Math.min(xs.length - 1, Math.floor(u * xs.length))] as T;
const scientific = (u1: number, u2: number, exponents: readonly number[]): number =>
  lin(u1, 1, 9.9) * 10 ** pick(u2, exponents);

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
      simulateImpact(
        (GROUND_BLAST === undefined ? input : { ...input, groundBlast: GROUND_BLAST }) as never
      ) as unknown as Json,
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

interface Finding {
  key: string;
  input: Json;
  detail: string;
}

/** Every invariant of one scenario, in the worker. */
function checkScenario(hazard: Hazard, input: Json): Finding[] {
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
      if (check === 'monotone' && b < a * (1 - 1e-9) - 1e-9)
        fail(`monotone in size: ${ring}`, input, `${a.toPrecision(6)} → ${b.toPrecision(6)}`);
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
          if (jumped && (!isContour || regimeSwitched))
            fail(`continuous: ${ring}`, input, `${detail}${isContour ? ' (regime switch)' : ''}`);
        }
      }
    }
    // Rule 624: the field, at fixed places, everywhere.
    if (check === 'continuous' && hazard.fields !== undefined) {
      for (const { path, floor } of hazard.fields) {
        const a = base.get(path);
        const b = grown.get(path);
        if (a === undefined || b === undefined || !Number.isFinite(a) || !Number.isFinite(b))
          continue;
        // Rule 625: below its floor in both runs a sample is not compared.
        if (Math.max(Math.abs(a), Math.abs(b)) < floor) continue;
        const scale = Math.max(Math.abs(a), Math.abs(b));
        if (Math.abs(b - a) / scale > CONTINUITY_TOLERANCE)
          fail(
            `continuous (field): ${path}`,
            input,
            `${a.toPrecision(6)} → ${b.toPrecision(6)}${regimeSwitched ? ' (regime switch)' : ''}`
          );
      }
    }
  }
  return found;
}

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
    const rng = mulberry32(`benchmark-2026-09-15-inv-${hazard.name}`);
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
    console.log(
      `${hazard.name}: ${N.toString()} scenarios, ${failures.toString()} invariant failures`
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
  // never writes over a sweep.
  const stamp = new Date().toISOString().slice(0, 10);
  let out = join(resultsDir, 'invariants.json');
  for (let n = 0; existsSync(out); n++) {
    out = join(
      resultsDir,
      n === 0 ? `invariants-${stamp}.json` : `invariants-${stamp}-${n.toString()}.json`
    );
  }
  writeFileSync(
    out,
    `${JSON.stringify({ track: 'INV', scenariosPerHazard: scenarios, watchdogMs: WATCHDOG_MS, failures: report }, null, 1)}\n`
  );
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
