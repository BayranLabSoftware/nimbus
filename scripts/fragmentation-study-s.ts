/**
 * The study of S, run once (rules 1009 to 1027,
 * src/physics/validation/fragmentationRoundRules.ts):
 *
 *   pnpm exec tsx scripts/fragmentation-study-s.ts
 *
 * Runs src/physics/effects/fragmentationStudyS.ts on the development cases'
 * draws of rule 978, at f1 = 0.25, 0.50 and 0.60 with the second phase on
 * 0.9–5 MPa, and at f1 = 0.50 with its upper edge at 10 MPa (rule 1023 (d)); the
 * baseline's row from today's product on the same draws. Writes
 * src/physics/validation/fragmentationStudyS.json and
 * docs/FRAGMENTATION_STUDY_S.md. Deterministic: no clock, no randomness but
 * the seeds'. A study of development: nothing it shows adopts S.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIRST_STAGE_STRENGTH } from '../src/physics/effects/atmosphericEntry.js';
import { DRAG_COEFFICIENT, GRAVITY, RHO_0 } from '../src/physics/effects/entryConstants.js';
import { studyS, type StudyResult } from '../src/physics/effects/fragmentationStudyS.js';
import { simulateImpact, type ImpactScenarioResult } from '../src/physics/simulate.js';
import { DEV_CASES, type DevCase } from '../src/physics/validation/fragmentationDevTable.js';
import { CRATER_DOMAIN_MIN_SPEED_MS } from '../src/physics/validation/craterDomainRules.js';
import { inputsOf, row } from './fragmentationRun.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = join(ROOT, 'src', 'physics', 'validation', 'fragmentationStudyS.json');
const OUT_MD = join(ROOT, 'docs', 'FRAGMENTATION_STUDY_S.md');

const platform = `${process.platform}-${process.arch}`;
if (process.version !== 'v22.20.0' || platform !== 'darwin-arm64') {
  console.error(`Refusing to run on ${process.version} ${platform}: v22.20.0 darwin-arm64.`);
  process.exit(2);
}

/** Rules 1013 and 1023 (a): what each case is to the priors. */
const DOMAIN: Record<DevCase, string> = {
  Chelyabinsk: 'ordinary chondrite (LL5): in the priors’ domain',
  '2023 CX1': 'ordinary chondrite (L): in the priors’ domain',
  Carancas: 'ordinary chondrite (H4–5): in the priors’ domain, diagnostic',
  '2022 EB5': 'type unknown: a sensitivity with the ordinary chondrites’ priors',
  '2022 WJ1': 'type unknown: a sensitivity with the ordinary chondrites’ priors',
  Tunguska: 'type unknown: a sensitivity with the ordinary chondrites’ priors',
  '2024 BX1': 'an aubrite: a control of robustness out of the priors’ domain',
  '2008 TC3': 'a ureilite: a control of robustness out of the priors’ domain',
  '2018 LA': 'a howardite: a control of robustness out of the priors’ domain',
};

/** Rule 1023 (e) and (d): the runs. */
const RUNS = [
  { key: 'f1 = 0.25', f1: 0.25, range: [900_000, 5_000_000] as const },
  { key: 'f1 = 0.50', f1: 0.5, range: [900_000, 5_000_000] as const },
  { key: 'f1 = 0.60', f1: 0.6, range: [900_000, 5_000_000] as const },
  { key: 'upper edge 10 MPa, f1 = 0.50', f1: 0.5, range: [900_000, 10_000_000] as const },
] as const;

type Arrival = 'hypervelocity' | 'darkFlight' | 'outOfDomain' | 'none';
type Crater = 'computed' | 'none' | 'outOfDomain';

/** Rule 1011: the three observables of one draw, and what else is read. */
interface DrawReading {
  arrives: boolean;
  largestFraction: number | null;
  largestSpeed: number | null;
  arrival: Arrival;
  crater: Crater;
  burst: boolean;
  burstAltitude: number | null;
  releaseAltitude: number | null;
  energyToGround: number;
  ends?: { burst: number; swarm: number; surviving: number; broken: number };
  firstPhase?: boolean;
  energyPerKm?: number[];
  residuals?: { energy: number; momentum: number; mass: number };
}

const arrivalOf = (speed: number, atTerminal: boolean): Arrival =>
  atTerminal ? 'darkFlight' : speed >= CRATER_DOMAIN_MIN_SPEED_MS ? 'hypervelocity' : 'outOfDomain';
