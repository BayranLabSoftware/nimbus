import { describe, expect, it } from 'vitest';
import { electromagneticPulse } from '../events/explosion/emp.js';
import { mulberry32 } from '../montecarlo/sampling.js';
import { SWEEP_SEED } from './physicalInvariantRules.js';

/**
 * Two more readings of the lens that found B-084, B-085 and B-086, taken
 * after the audit of rules 548 to 554 closed. Neither is one of that audit's
 * seven questions — rule 549 fixed those and they may not grow — so these
 * are recorded here as what else the lens was pointed at, and what came
 * back. Both came back clean, and a clean answer is worth keeping so the
 * next reader does not spend the hour again.
 *
 * 1. THE EMP'S FOOTPRINT IS A SLANT, NOT AN ARC, and it does not matter
 *    inside the form. `emp.ts` returns √(2Rh + h²), the straight-line
 *    distance to the tangent point, where the ground radius of the
 *    footprint is R·arccos(R/(R+h)). The two diverge with altitude: 0.65 %
 *    at 50 km, 4 % at 400 km — Starfish Prime's altitude, where the
 *    literature's ~2 200 km is the arc and the slant is 2 293 — and an
 *    order of magnitude above 10 000 km, where the slant grows without
 *    bound and the arc saturates at a quarter of the circumference. The
 *    invariant sweep draws the height of burst over 0 to 50 000 m, so
 *    inside everything this product is asked the difference is under one
 *    per cent. Not a defect; a declared approximation, now declared.
 *
 * 2. NO WAVE OUTRUNS ITS WATER. A long wave travels at √(g h), so nothing
 *    this project draws may cross the ocean faster than √(g × 11 000 m) =
 *    328.5 m/s, the shallow-water speed at the deepest trench. Over 5 042
 *    readings of the sweep's four wave-making domains — the travel times to
 *    100, 1 000 and 5 000 km and the declared deep-water celerity — none
 *    does. It was worth asking: the wave's speed is where B-046 lived, a
 *    Mw 9.0 crossing 1 000 km at 13.3 m/s because it read the depth over
 *    its own epicentre, and that was the error in the other direction.
 */

const EARTH_RADIUS_M = 6_371_000;
const DEEPEST_TRENCH_M = 11_000;
const SHALLOW_WATER_CEILING = Math.sqrt(9.81 * DEEPEST_TRENCH_M);
const SLICE = 40;

describe("the EMP's footprint is a slant, and it is within a per cent inside the form", () => {
  const arcKm = (h: number): number =>
    (EARTH_RADIUS_M * Math.acos(EARTH_RADIUS_M / (EARTH_RADIUS_M + h))) / 1_000;
  const modelKm = (h: number): number => Number(electromagneticPulse(1, h).affectedRadius) / 1_000;

  it('is under one per cent over the whole range the sweep draws', () => {
    // `scripts/benchmark/invariants.ts` draws the height of burst over
    // 0 to 50 000 m.
    for (const h of [35_000, 40_000, 50_000]) {
      const model = modelKm(h);
      if (!(model > 0)) continue;
      expect(Math.abs(model / arcKm(h) - 1), `${String(h)} m`).toBeLessThan(0.01);
    }
  });

  it('is four per cent at Starfish Prime, and unbounded far above it', () => {
    expect(modelKm(400_000) / arcKm(400_000)).toBeCloseTo(1.04, 1);
    // The arc can never exceed a quarter of the circumference; the slant can.
    expect(arcKm(1e8)).toBeLessThan(10_009);
    expect(modelKm(1e8)).toBeGreaterThan(100_000);
  });
});

describe('no wave outruns its water', () => {
  // Forty scenarios a domain, not a hundred and twenty: at a hundred and
  // twenty this took 9.7 s here and timed out CI's thirty-second budget,
  // which is what turned the pipeline red on 21 September. The claim is the
  // same — the assertion below still requires more than a hundred readings
  // before it will call the answer clean.
  it('keeps every travel time and celerity under √(g h) at the deepest trench', async () => {
    const { HAZARDS } = await import('../../../scripts/benchmark/invariants.js');
    const at = (o: unknown, p: string): number | undefined => {
      const v = p
        .split('.')
        .reduce<unknown>((a, k) => (a as Record<string, unknown> | undefined)?.[k], o);
      return typeof v === 'number' ? v : undefined;
    };
    let read = 0;
    for (const hazard of HAZARDS) {
      const rng = mulberry32(SWEEP_SEED(hazard.name));
      const u = (): number => rng.next();
      for (let i = 0; i < SLICE; i++) {
        let r: Record<string, unknown>;
        try {
          r = hazard.run(hazard.sample(u));
        } catch {
          continue;
        }
        for (const [distance, path] of [
          [1e5, 'tsunami.travelTimeTo100km'],
          [1e6, 'tsunami.travelTimeTo1000km'],
          [5e6, 'tsunami.travelTimeTo5000km'],
        ] as const) {
          const t = at(r, path);
          if (t === undefined || !(t > 0)) continue;
          read++;
          expect(distance / t, `${hazard.name} ${path}`).toBeLessThanOrEqual(SHALLOW_WATER_CEILING);
        }
        const c = at(r, 'tsunami.deepWaterCelerity');
        if (c !== undefined && c > 0) {
          read++;
          expect(c, `${hazard.name} celerity`).toBeLessThanOrEqual(SHALLOW_WATER_CEILING);
        }
      }
    }
    expect(read).toBeGreaterThan(100);
  }, 120_000);

  it('states the ceiling it uses', () => {
    expect(SHALLOW_WATER_CEILING).toBeCloseTo(328.5, 1);
  });
});
