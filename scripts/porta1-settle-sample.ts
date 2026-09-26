/**
 * Rule 1227 (c) (`src/physics/validation/porta1Rules.ts`): the sealed engine
 * beside the corrected settle condition (`fcmBranchSettle.ts`), on a declared
 * sample of every development case of rule 1143 — the cases of rule 961, the
 * third set's six bodies, W18's four events — the first `DRAWS` draws of each,
 * on the same input and parameter streams as the cascade audit. A sample says
 * whether the defect moves the settled share, the energy given to the air at
 * stops, the ledger's balance and the deposit's peak; it is not the full
 * development run.
 *
 *   pnpm exec tsx scripts/porta1-settle-sample.ts [draws]
 *
 * Writes src/physics/validation/porta1SettleSample.json and
 * docs/PORTA1_SETTLE_SAMPLE.md.
 */

import { writeFileSync } from 'node:fs';
import { CRUSTAL_ROCK_DENSITY } from '../src/physics/constants.js';
import { fcmEntry, fcmPeaks, type FcmResult } from '../src/physics/effects/fcmBranch.js';
import { fcmEntrySettle } from '../src/physics/effects/fcmBranchSettle.js';
import type { ImpactScenarioInput } from '../src/physics/simulate.js';
import { kgPerM3, m, mps, rad } from '../src/physics/units.js';
import { DEV_CASES } from '../src/physics/validation/fragmentationDevTable.js';
import {
  FCM_DEV_PRIORS,
  FCM_DEV_RUN,
  FCM_DOMAIN_MAP,
  FCM_PEAKS,
} from '../src/physics/validation/fcmRound1Rules.js';
import { THIRD_SET_BODIES } from '../src/physics/validation/thirdSetSources.js';
import {
  THIRD_SET_RUN_DRAWS,
  THIRD_SET_RUN_SEED,
} from '../src/physics/validation/thirdSetRunRules.js';
import { drawnInputs, inputsOf, stream } from './fragmentationRun.js';
import { CONFIGURATIONS, drawFcm, REFERENCE, round } from './fcmRound1Common.js';

const DRAWS = Number(process.argv[2] ?? 5);

interface CaseSpec {
  name: string;
  family: 'rule 961' | 'third set' | 'W18';
  inputs: ImpactScenarioInput[];
}

