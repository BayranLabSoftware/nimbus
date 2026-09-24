// Rules 1070, 1078 to 1092 of src/physics/validation/fragmentationStudyFRules.ts:
// the verification of F's code before any development case is run, on bodies
// that are no development case, drawn from fixed seeds — rule 1070's 90 of
// 0.3 to 30 m, and rule 1092 (a)'s 90 of 0.05 to 0.5 m, where the floor acts.
// It writes src/physics/validation/fragmentationStudyFVerification.json and
// docs/FRAGMENTATION_STUDY_F_VERIFICATION.md. It runs no case of the round and
// opens nothing of the third set. It checks the code, not the physics.
//
//   pnpm exec tsx scripts/fragmentation-study-f-verify.ts
import { writeFileSync } from 'node:fs';
import { atmosphericEntry } from '../src/physics/effects/atmosphericEntry.js';
import {
  collinsPancakeSpeedAt,
  collinsWholeSpeed,
  entryDensity,
  type CollinsBody,
} from '../src/physics/effects/collinsClosedForms.js';
import { DRAG_COEFFICIENT, H_SCALE } from '../src/physics/effects/entryConstants.js';
import { carrySolid } from '../src/physics/effects/fragmentationStudyS.js';
import {
  STUDY_F_TOP_M,
  studyF,
  type StudyFPriors,
  type StudyFResult,
} from '../src/physics/effects/fragmentationStudyF.js';
import {
  F_BASELINE_LIMIT_TOLERANCE,
  F_BUDGET_TOLERANCE,
  F_CONVERGENCE,
  F_FLOOR_SET,
  F_MASS_FLOOR_SENSITIVITY_KG,
  F_MAX_COMPONENTS,
  F_PRIORS,
  F_PROFILE_BIN_M,
} from '../src/physics/validation/fragmentationStudyFRules.js';
import { J, kgPerM3, m, mps, Pa, type Radians } from '../src/physics/units.js';

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1_664_525) + 1_013_904_223) >>> 0;
    return s / 2 ** 32;
  };
}

interface Draw {
  body: CollinsBody;
  angle: number;
  strength: number;
  priors: StudyFPriors;
}

/** Rule 1070's law: 12–30 km/s, 2 500–3 500 kg/m³, 15–90°, S2 log-uniform on
 *  0.9–5 MPa, F's priors uniform on their intervals; the diameters
 *  log-uniform between the set's bounds. */
function drawSet(seed: number, minD: number, maxD: number): Draw[] {
  const r = lcg(seed);
  return Array.from({ length: 90 }, () => {
    const angle = ((15 + 75 * r()) * Math.PI) / 180;
    const u = (lo: number, hi: number): number => lo + (hi - lo) * r();
    return {
      body: {
        diameter: minD * (maxD / minD) ** r(),
        velocity: u(12_000, 30_000),
        density: u(2_500, 3_500),
        sinTheta: Math.sin(angle),
      },
      angle,
      strength: 0.9e6 * (5 / 0.9) ** r(),
      priors: {
        cloudShare: u(...F_PRIORS.cloudShare),
        largerSplit: u(...F_PRIORS.largerSplit),
        strengthScaling: u(...F_PRIORS.strengthScaling),
      },
    };
  });
}

const round = (x: number, d = 4): number => Number(x.toPrecision(d));
const massOf = (b: CollinsBody): number => (Math.PI / 6) * b.density * b.diameter ** 3;
const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
};
/** Rule 1087 (c): |a − b| / |b|, b the finer run's; where b is zero or absent
 *  the two converge only if a is too. */
const relChange = (a: number | null, b: number | null): number =>
  b === null || b === 0
    ? a === null || a === 0
      ? 0
      : Number.POSITIVE_INFINITY
    : Math.abs((a ?? 0) - b) / Math.abs(b);

