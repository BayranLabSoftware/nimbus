/**
 * Rules 1180 (a) and (c), 1182 (a) and (b) (src/physics/validation/
 * fcmSurvivalLightRules.ts): H1, the light law, and H3, the decomposition of
 * the landed mass — on the 18 declared development cases (rule 961's nine,
 * the third set's six, W18's three), the same input and parameter streams as
 * round 1's development runs, so the runs are directly comparable to
 * fcmDevRuns.json. No target is redrawn; the light law's two values are the
 * fixed midpoints of rule 1180 (a). Writes src/physics/validation/
 * fcmSurvivalLight.json and docs/FCM_SURVIVAL_LIGHT.md.
 *
 *   pnpm exec tsx scripts/fcm-survival-light.ts all
 *   pnpm exec tsx scripts/fcm-survival-light.ts shard k K
 *   pnpm exec tsx scripts/fcm-survival-light.ts merge K
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import { join } from 'node:path';
import { CRUSTAL_ROCK_DENSITY } from '../src/physics/constants.js';
import { fcmPeaks, type FcmResult } from '../src/physics/effects/fcmBranch.js';
import type { ImpactScenarioInput } from '../src/physics/simulate.js';
import { kgPerM3, m, mps, rad } from '../src/physics/units.js';
import { DEV_CASES } from '../src/physics/validation/fragmentationDevTable.js';
import {
  FCM_DEV_PRIORS,
  FCM_DOMAIN_MAP,
  FCM_PEAKS,
} from '../src/physics/validation/fcmRound1Rules.js';
import { FCM_LUMINOUS_EFFICIENCY } from '../src/physics/validation/fcmSurvivalLightRules.js';
import { THIRD_SET_BODIES } from '../src/physics/validation/thirdSetSources.js';
import {
  THIRD_SET_O1_WIDENING_M,
  THIRD_SET_RUN_DRAWS,
  THIRD_SET_RUN_SEED,
} from '../src/physics/validation/thirdSetRunRules.js';
import { FCM_DEV_RUN } from '../src/physics/validation/fcmRound1Rules.js';
import { drawnInputs, inputsOf, row, stream } from './fragmentationRun.js';
import { CONFIGURATIONS, drawFcm, round, run } from './fcmRound1Common.js';

const SHARDS_DIR = join(tmpdir(), 'nimbus-fcm-survival-light');
const DRAWS = FCM_DEV_PRIORS.draws;

interface CaseSpec {
  name: string;
  family: 'rule 961' | 'third set' | 'W18';
  inputs: ImpactScenarioInput[];
  mainFlare: { lowM: number; highM: number } | null;
}

function cases(): CaseSpec[] {
  const out: CaseSpec[] = [];
  for (const { case: c } of DEV_CASES) {
    const { inputs } = inputsOf(c);
    const m2 = row(c, 'm2');
    out.push({
      name: c,
      family: 'rule 961',
      inputs: inputs.slice(0, DRAWS),
      mainFlare:
        m2.observed.kind === 'altitude'
          ? { lowM: m2.observed.lowM, highM: m2.observed.highM }
          : null,
    });
  }
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
      mainFlare: b.o1.eligible
        ? {
            lowM: b.o1.intervalKm[0] * 1_000 - THIRD_SET_O1_WIDENING_M,
            highM: b.o1.intervalKm[1] * 1_000 + THIRD_SET_O1_WIDENING_M,
          }
        : null,
    });
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
    const main = name === 'Košice' ? 37 : name === 'Tagish Lake' ? 32 : null;
    out.push({
      name,
      family: 'W18',
      inputs,
      mainFlare: main === null ? null : { lowM: main * 1_000 - 1_000, highM: main * 1_000 + 1_000 },
    });
  }
  return out;
}

const entryOf = (x: ImpactScenarioInput) => ({
  diameterM: x.impactorDiameter as number,
  speedMS: x.impactVelocity as number,
  densityKgM3: x.impactorDensity as number,
  angleRad: x.impactAngle as number,
});

/** Rule 1180 (a): the synthetic light curve, and its peak on the same window
 *  as the mechanical deposit's (rule 1151). */
function lightPeak(r: FcmResult): { altitudeKm: number; ktPerKm: number } {
  const firstBreakBin =
    r.firstBreakAltitude === null ? -1 : Math.floor(r.firstBreakAltitude / r.binM);
  const synthetic = r.energyPerBin.map((e, i) =>
    i >= firstBreakBin
      ? e * FCM_LUMINOUS_EFFICIENCY.beforeFragmentation
      : e * FCM_LUMINOUS_EFFICIENCY.afterFragmentation
  );
  const fake = { energyPerBin: synthetic, binM: r.binM } as unknown as FcmResult;
  const p = fcmPeaks(fake, FCM_PEAKS);
  return { altitudeKm: p.altitudeKm, ktPerKm: p.ktPerKm };
}

