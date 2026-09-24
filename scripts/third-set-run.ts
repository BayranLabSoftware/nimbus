/**
 * The one paired run on the third set, under the second version of the judge
 * (rule 1126, src/physics/validation/thirdSetRunRules.ts; the table of rules
 * 1120 to 1125, thirdSetSources.ts; the judge, independentTestCharterV2.ts):
 *
 *   pnpm exec tsx scripts/third-set-run.ts
 *
 * Runs the baseline and S on every admitted body's draws, F beside as a
 * diagnostic; applies the frozen judge; writes
 * src/physics/validation/thirdSetRun.json and docs/THIRD_SET_RUN.md.
 * Deterministic: no clock, no randomness but the seeds'. Run once: whatever it
 * shows is the account. It adopts nothing.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collinsStrength,
  DEFAULT_STRENGTH_LAW,
  FIRST_STAGE_STRENGTH,
  mainStageStrength,
} from '../src/physics/effects/atmosphericEntry.js';
import { DRAG_COEFFICIENT, GRAVITY, RHO_0 } from '../src/physics/effects/entryConstants.js';
import { studyF, type StudyFResult } from '../src/physics/effects/fragmentationStudyF.js';
import { studyS, type StudyResult } from '../src/physics/effects/fragmentationStudyS.js';
import { simulateImpact, type ImpactScenarioInput } from '../src/physics/simulate.js';
import { percentileType7 } from '../src/physics/validation/entryBand.js';
import {
  F_CONVERGENCE,
  F_PRIOR_SEED,
  F_PRIORS,
  F_RELEASE_BINS_M,
} from '../src/physics/validation/fragmentationStudyFRules.js';
import {
  arrivalBreakdown,
  drawState,
  groundReading,
  groundVerdict,
  pieceClass,
  releaseStatus,
  verdictV2,
  type DecisiveOutcome,
  type GroundReading,
  type GroundState,
  type PieceClass,
  type ReleaseStatus,
} from '../src/physics/validation/independentTestCharterV2.js';
import type { LevelBEvent } from '../src/physics/validation/levelBSources.js';
import { THIRD_SET_BODIES, type ThirdSetBody } from '../src/physics/validation/thirdSetSources.js';
import {
  HAMBURG_TABLE4_MASSES_G,
  THIRD_SET_O1_MIN_PAIRED,
  THIRD_SET_O1_WIDENING_M,
  THIRD_SET_RUN_DRAWS,
  THIRD_SET_RUN_SEED,
  THIRD_SET_STRESS_MASS_FACTOR,
  thirdSetOutcome,
} from '../src/physics/validation/thirdSetRunRules.js';
import { m } from '../src/physics/units.js';
import { drawnInputs, stream } from './fragmentationRun.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = join(ROOT, 'src', 'physics', 'validation', 'thirdSetRun.json');
const OUT_MD = join(ROOT, 'docs', 'THIRD_SET_RUN.md');

const platform = `${process.platform}-${process.arch}`;
if (process.version !== 'v22.20.0' || platform !== 'darwin-arm64') {
  console.error(`Refusing to run on ${process.version} ${platform}: v22.20.0 darwin-arm64.`);
  process.exit(2);
}

const round = (x: number, d = 4): number => Number(x.toPrecision(d));
const median = (xs: readonly number[]): number | null =>
  xs.length === 0 ? null : percentileType7(xs, 0.5);
const band = (xs: readonly number[]): { p5: number; p95: number } | null =>
  xs.length === 0 ? null : { p5: percentileType7(xs, 0.05), p95: percentileType7(xs, 0.95) };

interface Arrival {
  cls: PieceClass;
  mass: number;
}

/** One model's reading of one draw. */
interface DrawReading {
  state: GroundState;
  arrivals: Arrival[];
  release: number | null;
  status: ReleaseStatus;
  largestPiece: number | null;
  /** The masses of the pieces at the ground (kg), for O3. */
  pieces: number[];
}

