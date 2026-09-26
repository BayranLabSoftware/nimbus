/**
 * Rule 1156 (src/physics/validation/fcmRound1Rules.ts): the observational
 * development of the FCM branch — every declared development case under both
 * structures and both clouds, paired with the baseline on the same input draws,
 * judged favourable, unfavourable or not assessable by the margins the rule
 * fixed before any run; and the sensitivities of rule 1156 (g). Writes
 * src/physics/validation/fcmDevRuns.json and docs/FCM_DEV_RUNS.md. None of it is
 * a blind test.
 *
 *   pnpm exec tsx scripts/fcm-dev-runs.ts all          # every shard, then the merge
 *   pnpm exec tsx scripts/fcm-dev-runs.ts shard k K    # the cases i with i % K = k
 *   pnpm exec tsx scripts/fcm-dev-runs.ts merge K
 *
 * Reads the aggregated tail rule 1150 chose from src/physics/validation/
 * fcmDomainMap.json: run the map first.
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FcmOptions } from '../src/physics/effects/fcmBranch.js';
import { CRUSTAL_ROCK_DENSITY } from '../src/physics/constants.js';
import { simulateImpact, type ImpactScenarioInput } from '../src/physics/simulate.js';
import { kgPerM3, m, mps, rad } from '../src/physics/units.js';
import { percentileType7 } from '../src/physics/validation/entryBand.js';
import { DEV_CASES } from '../src/physics/validation/fragmentationDevTable.js';
import {
  FCM_DEV_PRIORS,
  FCM_DEV_RUN,
  FCM_DOMAIN_MAP,
  FCM_TUNING,
} from '../src/physics/validation/fcmRound1Rules.js';
import { THIRD_SET_BODIES } from '../src/physics/validation/thirdSetSources.js';
import {
  THIRD_SET_O1_WIDENING_M,
  THIRD_SET_RUN_DRAWS,
  THIRD_SET_RUN_SEED,
} from '../src/physics/validation/thirdSetRunRules.js';
import { drawnInputs, inputsOf, row, stream } from './fragmentationRun.js';
import { CONFIGURATIONS, drawFcm, quantities, round, type Quantities } from './fcmRound1Common.js';
import { engineFromArgs, runOn } from './porta1Engine.js';

/** Rule 1160: `--tuning T1` or `T2` runs a candidate, without the
 *  sensitivities, into its own outputs. */
const TUNING_ARG = process.argv.indexOf('--tuning');
const TUNING = TUNING_ARG >= 0 ? (process.argv[TUNING_ARG + 1] as 'T1' | 'T2') : null;
const TUNED: { alpha?: readonly [number, number]; cloudShare?: readonly [number, number] } =
  TUNING === null ? {} : FCM_TUNING.candidates[TUNING];
const TUNED_WORDS = (['cloudShare', 'alpha'] as const).flatMap((k) => {
  const r = TUNED[k];
  return r === undefined ? [] : [`${k} uniform on ${String(r[0])}–${String(r[1])}`];
});
/** Rule 1229 (e)(1): `--engine settle` flies rule 1227's corrected settle
 *  condition, into its own outputs. */
const { engine: ENGINE, suffix: ENGINE_SUFFIX } = engineFromArgs(process.argv);
if (TUNING !== null && ENGINE_SUFFIX !== '') throw new Error('--tuning and --engine not combined');
const SUFFIX = TUNING === null ? ENGINE_SUFFIX : `.${TUNING}`;
const run = runOn(ENGINE);
const SHARDS_DIR = join(tmpdir(), `nimbus-fcm-dev-runs${SUFFIX}`);
const DRAWS = FCM_DEV_PRIORS.draws;

interface Interval {
  lowM: number;
  highM: number;
  source: string;
  counted: boolean;
}

interface DevCaseSpec {
  name: string;
  family: 'rule 961' | 'third set' | 'W18';
  inputs: ImpactScenarioInput[];
  drawn: string;
  firstEvent: Interval | null;
  mainFlare: Interval | null;
  /** W18's other flares, read as a diagnostic: found within 1 km or not. */
  otherFlaresKm: number[];
  recovery: string | null;
  noCrater: string | null;
  crater: string | null;
  recordedMassKg: number | null;
}

