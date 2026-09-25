/**
 * Rules 1189 (a) to (c), 1190 (a) (`src/physics/validation/
 * fcmSurvivalLightRules.ts`): the cascade audit — every break and every
 * component's fate, on all four configurations (M1 and M2, clouds unlimited
 * and capped) and the same 18 development cases and input/parameter streams
 * as H1, H3 and H5. No new physics, no hypothesis tested: a measurement,
 * reported by case AND by configuration (rule 1189 (c)), never only pooled.
 * Per rule 1190: a stopped component's exact reason (`stopReason`) is
 * reported apart from "settled"/"dust" and never summed into a ground- or
 * meteorite-mass claim; the largest child at a break is reported both for
 * any component and for a solid fragment only, since a draw's cloud can
 * itself be the largest child (rule 1190's own correction, found on
 * Chelyabinsk's report).
 *
 *   pnpm exec tsx scripts/fcm-audit-run.ts all
 *   pnpm exec tsx scripts/fcm-audit-run.ts shard k K
 *   pnpm exec tsx scripts/fcm-audit-run.ts merge K
 *
 * Writes src/physics/validation/fcmAuditRun.json and docs/FCM_AUDIT_RUN.md.
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import { join } from 'node:path';
import { CRUSTAL_ROCK_DENSITY } from '../src/physics/constants.js';
import { fcmEntryAudit, type FcmComponentRecord } from '../src/physics/effects/fcmBranchAudit.js';
import type { ImpactScenarioInput } from '../src/physics/simulate.js';
import { kgPerM3, m, mps, rad } from '../src/physics/units.js';
import { DEV_CASES } from '../src/physics/validation/fragmentationDevTable.js';
import {
  FCM_DEV_PRIORS,
  FCM_DEV_RUN,
  FCM_DOMAIN_MAP,
} from '../src/physics/validation/fcmRound1Rules.js';
import { THIRD_SET_BODIES } from '../src/physics/validation/thirdSetSources.js';
import {
  THIRD_SET_RUN_DRAWS,
  THIRD_SET_RUN_SEED,
} from '../src/physics/validation/thirdSetRunRules.js';
import { drawnInputs, inputsOf, stream } from './fragmentationRun.js';
import { CONFIGURATIONS, drawFcm, REFERENCE, round } from './fcmRound1Common.js';

const SHARDS_DIR = join(tmpdir(), 'nimbus-fcm-audit-run');
const DRAWS = FCM_DEV_PRIORS.draws;

interface CaseSpec {
  name: string;
  family: 'rule 961' | 'third set' | 'W18';
  inputs: ImpactScenarioInput[];
}

function cases(): CaseSpec[] {
  const out: CaseSpec[] = [];
  for (const { case: c } of DEV_CASES) {
    const { inputs } = inputsOf(c);
    out.push({ name: c, family: 'rule 961', inputs: inputs.slice(0, DRAWS) });
  }
  for (const b of THIRD_SET_BODIES) {
    const inputs = drawnInputs(
      { event: b.event, inputs: b.inputs, targets: [] },
      `${THIRD_SET_RUN_SEED}${b.event}`,
      THIRD_SET_RUN_DRAWS
    ).slice(0, DRAWS);
    out.push({ name: b.event, family: 'third set', inputs });
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
  for (const [name, w] of Object.entries(FCM_DEV_RUN.w18Cases)) {
    const u = stream(`${FCM_DEV_PRIORS.seed}${name}/inputs`);
    const inputs = Array.from({ length: DRAWS }, () => {
      const mass = w.massKg[0] * (w.massKg[1] / w.massKg[0]) ** u();
      const density = w.densityKgM3[0] + (w.densityKgM3[1] - w.densityKgM3[0]) * u();
      return input(Math.cbrt((6 * mass) / (Math.PI * density)), w.speedMS, density, w.angleDeg);
    });
    out.push({ name, family: 'W18', inputs });
  }
  return out;
}

const entryOf = (x: ImpactScenarioInput) => ({
  diameterM: x.impactorDiameter as number,
  speedMS: x.impactVelocity as number,
  densityKgM3: x.impactorDensity as number,
  angleRad: x.impactAngle as number,
});

const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  return round(s[Math.floor(s.length / 2)] ?? 0, 6);
};

const GEN_BUCKETS = ['1', '2', '3', '4', '5+'] as const;
type GenBucket = (typeof GEN_BUCKETS)[number];
const genBucketOf = (g: number): GenBucket =>
  g <= 0 ? '1' : g >= 5 ? '5+' : (String(g) as GenBucket);

interface ConfigAccumulator {
  produced: number;
  entryMassKg: number;
  pressureRatios: number[];
  firstBreakLargestShare: number[];
  firstBreakLargestSolidShare: number[];
  firstBreakCloudShare: number[];
  firstBreakChildCount: number[];
  laterBreakLargestShare: number[];
  laterBreakLargestSolidShare: number[];
  laterBreakCloudShare: number[];
  laterBreakChildCount: number[];
  landedSolidKg: number;
  landedCloudKg: number;
  settledKg: number;
  dustKg: number;
  /** Rule 1190 (a): a stopped (settled or dust) component's exact reason. */
  settledByReason: Record<'terminalVelocity' | 'nonPhysicalStep', number>;
  dustByReason: Record<'massFloor' | 'nonPhysicalStep', number>;
  aggregatedEvents: number;
  byGeneration: Record<GenBucket, { massKg: number; retained: number[]; birthAltM: number[] }>;
  landedBirthAltM: number[];
  landedRetained: number[];
  landedSolidKgAt: number[];
}

