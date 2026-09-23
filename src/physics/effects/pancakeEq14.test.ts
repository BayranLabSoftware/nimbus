import { describe, expect, it } from 'vitest';
import { IMPACT_PRESETS, simulateImpact } from '../simulate.js';
import { degreesToRadians, deg, J, kgPerM3, m, mps } from '../units.js';
import { atmosphericEntry } from './atmosphericEntry.js';
import { DRAG_COEFFICIENT, H_SCALE, PANCAKE_FACTOR, RHO_0 } from './entryConstants.js';
import { solveEq14 } from './pancakeEq14.js';

/**
 * Rule 993's verification of variant P, before its run, on bodies that are
 * none of the development cases: a grid of diameters, densities, angles and
 * breakup altitudes.
 */
const GRID: { diameter: number; density: number; sinTheta: number; breakupAltitude: number }[] = [];
for (const diameter of [1, 20, 100, 500])
  for (const density of [1_500, 3_000, 7_800])
    for (const angle of [15, 45, 80])
      for (const breakupAltitude of [8_000, 30_000, 60_000])
        GRID.push({
          diameter,
          density,
          sinTheta: Math.sin((angle * Math.PI) / 180),
          breakupAltitude,
        });

/** Eq. 17*'s coefficient, so a speed ratio is e^(−k I). */
const kOf = (b: (typeof GRID)[number]): number =>
  (0.75 * DRAG_COEFFICIENT * RHO_0 * Math.exp(-b.breakupAltitude / H_SCALE)) /
  (b.density * b.diameter ** 3 * b.sinTheta);

describe('rule 993: the solution of Eq. 14, verified before the run', () => {
  it('(a) moves the burst by under 1 m and the speed by under 1e-6 when the step halves', () => {
    for (const b of GRID) {
      const rules = solveEq14(b);
      const half = solveEq14(b, { stepScale: 0.5 });
      expect(half.burstAltitude === null, JSON.stringify(b)).toBe(rules.burstAltitude === null);
      if (rules.burstAltitude !== null && half.burstAltitude !== null)
        expect(Math.abs(rules.burstAltitude - half.burstAltitude), JSON.stringify(b)).toBeLessThan(
          1
        );
      const k = kOf(b);
      const ratio = Math.exp(-k * rules.endIntegral) / Math.exp(-k * half.endIntegral);
      expect(Math.abs(ratio - 1), JSON.stringify(b)).toBeLessThan(1e-6);
    }
  });

  it('(b) starts at L0, at rest, with the curvature Eq. 14 gives there', () => {
    for (const b of GRID) {
      const s = solveEq14(b, { step: 1 });
      const [first, second] = s.nodes;
      expect(first?.diameter).toBe(b.diameter);
      const curvature =
        (DRAG_COEFFICIENT * RHO_0 * Math.exp(-b.breakupAltitude / H_SCALE)) /
        (b.density * b.diameter * b.sinTheta ** 2);
      // L(z* − h) = L0 + h² L″ / 2 + O(h³), with L′(z*) = 0.
      const read = (2 * ((second?.diameter ?? Number.NaN) - b.diameter)) / 1;
      expect(Math.abs(read / curvature - 1), JSON.stringify(b)).toBeLessThan(1e-3);
    }
  });

  it('(c) agrees with Eq. 15* to second order near the breakup (rule 999)', () => {
    for (const b of GRID) {
      const rhoStar = RHO_0 * Math.exp(-b.breakupAltitude / H_SCALE);
      const l = b.diameter * b.sinTheta * Math.sqrt(b.density / (DRAG_COEFFICIENT * rhoStar));
      const depth = Math.min(0.001 * Math.min(l, H_SCALE), b.breakupAltitude);
      const s = solveEq14(b, { step: depth / 100, to: b.breakupAltitude - depth });
      const node = s.nodes[100];
      if (node === undefined) continue;
      const w = Math.exp(depth / (2 * H_SCALE));
      const eq15 = b.diameter * Math.sqrt(1 + ((2 * H_SCALE) / l) ** 2 * (w - 1) ** 2);
      // Their difference, a third-order term, within 1 % of the growth.
      expect(Math.abs(node.diameter - eq15) / (eq15 - b.diameter), JSON.stringify(b)).toBeLessThan(
        0.01
      );
    }
  });

  it('bursts where L reaches f_p L0, and nowhere above', () => {
    for (const b of GRID) {
      const s = solveEq14(b);
      if (s.burstAltitude === null) continue;
      const last = s.nodes[s.nodes.length - 1];
      expect(last?.diameter).toBeCloseTo(PANCAKE_FACTOR * b.diameter, 9);
      for (const n of s.nodes.slice(0, -1))
        expect(n.diameter).toBeLessThan(PANCAKE_FACTOR * b.diameter);
    }
  });

  it('(d) leaves every number of the product to the bit while it is off', () => {
    for (const preset of Object.values(IMPACT_PRESETS)) {
      // The result echoes its inputs; everything else must be the same.
      const { inputs: _on, ...on } = simulateImpact({ ...preset.input, pancakeGrowth: 'eq15' });
      const { inputs: _off, ...off } = simulateImpact(preset.input);
      expect(on).toEqual(off);
    }
    const e = (pancake?: 'eq15'): ReturnType<typeof atmosphericEntry> =>
      atmosphericEntry(
        m(40),
        mps(18_000),
        undefined,
        kgPerM3(3_000),
        J(1e16),
        degreesToRadians(deg(35)),
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        pancake
      );
    expect(e('eq15')).toEqual(e());
  });

  it('changes the entry only after the breakup, on the paper equations', () => {
    const input = {
      impactorDiameter: m(40),
      impactVelocity: mps(18_000),
      impactorDensity: kgPerM3(3_000),
      targetDensity: kgPerM3(2_700),
      impactAngle: degreesToRadians(deg(35)),
      surfaceGravity: 9.806_65,
    };
    const off = simulateImpact(input);
    const on = simulateImpact({ ...input, pancakeGrowth: 'eq14' });
    expect(on.entry.breakupAltitude).toBe(off.entry.breakupAltitude);
    expect(on.entry.firstFragmentationAltitude).toBe(off.entry.firstFragmentationAltitude);
    const program = { ...input, entryEquations: 'program' as const };
    expect(simulateImpact({ ...program, pancakeGrowth: 'eq14' }).entry).toEqual(
      simulateImpact(program).entry
    );
  });
});