function baseline(d: Draw): ReturnType<typeof atmosphericEntry> {
  const mass = massOf(d.body);
  return atmosphericEntry(
    m(d.body.diameter),
    mps(d.body.velocity),
    Pa(d.strength),
    kgPerM3(d.body.density),
    J(0.5 * mass * d.body.velocity ** 2),
    d.angle as Radians
  );
}

/** Rule 1092 (b): the baseline's profile, from its outputs, by a loop over the
 *  bins apart from F's. */
function baselineProfile(
  d: Draw,
  base: ReturnType<typeof atmosphericEntry>,
  binM: number
): number[] {
  const nBins = Math.ceil(STUDY_F_TOP_M / binM) + 1;
  const profile = new Array<number>(nBins).fill(0);
  const m0 = massOf(d.body);
  const v0 = d.body.velocity;
  const vTop = collinsWholeSpeed(d.body, STUDY_F_TOP_M);
  profile[nBins - 1] = 0.5 * m0 * (v0 * v0 - vTop * vTop);
  const segment = (
    zHi: number,
    zLo: number,
    speedAt: (z: number) => number,
    vEnd: number
  ): void => {
    for (let i = Math.floor(zHi / binM); i >= Math.floor(zLo / binM); i--) {
      const hi = Math.min((i + 1) * binM, zHi);
      const lo = Math.max(i * binM, zLo);
      if (!(hi > lo)) continue;
      const vHi = speedAt(hi);
      const vLo = lo === zLo ? vEnd : speedAt(lo);
      const b = Math.min(i, nBins - 1);
      profile[b] = (profile[b] ?? 0) + 0.5 * m0 * (vHi * vHi - vLo * vLo);
    }
  };
  const whole = (z: number): number => collinsWholeSpeed(d.body, z);
  if (base.regime === 'INTACT') {
    segment(STUDY_F_TOP_M, 0, whole, whole(0));
    return profile;
  }
  const zStar = base.breakupAltitude as number;
  const vStar = whole(zStar);
  segment(STUDY_F_TOP_M, zStar, whole, vStar);
  const start = {
    diameter: d.body.diameter,
    density: d.body.density,
    sinTheta: d.body.sinTheta,
    altitude: zStar,
    speed: vStar,
  };
  const vEnd = base.endVelocity as number;
  const zEnd = base.regime === 'COMPLETE_AIRBURST' ? (base.burstAltitude as number) : 0;
  segment(zStar, zEnd, (z) => collinsPancakeSpeedAt(start, z), vEnd);
  if (base.regime === 'COMPLETE_AIRBURST') {
    const b = Math.min(Math.floor(zEnd / binM), nBins - 1);
    profile[b] = (profile[b] ?? 0) + 0.5 * m0 * vEnd * vEnd;
  }
  return profile;
}

/** The profile's two largest maxima at least 1 km apart: altitude and share. */
function maxima(f: StudyFResult, binM: number): { altitude: number; share: number }[] {
  const E0 = f.budget.energyIn;
  const bins = f.energyPerBin
    .slice(0, -1)
    .map((e, i) => ({ altitude: (i + 0.5) * binM, share: e / E0 }))
    .sort((a, b) => b.share - a.share);
  const first = bins[0];
  const second = bins.find(
    (b) => first !== undefined && Math.abs(b.altitude - first.altitude) > 1_000
  );
  return [first, second]
    .filter((b): b is { altitude: number; share: number } => b !== undefined)
    .map((b) => ({ altitude: b.altitude, share: round(b.share) }));
}