const distanceToInterval = (
  km: number,
  iv: { lowM: number; highM: number } | null
): number | null => (iv === null ? null : Math.max(0, iv.lowM / 1_000 - km, km - iv.highM / 1_000));

function flyCase(spec: CaseSpec) {
  const configurations = CONFIGURATIONS.map(({ structure, cloud }) => {
    const u = stream(`fcm-round1/${spec.name}/${structure}/${cloud}`);
    const rows = spec.inputs.map((x) => {
      const d = drawFcm(entryOf(x), structure, cloud, u);
      let r = run(d);
      if (!r.completed) r = run(d, { maxComponents: FCM_DOMAIN_MAP.retryComponents });
      if (!r.completed) return null;
      const p = fcmPeaks(r, FCM_PEAKS);
      const light = lightPeak(r);
      const solidKg = r.pieces.reduce((a, x) => a + x.count * x.mass, 0);
      const cloudKg = r.swarm.mass;
      const totalKg = r.ledger.groundMass;
      const largestKg = r.pieces.reduce((a, x) => Math.max(a, x.mass), 0);
      return {
        robust: p.robust,
        mechanicalKm: p.altitudeKm,
        lightKm: light.altitudeKm,
        lightKtKm: light.ktPerKm,
        solidKg,
        cloudKg,
        totalKg,
        largestKg,
        massKg: r.mass,
      };
    });
    const ok = rows.flatMap((r) => (r === null ? [] : [r]));
    const robust = ok.filter((r) => r.robust);
    const med = (xs: number[]): number | null => {
      if (xs.length === 0) return null;
      const s = [...xs].sort((a, b) => a - b);
      return round(s[Math.floor(s.length / 2)] ?? 0, 4);
    };
    const mechDist = robust.flatMap((r) => {
      const d = distanceToInterval(r.mechanicalKm, spec.mainFlare);
      return d === null ? [] : [d];
    });
    const lightDist = robust.flatMap((r) => {
      const d = distanceToInterval(r.lightKm, spec.mainFlare);
      return d === null ? [] : [d];
    });
    return {
      configuration: `${structure}/${cloud}`,
      produced: ok.length,
      robustCount: robust.length,
      mechanicalPeakKm: med(robust.map((r) => r.mechanicalKm)),
      lightPeakKm: med(robust.map((r) => r.lightKm)),
      mechanicalDistanceKm: med(mechDist),
      lightDistanceKm: med(lightDist),
      lightCloserShare:
        mechDist.length === 0
          ? null
          : round(
              mechDist.filter((d, i) => (lightDist[i] ?? Infinity) < d).length / mechDist.length,
              4
            ),
      solidKg: med(ok.map((r) => r.solidKg)),
      cloudKg: med(ok.map((r) => r.cloudKg)),
      totalLandedKg: med(ok.map((r) => r.totalKg)),
      largestKg: med(ok.map((r) => r.largestKg)),
      largestShare: med(ok.map((r) => (r.totalKg > 0 ? r.largestKg / r.totalKg : 0))),
      solidShareOfLanded: med(ok.map((r) => (r.totalKg > 0 ? r.solidKg / r.totalKg : 0))),
    };
  });
  return {
    case: spec.name,
    family: spec.family,
    mainFlareKm:
      spec.mainFlare === null
        ? null
        : [round(spec.mainFlare.lowM / 1_000, 4), round(spec.mainFlare.highM / 1_000, 4)],
    configurations,
  };
}