/** Rule 1126 (c): the baseline's arrival — its body whole, or its swarm. */
function readBaseline(input: ImpactScenarioInput): DrawReading {
  const r = simulateImpact(input);
  const e = r.entry;
  const v = e.endVelocity as number;
  const L0 = input.impactorDiameter as number;
  const rhoI = input.impactorDensity as number;
  const m0 = (Math.PI / 6) * rhoI * L0 ** 3;
  const terminal = Math.min(
    Math.sqrt((4 * rhoI * L0 * GRAVITY) / (3 * RHO_0 * DRAG_COEFFICIENT)),
    input.impactVelocity
  );
  const computed = r.crater.state === 'computed';
  const arrivals: Arrival[] =
    e.regime === 'COMPLETE_AIRBURST'
      ? []
      : [
          {
            cls: pieceClass(v, e.regime === 'INTACT' && v <= terminal * (1 + 1e-9), computed),
            mass: m0,
          },
        ];
  const state = drawState(arrivals.map((a) => a.cls));
  const release = e.regime === 'COMPLETE_AIRBURST' ? (e.burstAltitude as number) : null;
  return {
    state,
    arrivals,
    release,
    status: releaseStatus(state, release),
    largestPiece: e.regime === 'INTACT' ? m0 : null,
    pieces: e.regime === 'INTACT' ? [m0] : [],
  };
}

/** Rule 1126 (b), (c), (d): S as its study ran, its m2 its release. */
function readS(input: ImpactScenarioInput): DrawReading {
  const r: StudyResult = studyS(
    {
      diameter: input.impactorDiameter,
      velocity: input.impactVelocity,
      density: input.impactorDensity,
      sinTheta: Math.sin(input.impactAngle),
    },
    { f1: 0.5, firstStrength: FIRST_STAGE_STRENGTH, range: [900_000, 5_000_000] }
  );
  const arrivals: Arrival[] = [];
  if (r.core.mass > 0)
    arrivals.push({ cls: pieceClass(r.core.groundSpeed, r.core.floorActed), mass: r.core.mass });
  for (const s of r.shares)
    if (s.burstAltitude === null)
      arrivals.push({ cls: pieceClass(s.endSpeed, false), mass: s.mass });
  const bursts = r.shares.filter((s) => s.burstAltitude !== null);
  const burstMass = bursts.reduce((a, s) => a + s.mass, 0);
  const release =
    bursts.length > 0
      ? bursts.reduce((a, s) => a + (s.burstAltitude ?? 0) * s.mass, 0) / burstMass
      : null;
  const state = drawState(arrivals.map((a) => a.cls));
  return {
    state,
    arrivals,
    release,
    status: releaseStatus(state, release),
    largestPiece: r.largestPiece?.mass ?? null,
    pieces: r.core.mass > 0 ? [r.core.mass] : [],
  };
}