const input = (
  diameterM: number,
  speedMS: number,
  densityKgM3: number,
  angleDeg: number
): ImpactScenarioInput => ({
  impactorDiameter: m(diameterM),
  impactVelocity: mps(speedMS),
  impactorDensity: kgPerM3(densityKgM3),
  targetDensity: CRUSTAL_ROCK_DENSITY,
  impactAngle: rad((angleDeg * Math.PI) / 180),
  surfaceGravity: 9.806_65,
});

/** Rule 1156 (a): the cases, their draws and what the sources document. */
function cases(): DevCaseSpec[] {
  const out: DevCaseSpec[] = [];
  // Rule 961's nine.
  const RECOVERY_961: Record<string, string> = {
    Chelyabinsk: 'W18 p. 8, after Popova et al. (2013): fallen masses of 4 000–6 000 kg',
    '2008 TC3': 'borovicka2009, Sect. 5: "only small meteorites (≤283 g) were found"',
    '2018 LA': 'jenniskens2021: twenty-three meteorites recovered',
    '2023 CX1': 'egal2025: Saint-Pierre-le-Viger meteorites recovered',
    '2024 BX1': 'spurny2024: meteorites recovered in the predicted strewn field',
  };
  for (const { case: c } of DEV_CASES) {
    const { inputs, drawn } = inputsOf(c);
    const interval = (metric: 'm1' | 'm2'): Interval | null => {
      const r = row(c, metric);
      return r.observed.kind === 'altitude'
        ? {
            lowM: r.observed.lowM,
            highM: r.observed.highM,
            source: `${r.source} ${r.where}`.trim(),
            counted: r.counted,
          }
        : null;
    };
    const m3 = row(c, 'm3');
    const outcome = m3.observed.kind === 'outcome' ? m3.observed.reachesGround : null;
    out.push({
      name: c,
      family: 'rule 961',
      inputs: inputs.slice(0, DRAWS),
      drawn: `${drawn}; the first ${String(Math.min(DRAWS, inputs.length))}`,
      firstEvent: interval('m1'),
      mainFlare: interval('m2'),
      otherFlaresKm: [],
      recovery: RECOVERY_961[c] ?? null,
      noCrater: outcome === false ? `the development table, m3 (${m3.source})` : null,
      crater: outcome === true ? `the development table, m3 (${m3.source} ${m3.where})` : null,
      recordedMassKg: null,
    });
  }
  // The third set's six (rule 1128: development only).
  for (const b of THIRD_SET_BODIES) {
    const inputs = drawnInputs(
      { event: b.event, inputs: b.inputs, targets: [] },
      `${THIRD_SET_RUN_SEED}${b.event}`,
      THIRD_SET_RUN_DRAWS
    ).slice(0, DRAWS);
    out.push({
      name: b.event,
      family: 'third set',
      inputs,
      drawn: `rule 1126's stream ${THIRD_SET_RUN_SEED}${b.event}; the first ${String(DRAWS)}`,
      firstEvent: null,
      mainFlare: b.o1.eligible
        ? {
            lowM: b.o1.intervalKm[0] * 1_000 - THIRD_SET_O1_WIDENING_M,
            highM: b.o1.intervalKm[1] * 1_000 + THIRD_SET_O1_WIDENING_M,
            source: `the third set's O1, ${b.o1.where}, widened as rule 1126`,
            counted: true,
          }
        : null,
      otherFlaresKm: [],
      recovery: b.ground.recovery.eligible ? b.ground.recovery.why : null,
      noCrater: b.ground.noCrater.eligible ? b.ground.noCrater.why : null,
      crater: null,
      recordedMassKg: null,
    });
  }
  // W18's three.
  for (const [name, w] of Object.entries(FCM_DEV_RUN.w18Cases)) {
    const u = stream(`${FCM_DEV_PRIORS.seed}${name}/inputs`);
    const inputs = Array.from({ length: DRAWS }, () => {
      const mass = w.massKg[0] * (w.massKg[1] / w.massKg[0]) ** u();
      const density = w.densityKgM3[0] + (w.densityKgM3[1] - w.densityKgM3[0]) * u();
      return input(Math.cbrt((6 * mass) / (Math.PI * density)), w.speedMS, density, w.angleDeg);
    });
    const r = FCM_DEV_RUN.w18ReadingM;
    const flares: readonly number[] = 'flaresKm' in w ? w.flaresKm : [];
    // The main flare: Košice's large lower one (37 km), Tagish Lake's largest,
    // the lowest (32 km) — W18's words.
    const main = name === 'Košice' ? 37 : name === 'Tagish Lake' ? 32 : null;
    out.push({
      name,
      family: 'W18',
      inputs,
      drawn: `W18's ranges on ${FCM_DEV_PRIORS.seed}${name}/inputs, ${String(DRAWS)} draws`,
      firstEvent:
        'disruptionKm' in w
          ? {
              lowM: w.disruptionKm[0] * 1_000,
              highM: w.disruptionKm[1] * 1_000,
              source:
                'W18 pp. 13–14: initial disruption at 65–67 km (FCM) and 70 km (Borovička 2015)',
              counted: true,
            }
          : null,
      mainFlare:
        main === null
          ? null
          : {
              lowM: main * 1_000 - r,
              highM: main * 1_000 + r,
              source: `W18: the main flare near ${String(main)} km, read ±1 km`,
              counted: true,
            },
      otherFlaresKm: flares.filter((z) => z !== main),
      recovery:
        name === 'Tagish Lake'
          ? 'W18 p. 18, after Hildebrand et al. (2006): 16.3 kg of recorded fragments'
          : name === 'Benešov'
            ? 'W18 p. 14: meteorite finds typed by Spurný et al. (2014)'
            : null,
      noCrater: null,
      crater: null,
      recordedMassKg: 'recordedMassKg' in w ? w.recordedMassKg : null,
    });
  }
  return out;
}

