/**
 * Rule 1229 (f)(2) (`src/physics/validation/porta1Rules.ts`): gate 1's
 * convergence (rule 1141 (c)) on every development draw that rule 1229 (e)(2)
 * found changed — each under round 1's variations (rule 1149 (b): the step
 * halved and doubled, bins of 100 m), each decisional quantity against its
 * own engine's reference by gate 1's tolerances (`failing`), flown by the
 * corrected settle condition and, on the same draw, by the sealed engine, so
 * that a tolerance the correction breaks is seen as such (rule 1229 (g)).
 * Reads src/physics/validation/porta1SettleFull.json: run
 * `scripts/porta1-settle-full.ts` first.
 *
 *   pnpm exec tsx scripts/porta1-settle-convergence.ts
 *
 * Writes src/physics/validation/porta1SettleConvergence.json and
 * docs/PORTA1_SETTLE_CONVERGENCE.md.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { CRUSTAL_ROCK_DENSITY } from '../src/physics/constants.js';
import { fcmEntry, type FcmResult } from '../src/physics/effects/fcmBranch.js';
import { fcmEntrySettle } from '../src/physics/effects/fcmBranchSettle.js';
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
import {
  drawFcm,
  failing,
  KT,
  quantities,
  REFERENCE,
  type Cloud,
  type Key,
  type Structure,
} from './fcmRound1Common.js';

const DRAWS = FCM_DEV_PRIORS.draws;

/** The cascade audit's input streams (`scripts/porta1-settle-full.ts`). */
function inputsOfCase(name: string): ImpactScenarioInput[] {
  const dev = DEV_CASES.find((c) => c.case === name);
  if (dev !== undefined) return inputsOf(dev.case).inputs.slice(0, DRAWS);
  const b = THIRD_SET_BODIES.find((x) => x.event === name);
  if (b !== undefined)
    return drawnInputs(
      { event: b.event, inputs: b.inputs, targets: [] },
      `${THIRD_SET_RUN_SEED}${b.event}`,
      THIRD_SET_RUN_DRAWS
    ).slice(0, DRAWS);
  const w = Object.entries(FCM_DEV_RUN.w18Cases).find(([n]) => n === name)?.[1];
  if (w === undefined) throw new Error(`no case ${name}`);
  const u = stream(`${FCM_DEV_PRIORS.seed}${name}/inputs`);
  return Array.from({ length: DRAWS }, () => {
    const mass = w.massKg[0] * (w.massKg[1] / w.massKg[0]) ** u();
    const density = w.densityKgM3[0] + (w.densityKgM3[1] - w.densityKgM3[0]) * u();
    return {
      impactorDiameter: m(Math.cbrt((6 * mass) / (Math.PI * density))),
      impactVelocity: mps(w.speedMS),
      impactorDensity: kgPerM3(density),
      targetDensity: CRUSTAL_ROCK_DENSITY,
      impactAngle: rad((w.angleDeg * Math.PI) / 180),
      surfaceGravity: 9.806_65,
    };
  });
}

interface FullRow {
  case: string;
  configuration: string;
  changed: { draw: number }[];
}

const full = JSON.parse(readFileSync('src/physics/validation/porta1SettleFull.json', 'utf8')) as {
  rows: FullRow[];
};

interface Verdict {
  completed: boolean;
  /** Per variation, the quantities outside gate 1's tolerance. */
  variations: { name: string; completed: boolean; failing: Key[] }[];
}

function converge(
  f: typeof fcmEntry,
  d: ReturnType<typeof drawFcm>
): { verdict: Verdict; peakAltitudeKm: number | null } {
  const fly = (extra: object): FcmResult => {
    const r = f(d.body, { ...d.options, ...REFERENCE, ...extra });
    return r.completed
      ? r
      : f(d.body, {
          ...d.options,
          ...REFERENCE,
          ...extra,
          maxComponents: FCM_DOMAIN_MAP.retryComponents,
        });
  };
  const ref = fly({});
  if (!ref.completed)
    return { verdict: { completed: false, variations: [] }, peakAltitudeKm: null };
  const q = quantities(ref);
  const entryKt = ref.energy / KT;
  const variations = FCM_DOMAIN_MAP.variations.map((v) => {
    const name = 'stepM' in v ? `step ${String(v.stepM)} m` : `bins ${String(v.binM)} m`;
    const r = fly(v);
    return {
      name,
      completed: r.completed,
      failing: r.completed ? failing(q, quantities(r), entryKt) : [],
    };
  });
  return { verdict: { completed: true, variations }, peakAltitudeKm: q.peakAltitudeKm };
}