const craterOf = (a: Arrival): Crater =>
  a === 'none' ? 'none' : a === 'hypervelocity' ? 'computed' : 'outOfDomain';

function readStudy(r: StudyResult): DrawReading {
  const E = r.budget.energyIn;
  const swarms = r.shares.filter((s) => s.burstAltitude === null);
  const bursts = r.shares.filter((s) => s.burstAltitude !== null);
  const swarmSpeed =
    swarms.length > 0 ? swarms.reduce((a, s) => a + s.endSpeed, 0) / swarms.length : 0;
  // The regime of what arrives: the core's where it survives, else the swarm's.
  const arrival: Arrival =
    r.core.mass > 0
      ? arrivalOf(r.core.groundSpeed, r.core.floorActed)
      : swarms.length > 0
        ? arrivalOf(swarmSpeed, false)
        : 'none';
  const air = r.energyPerKm.slice(0, 150);
  const airTotal = air.reduce((a, b) => a + b, 0);
  return {
    arrives: r.core.mass > 0 || swarms.length > 0,
    largestFraction: r.largestPiece === null ? null : r.largestPiece.mass / r.mass,
    largestSpeed: r.largestPiece?.speed ?? null,
    arrival,
    crater: craterOf(arrival),
    burst: bursts.length > 0,
    burstAltitude:
      bursts.length > 0
        ? bursts.reduce((a, s) => a + (s.burstAltitude ?? 0) * s.mass, 0) /
          bursts.reduce((a, s) => a + s.mass, 0)
        : null,
    releaseAltitude:
      airTotal > 0 ? (air.reduce((a, e, i) => a + e * (i + 0.5), 0) / airTotal) * 1_000 : null,
    energyToGround: r.budget.energyToGround / E,
    ends: {
      burst: r.ends.burst / r.mass,
      swarm: r.ends.swarm / r.mass,
      surviving: r.ends.surviving / r.mass,
      broken: r.shares.reduce((a, s) => a + s.mass, 0) / r.mass,
    },
    firstPhase: r.firstPhaseAltitude !== null,
    energyPerKm: r.energyPerKm.map((e) => e / E),
    residuals: {
      energy: r.budget.energyResidual,
      momentum: r.budget.momentumResidual,
      mass: r.budget.massResidual,
    },
  };
}

function readBaseline(r: ImpactScenarioResult): DrawReading {
  const e = r.entry;
  const v = e.endVelocity as number;
  const L0 = r.inputs.impactorDiameter as number;
  const rhoI = r.inputs.impactorDensity as number;
  const terminal = Math.min(
    Math.sqrt((4 * rhoI * L0 * GRAVITY) / (3 * RHO_0 * DRAG_COEFFICIENT)),
    r.inputs.impactVelocity
  );
  const arrives = e.regime !== 'COMPLETE_AIRBURST';
  const arrival: Arrival = !arrives
    ? 'none'
    : arrivalOf(v, e.regime === 'INTACT' && v <= terminal * (1 + 1e-9));
  return {
    arrives,
    largestFraction: e.regime === 'INTACT' ? 1 : null,
    largestSpeed: e.regime === 'INTACT' ? v : null,
    arrival,
    crater: r.crater.state,
    burst: e.regime === 'COMPLETE_AIRBURST',
    burstAltitude: e.regime === 'COMPLETE_AIRBURST' ? e.burstAltitude : null,
    releaseAltitude: e.regime === 'COMPLETE_AIRBURST' ? e.burstAltitude : null,
    energyToGround: e.energyFractionToGround,
  };
}

const median = (xs: readonly number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = (s.length - 1) / 2;
  return ((s[Math.floor(mid)] ?? 0) + (s[Math.ceil(mid)] ?? 0)) / 2;
};
const mean = (xs: readonly number[]): number | null =>
  xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;
const share = <T>(xs: readonly T[], f: (x: T) => boolean): number =>
  xs.filter(f).length / xs.length;

