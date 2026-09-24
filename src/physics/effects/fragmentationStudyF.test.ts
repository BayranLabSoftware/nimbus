import { describe, expect, it } from 'vitest';
import { atmosphericEntry } from './atmosphericEntry.js';
import { collinsWholeSpeed, entryDensity } from './collinsClosedForms.js';
import { DRAG_COEFFICIENT, GRAVITY, H_SCALE } from './entryConstants.js';
import { carrySolid } from './fragmentationStudyS.js';
import { studyF } from './fragmentationStudyF.js';
import {
  F_BASELINE_LIMIT_TOLERANCE,
  F_BUDGET_TOLERANCE,
  F_PRIORS,
} from '../validation/fragmentationStudyFRules.js';
import { J, kgPerM3, m, mps, Pa, type Radians } from '../units.js';

/** A seeded generator: the verification's bodies are no development cases. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1_664_525) + 1_013_904_223) >>> 0;
    return s / 2 ** 32;
  };
}

interface Case {
  body: { diameter: number; velocity: number; density: number; sinTheta: number };
  strength: number;
  angle: number;
}

function bodies(
  n: number,
  seed: number,
  maxDiameter = 30,
  minDiameter = 0.3,
  maxVelocity = 30_000
): Case[] {
  const r = lcg(seed);
  return Array.from({ length: n }, () => {
    const diameter = minDiameter * (maxDiameter / minDiameter) ** r();
    const angle = ((15 + 75 * r()) * Math.PI) / 180;
    return {
      body: {
        diameter,
        velocity: 12_000 + (maxVelocity - 12_000) * r(),
        density: 2_500 + 1_000 * r(),
        sinTheta: Math.sin(angle),
      },
      strength: 0.9e6 * (5 / 0.9) ** r(),
      angle,
    };
  });
}

const relative = (a: number, b: number, zero: number): number =>
  b === 0 ? Math.abs(a) / zero : Math.abs(a - b) / Math.abs(b);

describe('rule 1091 (a): a fragment’s flight solved exactly', () => {
  it('agrees with the Runge–Kutta integration of rule 1066 to 10⁻⁹', () => {
    for (const c of bodies(10, 11, 10)) {
      const { density: rhoI, sinTheta, diameter: L } = c.body;
      const z0 = 30_000;
      const v0 = 15_000;
      const a = (3 * DRAG_COEFFICIENT * H_SCALE) / (4 * rhoI * L * sinTheta);
      const exact = v0 * Math.exp(-a * (entryDensity(5_000) - entryDensity(z0)));
      const rk4 = carrySolid(z0, v0, 5_000, 1, L, rhoI, sinTheta);
      expect(Math.abs(rk4 - exact) / exact).toBeLessThan(1e-9);
    }
  });
});

describe('rules 1081 and 1088: with f_c = 1, F is the baseline at the same event', () => {
  it('breaks, bursts or reaches the ground as the baseline does', () => {
    let complete = 0;
    let partial = 0;
    // Metre-scale bodies burst in the air; hundreds of metres reach the ground.
    for (const c of [...bodies(40, 21, 60), ...bodies(20, 22, 1_000, 100)]) {
      const f = studyF(c.body, c.strength, {
        cloudShare: 1,
        largerSplit: 0.6,
        strengthScaling: 0.3,
      });
      const mass = (Math.PI / 6) * c.body.density * c.body.diameter ** 3;
      const base = atmosphericEntry(
        m(c.body.diameter),
        mps(c.body.velocity),
        Pa(c.strength),
        kgPerM3(c.body.density),
        J(0.5 * mass * c.body.velocity ** 2),
        c.angle as Radians
      );
      const tol = F_BASELINE_LIMIT_TOLERANCE;
      expect(f.regime).toBe(base.regime);
      if (base.regime === 'INTACT') continue;
      expect(relative(f.breakupAltitude ?? -1, base.breakupAltitude as number, 1e-6)).toBeLessThan(
        tol
      );
      const cloud = f.primaryCloud;
      expect(cloud).not.toBeNull();
      if (cloud === null) continue;
      if (base.regime === 'COMPLETE_AIRBURST') {
        complete += 1;
        expect(
          relative(cloud.burstAltitude ?? -1, base.burstAltitude as number, 1e-6)
        ).toBeLessThan(tol);
      } else {
        partial += 1;
        expect(cloud.burstAltitude).toBeNull();
      }
      expect(relative(cloud.endSpeed, base.endVelocity as number, 1)).toBeLessThan(tol);
      expect(Math.abs(f.energyFractionToGround - base.energyFractionToGround)).toBeLessThanOrEqual(
        tol
      );
    }
    expect(complete).toBeGreaterThan(0);
    expect(partial).toBeGreaterThan(0);
  });
});

describe('rule 1070 (b): f_c = 0 and no further break — two intact fragments', () => {
  it('flies each on the single-body path of its own mass', () => {
    // Below 14 km/s the pressure never reaches the ceiling of 330 MPa, which no
    // α can pass: past it a fragment breaks again (rule 1065 (b)).
    for (const c of bodies(10, 31, 20, 0.3, 14_000)) {
      const y = 0.62;
      const f = studyF(c.body, c.strength, { cloudShare: 0, largerSplit: y, strengthScaling: 40 });
      if (f.breakupAltitude === null) continue;
      expect(f.pieces).toHaveLength(2);
      const zStar = f.breakupAltitude;
      const vStar = collinsWholeSpeed(c.body, zStar);
      const m0 = f.mass;
      for (const [share, piece] of [
        [y, f.pieces.find((p) => p.mass === Math.max(...f.pieces.map((q) => q.mass)))],
        [1 - y, f.pieces.find((p) => p.mass === Math.min(...f.pieces.map((q) => q.mass)))],
      ] as const) {
        expect(piece).toBeDefined();
        if (piece === undefined) continue;
        expect(piece.mass / m0).toBeCloseTo(share, 12);
        const L = c.body.diameter * Math.cbrt(share);
        const a = (3 * DRAG_COEFFICIENT * H_SCALE) / (4 * c.body.density * L * c.body.sinTheta);
        const vGround = vStar * Math.exp(-a * (entryDensity(0) - entryDensity(zStar)));
        const terminal = Math.sqrt(
          (4 * c.body.density * L * GRAVITY) / (3 * entryDensity(0) * DRAG_COEFFICIENT)
        );
        const expected = Math.max(vGround, Math.min(terminal, c.body.velocity));
        expect(Math.abs(piece.speed - expected) / expected).toBeLessThan(1e-12);
      }
    }
  });
});

describe('rules 1078, 1085, 1086 and 1090: the budgets on 90 bodies', () => {
  it('close mass, energy and the momentum vector to 10⁻¹², the dust written apart', () => {
    const r = lcg(41);
    let completed = 0;
    for (const c of bodies(90, 43, 20)) {
      const [f0, f1] = F_PRIORS.cloudShare;
      const [y0, y1] = F_PRIORS.largerSplit;
      const [a0, a1] = F_PRIORS.strengthScaling;
      const f = studyF(c.body, c.strength, {
        cloudShare: f0 + (f1 - f0) * r(),
        largerSplit: y0 + (y1 - y0) * r(),
        strengthScaling: a0 + (a1 - a0) * r(),
      });
      if (!f.completed) continue;
      completed += 1;
      const b = f.budget;
      expect(Math.abs(b.massResidual)).toBeLessThan(F_BUDGET_TOLERANCE);
      expect(Math.abs(b.energyResidual)).toBeLessThan(F_BUDGET_TOLERANCE);
      expect(b.momentumResidual).toBeLessThan(F_BUDGET_TOLERANCE);
      // Rule 1090 (b): the vector equals its projection by these equations.
      expect(Math.abs(b.momentumResidual - b.momentumProjectionResidual)).toBeLessThan(1e-15);
      // Rule 1085: the dust's mass is written bin by bin, never dropped.
      const dustBins = f.dust.perBin.reduce((s, x) => s + x, 0);
      expect(Math.abs(dustBins - f.dust.mass)).toBeLessThanOrEqual(1e-9 * f.mass);
    }
    expect(completed).toBeGreaterThan(60);
  });
});

describe('rules 1083, 1087 (b) and 1090 (c): the bound on the components', () => {
  it('stops a cascade that does not resolve, and declares the draw not completed', () => {
    const [c] = bodies(1, 51, 10);
    if (c === undefined) throw new Error('no body');
    // α = 0: a child is no stronger than its parent, so at the break every child
    // breaks at once, again and again — only the bound stops it.
    const f = studyF(
      c.body,
      c.strength,
      { cloudShare: 0.05, largerSplit: 0.5, strengthScaling: 0 },
      { maxComponents: 1_000 }
    );
    expect(f.completed).toBe(false);
    expect(f.components).toBeGreaterThan(1_000);
  });
});

describe('rules 1065 (d) and 1085: the dust below the floor, on a case built to reach it', () => {
  // On rule 1070's and rule 1092's 180 draws no piece falls below 1 g: the dust's
  // branch is exercised here on a body built for it. With α = 0 no child is
  // stronger than its parent, so at the breakup every child breaks at once, at
  // the same altitude and speed, until it falls below the floor.
  const body = { diameter: 0.05, velocity: 25_000, density: 3_000, sinTheta: 1 };
  const priors = { cloudShare: 0.05, largerSplit: 0.5, strengthScaling: 0 };

  it('turns into dust and clouds at the breakup, its energy laid down where it forms', () => {
    for (const floorKg of [1e-3, 1e-4]) {
      const f = studyF(body, 3e5, priors, { floorKg });
      expect(f.completed).toBe(true);
      expect(f.pieces).toHaveLength(0);
      expect(f.dust.mass).toBeGreaterThan(0.5 * f.mass);
      const zStar = f.breakupAltitude ?? Number.NaN;
      const vStar = collinsWholeSpeed(body, zStar);
      // Eq. 11 is Collins et al.'s approximation: at its z* the pressure is
      // 0.9998 S2, so children as strong as their parent fly a few metres more
      // and break at the exact crossing. Every grain is born there, at no more
      // than v*: ½ m_dust v*² bounds E_dust, and within 10⁻⁴.
      const ratio = f.budget.energyDust / (0.5 * f.dust.mass * vStar * vStar);
      expect(ratio).toBeLessThanOrEqual(1);
      expect(ratio).toBeGreaterThan(1 - 1e-4);
      // Its mass written in the bin of z*, and nowhere else.
      const bins = f.dust.perBin.flatMap((x, i) => (x > 0 ? [i] : []));
      expect(bins).toEqual([Math.floor(zStar / 100)]);
      expect(Math.abs((f.dust.perBin[bins[0] ?? 0] ?? 0) - f.dust.mass)).toBeLessThanOrEqual(
        F_BUDGET_TOLERANCE * f.mass
      );
      expect(Math.abs(f.budget.massResidual)).toBeLessThan(F_BUDGET_TOLERANCE);
      expect(Math.abs(f.budget.energyResidual)).toBeLessThan(F_BUDGET_TOLERANCE);
      expect(f.budget.momentumResidual).toBeLessThan(F_BUDGET_TOLERANCE);
    }
  });

  it('follows more generations at 0.1 g than at 1 g', () => {
    const coarse = studyF(body, 3e5, priors);
    const fine = studyF(body, 3e5, priors, { floorKg: 1e-4 });
    expect(fine.components).toBeGreaterThan(coarse.components);
    expect(fine.clouds.count).toBeGreaterThan(coarse.clouds.count);
  });
});
