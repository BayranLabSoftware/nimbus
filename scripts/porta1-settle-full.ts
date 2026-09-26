/**
 * Rule 1229 (e)(2) (`src/physics/validation/porta1Rules.ts`): rule 1227 (c)'s
 * quantities on every draw of every development case of rule 1143 — the
 * cases of rule 961, the third set's six bodies, W18's three events, on the
 * cascade audit's own input and parameter streams — flown by the sealed
 * engine and by the corrected settle condition; and rule 1190's pooled
 * overview of the fates, from each engine's own ledger, weighted as rule 1190
 * weighs them. Development only; no adoption.
 *
 *   pnpm exec tsx scripts/porta1-settle-full.ts shard k K
 *   pnpm exec tsx scripts/porta1-settle-full.ts merge K
 *
 * Writes src/physics/validation/porta1SettleFull.json and
 * docs/PORTA1_SETTLE_FULL.md.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

const SHARDS_DIR = join(tmpdir(), 'nimbus-porta1-settle-full');
const DRAWS = FCM_DEV_PRIORS.draws;

interface CaseSpec {
  name: string;
  family: 'rule 961' | 'third set' | 'W18';
  inputs: ImpactScenarioInput[];
}

/** The cascade audit's cases and input streams (`scripts/fcm-audit-run.ts`). */
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

/** Every (case, configuration) pair, in the audit's order. */
const units = (): { spec: CaseSpec; structure: 'M1' | 'M2'; cloud: 'unlimited' | 'capped' }[] =>
  cases().flatMap((spec) =>
    CONFIGURATIONS.map(({ structure, cloud }) => ({ spec, structure, cloud }))
  );

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

/** Rule 1190's fates, in kilograms, over a pair's completed draws. */
interface Fates {
  produced: number;
  entryMassKg: number;
  landedSolidKg: number;
  landedCloudKg: number;
  settledKg: number;
  dustKg: number;
}

const noFates = (): Fates => ({
  produced: 0,
  entryMassKg: 0,
  landedSolidKg: 0,
  landedCloudKg: 0,
  settledKg: 0,
  dustKg: 0,
});

function absorb(f: Fates, r: FcmResult): void {
  f.produced += 1;
  f.entryMassKg += r.mass;
  f.landedSolidKg += r.ledger.groundMass - r.swarm.mass;
  f.landedCloudKg += r.swarm.mass;
  f.settledKg += r.ledger.settledCloudMass;
  f.dustKg += r.ledger.dustMass;
}

interface Unit {
  case: string;
  family: string;
  configuration: string;
  draws: number;
  identical: number;
  completed: { sealed: number; corrected: number; both: number };
  median: {
    stoppedShare: { sealed: number | null; corrected: number | null };
    settledShare: { sealed: number | null; corrected: number | null };
    peakAltitudeKm: { sealed: number | null; corrected: number | null };
  };
  worstCorrectedResidual: number | null;
  fates: { sealed: Fates; corrected: Fates };
  /** The draws the two engines fly differently, with both readings. */
  changed: { draw: number; sealed: Reading | null; corrected: Reading | null }[];
}

const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((p, q) => p - q);
  return s[Math.floor(s.length / 2)] ?? null;
};