function summarise(c: DevCase, readings: DrawReading[]) {
  const observed = row(c, 'm2').observed;
  const burstAlt = median(
    readings.filter((r) => r.burstAltitude !== null).map((r) => r.burstAltitude ?? 0)
  );
  const withEnds = readings.filter((r) => r.ends !== undefined);
  const profile =
    readings[0]?.energyPerKm === undefined
      ? null
      : readings[0].energyPerKm.map((_, i) => mean(readings.map((r) => r.energyPerKm?.[i] ?? 0)));
  return {
    draws: readings.length,
    firstPhaseReached: withEnds.length > 0 ? share(withEnds, (r) => r.firstPhase === true) : null,
    ends:
      withEnds.length > 0
        ? {
            brokenBySecondPhase: mean(withEnds.map((r) => r.ends?.broken ?? 0)),
            burst: mean(withEnds.map((r) => r.ends?.burst ?? 0)),
            swarm: mean(withEnds.map((r) => r.ends?.swarm ?? 0)),
            surviving: mean(withEnds.map((r) => r.ends?.surviving ?? 0)),
          }
        : null,
    survival: share(readings, (r) => r.arrives),
    largestPiece: {
      share: share(readings, (r) => r.largestFraction !== null),
      medianFraction: median(
        readings.filter((r) => r.largestFraction !== null).map((r) => r.largestFraction ?? 0)
      ),
      medianSpeed: median(
        readings.filter((r) => r.largestSpeed !== null).map((r) => r.largestSpeed ?? 0)
      ),
    },
    arrival: {
      hypervelocity: share(readings, (r) => r.arrival === 'hypervelocity'),
      darkFlight: share(readings, (r) => r.arrival === 'darkFlight'),
      outOfDomain: share(readings, (r) => r.arrival === 'outOfDomain'),
      none: share(readings, (r) => r.arrival === 'none'),
    },
    crater: {
      computed: share(readings, (r) => r.crater === 'computed'),
      none: share(readings, (r) => r.crater === 'none'),
      outOfDomain: share(readings, (r) => r.crater === 'outOfDomain'),
    },
    energyToGround: mean(readings.map((r) => r.energyToGround)),
    releaseAltitude: median(
      readings.filter((r) => r.releaseAltitude !== null).map((r) => r.releaseAltitude ?? 0)
    ),
    m2: {
      pBurst: share(readings, (r) => r.burst),
      burstAltitude: burstAlt,
      missProxy:
        burstAlt === null || observed.kind !== 'altitude'
          ? null
          : Math.max(0, observed.lowM - burstAlt, burstAlt - observed.highM),
    },
    energyPerKm: profile,
    worstResiduals:
      withEnds.length > 0
        ? {
            energy: Math.max(...withEnds.map((r) => Math.abs(r.residuals?.energy ?? 0))),
            momentum: Math.max(...withEnds.map((r) => Math.abs(r.residuals?.momentum ?? 0))),
            mass: Math.max(...withEnds.map((r) => Math.abs(r.residuals?.mass ?? 0))),
          }
        : null,
  };
}

const cases = DEV_CASES.map(({ case: c, role }) => {
  const { inputs, drawn } = inputsOf(c);
  const baseline = summarise(
    c,
    inputs.map((i) => readBaseline(simulateImpact(i)))
  );
  const runs = Object.fromEntries(
    RUNS.map((run) => [
      run.key,
      summarise(
        c,
        inputs.map((i) =>
          readStudy(
            studyS(
              {
                diameter: i.impactorDiameter,
                velocity: i.impactVelocity,
                density: i.impactorDensity,
                sinTheta: Math.sin(i.impactAngle as number),
              },
              { f1: run.f1, firstStrength: FIRST_STAGE_STRENGTH, range: run.range }
            )
          )
        )
      ),
    ])
  );
  return { case: c, role, domain: DOMAIN[c], drawn, baseline, runs };
});

const OUTCOME =
  'Studio S: la variante mostra come una cascata di frammentazione a due fasi modifica quota, deposito di energia, sopravvivenza e regime d’arrivo nel dominio delle condriti ordinarie. Non viene adottata in questo round e non riceve una classe B; la decisione resta riservata a un test indipendente successivo.';

writeFileSync(
  OUT_JSON,
  `${JSON.stringify(
    {
      protocol: 'rules 1009 to 1027, src/physics/validation/fragmentationRoundRules.ts',
      status: 'a study of development (rule 1014): nothing here adopts S',
      assumptions: [
        'the ablated mass is none by the model’s assumption, not by a physical prediction (rule 1023 (b))',
        'the second phase’s F(q) is a hypothesis of Nimbus, not a result of Borovička et al. 2020 (rule 1016)',
        'the cascade closed share by share with Collins et al.’s pancake is an exploratory experiment (rule 1021)',
      ],
      engine: { node: process.version, platform },
      cases,
      outcome: OUTCOME,
    },
    null,
    2
  )}\n`
);