function cases(): CaseSpec[] {
  const out: CaseSpec[] = [];
  for (const { case: c } of DEV_CASES) {
    out.push({ name: c, family: 'rule 961', inputs: inputsOf(c).inputs.slice(0, DRAWS) });
  }
  for (const b of THIRD_SET_BODIES) {
    const inputs = drawnInputs(
      { event: b.event, inputs: b.inputs, targets: [] },
      `${THIRD_SET_RUN_SEED}${b.event}`,
      THIRD_SET_RUN_DRAWS
    ).slice(0, DRAWS);
    out.push({ name: b.event, family: 'third set', inputs });
  }
  const input = (d: number, v: number, rho: number, deg: number): ImpactScenarioInput => ({
    impactorDiameter: m(d),
    impactVelocity: mps(v),
    impactorDensity: kgPerM3(rho),
    targetDensity: CRUSTAL_ROCK_DENSITY,
    impactAngle: rad((deg * Math.PI) / 180),
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

/** Rule 1154 (b)'s ledger: the energy given to the air at stops, over E0. */
const stoppedShare = (r: FcmResult): number =>
  (r.ledger.deposited -
    r.ledger.dragWork -
    r.ledger.ablatedEnergy -
    r.ledger.flightResidual * r.energy) /
  r.energy;

interface Reading {
  settledShare: number;
  stoppedShare: number;
  groundShare: number;
  peakKtKm: number;
  peakAltitudeKm: number;
  massResidual: number;
  energyResidual: number;
}

const read = (r: FcmResult): Reading => {
  const p = fcmPeaks(r, FCM_PEAKS);
  return {
    settledShare: round(r.ledger.settledCloudMass / r.mass, 6),
    stoppedShare: round(stoppedShare(r), 9),
    groundShare: round(r.ledger.groundMass / r.mass, 6),
    peakKtKm: round(p.ktPerKm, 4),
    peakAltitudeKm: round(p.altitudeKm, 3),
    massResidual: r.ledger.massResidual,
    energyResidual: r.ledger.energyResidual,
  };
};

interface DrawResult {
  draw: number;
  identical: boolean;
  sealed: Reading | null;
  corrected: Reading | null;
}

const results: { case: string; family: string; configuration: string; draws: DrawResult[] }[] = [];
for (const spec of cases()) {
  for (const { structure, cloud } of CONFIGURATIONS) {
    const u = stream(`fcm-round1/${spec.name}/${structure}/${cloud}`);
    const draws: DrawResult[] = [];
    for (const [i, x] of spec.inputs.entries()) {
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
      const run = (f: typeof fcmEntry): FcmResult | null => {
        let r = f(d.body, { ...d.options, ...REFERENCE });
        if (!r.completed)
          r = f(d.body, {
            ...d.options,
            ...REFERENCE,
            maxComponents: FCM_DOMAIN_MAP.retryComponents,
          });
        return r.completed ? r : null;
      };
      const a = run(fcmEntry);
      const b = run(fcmEntrySettle);
      const identical =
        a !== null &&
        b !== null &&
        JSON.stringify(a.energyPerBin) === JSON.stringify(b.energyPerBin) &&
        JSON.stringify(a.ledger) === JSON.stringify(b.ledger);
      draws.push({
        draw: i,
        identical,
        sealed: a === null ? null : read(a),
        corrected: b === null ? null : read(b),
      });
    }
    results.push({
      case: spec.name,
      family: spec.family,
      configuration: `${structure}/${cloud}`,
      draws,
    });
    console.log(
      `${spec.name} ${structure}/${cloud}: ${String(draws.filter((d) => d.identical).length)}/${String(draws.length)} identical`
    );
  }
}

writeFileSync(
  'src/physics/validation/porta1SettleSample.json',
  `${JSON.stringify({ rule: '1227 (c)', drawsPerCase: DRAWS, results }, null, 1)}\n`
);

const pct = (x: number | undefined): string =>
  x === undefined ? '—' : `${(x * 100).toFixed(2)} %`;
const lines: string[] = [
  '# Porta 1 — the settle condition, sealed beside corrected (rule 1227 (c))',
  '',
  `A declared sample of every development case of rule 1143, the first ${String(DRAWS)} draws of each on the cascade audit's own streams, flown by the sealed engine (\`fcmBranch.ts\`, rule 1162) and by the corrected settle condition (\`fcmBranchSettle.ts\`, rule 1227). Development only; no adoption; not the full development run.`,
  '',
  '| Case | Family | Configuration | Identical draws | Stopped energy, sealed → corrected (median) | Settled share, sealed → corrected (median) | Peak altitude, sealed → corrected (median) |',
  '| --- | --- | --- | --: | --- | --- | --- |',
];
const med = (xs: number[]): number | undefined => {
  if (xs.length === 0) return undefined;
  const s = [...xs].sort((p, q) => p - q);
  return s[Math.floor(s.length / 2)];
};
for (const r of results) {
  const both = r.draws.filter((d) => d.sealed !== null && d.corrected !== null);
  const sealedStop = med(both.map((d) => d.sealed?.stoppedShare ?? 0));
  const corrStop = med(both.map((d) => d.corrected?.stoppedShare ?? 0));
  const sealedSet = med(both.map((d) => d.sealed?.settledShare ?? 0));
  const corrSet = med(both.map((d) => d.corrected?.settledShare ?? 0));
  const sealedAlt = med(both.map((d) => d.sealed?.peakAltitudeKm ?? 0));
  const corrAlt = med(both.map((d) => d.corrected?.peakAltitudeKm ?? 0));
  lines.push(
    `| ${r.case} | ${r.family} | ${r.configuration} | ${String(r.draws.filter((d) => d.identical).length)} of ${String(r.draws.length)} | ${pct(sealedStop)} → ${pct(corrStop)} | ${pct(sealedSet)} → ${pct(corrSet)} | ${sealedAlt === undefined ? '—' : sealedAlt.toFixed(2)} → ${corrAlt === undefined ? '—' : corrAlt.toFixed(2)} km |`
  );
}
const worstResidual = Math.max(
  ...results.flatMap((r) =>
    r.draws.flatMap((d) =>
      d.corrected === null
        ? []
        : [Math.abs(d.corrected.massResidual), Math.abs(d.corrected.energyResidual)]
    )
  )
);
lines.push(
  '',
  `The corrected engine's ledger, worst over every completed draw: ${worstResidual.toExponential(2)} (rule 1141 (a) asks 10⁻¹²).`,
  ''
);
writeFileSync('docs/PORTA1_SETTLE_SAMPLE.md', lines.join('\n'));
console.log('written');