function flyUnit(u: ReturnType<typeof units>[number]): Unit {
  const { spec, structure, cloud } = u;
  const next = stream(`fcm-round1/${spec.name}/${structure}/${cloud}`);
  const fates = { sealed: noFates(), corrected: noFates() };
  const both: { sealed: Reading; corrected: Reading }[] = [];
  const changed: Unit['changed'] = [];
  let identical = 0;
  let worst: number | null = null;
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
      next
    );
    const fly = (f: typeof fcmEntry): FcmResult | null => {
      let r = f(d.body, { ...d.options, ...REFERENCE });
      if (!r.completed)
        r = f(d.body, {
          ...d.options,
          ...REFERENCE,
          maxComponents: FCM_DOMAIN_MAP.retryComponents,
        });
      return r.completed ? r : null;
    };
    const a = fly(fcmEntry);
    const b = fly(fcmEntrySettle);
    if (a !== null) absorb(fates.sealed, a);
    if (b !== null) {
      absorb(fates.corrected, b);
      const w = Math.max(Math.abs(b.ledger.massResidual), Math.abs(b.ledger.energyResidual));
      worst = worst === null ? w : Math.max(worst, w);
    }
    const same =
      a !== null &&
      b !== null &&
      JSON.stringify(a.energyPerBin) === JSON.stringify(b.energyPerBin) &&
      JSON.stringify(a.ledger) === JSON.stringify(b.ledger);
    const ra = a === null ? null : read(a);
    const rb = b === null ? null : read(b);
    if (ra !== null && rb !== null) both.push({ sealed: ra, corrected: rb });
    if (same) identical += 1;
    else if (a !== null || b !== null) changed.push({ draw: i, sealed: ra, corrected: rb });
  }
  const med = (get: (x: Reading) => number) => ({
    sealed: median(both.map((x) => get(x.sealed))),
    corrected: median(both.map((x) => get(x.corrected))),
  });
  return {
    case: spec.name,
    family: spec.family,
    configuration: `${structure}/${cloud}`,
    draws: spec.inputs.length,
    identical,
    completed: {
      sealed: fates.sealed.produced,
      corrected: fates.corrected.produced,
      both: both.length,
    },
    median: {
      stoppedShare: med((x) => x.stoppedShare),
      settledShare: med((x) => x.settledShare),
      peakAltitudeKm: med((x) => x.peakAltitudeKm),
    },
    worstCorrectedResidual: worst,
    fates,
    changed,
  };
}

function shard(k: number, K: number): void {
  const out: Unit[] = [];
  units().forEach((u, i) => {
    if (i % K === k) {
      out.push(flyUnit(u));
      console.log(`${u.spec.name} ${u.structure}/${u.cloud} done`);
    }
  });
  mkdirSync(SHARDS_DIR, { recursive: true });
  writeFileSync(join(SHARDS_DIR, `shard-${String(k)}-of-${String(K)}.json`), JSON.stringify(out));
}

/** Rule 1190's shares of a pair — the audit's own rounding. */
function shares(f: Fates): {
  entryMassKg: number;
  landedSolid: number;
  landedCloud: number;
  settled: number;
  dust: number;
} {
  const total = f.landedSolidKg + f.landedCloudKg + f.settledKg + f.dustKg;
  const s = (kg: number): number => (total > 0 ? round(kg / total, 6) : 0);
  return {
    entryMassKg: round(f.entryMassKg, 6),
    landedSolid: s(f.landedSolidKg),
    landedCloud: s(f.landedCloudKg),
    settled: s(f.settledKg),
    dust: s(f.dustKg),
  };
}

type Shares = ReturnType<typeof shares>;

/** Rule 1190's pooled overview: each pair weighted by its accounted mass. */
function pooled(xs: Shares[]): {
  landedSolid: number;
  landedCloud: number;
  settled: number;
  dust: number;
} {
  const produced = xs.filter((x) => x.entryMassKg > 0);
  const weight = (x: Shares): number =>
    x.entryMassKg * (x.landedSolid + x.landedCloud + x.settled + x.dust);
  const total = produced.reduce((a, x) => a + weight(x), 0);
  const mean = (get: (x: Shares) => number): number =>
    total === 0 ? 0 : produced.reduce((a, x) => a + weight(x) * get(x), 0) / total;
  return {
    landedSolid: mean((x) => x.landedSolid),
    landedCloud: mean((x) => x.landedCloud),
    settled: mean((x) => x.settled),
    dust: mean((x) => x.dust),
  };
}