function newAccumulator(): ConfigAccumulator {
  const byGeneration = Object.fromEntries(
    GEN_BUCKETS.map((g) => [g, { massKg: 0, retained: [] as number[], birthAltM: [] as number[] }])
  ) as ConfigAccumulator['byGeneration'];
  return {
    produced: 0,
    entryMassKg: 0,
    pressureRatios: [],
    firstBreakLargestShare: [],
    firstBreakLargestSolidShare: [],
    firstBreakCloudShare: [],
    firstBreakChildCount: [],
    laterBreakLargestShare: [],
    laterBreakLargestSolidShare: [],
    laterBreakCloudShare: [],
    laterBreakChildCount: [],
    landedSolidKg: 0,
    landedCloudKg: 0,
    settledKg: 0,
    dustKg: 0,
    settledByReason: { terminalVelocity: 0, nonPhysicalStep: 0 },
    dustByReason: { massFloor: 0, nonPhysicalStep: 0 },
    aggregatedEvents: 0,
    byGeneration,
    landedBirthAltM: [],
    landedRetained: [],
    landedSolidKgAt: [],
  };
}

function absorb(acc: ConfigAccumulator, r: ReturnType<typeof fcmEntryAudit>): void {
  acc.produced += 1;
  acc.entryMassKg += r.mass;
  for (const b of r.breaks) {
    acc.pressureRatios.push(b.pressureRatio);
    const children = b.childRecordIndices.flatMap((i) => {
      const rec = r.records[i];
      return rec === undefined ? [] : [rec];
    });
    const massOf = (rec: FcmComponentRecord): number => rec.count * rec.birthMassKg;
    const largestShare = Math.max(...children.map(massOf), 0) / b.parentMassKg;
    const solidMasses = children.filter((c) => !c.isCloud).map(massOf);
    const largestSolidShare =
      solidMasses.length === 0 ? null : Math.max(...solidMasses) / b.parentMassKg;
    const cloudShare =
      children.filter((c) => c.isCloud).reduce((a, c) => a + massOf(c), 0) / b.parentMassKg;
    const isFirst = b.generation === 0;
    (isFirst ? acc.firstBreakLargestShare : acc.laterBreakLargestShare).push(largestShare);
    if (largestSolidShare !== null)
      (isFirst ? acc.firstBreakLargestSolidShare : acc.laterBreakLargestSolidShare).push(
        largestSolidShare
      );
    (isFirst ? acc.firstBreakCloudShare : acc.laterBreakCloudShare).push(cloudShare);
    (isFirst ? acc.firstBreakChildCount : acc.laterBreakChildCount).push(children.length);
  }
  for (const rec of r.records) {
    if (rec.fate === 'aggregated') acc.aggregatedEvents += 1;
    if (rec.fate === 'landedSolid' && rec.finalMassKg !== null) {
      const kg = rec.count * rec.finalMassKg;
      acc.landedSolidKg += kg;
      acc.landedBirthAltM.push(rec.birthAltitudeM);
      acc.landedRetained.push(rec.finalMassKg / rec.birthMassKg);
      acc.landedSolidKgAt.push(kg);
      const bucket = genBucketOf(rec.generation);
      acc.byGeneration[bucket].massKg += kg;
      acc.byGeneration[bucket].retained.push(rec.finalMassKg / rec.birthMassKg);
      acc.byGeneration[bucket].birthAltM.push(rec.birthAltitudeM);
    } else if (rec.fate === 'landedCloud' && rec.finalMassKg !== null) {
      acc.landedCloudKg += rec.count * rec.finalMassKg;
    } else if (rec.fate === 'settled' && rec.finalMassKg !== null) {
      acc.settledKg += rec.count * rec.finalMassKg;
      if (rec.stopReason === 'terminalVelocity' || rec.stopReason === 'nonPhysicalStep')
        acc.settledByReason[rec.stopReason] += rec.count * rec.finalMassKg;
    } else if (rec.fate === 'dust' && rec.finalMassKg !== null) {
      acc.dustKg += rec.count * rec.finalMassKg;
      if (rec.stopReason === 'massFloor' || rec.stopReason === 'nonPhysicalStep')
        acc.dustByReason[rec.stopReason] += rec.count * rec.finalMassKg;
    }
  }
}