/** The aggregated tail rule 1150 chose, where the map verified one. */
function chosenTail(): number | null {
  const path = 'src/physics/validation/fcmDomainMap.json';
  if (!existsSync(path)) throw new Error('run scripts/fcm-domain-map.ts first');
  return (JSON.parse(readFileSync(path, 'utf8')) as { tail: { chosen: number | null } }).tail
    .chosen;
}

type FcmStatus = 'completed' | 'completed at 10⁶' | 'completed by the tail' | 'not completed';

interface FcmDraw {
  status: FcmStatus;
  q: Quantities | null;
}

interface Variant {
  name: string;
  change: (d: ReturnType<typeof drawFcm>) => ReturnType<typeof drawFcm>;
}

/** Rule 1156 (g): the sensitivities, on M1 with clouds unlimited. */
const SENSITIVITIES: Variant[] = [
  {
    name: 'exponential atmosphere',
    change: (d) => ({ ...d, options: { ...d.options, atmosphere: 'exponential' } }),
  },
  {
    name: 'C_disp 0.1',
    change: (d) => ({ ...d, options: { ...d.options, cloudDispersion: 0.1 } }),
  },
  ...[3, 4].map((n) => ({
    name: `${String(n)} fragments per break`,
    change: (d: ReturnType<typeof drawFcm>) => ({
      ...d,
      options: {
        ...d.options,
        split:
          d.options.split.kind === 'mass' ? { ...d.options.split, fragments: n } : d.options.split,
      } satisfies FcmOptions,
    }),
  })),
  {
    name: 'strength scaled with size',
    change: (d) => ({
      ...d,
      // Rule 1152 (b): S from a 1 m body, S (m_ref / m)^α = S (1 m / D)^(3α).
      body: {
        ...d.body,
        strength:
          d.body.strength *
          (FCM_DEV_PRIORS.sizeScalingReferenceM / d.body.diameter) ** (3 * d.parameters.alpha),
      },
    }),
  },
];

