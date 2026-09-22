import { describe, expect, it } from 'vitest';
import {
  fluenceReach,
  impactFireballVisibleFraction,
  impactThermalExposure,
  programIgnitionExposure,
} from '../effects/impactThermal.js';
import { DEFAULT_IMPACT_THERMAL } from '../events/impact/damageRings.js';
import { EIEP_REFERENCE } from './eiepReference.js';
import { simulateEiepRow } from './eiepComparison.js';
import { J, m } from '../units.js';
import {
  IMPACT_THERMAL_BODIES,
  impactThermalAgrees,
  impactThermalVerdict,
} from './impactThermalRules.js';

describe('rule 146: the law read off the program', () => {
  it('sees all of the fireball under the burst and none past its horizon', () => {
    const E = J(4.184e20);
    expect(impactFireballVisibleFraction(m(1), E)).toBeCloseTo(1, 6);
    // R_f = 0.002 E^⅓ = 1 496 m of fireball; its horizon, R⊕ arccos(1 − R_f/R⊕).
    const rf = 0.002 * Math.cbrt(4.184e20);
    const horizon = 6_371_000 * Math.acos(1 - rf / 6_371_000);
    expect(impactFireballVisibleFraction(m(horizon * 0.999), E)).toBeGreaterThan(0);
    expect(impactFireballVisibleFraction(m(horizon * 1.001), E)).toBe(0);
    expect(impactThermalExposure(m(horizon * 1.001), E)).toBe(0);
  });

  it("draws the program's clothing-ignition ring on the grid's 49 bodies, within 1 % or 200 m", () => {
    const seen = new Set<string>();
    let checked = 0;
    for (const row of EIEP_REFERENCE) {
      if (row.error !== null || row.burstAltitudeM != null || row.fireballRadiiM?.length !== 3) {
        continue;
      }
      const key = `${row.diameterM.toString()}|${row.densityKgM3.toString()}|${row.velocityKmS.toString()}|${row.angleDeg.toString()}|${row.target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const sim = simulateEiepRow(row);
      const energy = J((sim.impactor.kineticEnergy as number) * sim.entry.energyFractionToGround);
      const ring = fluenceReach(
        (d) => impactThermalExposure(m(d), energy),
        programIgnitionExposure(energy)
      ) as number;
      const program = row.fireballRadiiM[1] ?? 0;
      expect(impactThermalAgrees(program, ring), key).toBe(true);
      checked++;
    }
    expect(checked).toBe(49);
  }, 30_000);

  it('is the default since rule 149', () => {
    expect(DEFAULT_IMPACT_THERMAL).toBe('program');
  });
});

describe('rules 148 and 149', () => {
  it('draws sixteen bodies', () => {
    expect(IMPACT_THERMAL_BODIES).toHaveLength(16);
  });

  it('agrees within 1 % or 200 m, whichever is larger', () => {
    expect(impactThermalAgrees(3_000, 3_199)).toBe(true);
    expect(impactThermalAgrees(3_000, 3_201)).toBe(false);
    expect(impactThermalAgrees(100_000, 100_999)).toBe(true);
    expect(impactThermalAgrees(100_000, 101_001)).toBe(false);
  });

  it('passes only when enough is compared and every body agrees', () => {
    const twelve = Array.from({ length: 12 }, () => true);
    expect(impactThermalVerdict(twelve).heldOutPasses).toBe(true);
    expect(impactThermalVerdict([...twelve.slice(1), null]).heldOutPasses).toBe(false);
    expect(impactThermalVerdict([...twelve, false]).heldOutPasses).toBe(false);
  });
});