interface ConfigReport {
  configuration: string;
  produced: number;
  entryMassKg: number;
  pressureRatio: { median: number | null; min: number | null; max: number | null };
  firstBreak: {
    count: number;
    medianLargestChildShare: number | null;
    medianLargestSolidChildShare: number | null;
    medianCloudShare: number | null;
    medianChildCount: number | null;
  };
  laterBreaks: {
    count: number;
    medianLargestChildShare: number | null;
    medianLargestSolidChildShare: number | null;
    medianCloudShare: number | null;
    medianChildCount: number | null;
  };
  fateShare: {
    landedSolid: number;
    landedCloud: number;
    settled: number;
    dust: number;
  };
  /** Rule 1190 (a): each stopped fate's own share, split by exact reason —
   *  never summed into a ground- or meteorite-mass claim (rule 1190). */
  stopReasonShare: {
    settledTerminalVelocity: number;
    settledNonPhysicalStep: number;
    dustMassFloor: number;
    dustNonPhysicalStep: number;
  };
  aggregatedEvents: number;
  byGeneration: {
    generation: GenBucket;
    massShareOfLanded: number;
    medianRetainedFraction: number | null;
    medianBirthAltitudeM: number | null;
  }[];
  byBirthAltitudeTertile: {
    tertile: 'low' | 'mid' | 'high';
    massShareOfLanded: number;
    medianRetainedFraction: number | null;
    altitudeRangeM: [number, number] | null;
  }[];
}