function flyFcm(d: ReturnType<typeof drawFcm>, tail: number | null): FcmDraw {
  let r = run(d);
  let status: FcmStatus = 'completed';
  if (!r.completed) {
    r = run(d, { maxComponents: FCM_DOMAIN_MAP.retryComponents });
    status = 'completed at 10⁶';
  }
  if (!r.completed && tail !== null) {
    r = run(d, { aggregateBelowShare: tail, maxComponents: FCM_DOMAIN_MAP.retryComponents });
    status = 'completed by the tail';
  }
  if (!r.completed) return { status: 'not completed', q: null };
  return { status, q: quantities(r) };
}

interface BaseDraw {
  firstKm: number | null;
  burstKm: number | null;
  anyPiece: boolean;
  lawSpeed: boolean;
  landedKg: number;
  energyToGround: number;
}

function flyBaseline(x: ImpactScenarioInput): BaseDraw {
  const e = simulateImpact(x).entry;
  const m0 = (Math.PI / 6) * (x.impactorDensity as number) * (x.impactorDiameter as number) ** 3;
  const first = e.firstFragmentationAltitude as number | undefined;
  const reaches = e.regime !== 'COMPLETE_AIRBURST';
  return {
    firstKm: first !== undefined && first > 0 ? first / 1_000 : null,
    burstKm: reaches ? null : (e.burstAltitude as number) / 1_000,
    anyPiece: reaches,
    lawSpeed: reaches && (e.endVelocity as number) >= FCM_DEV_RUN.craterLawSpeedMS,
    landedKg: e.regime === 'INTACT' ? m0 : 0,
    energyToGround: e.energyFractionToGround,
  };
}

const med = (xs: readonly number[]): number | null =>
  xs.length === 0 ? null : percentileType7(xs, 0.5);
const p = (xs: readonly number[], q: number): number | null =>
  xs.length === 0 ? null : percentileType7(xs, q);
const r4 = (x: number | null): number | null => (x === null ? null : round(x, 4));
const distanceKm = (x: number | null, iv: Interval): number | null =>
  x === null ? null : Math.max(0, iv.lowM / 1_000 - x, x - iv.highM / 1_000);

type Verdict = 'favourable' | 'unfavourable' | 'equal' | 'not assessable';

/** Rule 1156 (d): a release judged by its median's distance to the interval. */
function releaseVerdict(
  model: readonly (number | null)[],
  base: readonly (number | null)[],
  iv: Interval | null
): { verdict: Verdict; model: number | null; baseline: number | null; why: string } {
  if (iv === null)
    return { verdict: 'not assessable', model: null, baseline: null, why: 'no observed interval' };
  const mm = model.filter((x): x is number => x !== null);
  const bb = base.filter((x): x is number => x !== null);
  const min = FCM_DEV_RUN.minProducedShare;
  if (mm.length < min * model.length || bb.length < min * base.length)
    return {
      verdict: 'not assessable',
      model: r4(med(mm)),
      baseline: r4(med(bb)),
      why: `produced in ${String(mm.length)} of the branch's draws and ${String(bb.length)} of the baseline's`,
    };
  const dm = distanceKm(med(mm), iv) ?? 0;
  const db = distanceKm(med(bb), iv) ?? 0;
  const margin = FCM_DEV_RUN.releaseMarginM / 1_000;
  return {
    verdict: dm <= db - margin ? 'favourable' : dm >= db + margin ? 'unfavourable' : 'equal',
    model: r4(med(mm)),
    baseline: r4(med(bb)),
    why: `distance ${String(round(dm, 3))} km against ${String(round(db, 3))} km`,
  };
}

/** Rule 1156 (d): a share judged by the margin; `worseOnly` for «no crater». */
function shareVerdict(
  model: number,
  base: number,
  documented: string | null,
  higherIsBetter: boolean,
  worseOnly = false
): { verdict: Verdict; model: number; baseline: number } {
  if (documented === null)
    return { verdict: 'not assessable', model: r4(model) ?? 0, baseline: r4(base) ?? 0 };
  const d = higherIsBetter ? model - base : base - model;
  const margin = FCM_DEV_RUN.shareMargin;
  const verdict: Verdict =
    d >= margin && !worseOnly ? 'favourable' : d <= -margin ? 'unfavourable' : 'equal';
  return { verdict, model: r4(model) ?? 0, baseline: r4(base) ?? 0 };
}