/** Rule 1126 (b), (g): F as a diagnostic. */
function readF(
  input: ImpactScenarioInput,
  u: () => number
): { reading: DrawReading | null; release: (number | null)[]; converges: boolean } {
  const priors = {
    cloudShare: F_PRIORS.cloudShare[0] + (F_PRIORS.cloudShare[1] - F_PRIORS.cloudShare[0]) * u(),
    largerSplit:
      F_PRIORS.largerSplit[0] + (F_PRIORS.largerSplit[1] - F_PRIORS.largerSplit[0]) * u(),
    strengthScaling:
      F_PRIORS.strengthScaling[0] +
      (F_PRIORS.strengthScaling[1] - F_PRIORS.strengthScaling[0]) * u(),
  };
  const strength =
    (mainStageStrength(
      input.strengthLaw ?? DEFAULT_STRENGTH_LAW,
      input.impactorStrength,
      input.impactorDensity
    ) as number | undefined) ?? collinsStrength(input.impactorDensity);
  const body = {
    diameter: input.impactorDiameter as number,
    velocity: input.impactVelocity as number,
    density: input.impactorDensity as number,
    sinTheta: Math.sin(input.impactAngle),
  };
  const [b50, , b200] = F_RELEASE_BINS_M;
  const f: StudyFResult = studyF(body, strength, priors);
  if (!f.completed) return { reading: null, release: [], converges: false };
  const fine = studyF(body, strength, priors, { binM: b50 });
  const coarse = studyF(body, strength, priors, { binM: b200 });
  const rel = (a: number | null, b: number | null): number =>
    b === null || b === 0
      ? a === null || a === 0
        ? 0
        : Infinity
      : Math.abs((a ?? 0) - b) / Math.abs(b);
  const converges =
    fine.completed &&
    coarse.completed &&
    rel(f.releaseAltitude, fine.releaseAltitude) < F_CONVERGENCE &&
    rel(coarse.releaseAltitude, f.releaseAltitude) < F_CONVERGENCE;
  const arrivals: Arrival[] = f.pieces.map((p) => ({
    cls: pieceClass(p.speed, p.floorActed),
    mass: p.mass,
  }));
  if (f.swarm.mass > 0)
    arrivals.push({
      cls: pieceClass(Math.sqrt((2 * f.swarm.energy) / f.swarm.mass), false),
      mass: f.swarm.mass,
    });
  const state = drawState(arrivals.map((a) => a.cls));
  return {
    reading: {
      state,
      arrivals,
      release: f.releaseAltitude,
      status: releaseStatus(state, f.releaseAltitude, converges),
      largestPiece: f.largestPiece?.mass ?? null,
      pieces: f.pieces.map((p) => p.mass),
    },
    release: [fine.releaseAltitude, f.releaseAltitude, coarse.releaseAltitude],
    converges,
  };
}

const statusCounts = (rs: readonly DrawReading[]): Record<ReleaseStatus, number> => ({
  produced: rs.filter((r) => r.status === 'produced').length,
  excludedBySelection: rs.filter((r) => r.status === 'excludedBySelection').length,
  notProduced: rs.filter((r) => r.status === 'notProduced').length,
  notConvergent: rs.filter((r) => r.status === 'notConvergent').length,
});

/** Rule 1126 (d): a model's O1 on one body. */
function o1Compatible(rs: readonly DrawReading[], body: ThirdSetBody) {
  const produced = rs.flatMap((r) =>
    r.status === 'produced' && r.release !== null ? [r.release] : []
  );
  const b = band(produced);
  const lo = body.o1.intervalKm[0] * 1_000 - THIRD_SET_O1_WIDENING_M;
  const hi = body.o1.intervalKm[1] * 1_000 + THIRD_SET_O1_WIDENING_M;
  return {
    produced: produced.length,
    band: b === null ? null : { p5: round(b.p5, 5), p95: round(b.p95, 5) },
    compatible: b !== null && b.p95 >= lo && b.p5 <= hi,
  };
}

/** Rule 1126 (g): O2, diagnostic. */
function o2(rs: readonly DrawReading[]) {
  const masses = rs.flatMap((r) => (r.largestPiece === null ? [] : [r.largestPiece]));
  const b = band(masses);
  return {
    shareWithPiece: round(masses.length / rs.length),
    medianKg: masses.length === 0 ? null : round(median(masses) ?? 0),
    bandKg: b === null ? null : { p5: round(b.p5), p95: round(b.p95) },
  };
}

const HAMBURG_QUARTILES_KG = [0.25, 0.5, 0.75].map(
  (q) => percentileType7(HAMBURG_TABLE4_MASSES_G, q) / 1_000
);
const o3 = (rs: readonly DrawReading[]): number[] =>
  HAMBURG_QUARTILES_KG.map((q) => median(rs.map((r) => r.pieces.filter((p) => p > q).length)) ?? 0);

const breakdown = (rs: readonly DrawReading[]) => {
  const b = arrivalBreakdown(rs.map((r) => r.arrivals));
  return Object.fromEntries(
    Object.entries(b).map(([k, v]) => [
      k,
      {
        drawsWith: round(v.drawsWith),
        meanMassShare: v.meanMassShare === null ? null : round(v.meanMassShare),
      },
    ])
  );
};

