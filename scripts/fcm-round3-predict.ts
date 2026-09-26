/**
 * Rule 1168 (d) (src/physics/validation/fcmRound3Charter.ts): round 3's
 * predictions, from the inputs alone (fcmRound3Sources.ts) — every event's
 * input draws and domain (rule 1170), the sealed candidate (rule 1162) under
 * its four configurations and their mixture with the sensitivity to the
 * weights (rules 1166, 1169), the exponential atmosphere beside the 1976
 * standard (rule 1165 (d)), and the baseline on the same draws. No target is
 * read here. Writes src/physics/validation/fcmRound3Predictions.json and
 * docs/FCM_ROUND3_PREDICTIONS.md, to be pushed before any target is extracted.
 *
 *   pnpm exec tsx scripts/fcm-round3-predict.ts
 */

import { writeFileSync } from 'node:fs';
import type { FcmOptions } from '../src/physics/effects/fcmBranch.js';
import { CRUSTAL_ROCK_DENSITY } from '../src/physics/constants.js';
import { simulateImpact, type ImpactScenarioInput } from '../src/physics/simulate.js';
import { kgPerM3, m, mps, rad } from '../src/physics/units.js';
import { percentileType7 } from '../src/physics/validation/entryBand.js';
import { FCM_DOMAIN_MAP } from '../src/physics/validation/fcmRound1Rules.js';
import { FCM_ROUND3 } from '../src/physics/validation/fcmRound3Charter.js';
import { FCM_ROUND3_INPUTS, type EventInputs } from '../src/physics/validation/fcmRound3Sources.js';
import { FCM_DOMAIN } from '../src/physics/validation/fcmRoundRules.js';
import { stream } from './fragmentationRun.js';
import { CONFIGURATIONS, drawFcm, quantities, round } from './fcmRound1Common.js';
import { engineFromArgs, runOn } from './porta1Engine.js';

/** Rule 1229 (e)(3): `--engine settle` flies rule 1227's corrected settle
 *  condition, into its own outputs; no target is read either way. */
const { engine: ENGINE, suffix: SUFFIX } = engineFromArgs(process.argv);
const run = runOn(ENGINE);

const platform = `${process.platform}-${process.arch}`;
if (process.version !== 'v22.20.0' || platform !== 'darwin-arm64') {
  console.error(`Refusing to run on ${process.version} ${platform}: v22.20.0 darwin-arm64.`);
  process.exit(2);
}

const DRAWS = 200;

/** Standard normal from two uniforms (Box–Muller). */
const normal = (u: () => number): number =>
  Math.sqrt(-2 * Math.log(Math.max(u(), Number.MIN_VALUE))) * Math.cos(2 * Math.PI * u());

/** Rule 1174 (a) and 1176 (a): an event's input draws. */
function inputDraws(
  e: EventInputs
): { diameterM: number; speedMS: number; densityKgM3: number; angleDeg: number }[] {
  const u = stream(`fcm-round3/${e.event}/inputs`);
  return Array.from({ length: DRAWS }, () => {
    const speed = e.speedKmS.value + (e.speedKmS.sigma ?? 0) * normal(u);
    const angle = e.angleDeg.value + (e.angleDeg.sigma ?? 0) * normal(u);
    const [mLo, mHi] = e.massKg.range ?? [e.massKg.value / 2, e.massKg.value * 2];
    const mass = mLo * (mHi / mLo) ** u();
    const [dLo, dHi] = e.densityKgM3.range ?? [e.densityKgM3.value, e.densityKgM3.value];
    const density = dLo + (dHi - dLo) * u();
    return {
      diameterM: Math.cbrt((6 * mass) / (Math.PI * density)),
      speedMS: speed * 1_000,
      densityKgM3: density,
      angleDeg: angle,
    };
  });
}

const q = (xs: readonly number[], p: number): number | null =>
  xs.length === 0 ? null : percentileType7(xs, p);
const band = (xs: readonly number[]) => ({
  p5: q(xs, 0.05) === null ? null : round(q(xs, 0.05) ?? 0, 4),
  median: q(xs, 0.5) === null ? null : round(q(xs, 0.5) ?? 0, 4),
  p95: q(xs, 0.95) === null ? null : round(q(xs, 0.95) ?? 0, 4),
});

/** A weighted quantile over several samples, each sample weighing w / n. */
function weightedQuantile(
  samples: readonly (readonly number[])[],
  weights: readonly number[],
  p: number
): number | null {
  const items: { x: number; w: number }[] = [];
  samples.forEach((xs, i) => {
    const w = weights[i] ?? 0;
    if (xs.length === 0 || w === 0) return;
    for (const x of xs) items.push({ x, w: w / xs.length });
  });
  if (items.length === 0) return null;
  items.sort((a, b) => a.x - b.x);
  const total = items.reduce((a, b) => a + b.w, 0);
  let acc = 0;
  for (const it of items) {
    acc += it.w;
    if (acc >= p * total) return round(it.x, 4);
  }
  return round(items[items.length - 1]?.x ?? 0, 4);
}

