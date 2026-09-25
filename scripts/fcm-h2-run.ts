/**
 * Rules 1180 (b), 1186 (src/physics/validation/fcmSurvivalLightRules.ts): H2
 * — σ redrawn once per break, from the same unnarrowed prior, against the
 * baseline of H3's fixed-σ runs (fcmSurvivalLight.json) — on the same 18
 * development cases, the same input and parameter streams (rule 1179): only
 * the ablation representation differs; a body's diameter, speed, density,
 * angle, strength, α, split and cloud dispersion are the exact draws H3 used.
 * Writes src/physics/validation/fcmH2Run.json and docs/FCM_H2_RUN.md.
 *
 *   pnpm exec tsx scripts/fcm-h2-run.ts all
 *   pnpm exec tsx scripts/fcm-h2-run.ts shard k K
 *   pnpm exec tsx scripts/fcm-h2-run.ts merge K
 *
 * Reads src/physics/validation/fcmSurvivalLight.json: run that first.
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fcmEntryH2, type FcmBody, type FcmH2Options } from '../src/physics/effects/fcmBranchH2.js';
import { CRUSTAL_ROCK_DENSITY } from '../src/physics/constants.js';
import type { ImpactScenarioInput } from '../src/physics/simulate.js';
import { kgPerM3, m, mps, rad } from '../src/physics/units.js';
import { DEV_CASES } from '../src/physics/validation/fragmentationDevTable.js';
import {
  FCM_DEV_PRIORS,
  FCM_DEV_RUN,
  FCM_DOMAIN_MAP,
} from '../src/physics/validation/fcmRound1Rules.js';
import { FCM_PRIORS } from '../src/physics/validation/fcmRoundRules.js';
import { FCM_H2_SIGMA_RANGE } from '../src/physics/validation/fcmSurvivalLightRules.js';
import { THIRD_SET_BODIES } from '../src/physics/validation/thirdSetSources.js';
import {
  THIRD_SET_RUN_DRAWS,
  THIRD_SET_RUN_SEED,
} from '../src/physics/validation/thirdSetRunRules.js';
import { drawnInputs, inputsOf, stream } from './fragmentationRun.js';
import { CONFIGURATIONS, round } from './fcmRound1Common.js';

const SHARDS_DIR = join(tmpdir(), 'nimbus-fcm-h2-run');
const DRAWS = FCM_DEV_PRIORS.draws;

function cases(): { name: string; family: string; inputs: ImpactScenarioInput[] }[] {
  const out: { name: string; family: string; inputs: ImpactScenarioInput[] }[] = [];
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

/** The same draw order as `drawFcm` (fcmRound1Common.ts), so every parameter
 *  but the ablation representation is identical to H3's runs; the discarded
 *  whole-draw σ is still consumed, to keep the stream aligned. A second,
 *  independent stream feeds H2's per-break σ draws. */