function verifySet(draws: Draw[]) {
  // (c) budgets and the bound, at the specification's bin and floor.
  const main = draws.map((d) => studyF(d.body, d.strength, d.priors));
  const done = main.filter((f) => f.completed);
  const worst = (pick: (f: StudyFResult) => number): number =>
    Math.max(0, ...done.map((f) => Math.abs(pick(f))));
  const components = done.map((f) => f.components);
  const budgets = {
    completed: done.length,
    notCompleted: main.length - done.length,
    notCompletedDraws: draws.flatMap((d, i) =>
      main[i]?.completed === false
        ? [
            {
              draw: i,
              diameterM: round(d.body.diameter),
              cloudShare: round(d.priors.cloudShare, 3),
              largerSplit: round(d.priors.largerSplit, 3),
              strengthScaling: round(d.priors.strengthScaling, 3),
            },
          ]
        : []
    ),
    worstMassResidual: worst((f) => f.budget.massResidual),
    worstEnergyResidual: worst((f) => f.budget.energyResidual),
    worstMomentumResidual: worst((f) => f.budget.momentumResidual),
    worstNormMinusProjection: worst(
      (f) => f.budget.momentumResidual - f.budget.momentumProjectionResidual
    ),
    medianComponents: median(components),
    maxComponents: Math.max(0, ...components),
    withPieceOnGround: done.filter((f) => f.pieces.length > 0).length,
    lightestPieceKg: Math.min(...done.flatMap((f) => f.pieces.map((x) => x.mass))),
  };

  // The dust below the floor, at 1 g and at 0.1 g (rules 1080 and 1085).
  const tenth = draws.map((d) =>
    studyF(d.body, d.strength, d.priors, { floorKg: F_MASS_FLOOR_SENSITIVITY_KG })
  );
  const dustOf = (runs: StudyFResult[]): Record<string, number | null> => {
    const acting = runs.filter((f) => f.completed && f.dust.mass > 0);
    const heights = acting.flatMap((f) =>
      f.dust.perBin.flatMap((x, i) => (x > 0 ? [(i + 0.5) * F_PROFILE_BIN_M] : []))
    );
    const perBinClosure = Math.max(
      0,
      ...acting.map(
        (f) => Math.abs(f.dust.perBin.reduce((s, x) => s + x, 0) - f.dust.mass) / f.mass
      )
    );
    return {
      drawsActing: acting.length,
      massShareMedian:
        acting.length > 0 ? round(median(acting.map((f) => f.dust.mass / f.mass))) : null,
      massShareMax:
        acting.length > 0 ? round(Math.max(...acting.map((f) => f.dust.mass / f.mass))) : null,
      energyShareMax:
        acting.length > 0
          ? round(Math.max(...acting.map((f) => f.budget.energyDust / f.budget.energyIn)))
          : null,
      lowestAltitudeM: heights.length > 0 ? Math.min(...heights) : null,
      highestAltitudeM: heights.length > 0 ? Math.max(...heights) : null,
      perBinClosureWorst: perBinClosure,
    };
  };

  // (d) convergence, rules 1080, 1087 (c), 1091 (b) and 1092 (d): the same
  // draws, the bin halved and doubled, the floor at 0.1 g.
  const variants: Record<
    string,
    { runs: StudyFResult[]; coarserIsVariant: boolean; binM: number }
  > = {
    'bin 50 m': {
      runs: draws.map((d) => studyF(d.body, d.strength, d.priors, { binM: F_PROFILE_BIN_M / 2 })),
      coarserIsVariant: false,
      binM: F_PROFILE_BIN_M / 2,
    },
    'bin 200 m': {
      runs: draws.map((d) => studyF(d.body, d.strength, d.priors, { binM: F_PROFILE_BIN_M * 2 })),
      coarserIsVariant: true,
      binM: F_PROFILE_BIN_M * 2,
    },
    'floor 0.1 g': { runs: tenth, coarserIsVariant: false, binM: F_PROFILE_BIN_M },
  };
  const convergence = Object.fromEntries(
    Object.entries(variants).map(([name, { runs, coarserIsVariant, binM }]) => {
      const pairs = draws.flatMap((d, i) => {
        const b = main[i];
        const v = runs[i];
        if (b?.completed !== true || v?.completed !== true) return [];
        // The finer run is the reference: the halved bin, or the lower floor.
        return [coarserIsVariant ? { i, d, fine: b, coarse: v } : { i, d, fine: v, coarse: b }];
      });
      const release = pairs.map((p) => relChange(p.coarse.releaseAltitude, p.fine.releaseAltitude));
      const over = pairs.filter((_, k) => (release[k] ?? 0) >= F_CONVERGENCE);
      const largest = (f: StudyFResult): number => f.largestPiece?.mass ?? 0;
      const largestChange = relChange(
        median(pairs.map((p) => largest(p.coarse))),
        median(pairs.map((p) => largest(p.fine)))
      );
      const perDrawLargest = pairs.map((p) => relChange(largest(p.coarse), largest(p.fine)));
      const share = (pick: (p: (typeof pairs)[number]) => StudyFResult): number =>
        pairs.filter((p) => pick(p).pieces.length > 0).length / Math.max(pairs.length, 1);
      const survivalChange = Math.abs(share((p) => p.coarse) - share((p) => p.fine));
      return [
        name,
        {
          pairs: pairs.length,
          releaseWorst: round(Math.max(0, ...release)),
          releaseOverOnePercent: over.length,
          releaseDrawsOver: over.map((p) => ({
            draw: p.i,
            diameterM: round(p.d.body.diameter),
            cloudShare: round(p.d.priors.cloudShare, 3),
            strengthScaling: round(p.d.priors.strengthScaling, 3),
            components: p.fine.components,
            primaryBurstM:
              p.fine.primaryCloud?.burstAltitude != null
                ? round(p.fine.primaryCloud.burstAltitude, 5)
                : null,
            finer: {
              release: p.fine.releaseAltitude,
              maxima: maxima(p.fine, coarserIsVariant ? F_PROFILE_BIN_M : binM),
            },
            coarser: {
              release: p.coarse.releaseAltitude,
              maxima: maxima(p.coarse, coarserIsVariant ? binM : F_PROFILE_BIN_M),
            },
          })),
          largestMedianChange: round(largestChange),
          largestPerDrawWorst: round(Math.max(0, ...perDrawLargest.filter(Number.isFinite))),
          largestPerDrawOver: perDrawLargest.filter((x) => x >= F_CONVERGENCE).length,
          survivalChange: round(survivalChange),
          converged: {
            release: over.length === 0,
            largest: largestChange < F_CONVERGENCE,
            survival: survivalChange < 0.01,
          },
        },
      ];
    })
  );

  // (a) the baseline's limit, f_c = 1, on the same draws (rules 1081, 1088, 1092 (b)).
  // Rule 1088: relative where the baseline's value is not zero; where it is,
  // absolute — 10⁻⁶ m for an altitude, 10⁻⁹ E0 for an energy.
  let limitWorst = 0;
  let zeroCases = 0;
  let zeroWorstPassesAt = 0;
  let profileWorst = 0;
  let regimeMismatches = 0;
  let eq17AtBurstWorst = 0;
  const regimes: Record<string, number> = {};
  for (const d of draws) {
    const f = studyF(d.body, d.strength, { ...d.priors, cloudShare: 1 });
    const base = baseline(d);
    regimes[base.regime] = (regimes[base.regime] ?? 0) + 1;
    if (f.regime !== base.regime) regimeMismatches += 1;
    const profile = baselineProfile(d, base, F_PROFILE_BIN_M);
    profile.forEach((e, i) => {
      profileWorst = Math.max(
        profileWorst,
        Math.abs((f.energyPerBin[i] ?? 0) - e) / f.budget.energyIn
      );
    });
    // `zeroTolerance` in the quantity's own unit; the returned value passes at ≤ 1.
    const within = (a: number | null | undefined, b: number, zeroTolerance: number): void => {
      const x = a ?? Number.NaN;
      if (b === 0) {
        zeroCases += 1;
        zeroWorstPassesAt = Math.max(zeroWorstPassesAt, Math.abs(x) / zeroTolerance);
      } else limitWorst = Math.max(limitWorst, Math.abs(x - b) / Math.abs(b));
    };
    // The share of energy at the ground: an energy over E0, so 10⁻⁹ where zero.
    within(f.energyFractionToGround, base.energyFractionToGround, 1e-9);
    if (base.regime === 'INTACT') continue;
    within(f.breakupAltitude, base.breakupAltitude, 1e-6);
    within(f.primaryCloud?.endSpeed, base.endVelocity, Number.NaN);
    if (base.regime === 'COMPLETE_AIRBURST') {
      const zBurst = base.burstAltitude as number;
      within(f.primaryCloud?.burstAltitude, zBurst, 1e-6);
      const zStar = base.breakupAltitude as number;
      const start = {
        diameter: d.body.diameter,
        density: d.body.density,
        sinTheta: d.body.sinTheta,
        altitude: zStar,
        speed: collinsWholeSpeed(d.body, zStar),
      };
      eq17AtBurstWorst = Math.max(
        eq17AtBurstWorst,
        Math.abs(collinsPancakeSpeedAt(start, zBurst) - (base.endVelocity as number)) /
          (base.endVelocity as number)
      );
    }
  }

  // (b) f_c = 0 and no further break: two fragments, each on its own path.
  let twoWorst = 0;
  let twoChecked = 0;
  for (const d of draws) {
    const y = d.priors.largerSplit;
    const f = studyF(d.body, d.strength, { cloudShare: 0, largerSplit: y, strengthScaling: 40 });
    if (f.breakupAltitude === null || f.pieces.length !== 2) continue;
    twoChecked += 1;
    const zStar = f.breakupAltitude;
    const vStar = collinsWholeSpeed(d.body, zStar);
    const sorted = [...f.pieces].sort((a, b) => b.mass - a.mass);
    [y, 1 - y].forEach((s, k) => {
      const piece = sorted[k];
      if (piece === undefined) return;
      const L = d.body.diameter * Math.cbrt(s);
      const a = (3 * DRAG_COEFFICIENT * H_SCALE) / (4 * d.body.density * L * d.body.sinTheta);
      const vGround = vStar * Math.exp(-a * (entryDensity(0) - entryDensity(zStar)));
      const terminal = Math.sqrt(
        (4 * d.body.density * L * 9.81) / (3 * entryDensity(0) * DRAG_COEFFICIENT)
      );
      const expected = Math.max(vGround, Math.min(terminal, d.body.velocity));
      twoWorst = Math.max(
        twoWorst,
        Math.abs(piece.mass / f.mass - s),
        Math.abs(piece.speed - expected) / expected
      );
    });
  }

  // Rule 1091 (a): the exact flight against rule 1066's Runge–Kutta.
  let rk4Worst = 0;
  for (const d of draws.slice(0, 30)) {
    const { density: rhoI, sinTheta, diameter: L } = d.body;
    const a = (3 * DRAG_COEFFICIENT * H_SCALE) / (4 * rhoI * L * sinTheta);
    const exact = 15_000 * Math.exp(-a * (entryDensity(5_000) - entryDensity(30_000)));
    const rk4 = carrySolid(30_000, 15_000, 5_000, 1, L, rhoI, sinTheta);
    rk4Worst = Math.max(rk4Worst, Math.abs(rk4 - exact) / exact);
  }

  return {
    budgets,
    dust: { floor1g: dustOf(main), floor01g: dustOf(tenth) },
    convergence,
    baselineLimit: {
      regimes,
      regimeMismatches,
      worstRelative: limitWorst,
      zeroCases,
      zeroWorstOverTolerance: zeroWorstPassesAt,
      profileWorstOverE0: profileWorst,
      eq17AtBurstWorst,
    },
    twoFragments: { checked: twoChecked, worst: twoWorst },
    exactVersusRk4: { bodies: 30, worst: rk4Worst },
  };
}