const results = FCM_ROUND3_INPUTS.map((e) => {
  const draws = inputDraws(e);
  const D = draws.map((d) => d.diameterM);
  const med = (xs: number[]): number => q(xs, 0.5) ?? 0;
  // Rule 1170: the domain, from the inputs alone.
  const inDomain =
    (q(D, 0.05) ?? 0) >= FCM_DOMAIN.diameterM[0] &&
    (q(D, 0.95) ?? 0) <= FCM_ROUND3.domain.diameterM[1] &&
    med(draws.map((d) => d.densityKgM3)) >= FCM_DOMAIN.densityKgM3[0] &&
    med(draws.map((d) => d.densityKgM3)) <= FCM_DOMAIN.densityKgM3[1] &&
    med(draws.map((d) => d.speedMS)) >= FCM_DOMAIN.speedMS[0] &&
    med(draws.map((d) => d.speedMS)) <= FCM_DOMAIN.speedMS[1] &&
    med(draws.map((d) => d.angleDeg)) >= FCM_DOMAIN.angleDeg[0] &&
    med(draws.map((d) => d.angleDeg)) <= FCM_DOMAIN.angleDeg[1];

  const fly = (
    structure: 'M1' | 'M2',
    cloud: 'unlimited' | 'capped',
    extra: Partial<FcmOptions>
  ) => {
    const u = stream(`fcm-round3/${e.event}/${structure}/${cloud}`);
    return draws.map((x) => {
      const d = drawFcm(
        {
          diameterM: x.diameterM,
          speedMS: x.speedMS,
          densityKgM3: x.densityKgM3,
          angleRad: (x.angleDeg * Math.PI) / 180,
        },
        structure,
        cloud,
        u
      );
      let r = run(d, extra);
      if (!r.completed) r = run(d, { ...extra, maxComponents: FCM_DOMAIN_MAP.retryComponents });
      if (!r.completed)
        return {
          produced: false,
          robust: false,
          peakKm: null as number | null,
          secondaryKm: null as number | null,
        };
      const qq = quantities(r);
      return {
        produced: true,
        robust: qq.robust,
        peakKm: qq.peakAltitudeKm,
        secondaryKm: qq.secondaryAltitudeKm,
      };
    });
  };

  const configurations = CONFIGURATIONS.map(({ structure, cloud }) => {
    const ref = fly(structure, cloud, {});
    const exp = fly(structure, cloud, { atmosphere: 'exponential' });
    const robust = ref.flatMap((r) =>
      r.produced && r.robust && r.peakKm !== null ? [r.peakKm] : []
    );
    const robustExp = exp.flatMap((r) =>
      r.produced && r.robust && r.peakKm !== null ? [r.peakKm] : []
    );
    return {
      configuration: `${structure}/${cloud}`,
      producedShare: round(ref.filter((r) => r.produced).length / DRAWS, 4),
      notRobustShare: round(ref.filter((r) => r.produced && !r.robust).length / DRAWS, 4),
      releaseKm: band(robust),
      exponentialReleaseKm: band(robustExp),
      notRobustAltitudesKm: ref
        .filter((r) => r.produced && !r.robust)
        .map((r) => [
          r.peakKm === null ? null : round(r.peakKm, 4),
          r.secondaryKm === null ? null : round(r.secondaryKm, 4),
        ]),
      robust,
      robustExp,
    };
  });

  const samples = configurations.map((c) => c.robust);
  const samplesExp = configurations.map((c) => c.robustExp);
  const mixtureAt = (w: readonly number[], xs = samples) => ({
    p5: weightedQuantile(xs, w, 0.05),
    median: weightedQuantile(xs, w, 0.5),
    p95: weightedQuantile(xs, w, 0.95),
  });
  const rotated = CONFIGURATIONS.map((_, i) =>
    CONFIGURATIONS.map((__, j) =>
      i === j ? FCM_ROUND3.weights.rotated[0] : FCM_ROUND3.weights.rotated[1]
    )
  );

  const base = draws.map((x) => {
    const input: ImpactScenarioInput = {
      impactorDiameter: m(x.diameterM),
      impactVelocity: mps(x.speedMS),
      impactorDensity: kgPerM3(x.densityKgM3),
      targetDensity: CRUSTAL_ROCK_DENSITY,
      impactAngle: rad((x.angleDeg * Math.PI) / 180),
      surfaceGravity: 9.806_65,
    };
    const en = simulateImpact(input).entry;
    return en.regime === 'COMPLETE_AIRBURST' ? (en.burstAltitude as number) / 1_000 : null;
  });
  const burst = base.filter((b): b is number => b !== null);

  return {
    event: e.event,
    kindFrozen: e.kind,
    inputs: {
      diameterM: band(D),
      speedKmS: band(draws.map((d) => d.speedMS / 1_000)),
      angleDeg: band(draws.map((d) => d.angleDeg)),
      densityKgM3: band(draws.map((d) => d.densityKgM3)),
    },
    inDomain,
    configurations: configurations.map(({ robust: _r, robustExp: _x, ...c }) => c),
    mixture: {
      equal: mixtureAt(FCM_ROUND3.weights.mixture),
      exponential: mixtureAt(FCM_ROUND3.weights.mixture, samplesExp),
      rotated: rotated.map((w, i) => {
        const c = CONFIGURATIONS[i];
        return { heavier: c === undefined ? '' : `${c.structure}/${c.cloud}`, ...mixtureAt(w) };
      }),
      monolithOnly: mixtureAt([0.5, 0.5, 0, 0]),
      structuredOnly: mixtureAt([0, 0, 0.5, 0.5]),
    },
    baseline: {
      burstShare: round(burst.length / DRAWS, 4),
      burstKm: band(burst),
    },
  };
});

