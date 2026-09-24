/**
 * The study of F, run once on the development cases (rules 1063 to 1096,
 * src/physics/validation/fragmentationStudyFRules.ts):
 *
 *   pnpm exec tsx scripts/fragmentation-study-f.ts
 *
 * Runs src/physics/effects/fragmentationStudyF.ts on the development cases'
 * draws of rule 978, F's priors drawn once per draw on their own stream (rule
 * 1096 (a)); beside it the baseline recomputed on the same draws and S's row
 * at f1 = 0.50 read from its record (rule 1096 (e)). Writes
 * src/physics/validation/fragmentationStudyF.json and
 * docs/FRAGMENTATION_STUDY_F.md. Deterministic: no clock, no randomness but
 * the seeds'. A study of development: nothing it shows adopts F.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collinsStrength,
  DEFAULT_STRENGTH_LAW,
  mainStageStrength,
} from '../src/physics/effects/atmosphericEntry.js';
import { DRAG_COEFFICIENT, GRAVITY, RHO_0 } from '../src/physics/effects/entryConstants.js';
import {
  studyF,
  type StudyFPriors,
  type StudyFResult,
} from '../src/physics/effects/fragmentationStudyF.js';
import { simulateImpact, type ImpactScenarioResult } from '../src/physics/simulate.js';
import { CRATER_DOMAIN_MIN_SPEED_MS } from '../src/physics/validation/craterDomainRules.js';
import { DEV_CASES, type DevCase } from '../src/physics/validation/fragmentationDevTable.js';
import {
  F_BASELINE_LIMIT_TOLERANCE,
  F_BUDGET_TOLERANCE,
  F_CONVERGENCE,
  F_MASS_FLOOR_KG,
  F_MASS_FLOOR_SENSITIVITY_KG,
  F_PRIOR_SEED,
  F_PRIORS,
  F_PROFILE_BIN_M,
  F_RELEASE_BINS_M,
} from '../src/physics/validation/fragmentationStudyFRules.js';
import { inputsOf, row, stream } from './fragmentationRun.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = join(ROOT, 'src', 'physics', 'validation', 'fragmentationStudyF.json');
const OUT_MD = join(ROOT, 'docs', 'FRAGMENTATION_STUDY_F.md');
const S_JSON = join(ROOT, 'src', 'physics', 'validation', 'fragmentationStudyS.json');

const platform = `${process.platform}-${process.arch}`;
if (process.version !== 'v22.20.0' || platform !== 'darwin-arm64') {
  console.error(`Refusing to run on ${process.version} ${platform}: v22.20.0 darwin-arm64.`);
  process.exit(2);
}

/** Rules 1023 (a) and 1071: what each case is to the priors. */
const DOMAIN: Record<DevCase, string> = {
  Chelyabinsk:
    'ordinary chondrite (LL5): in the priors’ domain — and a source of F’s priors, so F’s result on it is not independent of them',
  '2023 CX1': 'ordinary chondrite (L): in the priors’ domain',
  Carancas: 'ordinary chondrite (H4–5): in the priors’ domain, diagnostic',
  '2022 EB5': 'type unknown: a sensitivity with the ordinary chondrites’ priors',
  '2022 WJ1': 'type unknown: a sensitivity with the ordinary chondrites’ priors',
  Tunguska: 'type unknown: a sensitivity with the ordinary chondrites’ priors',
  '2024 BX1': 'an aubrite: a control of robustness out of the priors’ domain',
  '2008 TC3': 'a ureilite: a control of robustness out of the priors’ domain',
  '2018 LA': 'a howardite: a control of robustness out of the priors’ domain',
};

type Arrival = 'hypervelocity' | 'darkFlight' | 'outOfDomain' | 'none';
type Crater = 'computed' | 'none' | 'outOfDomain';

const arrivalOf = (speed: number, atTerminal: boolean): Arrival =>
  atTerminal ? 'darkFlight' : speed >= CRATER_DOMAIN_MIN_SPEED_MS ? 'hypervelocity' : 'outOfDomain';
