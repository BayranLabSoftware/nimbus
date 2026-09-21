import { describe, expect, it } from 'vitest';
import { DEFAULT_SEAFLOOR_CUTOFF, oceanCouplingPartition } from '../effects/oceanCoupling.js';
import { kgPerM3, m } from '../units.js';

/**
 * Rules 654 to 659 — the seafloor taper, asked again, and ADOPTED on
 * 21 September 2026.
 *
 * THE RUN, the impact sweep on one commit with the step and then with the
 * taper (`benchmark/results/invariants-2026-09-21-6.json` and `-7`): the two
 * tsunami amplitudes that shrank are gone, and every other count is the same
 * — 145, 133, 118, 38 and the rest, invariant by invariant. Against rule
 * 136's bar, word for word:
 *
 *   (a) held — no tsunami amplitude fails;
 *   (b) held — nothing fails more often, nothing fails that did not, and no
 *       crater moves onto the simple-to-complex step, which is joined;
 *   (c) held — the calibration ends, below; and of the ocean preset's 40
 *       numbers in the crater, damage and tsunami blocks, 8 move, all within
 *       1 / (1 − e^(−3)) = 1.0524, the farthest exactly at it;
 *   (d) held — the suite passes but three tests that pin an ocean impact,
 *       read and updated: the taper's own outcome test, a 1 km stone into
 *       200 m of water (B-065, its dust 4.91 → 4.84 × 10¹⁰ kg, still printed
 *       in megatonnes), and the same stone's water share on a shelf,
 *       0.208 → 0.219; and the report keeps the gate at PASS.
 *
 * The refusal of 16 September stands recorded in impactInvariantRules.ts: it
 * was right on the day, on the step it found.
 */
describe('rules 654 to 659: the seafloor taper', () => {
  const partition = (depthM: number) =>
    oceanCouplingPartition({
      impactorDiameter: m(1_000),
      waterDepth: m(depthM),
      impactorDensity: kgPerM3(3_000),
    });

  it('is the default', () => {
    expect(DEFAULT_SEAFLOOR_CUTOFF).toBe('taper');
  });

  it('keeps the calibration ends (rule 655 c)', () => {
    // A body under no water strikes the seafloor with all its energy ...
    expect(partition(0).seafloorFraction).toBe(1);
    // ... and none reaches it from the disruption depth on.
    let d = 1;
    while (partition(d).seafloorFraction > 0 && d < 1e6) d *= 1.5;
    expect(partition(d).seafloorFraction).toBe(0);
    expect(partition(d * 10).seafloorFraction).toBe(0);
  });

  it('falls without a step', () => {
    let previous = 1;
    for (let depth = 0; depth <= 20_000; depth += 25) {
      const f = partition(depth).seafloorFraction;
      expect(f, `${String(depth)} m`).toBeLessThanOrEqual(previous + 1e-12);
      // No drop larger than a smooth fall allows between neighbours.
      expect(previous - f, `${String(depth)} m`).toBeLessThan(0.05);
      previous = f;
    }
  });
});