function merge(K: number): void {
  const order = units().map((u) => `${u.spec.name}/${u.structure}/${u.cloud}`);
  const rows: Unit[] = [];
  for (let k = 0; k < K; k++) {
    const p = join(SHARDS_DIR, `shard-${String(k)}-of-${String(K)}.json`);
    if (!existsSync(p)) throw new Error(`missing ${p}`);
    rows.push(...(JSON.parse(readFileSync(p, 'utf8')) as Unit[]));
  }
  rows.sort(
    (a, b) =>
      order.indexOf(`${a.case}/${a.configuration}`) - order.indexOf(`${b.case}/${b.configuration}`)
  );
  const sealed = pooled(rows.map((r) => shares(r.fates.sealed)));
  const corrected = pooled(rows.map((r) => shares(r.fates.corrected)));
  const drawsTotal = rows.reduce((a, r) => a + r.draws, 0);
  const identicalTotal = rows.reduce((a, r) => a + r.identical, 0);
  const worst = Math.max(...rows.map((r) => r.worstCorrectedResidual ?? 0));
  writeFileSync(
    'src/physics/validation/porta1SettleFull.json',
    `${JSON.stringify({ rule: '1229 (e)(2)', draws: DRAWS, pooled: { sealed, corrected }, worstCorrectedResidual: worst, rows }, null, 1)}\n`
  );

  const pct = (x: number | null): string => (x === null ? '—' : `${String(round(x * 100, 4))} %`);
  const km = (x: number | null): string => (x === null ? '—' : x.toFixed(2));
  const lines: string[] = [
    '# Porta 1 — the settle condition on every development draw (rule 1229 (e)(2))',
    '',
    `Every development case of rule 1143 — rule 961’s nine, the third set’s six, W18’s three — on the cascade audit’s own streams, ${String(DRAWS)} draws each (or the one input), the four configurations, flown by the sealed engine (\`fcmBranch.ts\`, rule 1162) and by the corrected settle condition (\`fcmBranchSettle.ts\`, rule 1227), each retried with 10⁶ components where 10⁵ do not complete. Development only; no adoption.`,
    '',
    `Draws flown: ${String(drawsTotal)}; identical to the bit under the two engines: ${String(identicalTotal)}.`,
    '',
    '## Rule 1190’s pooled overview, from each engine’s own ledger',
    '',
    'Counted as rule 1190 counts it: each share is of the mass the runs still account for at their end — landed, settled or turned to dust, the vapour aside — and each case and configuration weighs by its entry mass over its completed draws. «Settled» is a stop, not a fate (rule 1190): nothing here is a ground- or meteorite-mass claim. The audit engine’s figures (`docs/FCM_AUDIT_RUN.md`): landed solid 3.253 %, landed cloud 3.538 %, settled 93.21 %, dust 4.588·10⁻⁷ %.',
    '',
    '| | Sealed engine | Corrected engine |',
    '| --- | --: | --: |',
    `| Landed, solid | ${pct(sealed.landedSolid)} | ${pct(corrected.landedSolid)} |`,
    `| Landed, cloud | ${pct(sealed.landedCloud)} | ${pct(corrected.landedCloud)} |`,
    `| No longer integrated: settled | ${pct(sealed.settled)} | ${pct(corrected.settled)} |`,
    `| Turned to dust | ${pct(sealed.dust)} | ${pct(corrected.dust)} |`,
    '',
    '## By case and configuration',
    '',
    '| Case | Family | Configuration | Identical draws | Completed, sealed / corrected | Energy given to the air at stops, of the entry’s, sealed → corrected (median) | Settled mass, of the entry’s, sealed → corrected (median) | Peak altitude, sealed → corrected (median, km) |',
    '| --- | --- | --- | --: | --- | --- | --- | --- |',
    ...rows.map(
      (r) =>
        `| ${r.case} | ${r.family} | ${r.configuration} | ${String(r.identical)} of ${String(r.draws)} | ${String(r.completed.sealed)} / ${String(r.completed.corrected)} | ${pct(r.median.stoppedShare.sealed)} → ${pct(r.median.stoppedShare.corrected)} | ${pct(r.median.settledShare.sealed)} → ${pct(r.median.settledShare.corrected)} | ${km(r.median.peakAltitudeKm.sealed)} → ${km(r.median.peakAltitudeKm.corrected)} |`
    ),
    '',
    `The corrected engine’s ledger, worst over every completed draw: ${worst.toExponential(2)} (rule 1141 (a) asks 10⁻¹²).`,
    '',
  ];
  writeFileSync('docs/PORTA1_SETTLE_FULL.md', lines.join('\n'));
  console.log(JSON.stringify({ drawsTotal, identicalTotal, sealed, corrected, worst }, null, 1));
}

const [mode, a, b] = process.argv.slice(2);
if (mode === 'shard') shard(Number(a), Number(b));
else if (mode === 'merge') merge(Number(a));
else throw new Error('usage: shard k K | merge K');