const groundOf = (r: GroundReading) => ({
  d1: round(r.q1),
  joint: round(r.joint),
  craters: r.craters,
  fast: r.fast,
  drawsInLawDomain: r.q2Draws,
  lawSpeedShareAll: round(r.lawSpeedShareAll),
  d3: r.q3 === null ? null : round(r.q3),
  d3Assessable: r.q3 !== null,
  betweenShare: r.betweenShare === null ? null : round(r.betweenShare),
});

const stressed = (input: ImpactScenarioInput, factor: number): ImpactScenarioInput => ({
  ...input,
  impactorDiameter: m((input.impactorDiameter as number) * Math.cbrt(factor)),
});

const bodies = THIRD_SET_BODIES.map((body) => {
  const event: LevelBEvent = { event: body.event, inputs: body.inputs, targets: [] };
  const inputs = drawnInputs(event, `${THIRD_SET_RUN_SEED}${body.event}`, THIRD_SET_RUN_DRAWS);
  const base = inputs.map(readBaseline);
  const s = inputs.map(readS);
  const u = stream(`${F_PRIOR_SEED}${body.event}`);
  const fAll = inputs.map((i) => readF(i, u));
  const f = fAll.flatMap((x) => (x.reading === null ? [] : [x.reading]));

  // Rule 1126 (d): comparability and the widths on the paired produced draws.
  const paired = base.flatMap((b, i) => {
    const sr = s[i];
    return b.status === 'produced' &&
      sr?.status === 'produced' &&
      b.release !== null &&
      sr.release !== null
      ? [{ b: b.release, s: sr.release }]
      : [];
  });
  const bw = band(paired.map((p) => p.b));
  const sw = band(paired.map((p) => p.s));
  const baseWidth = bw === null ? null : bw.p95 - bw.p5;
  const sWidth = sw === null ? null : sw.p95 - sw.p5;
  const voided = baseWidth !== null && sWidth !== null && sWidth > Math.max(1.5 * baseWidth, 500);

  const stress = Object.fromEntries(
    [THIRD_SET_STRESS_MASS_FACTOR, 1 / THIRD_SET_STRESS_MASS_FACTOR].map((factor) => {
      const bi = inputs.map((i) => readBaseline(stressed(i, factor)));
      const si = inputs.map((i) => readS(stressed(i, factor)));
      return [
        factor > 1 ? 'mass ×3' : 'mass ÷3',
        {
          baseline: {
            o1Compatible: o1Compatible(bi, body).compatible,
            d1: round(groundReading(bi.map((r) => r.state)).q1),
          },
          S: {
            o1Compatible: o1Compatible(si, body).compatible,
            d1: round(groundReading(si.map((r) => r.state)).q1),
          },
        },
      ];
    })
  );

  return {
    body,
    base,
    s,
    record: {
      event: body.event,
      reading: body.reading,
      draws: inputs.length,
      o1: {
        interval: body.o1.intervalKm,
        counts: { baseline: statusCounts(base), S: statusCounts(s), F: statusCounts(f) },
        baseline: o1Compatible(base, body),
        S: o1Compatible(s, body),
        pairedProduced: paired.length,
        comparable: paired.length >= THIRD_SET_O1_MIN_PAIRED,
        widthsOnPaired: {
          baseline: baseWidth === null ? null : round(baseWidth, 4),
          S: sWidth === null ? null : round(sWidth, 4),
          voidsGain: voided,
        },
      },
      ground: {
        baseline: groundOf(groundReading(base.map((r) => r.state))),
        S: groundOf(groundReading(s.map((r) => r.state))),
        F: groundOf(groundReading(f.map((r) => r.state))),
        classes: { baseline: breakdown(base), S: breakdown(s), F: breakdown(f) },
      },
      o2: {
        recovered: { kg: body.o2.largestKg, class: body.o2.class },
        baseline: o2(base),
        S: o2(s),
        F: o2(f),
      },
      o3:
        body.event === 'Hamburg'
          ? {
              quartilesKg: HAMBURG_QUARTILES_KG.map((q) => round(q)),
              medianPiecesAbove: { baseline: o3(base), S: o3(s), F: o3(f) },
            }
          : null,
      F: {
        started: fAll.length,
        completed: f.length,
        notCompleted: fAll.length - f.length,
        releaseNotConverging: fAll.filter((x) => x.reading !== null && !x.converges).length,
        releasePerDraw: fAll.map((x) =>
          x.reading === null
            ? null
            : [...x.release.map((z) => (z === null ? null : round(z, 5))), x.converges ? 1 : 0]
        ),
        note: 'a diagnostic (rules 1112, 1126): no aggregate of its release altitude is comparable (rule 1094); its masses carry no ablation (rule 1097)',
      },
      stress,
    },
  };
});

