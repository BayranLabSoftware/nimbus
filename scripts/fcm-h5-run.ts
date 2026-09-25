/**
 * Rules 1188 (a) to (c) (`src/physics/validation/fcmSurvivalLightRules.ts`):
 * H5's decomposition of every landed solid piece, under M1/unlimited — the
 * configuration H3 examined — on the same 18 development cases and the same
 * input and parameter streams as H1's and H3's runs (`drawFcm`,
 * `fcmRound1Common.ts`, unchanged: no new free parameter). Classifies each
 * piece's own landed mass by generation (born at the first break, later, or
 * the whole body never breaking) and by whether it retained more than half
 * its birth mass, then reports each bucket's pooled, mass-weighted share and
 * the mechanical decision of rule 1188 (c).
 *
 *   pnpm exec tsx scripts/fcm-h5-run.ts
 *
 * Writes src/physics/validation/fcmH5Run.json and docs/FCM_H5_RUN.md.
 */

import { writeFileSync } from 'node:fs';
import { CRUSTAL_ROCK_DENSITY } from '../src/physics/constants.js';
import { fcmEntryH5, type FcmH5Piece } from '../src/physics/effects/fcmBranchH5.js';
import type { ImpactScenarioInput } from '../src/physics/simulate.js';
import { kgPerM3, m, mps, rad } from '../src/physics/units.js';
import { DEV_CASES } from '../src/physics/validation/fragmentationDevTable.js';
import {
  FCM_DEV_PRIORS,
  FCM_DEV_RUN,
  FCM_DOMAIN_MAP,
} from '../src/physics/validation/fcmRound1Rules.js';
import {
  FCM_H5_DOMINANCE_MARGIN,
  FCM_H5_RETAINED_FRACTION,
} from '../src/physics/validation/fcmSurvivalLightRules.js';
import { THIRD_SET_BODIES } from '../src/physics/validation/thirdSetSources.js';
import {
  THIRD_SET_RUN_DRAWS,
  THIRD_SET_RUN_SEED,
} from '../src/physics/validation/thirdSetRunRules.js';
import { drawnInputs, inputsOf, stream } from './fragmentationRun.js';
import { drawFcm, REFERENCE, round } from './fcmRound1Common.js';

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

type Bucket = 'earlyRetained' | 'lateRetained' | 'ablatedEarly' | 'ablatedLate' | 'wholeBody';

/** Rule 1188 (b): the classification, fixed before any case was read. */
function bucketOf(p: FcmH5Piece): Bucket {
  if (p.generation === 0) return 'wholeBody';
  const retained = p.mass / p.birthMassKg > FCM_H5_RETAINED_FRACTION;
  const early = p.generation === 1;
  if (retained) return early ? 'earlyRetained' : 'lateRetained';
  return early ? 'ablatedEarly' : 'ablatedLate';
}

const BUCKETS: readonly Bucket[] = [
  'earlyRetained',
  'lateRetained',
  'ablatedEarly',
  'ablatedLate',
  'wholeBody',
];

interface CaseResult {
  case: string;
  family: string;
  produced: number;
  totalLandedKg: number;
  buckets: Record<Bucket, number>;
  medianGeneration: number | null;
  medianRetainedFraction: number | null;
}

function flyCase(spec: CaseSpec): CaseResult {
  const u = stream(`fcm-round1/${spec.name}/M1/unlimited`);
  const bucketKg: Record<Bucket, number> = {
    earlyRetained: 0,
    lateRetained: 0,
    ablatedEarly: 0,
    ablatedLate: 0,
    wholeBody: 0,
  };
  let produced = 0;
  const generations: number[] = [];
  const retainedFractions: number[] = [];
  for (const x of spec.inputs) {
    const d = drawFcm(entryOf(x), 'M1', 'unlimited', u);
    let r = fcmEntryH5(d.body, { ...d.options, ...REFERENCE });
    if (!r.completed)
      r = fcmEntryH5(d.body, {
        ...d.options,
        ...REFERENCE,
        maxComponents: FCM_DOMAIN_MAP.retryComponents,
      });
    if (!r.completed) continue;
    produced += 1;
    for (const p of r.pieces) {
      const kg = p.count * p.mass;
      bucketKg[bucketOf(p)] += kg;
      generations.push(p.generation);
      retainedFractions.push(p.mass / p.birthMassKg);
    }
  }
  const totalLandedKg = BUCKETS.reduce((a, b) => a + bucketKg[b], 0);
  const median = (xs: number[]): number | null => {
    if (xs.length === 0) return null;
    const s = [...xs].sort((a, b) => a - b);
    return round(s[Math.floor(s.length / 2)] ?? 0, 4);
  };
  return {
    case: spec.name,
    family: spec.family,
    produced,
    totalLandedKg: round(totalLandedKg, 6),
    buckets: Object.fromEntries(BUCKETS.map((b) => [b, round(bucketKg[b], 6)])) as Record<
      Bucket,
      number
    >,
    medianGeneration: median(generations),
    medianRetainedFraction: median(retainedFractions),
  };
}