function drawH2(
  x: ReturnType<typeof entryOf>,
  structure: 'M1' | 'M2',
  cloud: 'unlimited' | 'capped',
  u: () => number,
  sigmaDraw: () => number
): { body: FcmBody; options: FcmH2Options } {
  const p = FCM_DEV_PRIORS;
  const s1 = p.firstStagePa[0] * (p.firstStagePa[1] / p.firstStagePa[0]) ** u();
  const s2 = p.secondStagePa[0] * (p.secondStagePa[1] / p.secondStagePa[0]) ** u();
  const alpha = FCM_PRIORS.alpha[0] + (FCM_PRIORS.alpha[1] - FCM_PRIORS.alpha[0]) * u();
  const larger =
    FCM_PRIORS.largerShare[0] + (FCM_PRIORS.largerShare[1] - FCM_PRIORS.largerShare[0]) * u();
  const cloudShare =
    FCM_PRIORS.cloudShare[0] + (FCM_PRIORS.cloudShare[1] - FCM_PRIORS.cloudShare[0]) * u();
  u(); // the whole-draw σ H3 used: discarded here, kept only to align the stream.
  const cDispersion =
    FCM_PRIORS.cDispersionLog[0] *
    (FCM_PRIORS.cDispersionLog[1] / FCM_PRIORS.cDispersionLog[0]) ** u();
  const body: FcmBody = {
    diameter: x.diameterM,
    velocity: x.speedMS,
    density: x.densityKgM3,
    angle: x.angleRad,
    strength: s2,
  };
  if (structure === 'M2') {
    const rubble = p.m2.rubble[0] + (p.m2.rubble[1] - p.m2.rubble[0]) * u();
    const strong = p.m2.strong[0] + (p.m2.strong[1] - p.m2.strong[0]) * u();
    const debris = p.m2.debris[0] + (p.m2.debris[1] - p.m2.debris[0]) * u();
    const rubbleFactor = p.m2.rubbleFactor[0] + (p.m2.rubbleFactor[1] - p.m2.rubbleFactor[0]) * u();
    const strongFactor = p.m2.strongFactor[0] + (p.m2.strongFactor[1] - p.m2.strongFactor[0]) * u();
    body.structure = {
      initialStrength: s1,
      groups: [
        { massShare: 1 - rubble - strong - debris, pieces: 1, strength: s2 },
        { massShare: rubble, pieces: p.m2.rubblePieces, strength: s2 * rubbleFactor },
        { massShare: strong, pieces: 1, strength: s2 * strongFactor },
      ],
    };
  }
  const options: FcmH2Options = {
    sigmaRange: FCM_H2_SIGMA_RANGE,
    sigmaDraw,
    cloudDispersion: cDispersion,
    cloudCapRadii: cloud === 'capped' ? p.cloudCapRadii : null,
    alpha,
    split: { kind: 'mass', fragments: FCM_PRIORS.fragmentsPerBreak, larger, cloud: cloudShare },
  };
  return { body, options };
}

interface CaseResult {
  case: string;
  family: string;
  configurations: {
    configuration: string;
    produced: number;
    totalLandedKg: number | null;
    solidLandedKg: number | null;
    cloudLandedKg: number | null;
    largestKg: number | null;
  }[];
}