function summarise(spec: DevCaseSpec, fcm: FcmDraw[], base: BaseDraw[]) {
  const done = fcm.flatMap((d) => (d.q === null ? [] : [d.q]));
  const robust = done.filter((q) => q.robust);
  const main = fcm.map((d) => (d.q?.robust ? d.q.peakAltitudeKm : null));
  const first = fcm.map((d) => d.q?.firstBreakKm ?? null);
  const share = (f: (q: Quantities) => boolean): number =>
    done.filter(f).length / Math.max(fcm.length, 1);
  const landed = done.map((q) => q.landedKg);
  const statuses = Object.fromEntries(
    (
      ['completed', 'completed at 10⁶', 'completed by the tail', 'not completed'] as FcmStatus[]
    ).map((s) => [s, fcm.filter((d) => d.status === s).length])
  );
  return {
    draws: fcm.length,
    statuses,
    notRobust: done.length - robust.length,
    peak: {
      medianKm: r4(med(robust.map((q) => q.peakAltitudeKm))),
      p5Km: r4(
        p(
          robust.map((q) => q.peakAltitudeKm),
          0.05
        )
      ),
      p95Km: r4(
        p(
          robust.map((q) => q.peakAltitudeKm),
          0.95
        )
      ),
      medianKtKm: r4(med(done.map((q) => q.peakKtKm))),
      medianFinestRatio: r4(med(done.map((q) => q.finestRatio))),
    },
    firstBreakMedianKm: r4(med(first.filter((x): x is number => x !== null))),
    survivalShare: r4(share((q) => q.anyPiece)),
    lawSpeedShare: r4(share((q) => q.lawSpeedArrival)),
    landedKg: { median: r4(med(landed)), p95: r4(p(landed, 0.95)) },
    largestMedianKg: r4(med(done.map((q) => q.largestKg))),
    energyToGroundMedian: r4(med(done.map((q) => q.groundEnergyShare))),
    otherFlares: spec.otherFlaresKm.map((z) => ({
      km: z,
      share: r4(
        done.filter(
          (q) =>
            Math.abs(q.peakAltitudeKm - z) <= 1 ||
            (q.secondaryAltitudeKm !== null && Math.abs(q.secondaryAltitudeKm - z) <= 1)
        ).length / Math.max(fcm.length, 1)
      ),
    })),
    judgement: {
      mainFlare: releaseVerdict(
        main,
        base.map((b) => b.burstKm),
        spec.mainFlare
      ),
      firstEvent: releaseVerdict(
        first,
        base.map((b) => b.firstKm),
        spec.firstEvent
      ),
      survival: shareVerdict(
        share((q) => q.anyPiece),
        base.filter((b) => b.anyPiece).length / base.length,
        spec.recovery,
        true
      ),
      noCrater: shareVerdict(
        share((q) => q.lawSpeedArrival),
        base.filter((b) => b.lawSpeed).length / base.length,
        spec.noCrater,
        false,
        true
      ),
      crater: shareVerdict(
        share((q) => q.lawSpeedArrival),
        base.filter((b) => b.lawSpeed).length / base.length,
        spec.crater,
        true
      ),
      recordedMass:
        spec.recordedMassKg === null
          ? null
          : {
              recordedKg: spec.recordedMassKg,
              p95Kg: r4(p(landed, 0.95)),
              contradicted: (p(landed, 0.95) ?? 0) < spec.recordedMassKg,
            },
    },
  };
}