const rows: {
  case: string;
  configuration: string;
  draw: number;
  sealed: Verdict;
  corrected: Verdict;
  /** Quantities the corrected engine fails where the sealed one passed. */
  broken: { variation: string; keys: Key[] }[];
}[] = [];

for (const r of full.rows) {
  if (r.changed.length === 0) continue;
  const [structure, cloud] = r.configuration.split('/') as [Structure, Cloud];
  const inputs = inputsOfCase(r.case);
  const u = stream(`fcm-round1/${r.case}/${structure}/${cloud}`);
  const wanted = new Set(r.changed.map((c) => c.draw));
  for (const [i, x] of inputs.entries()) {
    // Every draw consumes its parameters from the stream, wanted or not.
    const d = drawFcm(
      {
        diameterM: x.impactorDiameter,
        speedMS: x.impactVelocity,
        densityKgM3: x.impactorDensity,
        angleRad: x.impactAngle,
      },
      structure,
      cloud,
      u
    );
    if (!wanted.has(i)) continue;
    const a = converge(fcmEntry, d).verdict;
    const b = converge(fcmEntrySettle, d).verdict;
    const broken = b.variations.flatMap((v) => {
      const before = a.variations.find((w) => w.name === v.name)?.failing ?? [];
      const keys = v.failing.filter((k) => !before.includes(k));
      return keys.length === 0 ? [] : [{ variation: v.name, keys }];
    });
    rows.push({
      case: r.case,
      configuration: r.configuration,
      draw: i,
      sealed: a,
      corrected: b,
      broken,
    });
    console.log(
      `${r.case} ${r.configuration} draw ${String(i)}: corrected fails ${JSON.stringify(b.variations.map((v) => v.failing))}; broken ${String(broken.length)}`
    );
  }
}

writeFileSync(
  'src/physics/validation/porta1SettleConvergence.json',
  `${JSON.stringify({ rule: '1229 (f)(2)', variations: FCM_DOMAIN_MAP.variations, rows }, null, 1)}\n`
);

const fails = (v: Verdict): string =>
  !v.completed
    ? 'not completed'
    : v.variations.every((x) => x.completed && x.failing.length === 0)
      ? 'all pass'
      : v.variations
          .filter((x) => !x.completed || x.failing.length > 0)
          .map((x) => `${x.name}: ${x.completed ? x.failing.join(', ') : 'not completed'}`)
          .join('; ');
const lines = [
  '# Porta 1 — gate 1’s convergence on the development draws the correction changes (rule 1229 (f)(2))',
  '',
  `Every development draw that rule 1229 (e)(2) found changed (${String(rows.length)}), flown by the sealed engine and by the corrected settle condition, each under round 1’s variations (the step halved and doubled, bins of 100 m) and judged against its own engine’s reference by gate 1’s tolerances (rule 1141 (c)). «Broken» is a quantity the corrected engine fails where the sealed one passed on the same draw (rule 1229 (g)).`,
  '',
  '| Case | Configuration | Draw | Sealed | Corrected | Broken by the correction |',
  '| --- | --- | --: | --- | --- | --- |',
  ...rows.map(
    (r) =>
      `| ${r.case} | ${r.configuration} | ${String(r.draw)} | ${fails(r.sealed)} | ${fails(r.corrected)} | ${r.broken.length === 0 ? 'none' : r.broken.map((b) => `${b.variation}: ${b.keys.join(', ')}`).join('; ')} |`
  ),
  '',
];
writeFileSync('docs/PORTA1_SETTLE_CONVERGENCE.md', lines.join('\n'));