const sets = {
  rule1070: { seed: 1_070, minD: 0.3, maxD: 30 },
  rule1092: {
    seed: F_FLOOR_SET.seed,
    minD: F_FLOOR_SET.minDiameterM,
    maxD: F_FLOOR_SET.maxDiameterM,
  },
};
const results = Object.fromEntries(
  Object.entries(sets).map(([k, s]) => [k, { ...s, ...verifySet(drawSet(s.seed, s.minD, s.maxD)) }])
);
// Rules 1065 (d) and 1085 on a body built to reach the floor, since no draw
// of the two sets does: α = 0, so every child breaks where its parent did.
const built = { diameter: 0.05, velocity: 25_000, density: 3_000, sinTheta: 1 };
const builtPriors = { cloudShare: 0.05, largerSplit: 0.5, strengthScaling: 0 };
const constructed = [1e-3, 1e-4].map((floorKg) => {
  const f = studyF(built, 3e5, builtPriors, { floorKg });
  const z = f.breakupAltitude ?? Number.NaN;
  const v = collinsWholeSpeed(built, z);
  return {
    floorKg,
    components: f.components,
    dustShare: round(f.dust.mass / f.mass),
    dustEnergyOverHalfMv2: round(f.budget.energyDust / (0.5 * f.dust.mass * v * v), 6),
    dustBinsM: f.dust.perBin.flatMap((x, i) => (x > 0 ? [(i + 0.5) * F_PROFILE_BIN_M] : [])),
    breakupM: round(z, 6),
    pressureOverStrengthAtBreakup: round((entryDensity(z) * v * v) / 3e5, 6),
    massResidual: f.budget.massResidual,
    energyResidual: f.budget.energyResidual,
    momentumResidual: f.budget.momentumResidual,
  };
});

