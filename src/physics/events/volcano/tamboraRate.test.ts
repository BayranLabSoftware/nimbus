import { describe, expect, it } from 'vitest';
import { validateVolcanoInput } from '../../validation/inputSchema.js';
import { plumeHeight } from './plumeHeight.js';
import { simulateVolcano, VOLCANO_PRESETS } from './simulate.js';

/**
 * Rule 602's open question, measured — and rule 602's own wording
 * corrected.
 *
 * Closing B-085 put a physical ceiling on the plume, and rule 602 said in
 * advance what that would NOT fix: that the product seemed to hold two
 * different eruption rates for Tambora 1815. It does, and this pins which
 * is which, because the rule stated it loosely and a loose statement in a
 * pushed rule is worth correcting in the open.
 *
 *   - The PRESET uses 5 × 10⁵ m³/s and gives a 47.3 km column. The
 *     reconstructed plume is ≈ 43 km, so the preset is +10 %, inside the
 *     ±50 % scatter Mastin et al. declare for their own relation.
 *   - `inputSchema.ts`'s warning STRING says "the largest known eruption
 *     (Tambora 1815, ~5×10⁶)". At that rate the same relation gives
 *     82.3 km — above every plume ever measured, which is the reading
 *     B-085 was registered on.
 *
 * So the two figures are a factor of ten apart and only the first is
 * computed with; the second is in a message. Neither is obviously a typo:
 * 5 × 10⁵ is the rate that reproduces the observed column, and 5 × 10⁶ is
 * roughly 40 km³ DRE over the climactic hours of 10 April 1815. They
 * answer different questions and the product does not say which it means.
 *
 * Pinned rather than repaired: choosing between them is a judgement about
 * the eruption, not about the code, and it wants a source in hand.
 */

describe('rule 602: the two rates the product holds for Tambora', () => {
  it('computes with 5 × 10⁵, and lands within Mastin’s own scatter', () => {
    expect(VOLCANO_PRESETS.TAMBORA_1815.input.volumeEruptionRate).toBe(5e5);
    const r = simulateVolcano(VOLCANO_PRESETS.TAMBORA_1815.input);
    expect(Number(r.plumeHeight) / 1_000).toBeCloseTo(47.3, 1);
    // The reconstructed column is about 43 km.
    expect(Number(r.plumeHeight) / 1_000 / 43 - 1).toBeLessThan(0.5);
  });

  it('says 5 × 10⁶ in a warning, which is ten times it and above every plume', () => {
    const out = validateVolcanoInput({
      volumeEruptionRate: 2e7,
      totalEjectaVolume: 1.4e11,
    });
    const warning = out.warnings.find((w) => w.field === 'volumeEruptionRate');
    expect(warning?.message).toContain('Tambora');
    expect(warning?.message).toContain('5×10⁶');
    // Ten times what the preset computes with.
    expect(5e6 / VOLCANO_PRESETS.TAMBORA_1815.input.volumeEruptionRate).toBe(10);
    // And the relation at that rate is the reading B-085 was registered on.
    expect(2.0 * 5e6 ** 0.241).toBeCloseTo(82.3, 1);
    // Which the ceiling now cuts, so the product can no longer print it.
    expect(Number(plumeHeight({ volumeEruptionRate: 5e6 })) / 1_000).toBeCloseTo(71.89, 2);
  });
});
