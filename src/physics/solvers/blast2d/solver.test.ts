import { describe, expect, it } from 'vitest';
import { isothermalAtmosphere, scaleHeight, uniformAtmosphere } from './atmosphere.js';
import { BlastSolver2D, radialCoefficients } from './solver.js';

/** Rule 1254 (c) T0 and the scheme's conservation, on small grids. */

const SEA = { rho0: 1.225, p0: 101_325 };

describe('the atmosphere at rest (T0, rule 1254 (c))', () => {
  it('stays at rest to rounding in an isothermal atmosphere, as Berberich et al. prove', () => {
    const air = isothermalAtmosphere(SEA.rho0, SEA.p0, 9.80665);
    expect(scaleHeight(air)).toBeCloseTo(8_434.5, 0);
    // 10 km by 40 km of air, 500 m cells: four and a half scale heights.
    const solver = new BlastSolver2D({ nr: 20, nz: 80, dx: 500 }, air);
    for (let n = 0; n < 200; n++) solver.step();
    expect(solver.time).toBeGreaterThan(50);
    expect(solver.maxSpeed()).toBeLessThan(1e-9);
    expect(solver.fallbacks).toBe(0);
  }, 30_000);
});

describe('conservation, with no gravity and walls on two sides', () => {
  it('keeps the mass and the energy put in, before the wave reaches the open boundaries', () => {
    const air = uniformAtmosphere(SEA.rho0, SEA.p0);
    const solver = new BlastSolver2D({ nr: 60, nz: 60, dx: 2 }, air);
    const mass = (): number => {
      let m = 0;
      for (let j = 0; j < solver.nz; j++)
        for (let i = 0; i < solver.nr; i++)
          m += (solver.rho[solver.index(i, j)] ?? 0) * solver.cellVolume(i);
      return m;
    };
    const m0 = mass();
    const e0 = solver.totalEnergy();
    const put = solver.deposit({ energy: 4.184e9, height: 40, radius: 10 });
    expect(put).toBeCloseTo(4.184e9, -1);
    expect(solver.totalEnergy() - e0).toBeCloseTo(4.184e9, -1);
    // The shock stays well inside 120 m for these steps.
    for (let n = 0; n < 60; n++) solver.step();
    const e1 = solver.totalEnergy();
    expect(Math.abs(e1 - e0 - put) / put).toBeLessThan(1e-9);
    expect(Math.abs(mass() - m0) / m0).toBeLessThan(1e-12);
    // Something moved, and the ground felt it.
    expect(solver.maxSpeed()).toBeGreaterThan(10);
  }, 30_000);

  it('gives a moving source its downward momentum and the whole energy', () => {
    const air = uniformAtmosphere(SEA.rho0, SEA.p0);
    const solver = new BlastSolver2D({ nr: 40, nz: 60, dx: 2 }, air);
    const e0 = solver.totalEnergy();
    const put = solver.deposit({ energy: 4.184e9, height: 60, radius: 10, kineticShare: 1 / 3 });
    expect(Math.abs(solver.totalEnergy() - e0 - put) / put).toBeLessThan(1e-12);
    expect(Math.abs(put - 4.184e9) / 4.184e9).toBeLessThan(1e-12);
    let pz = 0;
    for (let j = 0; j < solver.nz; j++)
      for (let i = 0; i < solver.nr; i++)
        pz += (solver.mz[solver.index(i, j)] ?? 0) * solver.cellVolume(i);
    expect(pz).toBeLessThan(0);
  }, 30_000);
});