const report = {
  rules: '1070, 1078 to 1092',
  bodiesPerSet: 90,
  tolerances: {
    budget: F_BUDGET_TOLERANCE,
    baselineLimit: F_BASELINE_LIMIT_TOLERANCE,
    convergence: F_CONVERGENCE,
    maxComponents: F_MAX_COMPONENTS,
    floorMinActing: F_FLOOR_SET.minActing,
  },
  sets: results,
  constructedDust: { body: built, strength: 3e5, priors: builtPriors, runs: constructed },
};
writeFileSync(
  'src/physics/validation/fragmentationStudyFVerification.json',
  `${JSON.stringify(report, null, 2)}\n`
);

const e = (x: number): string => x.toExponential(1);
const yes = (b: boolean): string => (b ? 'yes' : '**no**');
const setRows = Object.entries(results).map(([k, r]) => ({
  k,
  label: k === 'rule1070' ? 'Rule 1070 (0.3–30 m)' : 'Rule 1092 (0.05–0.5 m)',
  r,
}));
const md = `# The study of F — verification before any case

Rules 1070 and 1078 to 1092 of \`src/physics/validation/fragmentationStudyFRules.ts\`, run by
\`scripts/fragmentation-study-f-verify.ts\` on two sets of 90 bodies that are no development case,
drawn by one law (12–30 km/s, 2 500–3 500 kg/m³, 15–90°, S2 log-uniform on 0.9–5 MPa, F's priors
uniform on their intervals): rule 1070's with diameters of 0.3–30 m (seed 1070), rule 1092 (a)'s of
0.05–0.5 m (seed 1092). No case of the round was run and nothing of the third set was opened. This
checks the code against its equations and the baseline; it is no validation against observations.

## Budgets, the bound, the baseline's limit

| | ${setRows.map((x) => x.label).join(' | ')} |
| --- | --- | --- |
| Draws completed | ${setRows.map((x) => `${String(x.r.budgets.completed)} of 90`).join(' | ')} |
| Not completed (past 10⁵ components) | ${setRows.map((x) => String(x.r.budgets.notCompleted)).join(' | ')} |
| Draws with a piece on the ground | ${setRows.map((x) => `${String(x.r.budgets.withPieceOnGround)} of ${String(x.r.budgets.completed)}`).join(' | ')} |
| Components, median / largest | ${setRows.map((x) => `${String(x.r.budgets.medianComponents)} / ${String(x.r.budgets.maxComponents)}`).join(' | ')} |
| Mass residual, worst (≤ 10⁻¹²) | ${setRows.map((x) => e(x.r.budgets.worstMassResidual)).join(' | ')} |
| Energy residual, worst (≤ 10⁻¹²) | ${setRows.map((x) => e(x.r.budgets.worstEnergyResidual)).join(' | ')} |
| Momentum vector, worst (≤ 10⁻¹²) | ${setRows.map((x) => e(x.r.budgets.worstMomentumResidual)).join(' | ')} |
| Norm − projection, worst | ${setRows.map((x) => e(x.r.budgets.worstNormMinusProjection)).join(' | ')} |
| f_c = 1: regimes of the baseline | ${setRows
  .map((x) =>
    Object.entries(x.r.baselineLimit.regimes)
      .map(([g, n]) => `${g} ${String(n)}`)
      .join(', ')
  )
  .join(' | ')} |
| f_c = 1: regimes that differ | ${setRows.map((x) => String(x.r.baselineLimit.regimeMismatches)).join(' | ')} |
| f_c = 1: worst relative difference (≤ 10⁻⁹) | ${setRows.map((x) => e(x.r.baselineLimit.worstRelative)).join(' | ')} |
| f_c = 1: values zero in the baseline, worst over their tolerance | ${setRows.map((x) => `${String(x.r.baselineLimit.zeroCases)} values, ${String(x.r.baselineLimit.zeroWorstOverTolerance)}`).join(' | ')} |
| f_c = 1: profile, worst bin over E0 (≤ 10⁻⁹) | ${setRows.map((x) => e(x.r.baselineLimit.profileWorstOverE0)).join(' | ')} |
| Eq. 17 at the burst against Eq. 19's speed | ${setRows.map((x) => e(x.r.baselineLimit.eq17AtBurstWorst)).join(' | ')} |
| f_c = 0, no further break: draws with two fragments, worst | ${setRows.map((x) => `${String(x.r.twoFragments.checked)}, ${e(x.r.twoFragments.worst)}`).join(' | ')} |
| Exact flight against Runge–Kutta (h = 1 m), 30 bodies (≤ 10⁻⁹) | ${setRows.map((x) => e(x.r.exactVersusRk4.worst)).join(' | ')} |

The baseline has no profile of its own: the one compared is built from its outputs by a loop apart
from F's (rule 1092 (b)). Between breakup and burst both use Eq. 17 in closed form, the only law the
baseline implies there: this checks F's bookkeeping, not that law. With f_c = 0 a fragment faster
than about 14 km/s passes the ceiling of 330 MPa low in the air and breaks again, as rule 1065 (b)
wants; the two-fragment check reads the draws where it does not.
${setRows
  .flatMap((x) =>
    x.r.budgets.notCompletedDraws.map(
      (d) =>
        `\nNot completed, ${x.label}: draw ${String(d.draw)}, ${String(d.diameterM)} m, f_c ${String(d.cloudShare)}, y ${String(d.largerSplit)}, α ${String(d.strengthScaling)} — a low cloud share and a weak strength scaling, the cascade passing 10⁵ components; declared, never cut (rule 1083).`
    )
  )
  .join('')}

## Convergence on the same draws (rules 1080, 1087 (c), 1091 (b))

| Set | Change | Pairs | Release, worst | Draws ≥ 1 % | Largest piece, median | Survival share | Converged: release / largest / survival |
| --- | --- | --- | --- | --- | --- | --- | --- |
${setRows
  .flatMap((x) =>
    Object.entries(x.r.convergence).map(
      ([name, c]) =>
        `| ${x.label} | ${name} | ${String(c.pairs)} | ${String(c.releaseWorst)} | ${String(c.releaseOverOnePercent)} | ${String(c.largestMedianChange)} | ${String(c.survivalChange)} | ${name === 'floor 0.1 g' && (x.r.dust.floor1g.drawsActing ?? 0) + (x.r.dust.floor01g.drawsActing ?? 0) === 0 ? 'not exercised (rule 1095)' : `${yes(c.converged.release)} / ${yes(c.converged.largest)} / ${yes(c.converged.survival)}`} |`
    )
  )
  .join('\n')}
${setRows
  .flatMap((x) =>
    Object.entries(x.r.convergence).flatMap(([name, c]) =>
      c.releaseDrawsOver.map(
        (d) =>
          `\nNot converged (rule 1092 (d)), ${x.label}, ${name}: draw ${String(d.draw)} — ${String(d.diameterM)} m, f_c ${String(d.cloudShare)}, α ${String(d.strengthScaling)}, ${String(d.components)} components, the main cloud bursting at ${String(d.primaryBurstM)} m. Its profile has two maxima: at the finer bin ${d.finer.maxima.map((m) => `${String(m.altitude)} m (${String(m.share)} of E0)`).join(' and ')}; at the coarser ${d.coarser.maxima.map((m) => `${String(m.altitude)} m (${String(m.share)} of E0)`).join(' and ')}. The burst lays its energy in one bin, whatever the bin's width; the cascade spreads its own over many, so a wider bin gathers more of it. Where the two are close, the bin of the most energy — rule 1091 (c)'s release altitude — changes with the bin. No definition was changed before the reviewer read it; the reviewer chose to keep it and to publish no aggregated release altitude of F as a comparable result (rule 1094).`
      )
    )
  )
  .join('')}

Every completed draw keeps a piece on the ground whatever the bin or the floor, so the survival share
stays 1 and its criterion is met without being tested.

## The floor (rules 1065 (d), 1080, 1085, 1092 (a))

The floor acts — some piece falls below it — in ${setRows.map((x) => `${String(x.r.dust.floor1g.drawsActing)} of 90 draws at 1 g and ${String(x.r.dust.floor01g.drawsActing)} at 0.1 g (${x.label})`).join('; ')}: fewer than ${String(F_FLOOR_SET.minActing)}, and it is said. On these bodies a fragment stops breaking once past its peak of pressure, and children grow stronger as they shrink, and no cascade that ended came down to a gram: the lightest piece on the ground weighs ${setRows.map((x) => `${x.r.budgets.lightestPieceKg.toPrecision(2)} kg (${x.label})`).join(' and ')}. The floor's hypothesis does not weigh on these results; its sensitivity is read on no piece, and reads «not exercised», never «converged» (rule 1095).

The dust's branch is exercised on a body built to reach it (5 cm, 25 km/s, vertical, 0.3 MPa, f_c 0.05, y 0.5, α 0, so that every child breaks where its parent did):

| Floor | Components | Dust, share of the mass | E_dust / ½ m_dust v*² | Dust written at | Budgets, worst |
| --- | --- | --- | --- | --- | --- |
${constructed
  .map(
    (c) =>
      `| ${c.floorKg === 1e-3 ? '1 g' : '0.1 g'} | ${String(c.components)} | ${String(c.dustShare)} | ${String(c.dustEnergyOverHalfMv2)} | ${c.dustBinsM.map((z) => `${String(z)} m`).join(', ')} | ${e(Math.max(Math.abs(c.massResidual), Math.abs(c.energyResidual), c.momentumResidual))} |`
  )
  .join('\n')}

At Eq. 11's breakup altitude the pressure is ${String(constructed[0]?.pressureOverStrengthAtBreakup)} of S2 — Collins et al.'s approximation — so children as strong as their parent fly a few metres more and break at the exact crossing: the dust is born there, in the same bin, at a speed a little below v*.
`;
writeFileSync('docs/FRAGMENTATION_STUDY_F_VERIFICATION.md', md);
console.log(JSON.stringify(report, null, 1));