function main(): void {
  const results = cases().map(flyCase);
  const pooled: Record<Bucket, number> = {
    earlyRetained: 0,
    lateRetained: 0,
    ablatedEarly: 0,
    ablatedLate: 0,
    wholeBody: 0,
  };
  for (const r of results) for (const b of BUCKETS) pooled[b] += r.buckets[b];
  const totalKg = BUCKETS.reduce((a, b) => a + pooled[b], 0);
  const share = (b: Bucket): number => (totalKg > 0 ? pooled[b] / totalKg : 0);
  const earlyShare = share('earlyRetained');
  const lateShare = share('lateRetained');

  const decision: 'genealogy' | 'ablation' | 'unidentified' =
    lateShare > FCM_H5_DOMINANCE_MARGIN * earlyShare
      ? 'genealogy'
      : earlyShare > FCM_H5_DOMINANCE_MARGIN * lateShare
        ? 'ablation'
        : 'unidentified';

  const out = {
    rule: '1188 (a) to (c)',
    draws: DRAWS,
    configuration: 'M1/unlimited',
    totalLandedKg: round(totalKg, 6),
    shares: Object.fromEntries(BUCKETS.map((b) => [b, round(share(b), 6)])),
    dominanceMargin: FCM_H5_DOMINANCE_MARGIN,
    retainedFraction: FCM_H5_RETAINED_FRACTION,
    decision,
    results,
  };
  writeFileSync('src/physics/validation/fcmH5Run.json', `${JSON.stringify(out, null, 1)}\n`);

  const pct = (x: number): string => `${String(round(x * 100, 4))} %`;
  const kg = (x: number): string => String(round(x, 4));
  const decisionText: Record<typeof decision, string> = {
    genealogy:
      'the excess is dominated by genealogy: born already large, late in the cascade. The next causal ' +
      'study is break conditions, mass partition and child genealogy.',
    ablation:
      'the excess is dominated by insufficiently ablated early survivors: born as high and early as a ' +
      'fragment can be, yet retaining most of its birth mass. A regime-dependent ablation law becomes ' +
      'worth a separately preregistered specification.',
    unidentified:
      'neither bucket leads by the declared 2× margin: the mechanism is NOT IDENTIFIED by this ' +
      'decomposition. No correction is forced.',
  };
  const lines = [
    '# FCM survival–light round — H5, the residual history of surviving fragments',
    '',
    'Rules 1188 (a) to (c) (`src/physics/validation/fcmSurvivalLightRules.ts`), run by',
    '`scripts/fcm-h5-run.ts` on the same 18 development cases and the same input and parameter streams as',
    'H1’s and H3’s runs — M1/unlimited only, the configuration H3 examined. No new free parameter: every',
    'piece’s ablation follows the same fixed σ per draw as the sealed candidate.',
    '',
    `**Pooled, mass-weighted shares of the ${kg(totalKg)} kg landed across all 18 cases:**`,
    '',
    '| Bucket | Share | Landed (kg) |',
    '| --- | --- | --- |',
    `| Early + retained (ablation channel) | ${pct(earlyShare)} | ${kg(pooled.earlyRetained)} |`,
    `| Late + retained (genealogy channel) | ${pct(lateShare)} | ${kg(pooled.lateRetained)} |`,
    `| Ablated as expected (early) | ${pct(share('ablatedEarly'))} | ${kg(pooled.ablatedEarly)} |`,
    `| Ablated as expected (late) | ${pct(share('ablatedLate'))} | ${kg(pooled.ablatedLate)} |`,
    `| Whole body, never broke | ${pct(share('wholeBody'))} | ${kg(pooled.wholeBody)} |`,
    '',
    `**Decision (rule 1188 (c), margin ${String(FCM_H5_DOMINANCE_MARGIN)}×):** ${decisionText[decision]}`,
    '',
    '## By case',
    '',
    '| Case | produced | total landed (kg) | early+retained | late+retained | ablated | whole body | median generation | median retained fraction |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...results.map((r) => {
      const ablated = r.buckets.ablatedEarly + r.buckets.ablatedLate;
      return `| ${r.case} (${r.family}) | ${String(r.produced)} | ${kg(r.totalLandedKg)} | ${kg(r.buckets.earlyRetained)} | ${kg(r.buckets.lateRetained)} | ${kg(ablated)} | ${kg(r.buckets.wholeBody)} | ${r.medianGeneration === null ? '—' : String(r.medianGeneration)} | ${r.medianRetainedFraction === null ? '—' : String(r.medianRetainedFraction)} |`;
    }),
    '',
  ];
  writeFileSync('docs/FCM_H5_RUN.md', lines.join('\n'));
  console.log(
    JSON.stringify({ totalKg: round(totalKg, 4), earlyShare, lateShare, decision }, null, 1)
  );
}

main();