const craterOf = (a: Arrival): Crater =>
  a === 'none' ? 'none' : a === 'hypervelocity' ? 'computed' : 'outOfDomain';

const median = (xs: readonly number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = (s.length - 1) / 2;
  return ((s[Math.floor(mid)] ?? 0) + (s[Math.ceil(mid)] ?? 0)) / 2;
};
const mean = (xs: readonly number[]): number | null =>
  xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;
const share = <T>(xs: readonly T[], f: (x: T) => boolean): number =>
  xs.length === 0 ? 0 : xs.filter(f).length / xs.length;
const round = (x: number, d = 4): number => Number(x.toPrecision(d));
/** Rule 1087 (c): |a − b| / |b|, b the finer run's; where b is zero or absent
 *  the two converge only if a is too. */
const relChange = (a: number | null, b: number | null): number =>
  b === null || b === 0
    ? a === null || a === 0
      ? 0
      : Number.POSITIVE_INFINITY
    : Math.abs((a ?? 0) - b) / Math.abs(b);

/** The baseline's reading of one draw, as S's run read it (rule 1011). */
interface BaseReading {
  arrives: boolean;
  largestFraction: number | null;
  largestSpeed: number | null;
  arrival: Arrival;
  crater: Crater;
  burst: boolean;
  burstAltitude: number | null;
  energyToGround: number;
}

function readBaseline(r: ImpactScenarioResult): BaseReading {
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
    energyToGround: e.energyFractionToGround,
  };
}

/** F's reading of one completed draw (rules 1071 and 1096 (d)). */
interface FReading {
  arrives: boolean;
  largestFraction: number | null;
  largestSpeed: number | null;
  survivingFraction: number;
  piecesAbove1g: number;
  swarmFraction: number;
  arrival: Arrival;
  crater: Crater;
  regime: StudyFResult['regime'];
  energyToGround: number;
}

function readF(f: StudyFResult): FReading {
  const largest = f.largestPiece;
  const swarmSpeed = f.swarm.mass > 0 ? Math.sqrt((2 * f.swarm.energy) / f.swarm.mass) : 0;
  const arrival: Arrival =
    largest !== null
      ? arrivalOf(largest.speed, largest.floorActed)
      : f.swarm.mass > 0
        ? arrivalOf(swarmSpeed, false)
        : 'none';
  return {
    arrives: largest !== null || f.swarm.mass > 0,
    largestFraction: largest === null ? null : largest.mass / f.mass,
    largestSpeed: largest?.speed ?? null,
    survivingFraction: f.survivingMass / f.mass,
    piecesAbove1g: f.pieces.filter((p) => p.mass >= 1e-3).length,
    swarmFraction: f.swarm.mass / f.mass,
    arrival,
    crater: craterOf(arrival),
    regime: f.regime,
    energyToGround: f.energyFractionToGround,
  };
}

const budgetOk = (f: StudyFResult): boolean =>
  Math.abs(f.budget.massResidual) <= F_BUDGET_TOLERANCE &&
  Math.abs(f.budget.energyResidual) <= F_BUDGET_TOLERANCE &&
  f.budget.momentumResidual <= F_BUDGET_TOLERANCE;

/** The profile's two largest maxima at least 1 km apart: altitude and share. */
function maxima(f: StudyFResult): [number, number, number | null, number | null] {
  const E0 = f.budget.energyIn;
  const bins = f.energyPerBin
    .slice(0, -1)
    .map((e, i) => ({ z: (i + 0.5) * F_PROFILE_BIN_M, s: e / E0 }))
    .sort((a, b) => b.s - a.s);
  const first = bins[0] ?? { z: 0, s: 0 };
  const second = bins.find((b) => Math.abs(b.z - first.z) > 1_000);
  return [first.z, round(first.s, 3), second?.z ?? null, second ? round(second.s, 3) : null];
}