function runCase(spec: DevCaseSpec, tail: number | null) {
  const base = spec.inputs.map(flyBaseline);
  const baseline = {
    firstMedianKm: r4(med(base.flatMap((b) => (b.firstKm === null ? [] : [b.firstKm])))),
    burstMedianKm: r4(med(base.flatMap((b) => (b.burstKm === null ? [] : [b.burstKm])))),
    burstShare: r4(base.filter((b) => b.burstKm !== null).length / base.length),
    survivalShare: r4(base.filter((b) => b.anyPiece).length / base.length),
    lawSpeedShare: r4(base.filter((b) => b.lawSpeed).length / base.length),
    energyToGroundMedian: r4(med(base.map((b) => b.energyToGround))),
  };
  const configurations = CONFIGURATIONS.map(({ structure, cloud }) => {
    const u = stream(`${FCM_DEV_PRIORS.seed}${spec.name}/${structure}/${cloud}`);
    const fcm = spec.inputs.map((x) =>
      flyFcm(drawFcm(entryOf(x), structure, cloud, u, TUNED), tail)
    );
    return { configuration: `${structure}/${cloud}`, ...summarise(spec, fcm, base) };
  });
  // Rule 1156 (g): on M1 with clouds unlimited, the same parameter draws.
  const sensitivities = (TUNING === null ? SENSITIVITIES : []).map((v) => {
    const u = stream(`${FCM_DEV_PRIORS.seed}${spec.name}/M1/unlimited`);
    const fcm = spec.inputs.map((x) =>
      flyFcm(v.change(drawFcm(entryOf(x), 'M1', 'unlimited', u)), tail)
    );
    const s = summarise(spec, fcm, base);
    return {
      sensitivity: v.name,
      statuses: s.statuses,
      peakMedianKm: s.peak.medianKm,
      firstBreakMedianKm: s.firstBreakMedianKm,
      survivalShare: s.survivalShare,
      lawSpeedShare: s.lawSpeedShare,
      landedMedianKg: s.landedKg.median,
      mainFlare: s.judgement.mainFlare.verdict,
    };
  });
  const spread = (f: (c: (typeof configurations)[number]) => number | null): number | null => {
    const xs = configurations.map(f).filter((x): x is number => x !== null);
    return xs.length < 2 ? null : r4(Math.max(...xs) - Math.min(...xs));
  };
  return {
    case: spec.name,
    family: spec.family,
    drawn: spec.drawn,
    documented: {
      firstEvent: spec.firstEvent,
      mainFlare: spec.mainFlare,
      otherFlaresKm: spec.otherFlaresKm,
      recovery: spec.recovery,
      noCrater: spec.noCrater,
      crater: spec.crater,
      recordedMassKg: spec.recordedMassKg,
    },
    baseline,
    configurations,
    structuralSpread: {
      peakMedianKm: spread((c) => c.peak.medianKm),
      firstBreakMedianKm: spread((c) => c.firstBreakMedianKm),
      survivalShare: spread((c) => c.survivalShare),
      lawSpeedShare: spread((c) => c.lawSpeedShare),
    },
    sensitivities,
  };
}

const entryOf = (x: ImpactScenarioInput) => ({
  diameterM: x.impactorDiameter as number,
  speedMS: x.impactVelocity as number,
  densityKgM3: x.impactorDensity as number,
  angleRad: x.impactAngle as number,
});

type CaseResult = ReturnType<typeof runCase>;

function shard(k: number, K: number): void {
  const tail = chosenTail();
  const out: CaseResult[] = [];
  cases().forEach((c, i) => {
    if (i % K === k) out.push(runCase(c, tail));
  });
  mkdirSync(SHARDS_DIR, { recursive: true });
  writeFileSync(join(SHARDS_DIR, `shard-${String(k)}-of-${String(K)}.json`), JSON.stringify(out));
}