function flyCase(spec: {
  name: string;
  family: string;
  inputs: ImpactScenarioInput[];
}): CaseResult {
  const configurations = CONFIGURATIONS.map(({ structure, cloud }) => {
    const u = stream(`fcm-round1/${spec.name}/${structure}/${cloud}`);
    const rows = spec.inputs.map((x, i) => {
      const sigmaU = stream(`fcm-h2-sigma/${spec.name}/${structure}/${cloud}/${String(i)}`);
      const d = drawH2(entryOf(x), structure, cloud, u, sigmaU);
      let r = fcmEntryH2(d.body, d.options);
      if (!r.completed)
        r = fcmEntryH2(d.body, { ...d.options, maxComponents: FCM_DOMAIN_MAP.retryComponents });
      if (!r.completed) return null;
      const solidKg = r.pieces.reduce((a, p) => a + p.count * p.mass, 0);
      const cloudKg = r.swarm.mass;
      return {
        totalKg: r.ledger.groundMass,
        solidKg,
        cloudKg,
        largestKg: r.pieces.reduce((a, p) => Math.max(a, p.mass), 0),
      };
    });
    const ok = rows.flatMap((r) => (r === null ? [] : [r]));
    const med = (xs: number[]): number | null => {
      if (xs.length === 0) return null;
      const s = [...xs].sort((a, b) => a - b);
      return round(s[Math.floor(s.length / 2)] ?? 0, 4);
    };
    return {
      configuration: `${structure}/${cloud}`,
      produced: ok.length,
      totalLandedKg: med(ok.map((r) => r.totalKg)),
      solidLandedKg: med(ok.map((r) => r.solidKg)),
      cloudLandedKg: med(ok.map((r) => r.cloudKg)),
      largestKg: med(ok.map((r) => r.largestKg)),
    };
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

interface H3Config {
  configuration: string;
  totalLandedKg: number | null;
  solidKg: number | null;
  cloudKg: number | null;
}
interface H3Case {
  case: string;
  configurations: H3Config[];
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

  const h3 = JSON.parse(readFileSync('src/physics/validation/fcmSurvivalLight.json', 'utf8')) as {
    results: H3Case[];
  };
  const h3Of = (caseName: string, conf: string): H3Config | null =>
    h3.results
      .find((r) => r.case === caseName)
      ?.configurations.find((c) => c.configuration === conf) ?? null;

  const compared = results.flatMap((r) =>
    r.configurations.flatMap((c) => {
      const base = h3Of(r.case, c.configuration);
      if (
        base?.totalLandedKg === null ||
        base?.totalLandedKg === undefined ||
        c.totalLandedKg === null
      )
        return [];
      const ratio = c.totalLandedKg / base.totalLandedKg;
      return [
        {
          case: r.case,
          configuration: c.configuration,
          h2: c.totalLandedKg,
          h3: base.totalLandedKg,
          ratio,
        },
      ];
    })
  );
  const ratios = compared.map((x) => x.ratio).sort((a, b) => a - b);
  const medianRatio =
    ratios.length === 0 ? null : round(ratios[Math.floor(ratios.length / 2)] ?? 0, 4);
  const lowerCount = compared.filter((x) => x.ratio < 0.9).length;
  const higherCount = compared.filter((x) => x.ratio > 1.1).length;
  const sameCount = compared.length - lowerCount - higherCount;

  const out = {
    rule: '1180 (b), 1186',
    draws: DRAWS,
    compared: compared.length,
    medianRatio,
    lowerCount,
    higherCount,
    sameCount,
    results,
    comparison: compared,
  };
  writeFileSync('src/physics/validation/fcmH2Run.json', `${JSON.stringify(out, null, 1)}\n`);

  const kg = (x: number | null): string => (x === null ? '—' : String(x));
  const lines = [
    '# FCM survival–light round — H2, per-break σ against H3’s fixed-σ baseline',
    '',
    'Rules 1180 (b), 1186 (`src/physics/validation/fcmSurvivalLightRules.ts`), run by `scripts/fcm-h2-run.ts` on',
    'the same 18 development cases, the same input and parameter streams as H3 (`fcmSurvivalLight.json`) —',
    'only the ablation representation differs: H3’s one σ per whole draw against H2’s one σ per break, both',
    'from the identical, unnarrowed prior (rule 1131).',
    '',
    `**Landed mass, H2 against H3, ${String(compared.length)} case–configuration pairs**: median ratio ${String(medianRatio)}`,
    `(1 = unchanged); lower by more than 10 % on ${String(lowerCount)}, higher by more than 10 % on ${String(higherCount)}, within 10 % on ${String(sameCount)}.`,
    '',
    '## By case',
    '',
    ...results.flatMap((r) => [
      `### ${r.case} (${r.family})`,
      '',
      '| Configuration | produced | H2 total landed (kg) | H2 solid (kg) | H2 cloud (kg) | H3 total landed (kg) | ratio |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      ...r.configurations.map((c) => {
        const base = h3Of(r.case, c.configuration);
        const ratio =
          base?.totalLandedKg !== null &&
          base?.totalLandedKg !== undefined &&
          c.totalLandedKg !== null
            ? round(c.totalLandedKg / base.totalLandedKg, 4)
            : null;
        return `| ${c.configuration} | ${String(c.produced)} | ${kg(c.totalLandedKg)} | ${kg(c.solidLandedKg)} | ${kg(c.cloudLandedKg)} | ${kg(base?.totalLandedKg ?? null)} | ${kg(ratio)} |`;
      }),
      '',
    ]),
  ];
  writeFileSync('docs/FCM_H2_RUN.md', lines.join('\n'));
  console.log(
    JSON.stringify(
      { compared: compared.length, medianRatio, lowerCount, higherCount, sameCount },
      null,
      1
    )
  );
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