describe("rule 1277's continuous limiter (Hu, Adams & Shu 2013)", () => {
  it('keeps the atmosphere at rest, blending no face', () => {
    const air = isothermalAtmosphere(SEA.rho0, SEA.p0, 9.80665);
    const solver = new BlastSolver2D({ nr: 20, nz: 80, dx: 500 }, air, { limiter: 'has' });
    for (let n = 0; n < 200; n++) solver.step();
    expect(solver.time).toBeGreaterThan(50);
    expect(solver.maxSpeed()).toBeLessThan(1e-9);
    expect(solver.limitedFaces).toBe(0);
    expect(solver.scaledFaces).toBe(0);
  }, 30_000);

  it('keeps the mass and the energy put in, with no fall-back of any kind', () => {
    const air = uniformAtmosphere(SEA.rho0, SEA.p0);
    const solver = new BlastSolver2D({ nr: 60, nz: 60, dx: 2 }, air, { limiter: 'has' });
    const mass = (): number => {
      let m = 0;
      for (let j = 0; j < solver.nz; j++)
        for (let i = 0; i < solver.nr; i++)
          m += (solver.rho[solver.index(i, j)] ?? 0) * solver.cellVolume(i);
      return m;
    };
    const m0 = mass();
    const e0 = solver.totalEnergy();
    const put = solver.deposit({ energy: 4.184e9, height: 40, radius: 10 });
    for (let n = 0; n < 60; n++) solver.step();
    expect(Math.abs(solver.totalEnergy() - e0 - put) / put).toBeLessThan(1e-9);
    expect(Math.abs(mass() - m0) / m0).toBeLessThan(1e-12);
    expect(solver.maxSpeed()).toBeGreaterThan(10);
    expect(solver.fallbacks).toBe(0);
    expect(solver.redone).toBe(0);
    expect(solver.halvings).toBe(0);
  }, 30_000);

  it('answers a tiny change of the source with a tiny change of the ground', () => {
    // Rule 1277 (a): no yes-or-no decision for rounding to turn.
    const air = uniformAtmosphere(SEA.rho0, SEA.p0);
    const peaks = (energy: number): Float64Array => {
      const solver = new BlastSolver2D({ nr: 40, nz: 40, dx: 2 }, air, { limiter: 'has' });
      solver.deposit({ energy, height: 20, radius: 6 });
      for (let n = 0; n < 80; n++) solver.step();
      return solver.groundPeak;
    };
    const a = peaks(4.184e9);
    const b = peaks(4.184e9 * (1 + 1e-9));
    let worst = 0;
    for (let i = 0; i < a.length; i++) {
      const x = a[i] ?? 0;
      if (x > 1_000) worst = Math.max(worst, Math.abs((b[i] ?? 0) / x - 1));
    }
    expect(worst).toBeLessThan(1e-6);
  }, 30_000);
});

describe("rule 1297's radial reconstruction (Mignone 2014)", () => {
  /** The r-weighted average of f over cell j (cell units, signed coordinates:
   *  a mirrored ghost below the axis keeps its own), exact for polynomials. */
  const average = (f: (x: number) => number, j: number): number => {
    const gauss = [
      [-0.8611363115940526, 0.3478548451374538],
      [-0.3399810435848563, 0.6521451548625461],
      [0.3399810435848563, 0.6521451548625461],
      [0.8611363115940526, 0.3478548451374538],
    ] as const;
    let sum = 0;
    let weight = 0;
    for (const [t, w] of gauss) {
      const x = j + 0.5 + 0.5 * t;
      sum += w * f(x) * x;
      weight += w * x;
    }
    return sum / weight;
  };

  it('gives back every polynomial to degree 4 at both faces, the axis included', () => {
    for (const i of [-1, 0, 1, 2, 7, 300])
      for (const side of [0, 1] as const)
        for (const degree of [0, 1, 2, 3, 4]) {
          const f = (x: number): number => x ** degree + 0.3 * x - 2;
          const cells = [i - 2, i - 1, i, i + 1, i + 2].map((j) => average(f, j));
          const k = radialCoefficients(i);
          let value = 0;
          for (let c = 0; c < 3; c++) {
            const w = k.candidate[side]?.[c] ?? [];
            const q =
              (w[0] ?? 0) * (cells[c] ?? 0) +
              (w[1] ?? 0) * (cells[c + 1] ?? 0) +
              (w[2] ?? 0) * (cells[c + 2] ?? 0);
            value += (k.linear[side]?.[c] ?? 0) * q;
          }
          const face = i + (side === 0 ? 1 : 0);
          expect(Math.abs(value - f(face))).toBeLessThan(1e-9 * Math.max(1, Math.abs(f(face))));
        }
  });

  it('has positive linear weights that sum to one', () => {
    for (let i = -1; i < 400; i++)
      for (const side of [0, 1] as const) {
        const d = radialCoefficients(i).linear[side] ?? [];
        expect(Math.min(...d)).toBeGreaterThan(0);
        expect(Math.abs(d.reduce((a, b) => a + b, 0) - 1)).toBeLessThan(1e-12);
      }
  });
});