type CaseResult = ReturnType<typeof flyCase>;

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

  const withMainFlare = results.filter((r) => r.mainFlareKm !== null);
  const closerCounts = withMainFlare.flatMap((r) =>
    r.configurations.flatMap((c) => (c.lightCloserShare === null ? [] : [c.lightCloserShare]))
  );
  const meanCloser =
    closerCounts.length === 0
      ? null
      : round(closerCounts.reduce((a, b) => a + b, 0) / closerCounts.length, 4);

  const solidVsCloud = results.map((r) => {
    const c = r.configurations[0];
    return {
      case: r.case,
      solidShareOfLanded: c?.solidShareOfLanded ?? null,
      largestShare: c?.largestShare ?? null,
    };
  });
  const meanSolidShare = round(
    solidVsCloud.reduce((a, x) => a + (x.solidShareOfLanded ?? 0), 0) / solidVsCloud.length,
    4
  );

  // H3: every case x configuration where a cloud lands any mass at all — the
  // capped configurations can trap mass whose area, and so ablation rate,
  // stops growing once the cap is reached.
  const cloudLanding = results.flatMap((r) =>
    r.configurations
      .filter((c) => (c.cloudKg ?? 0) > 0)
      .map((c) => ({
        case: r.case,
        configuration: c.configuration,
        solidKg: c.solidKg,
        cloudKg: c.cloudKg,
        totalLandedKg: c.totalLandedKg,
      }))
  );

  const out = {
    rule: '1180, 1182',
    draws: DRAWS,
    meanLightCloserShare: meanCloser,
    meanSolidShareOfLanded: meanSolidShare,
    cloudLanding,
    results,
  };
  writeFileSync(
    'src/physics/validation/fcmSurvivalLight.json',
    `${JSON.stringify(out, null, 1)}\n`
  );

  const km = (x: number | null): string => (x === null ? '—' : String(x));
  const lines = [
    '# FCM survival–light round — H1 and H3, on the development cases',
    '',
    'Rules 1180 (a), 1180 (c), 1182 (a), 1182 (b) (`src/physics/validation/fcmSurvivalLightRules.ts`), run by',
    '`scripts/fcm-survival-light.ts` on the same input and parameter streams as round 1’s development runs',
    '(`fcmDevRuns.json`) — 18 cases, four configurations, 200 draws each. The light law’s two values are fixed',
    `at ${String(round(FCM_LUMINOUS_EFFICIENCY.beforeFragmentation * 100, 4))} % above a component’s first break and`,
    `${String(round(FCM_LUMINOUS_EFFICIENCY.afterFragmentation * 100, 4))} % at or below it (McFadden et al. 2021,`,
    'cited by Jenniskens 2026), before any comparison.',
    '',
    `**H1**: on the ${String(withMainFlare.length)} cases with a documented main-flare interval, the synthetic light peak sits`,
    `closer to it than the mechanical deposit peak in ${meanCloser === null ? '—' : String(Math.round(meanCloser * 100))} % of the case-configuration pairs on average.`,
    `**H3**: at the median, ${String(Math.round(meanSolidShare * 100))} % of the landed mass under M1/unlimited is solid pieces, the rest settled cloud.`,
    '',
    ...(cloudLanding.length === 0
      ? []
      : [
          "**H3, a capped-cloud finding**: round 1's `landedKg` summed solid pieces only, silently leaving out any",
          'cloud mass that settles at the ground (D16). Where a cloud is capped at ten radii, its area — and so',
          'its ablation rate — stops growing once the cap is reached; on the two single-draw presets this leaves',
          "most of the body's mass unablated:",
          '',
          '| Case | Configuration | Solid landed (kg) | Cloud landed (kg) | Total (kg) |',
          '| --- | --- | --- | --- | --- |',
          ...cloudLanding.map(
            (c) =>
              `| ${c.case} | ${c.configuration} | ${String(c.solidKg)} | ${String(c.cloudKg)} | ${String(c.totalLandedKg)} |`
          ),
          '',
          "Both are far above 10 m, outside round 3's tested domain, and neither the third set's nor the drawn",
          'cases show it — a candidate mechanism for H2 (ablation by regime), extended to ablation by cloud',
          'confinement: written here for when H2 is tested, not coded now.',
          '',
        ]),
    '## By case',
    '',
    ...results.flatMap((r) => [
      `### ${r.case} (${r.family})`,
      '',
      r.mainFlareKm === null
        ? 'No documented main-flare interval.'
        : `Documented main flare: ${String(r.mainFlareKm[0])}–${String(r.mainFlareKm[1])} km.`,
      '',
      '| Configuration | mechanical peak (km) | light peak (km) | mech. distance (km) | light distance (km) | light closer | solid landed (kg) | cloud landed (kg) | largest (kg) | largest share |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
      ...r.configurations.map(
        (c) =>
          `| ${c.configuration} | ${km(c.mechanicalPeakKm)} | ${km(c.lightPeakKm)} | ${km(c.mechanicalDistanceKm)} | ${km(c.lightDistanceKm)} | ${c.lightCloserShare === null ? '—' : `${String(Math.round(c.lightCloserShare * 100))} %`} | ${km(c.solidKg)} | ${km(c.cloudKg)} | ${km(c.largestKg)} | ${c.largestShare === null ? '—' : `${String(Math.round(c.largestShare * 100))} %`} |`
      ),
      '',
    ]),
  ];
  writeFileSync('docs/FCM_SURVIVAL_LIGHT.md', lines.join('\n'));
  console.log(
    JSON.stringify(
      { meanLightCloserShare: meanCloser, meanSolidShareOfLanded: meanSolidShare },
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
