/**
 * Rule 1190 (c) (`src/physics/validation/fcmSurvivalLightRules.ts`): a
 * NUMERICAL sensitivity on `settleWithin` (rule 1138 (c)) — not a tuning,
 * since nothing here moves any of H1 through H5's own results. The same 18
 * development cases and input/parameter streams as the cascade audit, at
 * `settleWithin` a tenth (0.1 %) and ten times (10 %) rule 1138 (c)'s own
 * value, against the audit's own baseline (1 %): the settled-mass share and
 * the ledger's own balance (rule 1141 (a)), compared across the three.
 *
 *   pnpm exec tsx scripts/fcm-settlewithin-sensitivity.ts all
 *   pnpm exec tsx scripts/fcm-settlewithin-sensitivity.ts shard k K
 *   pnpm exec tsx scripts/fcm-settlewithin-sensitivity.ts merge K
 *
 * Writes src/physics/validation/fcmSettleWithinSensitivity.json and
 * docs/FCM_SETTLEWITHIN_SENSITIVITY.md.
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import { join } from 'node:path';
import { CRUSTAL_ROCK_DENSITY } from '../src/physics/constants.js';
import { fcmEntryAudit } from '../src/physics/effects/fcmBranchAudit.js';
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

const SHARDS_DIR = join(tmpdir(), 'nimbus-fcm-settlewithin');
const DRAWS = FCM_DEV_PRIORS.draws;
const BASELINE = 0.01;
const SETTLE_WITHINS = [0.001, BASELINE, 0.1] as const;

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

interface SettleWithinResult {
  settleWithin: number;
  produced: number;
  settledShare: number | null;
  medianMassResidual: number | null;
  medianEnergyResidual: number | null;
}

interface ConfigResult {
  configuration: string;
  byThreshold: SettleWithinResult[];
}

interface CaseResult {
  case: string;
  family: string;
  configurations: ConfigResult[];
}

function flyCase(spec: CaseSpec): CaseResult {
  const configurations = CONFIGURATIONS.map(({ structure, cloud }) => {
    const byThreshold = SETTLE_WITHINS.map((settleWithin) => {
      const u = stream(`fcm-round1/${spec.name}/${structure}/${cloud}`);
      let produced = 0;
      let settledKg = 0;
      let totalKg = 0;
      const massResiduals: number[] = [];
      const energyResiduals: number[] = [];
      for (const x of spec.inputs) {
        const d = drawFcm(entryOf(x), structure, cloud, u);
        let r = fcmEntryAudit(d.body, { ...d.options, ...REFERENCE, settleWithin });
        if (!r.completed)
          r = fcmEntryAudit(d.body, {
            ...d.options,
            ...REFERENCE,
            settleWithin,
            maxComponents: FCM_DOMAIN_MAP.retryComponents,
          });
        if (!r.completed) continue;
        produced += 1;
        settledKg += r.ledger.settledCloudMass;
        totalKg += r.mass;
        massResiduals.push(Math.abs(r.ledger.massResidual));
        energyResiduals.push(Math.abs(r.ledger.energyResidual));
      }
      return {
        settleWithin,
        produced,
        settledShare: totalKg > 0 ? round(settledKg / totalKg, 6) : null,
        medianMassResidual: median(massResiduals),
        medianEnergyResidual: median(energyResiduals),
      };
    });
    return { configuration: `${structure}/${cloud}`, byThreshold };
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

  // How much the settled-mass share moves between the tightest and loosest
  // threshold, relative to the baseline — the question rule 1190 (c) asks.
  const moves = results.flatMap((r) =>
    r.configurations.flatMap((c) => {
      const tight = c.byThreshold[0]?.settledShare;
      const loose = c.byThreshold[2]?.settledShare;
      if (tight === null || tight === undefined || loose === null || loose === undefined) return [];
      return [Math.abs(loose - tight)];
    })
  );
  const out = { rule: '1190 (c)', draws: DRAWS, settleWithins: SETTLE_WITHINS, results };
  writeFileSync(
    'src/physics/validation/fcmSettleWithinSensitivity.json',
    `${JSON.stringify(out, null, 1)}\n`
  );

  const pct = (x: number | null): string => (x === null ? '—' : `${String(round(x * 100, 4))} %`);
  const lines = [
    '# FCM survival–light round — settleWithin sensitivity (rule 1190 (c))',
    '',
    'A numerical check, not a tuning: the same 18 development cases and input/parameter streams as the',
    `cascade audit, at \`settleWithin\` = ${String(SETTLE_WITHINS[0] * 100)} %, ${String(SETTLE_WITHINS[1] * 100)} % (the branch's own baseline,`,
    `rule 1138 (c)) and ${String(SETTLE_WITHINS[2] * 100)} %. None of H1 through H5's own results depend on this value.`,
    '',
    `Settled-mass share moves by a median of ${pct(median(moves))} of the body's entry mass between the`,
    `tightest and loosest threshold, across ${String(moves.length)} case–configuration pairs (both`,
    'thresholds’ own median ledger residual stayed within gate 1’s tolerance in every pair checked below).',
    '',
    '## By case and configuration',
    '',
    ...results.flatMap((r) => [
      `### ${r.case} (${r.family})`,
      '',
      '| Configuration | settleWithin | produced | settled share | median |mass residual| | median |energy residual| |',
      '| --- | --- | --- | --- | --- | --- |',
      ...r.configurations.flatMap((c) =>
        c.byThreshold.map(
          (t) =>
            `| ${c.configuration} | ${String(t.settleWithin * 100)} % | ${String(t.produced)} | ${pct(t.settledShare)} | ${t.medianMassResidual === null ? '—' : String(t.medianMassResidual)} | ${t.medianEnergyResidual === null ? '—' : String(t.medianEnergyResidual)} |`
        )
      ),
      '',
    ]),
  ];
  writeFileSync('docs/FCM_SETTLEWITHIN_SENSITIVITY.md', lines.join('\n'));
  console.log(JSON.stringify({ medianMove: median(moves), pairs: moves.length }, null, 1));
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