function merge(K: number): void {
  const order = cases().map((c) => c.name);
  const results: CaseResult[] = [];
  for (let k = 0; k < K; k++)
    results.push(
      ...(JSON.parse(
        readFileSync(join(SHARDS_DIR, `shard-${String(k)}-of-${String(K)}.json`), 'utf8')
      ) as CaseResult[])
    );
  results.sort((a, b) => order.indexOf(a.case) - order.indexOf(b.case));
  const OBS = ['mainFlare', 'firstEvent', 'survival', 'noCrater', 'crater'] as const;
  const tally = Object.fromEntries(
    CONFIGURATIONS.map(({ structure, cloud }) => {
      const conf = `${structure}/${cloud}`;
      const counts: Record<Verdict, number> = {
        favourable: 0,
        unfavourable: 0,
        equal: 0,
        'not assessable': 0,
      };
      for (const r of results) {
        const c = r.configurations.find((x) => x.configuration === conf);
        if (c === undefined) continue;
        for (const o of OBS) counts[c.judgement[o].verdict] += 1;
      }
      return [conf, counts];
    })
  );
  const contradicted = results.flatMap((r) =>
    r.configurations
      .filter((c) => c.judgement.recordedMass?.contradicted === true)
      .map((c) => `${r.case} ${c.configuration}`)
  );
  const out = { rule: '1156', tail: chosenTail(), draws: DRAWS, tally, contradicted, results };
  writeFileSync(
    `src/physics/validation/fcmDevRuns${SUFFIX}.json`,
    `${JSON.stringify({ ...out, tuning: TUNING === null ? null : { name: TUNING, priors: TUNED }, engine: ENGINE_SUFFIX === '' ? undefined : 'rule 1227, effects/fcmBranchSettle.ts' }, null, 1)}\n`
  );

  const V: Record<Verdict, string> = {
    favourable: 'favourable',
    unfavourable: '**unfavourable**',
    equal: 'equal',
    'not assessable': '—',
  };
  const lines = [
    '# FCM round 1 — the observational development',
    '',
    ...(ENGINE_SUFFIX === ''
      ? []
      : [
          'Flown by rule 1227’s corrected settle condition (`effects/fcmBranchSettle.ts`), rule 1229 (e)(1) — development only, beside the sealed engine’s run of `docs/FCM_DEV_RUNS.md`.',
          '',
        ]),
    'Rule 1156 (`src/physics/validation/fcmRound1Rules.ts`), run by `scripts/fcm-dev-runs.ts`. Every declared',
    `development case — rule 961’s nine, the third set’s six, W18’s three — ${String(DRAWS)} draws each (or one input with`,
    `${String(DRAWS)} parameter draws), under both structures and both clouds, paired with the baseline on the same`,
    'input draws. The judgement is the rule’s, fixed before any run: a release favourable where its median’s',
    'distance to the observed interval is smaller by at least 1 km, unfavourable where larger by 1 km; a share',
    'favourable or unfavourable by 0.10; «no crater» unfavourable only. «—» is not assessable. None of it is a',
    'blind test: every case is development, several were read and tuned on before.',
    '',
    `The aggregated tail: ${out.tail === null ? 'none verified (rule 1150) — draws past the bound stay not completed' : `f_agg = ${String(out.tail)}`}.`,
    '',
    '## The tally, over every case and observable',
    '',
    '| Configuration | favourable | unfavourable | equal | not assessable |',
    '| --- | --- | --- | --- | --- |',
    ...Object.entries(tally).map(
      ([c, t]) =>
        `| ${c} | ${String(t.favourable)} | ${String(t.unfavourable)} | ${String(t.equal)} | ${String(t['not assessable'])} |`
    ),
    '',
    `A recorded mass contradicted (the branch’s 95th percentile below it): ${contradicted.length === 0 ? 'none' : contradicted.join('; ')}.`,
    '',
    '## Case by case',
    '',
    ...results.flatMap((r) => [
      `### ${r.case} (${r.family})`,
      '',
      `Draws: ${r.drawn}. Documented: ${
        [
          r.documented.mainFlare === null
            ? null
            : `main flare ${String(r.documented.mainFlare.lowM / 1_000)}–${String(r.documented.mainFlare.highM / 1_000)} km${r.documented.mainFlare.counted ? '' : ' (not counted before)'}`,
          r.documented.firstEvent === null
            ? null
            : `first event ${String(r.documented.firstEvent.lowM / 1_000)}–${String(r.documented.firstEvent.highM / 1_000)} km${r.documented.firstEvent.counted ? '' : ' (not counted before)'}`,
          r.documented.recovery === null ? null : `recovery (${r.documented.recovery})`,
          r.documented.noCrater === null ? null : 'no crater',
          r.documented.crater === null ? null : 'a crater',
          r.documented.recordedMassKg === null
            ? null
            : `${String(r.documented.recordedMassKg)} kg recorded`,
        ]
          .filter((x) => x !== null)
          .join('; ') || 'nothing the repository or W18 holds'
      }.`,
      '',
      `Baseline: burst in ${String(r.baseline.burstShare)} of the draws, median ${String(r.baseline.burstMedianKm)} km; first event ${String(r.baseline.firstMedianKm)} km; something at the ground in ${String(r.baseline.survivalShare)}, at the crater law’s speeds in ${String(r.baseline.lawSpeedShare)}.`,
      '',
      '| Configuration | completed / 10⁶ / tail / not | not robust | main peak (km, p5–p95) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed (kg, median · p95) | main flare | first event | survival | no crater | crater |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
      ...r.configurations.map(
        (c) =>
          `| ${c.configuration} | ${String(c.statuses.completed)} / ${String(c.statuses['completed at 10⁶'])} / ${String(c.statuses['completed by the tail'])} / ${String(c.statuses['not completed'])} | ${String(c.notRobust)} | ${String(c.peak.medianKm)} (${String(c.peak.p5Km)}–${String(c.peak.p95Km)}) | ${String(c.firstBreakMedianKm)} | ${String(c.survivalShare)} | ${String(c.lawSpeedShare)} | ${String(c.landedKg.median)} · ${String(c.landedKg.p95)} | ${V[c.judgement.mainFlare.verdict]} | ${V[c.judgement.firstEvent.verdict]} | ${V[c.judgement.survival.verdict]} | ${V[c.judgement.noCrater.verdict]} | ${V[c.judgement.crater.verdict]} |`
      ),
      '',
      `Structural spread over the four configurations: main peak ${String(r.structuralSpread.peakMedianKm)} km, first break ${String(r.structuralSpread.firstBreakMedianKm)} km, pieces at the ground ${String(r.structuralSpread.survivalShare)}, at ≥ 5 km/s ${String(r.structuralSpread.lawSpeedShare)}.`,
      ...(r.documented.otherFlaresKm.length > 0
        ? [
            '',
            `W18’s other flares, found within 1 km (main or secondary peak): ${r.configurations
              .map(
                (c) =>
                  `${c.configuration} ${c.otherFlares.map((f) => `${String(f.km)} km in ${String(f.share)}`).join(', ')}`
              )
              .join('; ')}.`,
          ]
        : []),
      '',
      'Sensitivities (M1, clouds unlimited, the same draws):',
      '',
      '| Sensitivity | main peak (km) | first break (km) | pieces at the ground | at ≥ 5 km/s | landed median (kg) | main flare |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      ...r.sensitivities.map(
        (s) =>
          `| ${s.sensitivity} | ${String(s.peakMedianKm)} | ${String(s.firstBreakMedianKm)} | ${String(s.survivalShare)} | ${String(s.lawSpeedShare)} | ${String(s.landedMedianKg)} | ${V[s.mainFlare]} |`
      ),
      '',
    ]),
  ];
  writeFileSync(
    `docs/FCM_DEV_RUNS${SUFFIX.replace('.', '_').toUpperCase()}.md`,
    (TUNING === null
      ? lines
      : [
          `# FCM round 1 — the development runs under tuning ${TUNING} (rule 1160)`,
          '',
          `The priors of rule 1152 with ${TUNED_WORDS.join(' and ')}; nothing else changed, the same streams. The untuned runs: docs/FCM_DEV_RUNS.md. No sensitivities under a tuning.`,
          '',
          ...lines.slice(1),
        ]
    ).join('\n')
  );
  console.log(JSON.stringify({ tally, contradicted }, null, 1));
}

async function all(): Promise<void> {
  const K = Math.max(1, Math.min(availableParallelism() - 1, cases().length));
  await Promise.all(
    Array.from(
      { length: K },
      (_, k) =>
        new Promise<void>((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [
              ...process.execArgv,
              process.argv[1] ?? '',
              'shard',
              String(k),
              String(K),
              ...(TUNING === null ? [] : ['--tuning', TUNING]),
              ...(ENGINE_SUFFIX === '' ? [] : ['--engine', 'settle']),
            ],
            { stdio: 'inherit' }
          );
          child.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`shard ${String(k)} exited ${String(code)}`));
          });
        })
    )
  );
  merge(K);
}

const [mode, a, b] = process.argv.slice(2);
if (mode === 'shard') shard(Number(a), Number(b));
else if (mode === 'merge') merge(Number(a));
else await all();