const pct = (x: number | null): string => (x === null ? '—' : `${(x * 100).toFixed(1)} %`);
const km = (x: number | null): string => (x === null ? '—' : (x / 1_000).toFixed(1));
const lines: string[] = [
  '# The study of S — a two-phase cascade of fragmentation',
  '',
  `> ${OUTCOME}`,
  '',
  'Rules 1009 to 1027 (`src/physics/validation/fragmentationRoundRules.ts`), run once by',
  '`scripts/fragmentation-study-s.ts` on the development cases’ draws of rule 978. A study of',
  'development: nothing here adopts S (rule 1014); the third set stays closed and chose nothing.',
  '',
  '- The ablated mass is none by the model’s assumption, not by a physical prediction (rule 1023 (b)).',
  '- F(q), the second phase’s share broken by a pressure q, log-uniform on 0.9–5 MPa, is a hypothesis of',
  '  Nimbus, not a result of Borovička et al. 2020 (rule 1016); the upper edge of 10 MPa is a diagnostic.',
  '- The cascade closed share by share with Collins et al.’s pancake is an exploratory experiment, not a',
  '  solution validated by observation (rule 1021). f1 is a sensitivity, never a property of the body.',
  '- m2 compares a burst altitude with the brightest flare: a proxy. m3 of version 2 decides nothing',
  '  (rule 1010); the three observables of rule 1011 are diagnostic.',
  '',
  '## Case by case',
  '',
  '| Case | What it is to the priors | Run | First phase reached | Broken in the second phase | Mass burst · swarm · surviving | Survival at the ground | Largest piece: share · mass · speed | Arrival: hyper · dark flight · out of domain · none | Crater: computed · none · no law | Energy to the ground | Release altitude (km) | p(burst) · burst altitude (km) · miss, proxy (km) | Worst budget residual |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
];
for (const c of cases) {
  const all = [['baseline', c.baseline] as const, ...Object.entries(c.runs)];
  for (const [i, [key, s]] of all.entries()) {
    lines.push(
      `| ${i === 0 ? c.case : ''} | ${i === 0 ? c.domain : ''} | ${key} | ${pct(s.firstPhaseReached)} | ${s.ends === null ? '—' : pct(s.ends.brokenBySecondPhase)} | ${s.ends === null ? '—' : `${pct(s.ends.burst)} · ${pct(s.ends.swarm)} · ${pct(s.ends.surviving)}`} | ${pct(s.survival)} | ${pct(s.largestPiece.share)} · ${pct(s.largestPiece.medianFraction)} · ${s.largestPiece.medianSpeed === null ? '—' : `${(s.largestPiece.medianSpeed / 1_000).toFixed(2)} km/s`} | ${pct(s.arrival.hypervelocity)} · ${pct(s.arrival.darkFlight)} · ${pct(s.arrival.outOfDomain)} · ${pct(s.arrival.none)} | ${pct(s.crater.computed)} · ${pct(s.crater.none)} · ${pct(s.crater.outOfDomain)} | ${pct(s.energyToGround)} | ${km(s.releaseAltitude)} | ${pct(s.m2.pBurst)} · ${km(s.m2.burstAltitude)} · ${km(s.m2.missProxy)} | ${s.worstResiduals === null ? '—' : s.worstResiduals.energy.toExponential(1)} |`
    );
  }
}
lines.push(
  '',
  '## The upper edge, 5 against 10 MPa (rule 1023 (d)), at f1 = 0.50',
  '',
  '| Case | Surviving mass at 5 MPa | at 10 MPa | Release altitude at 5 MPa (km) | at 10 MPa | Energy to the ground at 5 MPa | at 10 MPa |',
  '| --- | --- | --- | --- | --- | --- | --- |'
);
for (const c of cases) {
  const a = c.runs['f1 = 0.50'];
  const b = c.runs['upper edge 10 MPa, f1 = 0.50'];
  if (a === undefined || b === undefined) continue;
  lines.push(
    `| ${c.case} | ${a.ends === null ? '—' : pct(a.ends.surviving)} | ${b.ends === null ? '—' : pct(b.ends.surviving)} | ${km(a.releaseAltitude)} | ${km(b.releaseAltitude)} | ${pct(a.energyToGround)} | ${pct(b.energyToGround)} |`
  );
}
lines.push('');
writeFileSync(OUT_MD, lines.join('\n'));
console.log(`Wrote ${OUT_JSON}`);
console.log(`Wrote ${OUT_MD}`);
