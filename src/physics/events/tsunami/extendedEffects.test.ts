import { describe, expect, it } from 'vitest';
import { m } from '../../units.js';
import {
  submarineLandslideAmplitude,
  synolakisRunup,
  tohoku2011DARTReference,
} from './extendedEffects.js';

describe('synolakisRunup (Synolakis 1987)', () => {
  it('1 m wave on a 1:100 beach with 10 m offshore depth → run-up ~ 10–20 m', () => {
    const R = synolakisRunup(m(1), Math.atan(1 / 100), m(10)) as number;
    expect(R).toBeGreaterThan(10);
    expect(R).toBeLessThan(20);
  });

  it('gentler slope → higher run-up', () => {
    const steep = synolakisRunup(m(1), Math.atan(1 / 20), m(10)) as number;
    const gentle = synolakisRunup(m(1), Math.atan(1 / 200), m(10)) as number;
    expect(gentle).toBeGreaterThan(steep);
  });

  it('returns 0 for invalid inputs', () => {
    expect(synolakisRunup(m(0), 0.01, m(10))).toBe(0);
    expect(synolakisRunup(m(1), 0, m(10))).toBe(0);
    expect(synolakisRunup(m(1), 0.01, m(0))).toBe(0);
  });
});

describe('submarineLandslideAmplitude (Watts 2000)', () => {
  it('Aitape 1998 slide V = 4×10⁶ m³, slope 10° → initial amplitude of a few m', () => {
    const A = submarineLandslideAmplitude(4e6, (10 * Math.PI) / 180) as number;
    expect(A).toBeGreaterThan(1);
    expect(A).toBeLessThan(10);
  });

  it('scales as V^(1/3) · sin(θ)', () => {
    const a = submarineLandslideAmplitude(1e7, Math.PI / 6) as number;
    const b = submarineLandslideAmplitude(8e7, Math.PI / 6) as number;
    // 8× the volume → 2× the amplitude.
    expect(b / a).toBeCloseTo(2, 2);
  });

  it('returns 0 for zero volume or zero slope', () => {
    expect(submarineLandslideAmplitude(0, 0.1)).toBe(0);
    expect(submarineLandslideAmplitude(1e6, 0)).toBe(0);
  });
});

describe('tohoku2011DARTReference', () => {
  it('brackets the ~30 cm peak recorded at DART 21413', () => {
    const A = tohoku2011DARTReference() as number;
    // Observed peak ~0.30 m. This 1/r reference lands at ~0.13 m —
    // under the record by a factor of two, which is what 1/r does to
    // a wave that spreads over a ring.
    //
    // It used to be one half of a bracket: the simulator's own
    // cylindrical law landed at 1.93 m, six times over, and the
    // record sat between them. Since 9 September 2026 the simulator
    // has one law and reads 0.27 m here, so this is no longer a
    // bracket but an independent estimate from a different formula
    // and a different source amplitude, kept because a law with
    // nothing to disagree with is a law nobody is checking.
    expect(A).toBeGreaterThan(0.05);
    expect(A).toBeLessThan(1.0);
  });
});