/** The quantities of rule 1071 the floor may move, on one paired draw. */
function floorDifference(a: FReading, b: FReading, ra: number | null, rb: number | null) {
  return {
    discrete:
      a.regime !== b.regime ||
      a.arrival !== b.arrival ||
      a.crater !== b.crater ||
      a.piecesAbove1g !== b.piecesAbove1g ||
      a.arrives !== b.arrives,
    largestFraction: Math.abs((a.largestFraction ?? 0) - (b.largestFraction ?? 0)),
    largestSpeed: Math.abs((a.largestSpeed ?? 0) - (b.largestSpeed ?? 0)),
    surviving: Math.abs(a.survivingFraction - b.survivingFraction),
    energyToGround: Math.abs(a.energyToGround - b.energyToGround),
    release: relChange(ra, rb),
  };
}

interface SRecord {
  cases: {
    case: string;
    baseline: Record<string, unknown>;
    runs: Record<string, Record<string, unknown>>;
  }[];
}
const sRecord = JSON.parse(readFileSync(S_JSON, 'utf8')) as SRecord;

let limitFailures = 0;
let limitWorst = 0;

const cases = DEV_CASES.map(({ case: c, role }) => {
  const { inputs, drawn } = inputsOf(c);
  const u = stream(`${F_PRIOR_SEED}${c}`);
  const baseReadings: BaseReading[] = [];
  const fReadings: FReading[] = [];
  const account = {
    started: 0,
    completed: 0,
    notCompleted: 0,
    void: 0,
    notCompletedDraws: [] as { draw: number; priors: StudyFPriors; components: number }[],
    voidDraws: [] as { draw: number; priors: StudyFPriors }[],
  };
  const components: number[] = [];
  const perDraw: (number | null)[][] = [];
  let nonConverging = 0;
  const profileSum = new Array<number>(0);
  const floor = {
    g1: { acting: 0, mass: [] as number[], energy: [] as number[] },
    g01: { acting: 0, mass: [] as number[], energy: [] as number[] },
  };
  const paired = {
    draws: 0,
    discreteChanges: 0,
    largestFraction: 0,
    largestSpeed: 0,
    surviving: 0,
    energyToGround: 0,
    release: 0,
  };
  const worst = { mass: 0, energy: 0, momentum: 0 };

  inputs.forEach((input, i) => {
    const priors: StudyFPriors = {
      cloudShare: F_PRIORS.cloudShare[0] + (F_PRIORS.cloudShare[1] - F_PRIORS.cloudShare[0]) * u(),
      largerSplit:
        F_PRIORS.largerSplit[0] + (F_PRIORS.largerSplit[1] - F_PRIORS.largerSplit[0]) * u(),
      strengthScaling:
        F_PRIORS.strengthScaling[0] +
        (F_PRIORS.strengthScaling[1] - F_PRIORS.strengthScaling[0]) * u(),
    };
    const base = simulateImpact(input);
    baseReadings.push(readBaseline(base));
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

    // Rule 1096 (c): the baseline's limit on this very draw.
    const limit = studyF(body, strength, { ...priors, cloudShare: 1 });
    const e = base.entry;
    // Rule 1088: relative within 10⁻⁹; where the baseline's value is zero,
    // absolute within its own tolerance. A score of 1 is the tolerance.
    const within = (a: number | null | undefined, b: number, zero: number): number => {
      const x = a ?? Number.NaN;
      return b === 0
        ? Math.abs(x) / zero
        : Math.abs(x - b) / Math.abs(b) / F_BASELINE_LIMIT_TOLERANCE;
    };
    const scores: number[] = [within(limit.energyFractionToGround, e.energyFractionToGround, 1e-9)];
    if (e.regime !== 'INTACT') {
      scores.push(
        within(limit.breakupAltitude, e.breakupAltitude, 1e-6),
        within(limit.primaryCloud?.endSpeed, e.endVelocity, 1e-6)
      );
      if (e.regime === 'COMPLETE_AIRBURST')
        scores.push(within(limit.primaryCloud?.burstAltitude, e.burstAltitude, 1e-6));
    }
    const score = Math.max(...scores.map((x) => (Number.isNaN(x) ? Infinity : x)));
    limitWorst = Math.max(limitWorst, score);
    if (limit.regime !== e.regime || !(score <= 1)) limitFailures += 1;

    // The run itself, and its bins and floor (rules 1094 and 1095).
    account.started += 1;
    const main = studyF(body, strength, priors);
    if (!main.completed) {
      account.notCompleted += 1;
      account.notCompletedDraws.push({ draw: i, priors, components: main.components });
      return;
    }
    if (!budgetOk(main)) {
      account.void += 1;
      account.voidDraws.push({ draw: i, priors });
      return;
    }
    account.completed += 1;
    components.push(main.components);
    worst.mass = Math.max(worst.mass, Math.abs(main.budget.massResidual));
    worst.energy = Math.max(worst.energy, Math.abs(main.budget.energyResidual));
    worst.momentum = Math.max(worst.momentum, main.budget.momentumResidual);
    const reading = readF(main);
    fReadings.push(reading);

    const [b50, , b200] = F_RELEASE_BINS_M;
    const fine = studyF(body, strength, priors, { binM: b50 });
    const coarse = studyF(body, strength, priors, { binM: b200 });
    const r50 = fine.completed ? fine.releaseAltitude : null;
    const r100 = main.releaseAltitude;
    const r200 = coarse.completed ? coarse.releaseAltitude : null;
    const converges =
      fine.completed &&
      coarse.completed &&
      relChange(r100, r50) < F_CONVERGENCE &&
      relChange(r200, r100) < F_CONVERGENCE;
    if (!converges) nonConverging += 1;
    perDraw.push([i, r50, r100, r200, converges ? 1 : 0, ...maxima(main)]);
    main.energyPerBin.slice(0, -1).forEach((x, k) => {
      profileSum[k] = (profileSum[k] ?? 0) + x / main.budget.energyIn;
    });

    // Rule 1095: the floor at 1 g and at 0.1 g on this draw.
    const tenth = studyF(body, strength, priors, { floorKg: F_MASS_FLOOR_SENSITIVITY_KG });
    const acts1 = main.dust.mass > 0;
    const acts01 = tenth.completed && tenth.dust.mass > 0;
    if (acts1) {
      floor.g1.acting += 1;
      floor.g1.mass.push(main.dust.mass / main.mass);
      floor.g1.energy.push(main.budget.energyDust / main.budget.energyIn);
    }
    if (acts01) {
      floor.g01.acting += 1;
      floor.g01.mass.push(tenth.dust.mass / tenth.mass);
      floor.g01.energy.push(tenth.budget.energyDust / tenth.budget.energyIn);
    }
    if ((acts1 || acts01) && tenth.completed && budgetOk(tenth)) {
      const d = floorDifference(reading, readF(tenth), main.releaseAltitude, tenth.releaseAltitude);
      paired.draws += 1;
      if (d.discrete) paired.discreteChanges += 1;
      paired.largestFraction = Math.max(paired.largestFraction, d.largestFraction);
      paired.largestSpeed = Math.max(paired.largestSpeed, d.largestSpeed);
      paired.surviving = Math.max(paired.surviving, d.surviving);
      paired.energyToGround = Math.max(paired.energyToGround, d.energyToGround);
      paired.release = Math.max(paired.release, d.release);
    }
  });

  const floorOf = (x: { acting: number; mass: number[]; energy: number[] }) => ({
    acting: x.acting,
    massShareMean: mean(x.mass),
    massShareMax: x.mass.length > 0 ? Math.max(...x.mass) : null,
    energyShareMean: mean(x.energy),
    energyShareMax: x.energy.length > 0 ? Math.max(...x.energy) : null,
  });
  const exercised = floor.g1.acting + floor.g01.acting > 0;
  const n = fReadings.length;
  let profile = profileSum.map((x) => round(x / Math.max(n, 1), 4));
  while (profile.length > 0 && profile[profile.length - 1] === 0) profile = profile.slice(0, -1);

  const observed = row(c, 'm2').observed;
  const burstAlt = median(
    baseReadings.filter((r) => r.burstAltitude !== null).map((r) => r.burstAltitude ?? 0)
  );
  const baseline = {
    draws: baseReadings.length,
    survival: share(baseReadings, (r) => r.arrives),
    largestPiece: {
      share: share(baseReadings, (r) => r.largestFraction !== null),
      medianFraction: median(
        baseReadings.filter((r) => r.largestFraction !== null).map((r) => r.largestFraction ?? 0)
      ),
      medianSpeed: median(
        baseReadings.filter((r) => r.largestSpeed !== null).map((r) => r.largestSpeed ?? 0)
      ),
    },
    arrival: {
      hypervelocity: share(baseReadings, (r) => r.arrival === 'hypervelocity'),
      darkFlight: share(baseReadings, (r) => r.arrival === 'darkFlight'),
      outOfDomain: share(baseReadings, (r) => r.arrival === 'outOfDomain'),
      none: share(baseReadings, (r) => r.arrival === 'none'),
    },
    crater: {
      computed: share(baseReadings, (r) => r.crater === 'computed'),
      none: share(baseReadings, (r) => r.crater === 'none'),
      outOfDomain: share(baseReadings, (r) => r.crater === 'outOfDomain'),
    },
    energyToGround: mean(baseReadings.map((r) => r.energyToGround)),
    m2: {
      pBurst: share(baseReadings, (r) => r.burst),
      burstAltitude: burstAlt,
      missProxy:
        burstAlt === null || observed.kind !== 'altitude'
          ? null
          : Math.max(0, observed.lowM - burstAlt, burstAlt - observed.highM),
    },
  };
  const sCase = sRecord.cases.find((x) => x.case === c);
  const sBaseline = sCase?.baseline;
  const baselineAsS =
    sBaseline !== undefined &&
    ['survival', 'largestPiece', 'arrival', 'crater', 'energyToGround', 'm2'].every(
      (k) => JSON.stringify(sBaseline[k]) === JSON.stringify(baseline[k as keyof typeof baseline])
    );
  const s = sCase?.runs['f1 = 0.50'];

  const f = {
    draws: n,
    components: { median: median(components), max: Math.max(0, ...components) },
    survival: share(fReadings, (r) => r.arrives),
    largestPiece: {
      share: share(fReadings, (r) => r.largestFraction !== null),
      medianFraction: median(
        fReadings.filter((r) => r.largestFraction !== null).map((r) => r.largestFraction ?? 0)
      ),
      medianSpeed: median(
        fReadings.filter((r) => r.largestSpeed !== null).map((r) => r.largestSpeed ?? 0)
      ),
    },
    survivingMassMedian: median(fReadings.map((r) => r.survivingFraction)),
    piecesAbove1gMedian: median(fReadings.map((r) => r.piecesAbove1g)),
    swarm: {
      share: share(fReadings, (r) => r.swarmFraction > 0),
      meanFraction: mean(fReadings.map((r) => r.swarmFraction)),
    },
    regime: {
      intact: share(fReadings, (r) => r.regime === 'INTACT'),
      complete: share(fReadings, (r) => r.regime === 'COMPLETE_AIRBURST'),
      partial: share(fReadings, (r) => r.regime === 'PARTIAL_AIRBURST'),
    },
    arrival: {
      hypervelocity: share(fReadings, (r) => r.arrival === 'hypervelocity'),
      darkFlight: share(fReadings, (r) => r.arrival === 'darkFlight'),
      outOfDomain: share(fReadings, (r) => r.arrival === 'outOfDomain'),
      none: share(fReadings, (r) => r.arrival === 'none'),
    },
    crater: {
      computed: share(fReadings, (r) => r.crater === 'computed'),
      none: share(fReadings, (r) => r.crater === 'none'),
      outOfDomain: share(fReadings, (r) => r.crater === 'outOfDomain'),
    },
    energyToGround: mean(fReadings.map((r) => r.energyToGround)),
    worstResiduals: worst,
    release: {
      note: 'rule 1094: not a result — no aggregate is comparable, none earns credit',
      nonConverging,
      columns: [
        'draw',
        'release at 50 m bins (m)',
        'at 100 m',
        'at 200 m',
        'converges (1) or not (0)',
        'first maximum (m)',
        'its share of E0',
        'second maximum, 1 km apart or more (m)',
        'its share of E0',
      ],
      perDraw,
      meanProfileShareOfE0Per100m: profile,
    },
    floor: {
      status: exercised ? 'exercised' : 'the floor’s sensitivity not exercised',
      at1g: floorOf(floor.g1),
      at01g: floorOf(floor.g01),
      pairedWhereItActs: paired,
    },
  };

  return {
    case: c,
    role,
    domain: DOMAIN[c],
    drawn,
    account,
    baseline,
    baselineAsSRecorded: baselineAsS,
    s: s ?? null,
    f,
  };
});