// Rule 1126 (d)–(f): the judge on the bodies in the priors' domain.
const counted = bodies.filter((b) => b.body.reading === 'counted');
const comparable = counted.filter((b) => b.record.o1.comparable);
const gains = comparable.filter(
  (b) =>
    b.record.o1.S.compatible &&
    !b.record.o1.baseline.compatible &&
    !b.record.o1.widthsOnPaired.voidsGain
);
const losses = comparable.filter(
  (b) => b.record.o1.baseline.compatible && !b.record.o1.S.compatible
);
const o1: DecisiveOutcome = {
  assessable: comparable.length >= 3,
  improves: gains.length >= 1 && losses.length === 0,
  worsens: losses.length >= 1,
};
const gv = groundVerdict(
  counted.map((b) => ({
    baseline: groundReading(b.base.map((r) => r.state)),
    model: groundReading(b.s.map((r) => r.state)),
    documented: {
      recovery: b.body.ground.recovery.eligible,
      noCrater: b.body.ground.noCrater.eligible,
      regime: b.body.ground.regime.eligible,
    },
  }))
);
const ground: DecisiveOutcome = {
  assessable: gv.d1.eligible >= 3 || gv.joint.eligible >= 3,
  improves: gv.improves,
  worsens: gv.worsens,
};
const v = verdictV2(o1, ground);
const VERDICT_IT: Record<string, string> = {
  'a decisive observable is not assessable': 'adozione non valutabile secondo la versione 2',
  'it worsens': 'non adottabile secondo la versione 2: peggiora un osservabile decisivo',
  'fewer than two decisive observables improve':
    'non adottabile secondo la versione 2: meno di due osservabili decisivi migliorano',
  'both decisive observables improve, neither worsens': 'adottabile secondo la versione 2',
};
const verdictWords = VERDICT_IT[v.reason] ?? v.reason;
const OUTCOME = thirdSetOutcome(verdictWords);

const record = {
  protocol:
    'rule 1126 (thirdSetRunRules.ts); the table of rules 1120–1125 (thirdSetSources.ts); the judge of rules 1100–1119 (independentTestCharterV2.ts)',
  engine: { node: process.version, platform },
  judge: {
    o1: {
      ...o1,
      comparableBodies: comparable.map((b) => b.body.event),
      gains: gains.map((b) => b.body.event),
      losses: losses.map((b) => b.body.event),
    },
    ground: {
      ...ground,
      d1: gv.d1,
      joint: gv.joint,
      worseningByArrivalsAtLawSpeeds: gv.craters,
    },
    verdict: v,
  },
  bodies: bodies.map((b) => b.record),
  outcome: OUTCOME,
};
writeFileSync(OUT_JSON, `${JSON.stringify(record, null, 2)}\n`);

const pct = (x: number | null | undefined): string =>
  x === null || x === undefined ? '—' : `${(x * 100).toFixed(1)} %`;
const km = (x: number | null | undefined): string =>
  x === null || x === undefined ? '—' : (x / 1_000).toFixed(2);
