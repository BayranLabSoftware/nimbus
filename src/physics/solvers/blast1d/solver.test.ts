import { beforeAll, describe, expect, it } from 'vitest';
import { airTabled } from '../blast2d/airEos.js';
import { BlastSolver1D } from './solver.js';

/** Rule 1351 (b): the one-dimensional solver's tests (rule 1333 (c)). */

const AIR = { rho0: 1.225, p0: 101_325 };

describe('the one-dimensional blast solver', () => {
  // The real-air table is built on first use: outside any one test's time.
  beforeAll(() => {
    airTabled(1e6, 1.2);
  }, 120_000);

  it('refuses real air over a hot background (rule 1352 (a))', () => {
    expect(
      () => new BlastSolver1D({ n: 20, dr: 1 }, { rho0: 0.1, p0: 101_325 }, { eos: 'air' })
    ).toThrow();
  });

  it('keeps air at rest at rest, ideal gas and real air', () => {
    for (const eos of ['ideal', 'air'] as const) {
      const s = new BlastSolver1D({ n: 60, dr: 2 }, AIR, { eos });
      for (let k = 0; k < 50; k++) s.step();
      let worst = 0;
      for (let i = 0; i < s.n; i++) worst = Math.max(worst, Math.abs(s.pressure(i) / AIR.p0 - 1));
      expect(worst).toBeLessThanOrEqual(1e-12);
    }
  });

  it('keeps the energy of a hot sphere before its wave leaves', () => {
    const s = new BlastSolver1D({ n: 400, dr: 1 }, AIR);
    const put = s.depositHotSphere(4.184e9, 10);
    expect(put).toBeCloseTo(4.184e9, -1);
    const before = s.excessEnergy();
    for (let k = 0; k < 200; k++) s.step();
    // The wave is still well inside the 400 m domain after 200 steps.
    expect(s.peak[380] ?? 0).toBe(0);
    expect(Math.abs(s.excessEnergy() / before - 1)).toBeLessThanOrEqual(1e-10);
  });

  it('gives a cold weak pulse the same state to the bit in real air', () => {
    const run = (eos: 'ideal' | 'air'): BlastSolver1D => {
      const s = new BlastSolver1D({ n: 120, dr: 2 }, AIR, { eos });
      for (let i = 0; i < s.n; i++) {
        const p = 1e-3 * AIR.p0 * Math.exp(-(((s.radius(i) - 80) / 20) ** 2));
        // The state arrays are indexed past three ghosts.
        s.en[i + 3] = (AIR.p0 + p) / (1.4 - 1);
      }
      for (let k = 0; k < 80; k++) s.step();
      return s;
    };
    const a = run('ideal');
    const b = run('air');
    expect(Array.from(b.rho)).toEqual(Array.from(a.rho));
    expect(Array.from(b.mom)).toEqual(Array.from(a.mom));
    expect(Array.from(b.en)).toEqual(Array.from(a.en));
  });

  it('runs a real-air hot sphere with no fall-back and positive pressures', () => {
    const s = new BlastSolver1D({ n: 300, dr: 1 }, AIR, { eos: 'air' });
    s.depositHotSphere(4.184e9, 4);
    for (let k = 0; k < 300; k++) s.step();
    expect(s.fallbacks).toBe(0);
    for (let i = 0; i < s.n; i++) expect(s.pressure(i)).toBeGreaterThan(0);
    expect(s.beyondEdgeEnergy()).toBe(0);
  });

  it('reads a probe: the foot before the peak, a positive impulse, the phase closed', () => {
    const s = new BlastSolver1D({ n: 400, dr: 1 }, AIR, { probes: [150] });
    s.depositHotSphere(4.184e9, 10);
    let steps = 0;
    while (!s.positivePhaseEnded(150) && steps < 20_000) {
      s.step();
      steps++;
    }
    expect(s.positivePhaseEnded(150)).toBe(true);
    const at = s.probe(150);
    const i = Math.floor(150 / 1 - 0.5);
    expect(at.foot).toBeGreaterThan(0);
    expect(at.foot).toBeLessThan(s.peakTime[i] ?? 0);
    expect(at.impulse).toBeGreaterThan(0);
    expect(at.peak).toBeGreaterThan(1_000);
  });
});