const OUTCOME =
  'Studio F: la variante mostra come una frammentazione progressiva in frammenti che rallentano e si rompono secondo la propria taglia, con nubi di detriti, modifica quota di rilascio, deposito di energia, sopravvivenza, massa dei pezzi al suolo e regime d’arrivo nel dominio delle condriti ordinarie. Non viene adottata in questo round e non riceve una classe B; la decisione resta riservata al test indipendente della carta (regole 1038–1062).';

const record = {
  protocol: 'rules 1063 to 1096, src/physics/validation/fragmentationStudyFRules.ts',
  status:
    'a study of development (rule 1090): nothing here adopts F, gives a class B or concludes on compatibility with observations',
  assumptions: [
    'no ablation: the surviving masses carry no ablation’s loss (rule 1083)',
    'no lateral speed: F predicts no strewn field and no place of recovery (rules 1065 (c), 1083)',
    'the clouds are closed by Collins et al.’s pancake, not by the FCM’s dispersion (rule 1067)',
    'the priors are uniform on intervals Nimbus chose; they come partly from fits of Chelyabinsk (rules 1068, 1082)',
    'the release altitude is the peak of the energy given to the air, not the peak of observed brightness; m2 is a proxy, and F’s release altitude is no comparable result in this run (rule 1094)',
  ],
  engine: { node: process.version, platform },
  floorKg: F_MASS_FLOOR_KG,
  baselineLimit: {
    rule: '1096 (c)',
    draws: cases.reduce((a, x) => a + x.account.started, 0),
    failures: limitFailures,
    worstOverTolerance: limitWorst,
    void: limitFailures > 0,
  },
  cases,
  outcome: OUTCOME,
};
writeFileSync(OUT_JSON, `${JSON.stringify(record, null, 2)}\n`);