function report(configuration: string, acc: ConfigAccumulator): ConfigReport {
  const totalLanded = acc.landedSolidKg + acc.landedCloudKg + acc.settledKg + acc.dustKg;
  const byGeneration = GEN_BUCKETS.map((g) => {
    const bucket = acc.byGeneration[g];
    return {
      generation: g,
      massShareOfLanded: totalLanded > 0 ? round(bucket.massKg / totalLanded, 6) : 0,
      medianRetainedFraction: median(bucket.retained),
      medianBirthAltitudeM: median(bucket.birthAltM),
    };
  });
  // Landed solids only, sorted by birth altitude, split into three EQUAL-
  // COUNT groups (not equal-mass): the tertile's own mass share is reported
  // separately, since a few massive pieces can dominate one third of the
  // altitude range without dominating a third of the count.
  const sortedByAlt = acc.landedBirthAltM
    .map((alt, i) => ({
      alt,
      retained: acc.landedRetained[i] ?? 0,
      massKg: acc.landedSolidKgAt[i] ?? 0,
    }))
    .sort((a, b) => a.alt - b.alt);
  const third = Math.ceil(sortedByAlt.length / 3);
  const tertiles: ConfigReport['byBirthAltitudeTertile'] = (['low', 'mid', 'high'] as const).map(
    (tertile, i) => {
      const slice = sortedByAlt.slice(i * third, i === 2 ? sortedByAlt.length : (i + 1) * third);
      const alts = slice.map((x) => x.alt);
      const sliceMassKg = slice.reduce((a, x) => a + x.massKg, 0);
      return {
        tertile,
        massShareOfLanded: acc.landedSolidKg > 0 ? round(sliceMassKg / acc.landedSolidKg, 6) : 0,
        medianRetainedFraction: median(slice.map((x) => x.retained)),
        altitudeRangeM:
          alts.length === 0 ? null : [round(Math.min(...alts), 4), round(Math.max(...alts), 4)],
      };
    }
  );
  return {
    configuration,
    produced: acc.produced,
    entryMassKg: round(acc.entryMassKg, 6),
    pressureRatio: {
      median: median(acc.pressureRatios),
      min: acc.pressureRatios.length === 0 ? null : round(Math.min(...acc.pressureRatios), 6),
      max: acc.pressureRatios.length === 0 ? null : round(Math.max(...acc.pressureRatios), 6),
    },
    firstBreak: {
      count: acc.firstBreakLargestShare.length,
      medianLargestChildShare: median(acc.firstBreakLargestShare),
      medianLargestSolidChildShare: median(acc.firstBreakLargestSolidShare),
      medianCloudShare: median(acc.firstBreakCloudShare),
      medianChildCount: median(acc.firstBreakChildCount),
    },
    laterBreaks: {
      count: acc.laterBreakLargestShare.length,
      medianLargestChildShare: median(acc.laterBreakLargestShare),
      medianLargestSolidChildShare: median(acc.laterBreakLargestSolidShare),
      medianCloudShare: median(acc.laterBreakCloudShare),
      medianChildCount: median(acc.laterBreakChildCount),
    },
    fateShare: {
      landedSolid: totalLanded > 0 ? round(acc.landedSolidKg / totalLanded, 6) : 0,
      landedCloud: totalLanded > 0 ? round(acc.landedCloudKg / totalLanded, 6) : 0,
      settled: totalLanded > 0 ? round(acc.settledKg / totalLanded, 6) : 0,
      dust: totalLanded > 0 ? round(acc.dustKg / totalLanded, 6) : 0,
    },
    stopReasonShare: {
      settledTerminalVelocity:
        totalLanded > 0 ? round(acc.settledByReason.terminalVelocity / totalLanded, 6) : 0,
      settledNonPhysicalStep:
        totalLanded > 0 ? round(acc.settledByReason.nonPhysicalStep / totalLanded, 6) : 0,
      dustMassFloor: totalLanded > 0 ? round(acc.dustByReason.massFloor / totalLanded, 6) : 0,
      dustNonPhysicalStep:
        totalLanded > 0 ? round(acc.dustByReason.nonPhysicalStep / totalLanded, 6) : 0,
    },
    aggregatedEvents: acc.aggregatedEvents,
    byGeneration,
    byBirthAltitudeTertile: tertiles,
  };
}

interface CaseResult {
  case: string;
  family: string;
  configurations: ConfigReport[];
}

function flyCase(spec: CaseSpec): CaseResult {
  const configurations = CONFIGURATIONS.map(({ structure, cloud }) => {
    const u = stream(`fcm-round1/${spec.name}/${structure}/${cloud}`);
    const acc = newAccumulator();
    for (const x of spec.inputs) {
      const d = drawFcm(entryOf(x), structure, cloud, u);
      let r = fcmEntryAudit(d.body, { ...d.options, ...REFERENCE });
      if (!r.completed)
        r = fcmEntryAudit(d.body, {
          ...d.options,
          ...REFERENCE,
          maxComponents: FCM_DOMAIN_MAP.retryComponents,
        });
      if (!r.completed) continue;
      absorb(acc, r);
    }
    return report(`${structure}/${cloud}`, acc);
  });
  return { case: spec.name, family: spec.family, configurations };
}

function shard(k: number, K: number): void {
  const out: CaseResult[] = [];
  cases().forEach((c, i) => {
    if (i % K === k) out.push(flyCase(c));
  });
  mkdirSync(SHARDS_DIR, { recursive: true });
  writeFileSync(join(SHARDS_DIR, `shard-${String(k)}-of-${String(K)}.json`), JSON.stringify(out));
}

