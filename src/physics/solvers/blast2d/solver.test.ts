import { describe, expect, it } from 'vitest';
import { isothermalAtmosphere, scaleHeight, uniformAtmosphere } from './atmosphere.js';
import { BlastSolver2D } from './solver.js';

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
  });
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
  });

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
  });
});