const pct = (x: number | null | undefined): string =>
  x === null || x === undefined ? '—' : `${(x * 100).toFixed(1)} %`;
const km = (x: number | null | undefined): string =>
  x === null || x === undefined ? '—' : (x / 1_000).toFixed(2);
const sci = (x: number): string => x.toExponential(1);
interface Shares {
  hypervelocity?: number;
  darkFlight?: number;
  outOfDomain?: number;
  none?: number;
  computed?: number;
}
const sOf = (x: Record<string, unknown> | null, k: string): unknown =>
  x === null ? undefined : x[k];

const lines: string[] = [
  '# The study of F — fragments and debris clouds, on the development cases',
  '',
  `> ${OUTCOME}`,
  '',
  'Rules 1063 to 1096 (`src/physics/validation/fragmentationStudyFRules.ts`), run once by',
  '`scripts/fragmentation-study-f.ts` on the development cases’ draws of rule 978, authorized by the',
  'reviewer on 24 September 2026 as a study of development only. Nothing here adopts F, gives a class B',
  'or concludes on compatibility with observations; the third set stays closed and chose nothing; the',
  'charter is frozen and not run (rule 1093).',
  '',
  ...record.assumptions.map((a) => `- ${a[0]?.toUpperCase() ?? ''}${a.slice(1)}.`),
  '',
  `The baseline’s limit (rule 1096 (c)): with f_c = 1, on all ${String(record.baselineLimit.draws)} draws, F is the product’s entry — ${limitFailures === 0 ? `every draw within rule 1088’s tolerances (worst ${sci(limitWorst)} of the tolerance)` : `**${String(limitFailures)} draws are not: the run is void**`}.`,
  '',
  '## The account of the draws (rule 1096 (b))',
  '',
  '| Case | Draws | Started | Completed | Not completed (past 10⁵) | Void (budget) | Components, median · largest | Worst residual: mass · energy · momentum |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...cases.map(
    (x) =>
      `| ${x.case} | ${x.drawn} | ${String(x.account.started)} | ${String(x.account.completed)} | ${String(x.account.notCompleted)} | ${String(x.account.void)} | ${String(x.f.components.median)} · ${String(x.f.components.max)} | ${sci(x.f.worstResiduals.mass)} · ${sci(x.f.worstResiduals.energy)} · ${sci(x.f.worstResiduals.momentum)} |`
  ),
  '',
  '## Case by case (rules 1071 and 1011; diagnostic)',
  '',
  'S is read from its own record at f1 = 0.50, the charter’s f1 (rule 1039). Shares are over completed',
  'draws. m2 compares a burst altitude with the brightest flare: a proxy; F’s release altitude is not',
  'shown here (rule 1094).',
  '',
  '| Case | What it is to the priors | Model | Survival at the ground | Largest piece: share · mass · speed | Arrival: hyper · dark flight · out of domain · none | Crater: computed · none · no law | Energy to the ground | Baseline’s p(burst) · burst altitude (km) · miss, proxy (km) |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
];
for (const x of cases) {
  const b = x.baseline;
  const sRow = x.s;
  const sLp = sOf(sRow, 'largestPiece') as
    | { share: number; medianFraction: number | null; medianSpeed: number | null }
    | undefined;
  const sAr = (sOf(sRow, 'arrival') ?? {}) as Shares;
  const sCr = (sOf(sRow, 'crater') ?? {}) as Shares;
  const speed = (v: number | null | undefined): string =>
    v === null || v === undefined ? '—' : `${(v / 1_000).toFixed(2)} km/s`;
  lines.push(
    `| ${x.case} | ${x.domain} | baseline${x.baselineAsSRecorded ? '' : ' (differs from S’s record)'} | ${pct(b.survival)} | ${pct(b.largestPiece.share)} · ${pct(b.largestPiece.medianFraction)} · ${speed(b.largestPiece.medianSpeed)} | ${pct(b.arrival.hypervelocity)} · ${pct(b.arrival.darkFlight)} · ${pct(b.arrival.outOfDomain)} · ${pct(b.arrival.none)} | ${pct(b.crater.computed)} · ${pct(b.crater.none)} · ${pct(b.crater.outOfDomain)} | ${pct(b.energyToGround)} | ${pct(b.m2.pBurst)} · ${km(b.m2.burstAltitude)} · ${km(b.m2.missProxy)} |`,
    `| | | S, f1 = 0.50 | ${pct(sOf(sRow, 'survival') as number | undefined)} | ${sLp === undefined ? '—' : `${pct(sLp.share)} · ${pct(sLp.medianFraction)} · ${speed(sLp.medianSpeed)}`} | ${pct(sAr.hypervelocity)} · ${pct(sAr.darkFlight)} · ${pct(sAr.outOfDomain)} · ${pct(sAr.none)} | ${pct(sCr.computed)} · ${pct(sCr.none)} · ${pct(sCr.outOfDomain)} | ${pct(sOf(sRow, 'energyToGround') as number | undefined)} | |`,
    `| | | F | ${pct(x.f.survival)} | ${pct(x.f.largestPiece.share)} · ${pct(x.f.largestPiece.medianFraction)} · ${speed(x.f.largestPiece.medianSpeed)} | ${pct(x.f.arrival.hypervelocity)} · ${pct(x.f.arrival.darkFlight)} · ${pct(x.f.arrival.outOfDomain)} · ${pct(x.f.arrival.none)} | ${pct(x.f.crater.computed)} · ${pct(x.f.crater.none)} · ${pct(x.f.crater.outOfDomain)} | ${pct(x.f.energyToGround)} | |`
  );
}
lines.push(
  '',
  '## F: what reaches the ground, and how the entry ends',
  '',
  '| Case | Regime: intact · complete airburst · partial | Surviving mass, median | Pieces above 1 g, median | Draws with a swarm on the ground · its mean share of the mass |',
  '| --- | --- | --- | --- | --- |',
  ...cases.map(
    (x) =>
      `| ${x.case} | ${pct(x.f.regime.intact)} · ${pct(x.f.regime.complete)} · ${pct(x.f.regime.partial)} | ${pct(x.f.survivingMassMedian)} | ${String(x.f.piecesAbove1gMedian ?? '—')} | ${pct(x.f.swarm.share)} · ${pct(x.f.swarm.meanFraction)} |`
  ),
  '',
  '## F’s release altitude, draw by draw (rule 1094)',
  '',
  'Not a result: no aggregate of it is comparable with the observation or the baseline, and none earns',
  'credit. The peak of the energy given to the air is not the peak of observed brightness. Every draw’s',
  'altitude at the three bins, its convergence and its two maxima are in `fragmentationStudyF.json`,',
  'with each case’s mean profile.',
  '',
  '| Case | Completed draws | Draws whose release altitude does not converge | Single run: at 50 · 100 · 200 m (km) | Single run: the two maxima (km, share of E0) |',
  '| --- | --- | --- | --- | --- |',
  ...cases.map((x) => {
    const one = x.f.release.perDraw.length === 1 ? x.f.release.perDraw[0] : undefined;
    return `| ${x.case} | ${String(x.f.draws)} | ${String(x.f.release.nonConverging)} | ${one === undefined ? '—' : `${km(one[1])} · ${km(one[2])} · ${km(one[3])}`} | ${one === undefined ? '—' : `${km(one[5])} (${pct(one[6])}) · ${km(one[7])} (${pct(one[8])})`} |`;
  }),
  '',
  '## The floor (rule 1095)',
  '',
  '| Case | Status | Acts at 1 g: draws · mass · energy (mean, largest) | Acts at 0.1 g: draws · mass · energy (mean, largest) | Paired draws where it acts: draws · discrete changes · largest piece · surviving mass · energy to the ground · release |',
  '| --- | --- | --- | --- | --- |',
  ...cases.map((x) => {
    const fl = x.f.floor;
    const side = (a: typeof fl.at1g): string =>
      a.acting === 0
        ? '0'
        : `${String(a.acting)} · ${pct(a.massShareMean)}, ${pct(a.massShareMax)} · ${pct(a.energyShareMean)}, ${pct(a.energyShareMax)}`;
    const p = fl.pairedWhereItActs;
    return `| ${x.case} | ${fl.status} | ${side(fl.at1g)} | ${side(fl.at01g)} | ${p.draws === 0 ? '—' : `${String(p.draws)} · ${String(p.discreteChanges)} · ${sci(p.largestFraction)} · ${sci(p.surviving)} · ${sci(p.energyToGround)} · ${sci(p.release)}`} |`;
  }),
  '',
  'Not completed and void draws, with their priors, are listed in the record; they enter no comparison.',
  ''
);
writeFileSync(OUT_MD, lines.join('\n'));
console.log(`Wrote ${OUT_JSON}`);
console.log(`Wrote ${OUT_MD}`);
console.log(
  JSON.stringify(
    {
      limit: record.baselineLimit,
      account: cases.map((x) => [
        x.case,
        x.account.started,
        x.account.completed,
        x.account.notCompleted,
        x.account.void,
        x.f.release.nonConverging,
        x.f.floor.status,
        x.baselineAsSRecorded,
      ]),
    },
    null,
    1
  )
);