function merge(K: number): void {
  const order = cases().map((c) => c.name);
  const results: CaseResult[] = [];
  for (let k = 0; k < K; k++) {
    const p = join(SHARDS_DIR, `shard-${String(k)}-of-${String(K)}.json`);
    if (!existsSync(p)) throw new Error(`missing ${p}`);
    results.push(...(JSON.parse(readFileSync(p, 'utf8')) as CaseResult[]));
  }
  results.sort((a, b) => order.indexOf(a.case) - order.indexOf(b.case));

  const out = { rule: '1189 (a) to (c), 1190 (a)', draws: DRAWS, results };
  writeFileSync('src/physics/validation/fcmAuditRun.json', `${JSON.stringify(out, null, 1)}\n`);

  const pct = (x: number): string => `${String(round(x * 100, 4))} %`;

  // A pooled overview only, weighted by each case-configuration's own
  // landed mass — never a substitute for the by-case tables below (the
  // reviewer's own qualification on H5: a pooled share can hide which few
  // events dominate it).
  const allConfigs = results.flatMap((r) => r.configurations.filter((c) => c.produced > 0));
  const weight = (c: ConfigReport): number =>
    c.entryMassKg *
    (c.fateShare.landedSolid + c.fateShare.landedCloud + c.fateShare.settled + c.fateShare.dust);
  const weightedMean = (get: (c: ConfigReport) => number): number => {
    const totalW = allConfigs.reduce((a, c) => a + weight(c), 0);
    if (totalW === 0) return 0;
    return allConfigs.reduce((a, c) => a + weight(c) * get(c), 0) / totalW;
  };
  const pooledFate = {
    landedSolid: weightedMean((c) => c.fateShare.landedSolid),
    landedCloud: weightedMean((c) => c.fateShare.landedCloud),
    settled: weightedMean((c) => c.fateShare.settled),
    dust: weightedMean((c) => c.fateShare.dust),
  };
  const pooledStopReason = {
    settledTerminalVelocity: weightedMean((c) => c.stopReasonShare.settledTerminalVelocity),
    settledNonPhysicalStep: weightedMean((c) => c.stopReasonShare.settledNonPhysicalStep),
    dustMassFloor: weightedMean((c) => c.stopReasonShare.dustMassFloor),
    dustNonPhysicalStep: weightedMean((c) => c.stopReasonShare.dustNonPhysicalStep),
  };
  const pooledPressure = allConfigs.flatMap((c) =>
    c.pressureRatio.median === null ? [] : [c.pressureRatio.median]
  );
  const pooledFirstLargestSolid = median(
    allConfigs.flatMap((c) =>
      c.firstBreak.medianLargestSolidChildShare === null
        ? []
        : [c.firstBreak.medianLargestSolidChildShare]
    )
  );
  const pooledLaterLargestSolid = median(
    allConfigs.flatMap((c) =>
      c.laterBreaks.medianLargestSolidChildShare === null
        ? []
        : [c.laterBreaks.medianLargestSolidChildShare]
    )
  );

  const lines = [
    '# FCM survival–light round — the cascade audit (rule 1189)',
    '',
    'Rules 1189 (a) to (c) (`src/physics/validation/fcmSurvivalLightRules.ts`), run by',
    '`scripts/fcm-audit-run.ts` on the same 18 development cases and the same input and parameter streams as',
    'H1, H3 and H5 — all four configurations this time, not only M1/unlimited. No new physics, no hypothesis',
    'tested: a measurement, reported by case and by configuration throughout.',
    '',
    '## Pooled overview (weighted by each run’s own accounted mass — never a substitute for the tables below)',
    '',
    `Break pressure ratio: every case-configuration’s own median sits at ${median(pooledPressure) === null ? '—' : String(median(pooledPressure))}` +
      ' (the bisection’s own precision — a sanity check, not a result).',
    '',
    'What the branch stops accounting for, pooled across every case and configuration that completed —',
    '**rule 1190: "settled" is a numerical stopping condition, not a claim about the material’s later,',
    'physical fate; nothing here sums it into a ground- or meteorite-mass claim**:',
    '',
    '| | share |',
    '| --- | --- |',
    `| Landed, solid | ${pct(pooledFate.landedSolid)} |`,
    `| Landed, cloud | ${pct(pooledFate.landedCloud)} |`,
    `| No longer integrated: a cloud within \`settleWithin\` of its own terminal speed | ${pct(pooledStopReason.settledTerminalVelocity)} |`,
    `| No longer integrated: a non-physical-step fallback, as a settled cloud | ${pct(pooledStopReason.settledNonPhysicalStep)} |`,
    `| Turned to dust: below the mass floor | ${pct(pooledStopReason.dustMassFloor)} |`,
    `| Turned to dust: a non-physical-step fallback | ${pct(pooledStopReason.dustNonPhysicalStep)} |`,
    '',
    'What H1, H3 and H5 call "landed mass" — the quantity with an excess against the references of rule',
    '1178 (a) — is already a small remainder of the entry mass by the time it reaches the ground; this audit',
    'does not change that finding. The great majority of the remaining mass stops being integrated once a',
    'cloud nears its own terminal speed, well above the surface (rule 1138 (c), deviation D9); this audit',
    'reports that stop, not the material’s subsequent, physical fate, which it has no physics to decide',
    '(rule 1190).',
    '',
    'Largest child at a break, corrected (rule 1190): reported separately for any component and for a',
    `solid fragment only, since a draw’s cloud can itself be the largest child — first break, solid only,`,
    `median of medians ${pooledFirstLargestSolid === null ? '—' : pct(pooledFirstLargestSolid)}; later breaks, solid only, ${pooledLaterLargestSolid === null ? '—' : pct(pooledLaterLargestSolid)}.`,
    '',
    '## By case and configuration',
    '',
    ...results.flatMap((r) => [
      `### ${r.case} (${r.family})`,
      '',
      ...r.configurations.flatMap((c) => [
        `**${c.configuration}** — ${String(c.produced)} draws produced, pressure ratio at the break ` +
          `${String(c.pressureRatio.median)} (median, ${String(c.pressureRatio.min)}–${String(c.pressureRatio.max)})`,
        '',
        `First break: ${String(c.firstBreak.count)} events — largest child (any) ${c.firstBreak.medianLargestChildShare === null ? '—' : pct(c.firstBreak.medianLargestChildShare)}, ` +
          `largest **solid** child ${c.firstBreak.medianLargestSolidChildShare === null ? '— (every child a cloud)' : pct(c.firstBreak.medianLargestSolidChildShare)} ` +
          `of parent mass (medians), cloud ${c.firstBreak.medianCloudShare === null ? '—' : pct(c.firstBreak.medianCloudShare)}, ` +
          `${String(c.firstBreak.medianChildCount)} distinct children (median).`,
        `Later breaks: ${String(c.laterBreaks.count)} events — largest child (any) ${c.laterBreaks.medianLargestChildShare === null ? '—' : pct(c.laterBreaks.medianLargestChildShare)}, ` +
          `largest **solid** child ${c.laterBreaks.medianLargestSolidChildShare === null ? '— (every child a cloud)' : pct(c.laterBreaks.medianLargestSolidChildShare)} ` +
          `of parent mass (medians), cloud ${c.laterBreaks.medianCloudShare === null ? '—' : pct(c.laterBreaks.medianCloudShare)}, ` +
          `${String(c.laterBreaks.medianChildCount)} distinct children (median).`,
        '',
        `Where the run's own accounting stands — **landed** solid ${pct(c.fateShare.landedSolid)}, **landed** cloud ${pct(c.fateShare.landedCloud)}, ` +
          `**no longer integrated, as a cloud (rule 1190: a stop, not a fate)** ${pct(c.fateShare.settled)} (of which ${pct(c.stopReasonShare.settledTerminalVelocity)} at the terminal-speed stop, ${pct(c.stopReasonShare.settledNonPhysicalStep)} at a non-physical-step fallback), ` +
          `dust ${pct(c.fateShare.dust)} (${pct(c.stopReasonShare.dustMassFloor)} at the mass floor, ${pct(c.stopReasonShare.dustNonPhysicalStep)} at a non-physical-step fallback); ` +
          `${String(c.aggregatedEvents)} breaks folded wholly into the aggregated tail (rule 1150).`,
        '',
        '| Generation | share of landed mass | median retained fraction | median birth altitude (m) |',
        '| --- | --- | --- | --- |',
        ...c.byGeneration.map(
          (g) =>
            `| ${g.generation} | ${pct(g.massShareOfLanded)} | ${g.medianRetainedFraction === null ? '—' : String(g.medianRetainedFraction)} | ${g.medianBirthAltitudeM === null ? '—' : String(g.medianBirthAltitudeM)} |`
        ),
        '',
        '| Birth-altitude tertile (landed solids) | share of landed pieces | median retained fraction | altitude range (m) |',
        '| --- | --- | --- | --- |',
        ...c.byBirthAltitudeTertile.map(
          (t) =>
            `| ${t.tertile} | ${pct(t.massShareOfLanded)} | ${t.medianRetainedFraction === null ? '—' : String(t.medianRetainedFraction)} | ${t.altitudeRangeM === null ? '—' : `${String(t.altitudeRangeM[0])}–${String(t.altitudeRangeM[1])}`} |`
        ),
        '',
      ]),
    ]),
  ];
  writeFileSync('docs/FCM_AUDIT_RUN.md', lines.join('\n'));
  console.log(JSON.stringify({ cases: results.length }, null, 1));
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
            [...process.execArgv, process.argv[1] ?? '', 'shard', String(k), String(K)],
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