const yes = (b: boolean): string => (b ? 'yes' : 'no');
const lines: string[] = [
  '# The third set — the one paired run under version 2',
  '',
  `> ${OUTCOME}`,
  '',
  'Rule 1126 (`src/physics/validation/thirdSetRunRules.ts`), run once by `scripts/third-set-run.ts` on the',
  'table of rules 1120–1125, judged by rules 1100–1119. The baseline and S decide; F is a diagnostic only,',
  'and cannot be adopted in this round. Winchcombe is a control, counted in no decision. Nothing here',
  'adopts a model: the reviewer reads this account first. No class B can come from this set.',
  '',
  '> **F’s warning (rule 1097)** goes with its readings below: its masses carry no ablation and are not',
  '> comparable with a recovered mass; its release altitude is no comparable result (rule 1094).',
  '',
  // Rule 1127: added on closing the round.
  '> **Closed (rule 1127).** The reviewer confirmed the verdict; the audit re-derives it from this record',
  '> apart from the judge’s functions (`thirdSetAudit.ts`, tested on every commit).',
  '',
  '## The verdict (rules 1115, 1119)',
  '',
  `- **O1**: comparable on ${String(comparable.length)} bodies of the priors’ domain (${comparable.map((b) => b.body.event).join(', ') || 'none'}) — ${o1.assessable ? 'assessable' : '**not assessable**'}; S gains ${String(gains.length)} (${gains.map((b) => b.body.event).join(', ') || 'none'}) and loses ${String(losses.length)} (${losses.map((b) => b.body.event).join(', ') || 'none'}) — improves: ${yes(o1.improves)}, worsens: ${yes(o1.worsens)}.`,
  `- **The ground outcome**: D1 on ${String(gv.d1.eligible)} bodies, gain ${gv.d1.gain === null ? '—' : pct(gv.d1.gain)}; J admissible on ${String(gv.joint.eligible)}; worsening by arrivals at the law’s speeds: ${yes(gv.craters)} — improves: ${yes(ground.improves)}, worsens: ${yes(ground.worsens)}.`,
  `- **S**: ${verdictWords}.`,
  '',
  '## O1, body by body (rules 1104, 1111, 1125, 1126 (d))',
  '',
  '| Body | Interval (km) | Model | Produced · excluded · not produced · not convergent | 5–95 % band (km) | Compatible | Paired produced | Comparable | Width on the paired draws (km) |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
];
for (const b of bodies) {
  const r = b.record;
  for (const [k, label] of [
    ['baseline', 'baseline'],
    ['S', 'S'],
  ] as const) {
    const c = r.o1.counts[k];
    const o = r.o1[k];
    lines.push(
      `| ${k === 'baseline' ? `${r.event}${r.reading === 'counted' ? '' : ' (control)'}` : ''} | ${k === 'baseline' ? `${String(r.o1.interval[0])}–${String(r.o1.interval[1])}` : ''} | ${label} | ${String(c.produced)} · ${String(c.excludedBySelection)} · ${String(c.notProduced)} · ${String(c.notConvergent)} | ${o.band === null ? '—' : `${km(o.band.p5)}–${km(o.band.p95)}`} | ${yes(o.compatible)} | ${k === 'baseline' ? String(r.o1.pairedProduced) : ''} | ${k === 'baseline' ? yes(r.o1.comparable) : ''} | ${km(r.o1.widthsOnPaired[k])}${k === 'S' && r.o1.widthsOnPaired.voidsGain ? ' (voids the gain)' : ''} |`
    );
  }
}
lines.push(
  '',
  '## The ground, body by body (rules 1103, 1108–1110, 1116, 1117)',
  '',
  'D1 is the share of draws on which material arrives; J — not admissible here — is published beside; the',
  'last share is of draws with an arrival at the crater law’s speeds (a crater, or for S and F a fast',
  'arrival), not a share of craters; D3 describes, over the arriving draws, those in dark flight.',
  '',
  '| Body | Model | D1 | J (beside) | Arrivals at the law’s speeds | Computed craters · draws in the law’s domain | D3 (description) | Classes: draws with crater · fast · between · dark flight |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |'
);
for (const b of bodies) {
  const r = b.record;
  for (const k of ['baseline', 'S', 'F'] as const) {
    const g = r.ground[k];
    const cl = r.ground.classes[k] as Record<string, { drawsWith: number }>;
    lines.push(
      `| ${k === 'baseline' ? r.event : ''} | ${k === 'F' ? 'F (diagnostic)' : k} | ${pct(g.d1)} | ${pct(g.joint)} | ${pct(g.lawSpeedShareAll)} | ${String(g.craters)} · ${String(g.drawsInLawDomain)} | ${g.d3Assessable ? pct(g.d3) : 'not assessable'} | ${pct(cl.crater?.drawsWith)} · ${pct(cl.fast?.drawsWith)} · ${pct(cl.between?.drawsWith)} · ${pct(cl.darkFlight?.drawsWith)} |`
    );
  }
}
lines.push(
  '',
  '## Diagnostics (rule 1126 (g)) — deciding nothing',
  '',
  '### O2: the largest piece at the ground, beside the recovered mass (a lower bound everywhere)',
  '',
  '| Body | Recovered | Model | Draws with a piece | Median largest piece | 5–95 % |',
  '| --- | --- | --- | --- | --- | --- |'
);
for (const b of bodies) {
  const r = b.record;
  for (const k of ['baseline', 'S', 'F'] as const) {
    const o = r.o2[k];
    lines.push(
      `| ${k === 'baseline' ? r.event : ''} | ${k === 'baseline' ? `${String(round(r.o2.recovered.kg * 1000, 4))} g, lower bound` : ''} | ${k === 'F' ? 'F (diagnostic)' : k} | ${pct(o.shareWithPiece)} | ${o.medianKg === null ? '—' : `${String(o.medianKg)} kg`} | ${o.bandKg === null ? '—' : `${String(o.bandKg.p5)}–${String(o.bandKg.p95)} kg`} |`
    );
  }
}
const ham = bodies.find((b) => b.record.event === 'Hamburg')?.record.o3;
lines.push(
  '',
  // Rule 1127 (b): added on closing the round, as it reads in the account.
  '**Read with caution (rule 1127 (b)).** That S’s median largest piece is 17 to 250 times the recovered',
  'mass measures no overestimate of the mass that reached the ground: every recovered mass is a lower',
  'bound. It is a sign of the comparison’s limit and of the missing ablation, not a verdict of accuracy on',
  'O2.',
  '',
  '### O3 on Hamburg: the median number of pieces heavier than each quartile of Table 4’s 25 masses',
  '',
  ham === null || ham === undefined
    ? '—'
    : `Quartiles ${ham.quartilesKg.map((q) => `${String(round(q * 1000, 3))} g`).join(', ')}: baseline ${ham.medianPiecesAbove.baseline.join(' · ')}; S ${ham.medianPiecesAbove.S.join(' · ')}; F ${ham.medianPiecesAbove.F.join(' · ')}; recovered ${HAMBURG_QUARTILES_KG.map((q) => String(HAMBURG_TABLE4_MASSES_G.filter((g) => g / 1_000 > q).length)).join(' · ')} of 25.`,
  '',
  '### F’s account and release altitude (rules 1094, 1096 (b))',
  '',
  '| Body | Started | Completed | Not completed | Release altitudes not converging |',
  '| --- | --- | --- | --- | --- |',
  ...bodies.map(
    (b) =>
      `| ${b.record.event} | ${String(b.record.F.started)} | ${String(b.record.F.completed)} | ${String(b.record.F.notCompleted)} | ${String(b.record.F.releaseNotConverging)} |`
  ),
  '',
  'Every draw’s release altitude at 50, 100 and 200 m is in `thirdSetRun.json`; no aggregate of it is comparable.',
  '',
  '## The stress run (rule 934 (c)) — reported, never scored',
  '',
  '| Body | Mass | Baseline: O1 compatible · D1 | S: O1 compatible · D1 |',
  '| --- | --- | --- | --- |',
  ...bodies.flatMap((b) =>
    Object.entries(b.record.stress).map(
      ([k, x]) =>
        `| ${b.record.event} | ${k} | ${yes(x.baseline.o1Compatible)} · ${pct(x.baseline.d1)} | ${yes(x.S.o1Compatible)} · ${pct(x.S.d1)} |`
    )
  ),
  ''
);
writeFileSync(OUT_MD, lines.join('\n'));
console.log(JSON.stringify({ judge: record.judge, outcome: OUTCOME }, null, 1));