writeFileSync(
  `src/physics/validation/fcmRound3Predictions${SUFFIX}.json`,
  `${JSON.stringify({ rule: '1168 (d)', draws: DRAWS, ...(SUFFIX === '' ? {} : { engine: 'rule 1227, effects/fcmBranchSettle.ts' }), results }, null, 1)}\n`
);

const km = (b: { p5: number | null; median: number | null; p95: number | null }): string =>
  b.median === null ? '—' : `${String(b.median)} (${String(b.p5)}–${String(b.p95)})`;
const lines = [
  '# FCM round 3 — the predictions, before any target',
  '',
  ...(SUFFIX === ''
    ? []
    : [
        'Flown by rule 1227’s corrected settle condition (`effects/fcmBranchSettle.ts`), rule 1229 (e)(3) — beside the sealed engine’s predictions of `docs/FCM_ROUND3_PREDICTIONS.md`, never against round 3’s targets.',
        '',
      ]),
  'Rule 1168 (d) (`src/physics/validation/fcmRound3Charter.ts`), run by `scripts/fcm-round3-predict.ts` from the',
  'inputs of `fcmRound3Sources.ts` alone, pushed before any target is extracted. The sealed candidate (rule',
  '1162), 200 input draws per event; the release is the main peak on the 1 km window, robust draws only',
  '(rule 1163 (c)); medians with their 5th–95th percentiles, in km. Benenitra is not here: its kind fell',
  '(rule 1176 (c)). For Grimsby, Bunburra Rockhole, Mason Gully and Neuschwanstein the analyst has seen',
  'their targets before these predictions (rule 1177 (a)); the predictions are the script’s, from inputs alone.',
  '',
  ...results.flatMap((r) => [
    `## ${r.event}`,
    '',
    `Inputs: diameter ${km(r.inputs.diameterM)} m, speed ${km(r.inputs.speedKmS)} km/s, angle ${km(r.inputs.angleDeg)}°, density ${km(r.inputs.densityKgM3)} kg/m³ — ${r.inDomain ? 'in the domain' : '**out of the domain** (rule 1170)'}.`,
    '',
    '| Configuration | produced | not robust | release, 1976 (km) | release, exponential (km) |',
    '| --- | --- | --- | --- | --- |',
    ...r.configurations.map(
      (c) =>
        `| ${c.configuration} | ${String(c.producedShare)} | ${String(c.notRobustShare)} | ${km(c.releaseKm)} | ${km(c.exponentialReleaseKm)} |`
    ),
    `| **mixture, equal weights** | | | ${km(r.mixture.equal)} | ${km(r.mixture.exponential)} |`,
    '',
    `Weights: ${r.mixture.rotated.map((w) => `${w.heavier} at 0.55: ${km(w)}`).join('; ')}; the monolith alone ${km(r.mixture.monolithOnly)}; the structured body alone ${km(r.mixture.structuredOnly)}.`,
    '',
    `Baseline (Collins): bursts in ${String(r.baseline.burstShare)} of the draws, at ${km(r.baseline.burstKm)} km.`,
    '',
  ]),
];
writeFileSync(
  `docs/FCM_ROUND3_PREDICTIONS${SUFFIX.replace('.', '_').toUpperCase()}.md`,
  lines.join('\n')
);
console.log(
  JSON.stringify(
    results.map((r) => ({
      event: r.event,
      inDomain: r.inDomain,
      mixture: r.mixture.equal,
      baseline: r.baseline,
    })),
    null,
    1
  )
);
