import { describe, expect, it } from 'vitest';
import { eiepRatios, simulateEiepRow } from './eiepComparison.js';
import { EIEP_REFERENCE } from './eiepReference.js';

/**
 * The impact pipeline against the Earth Impact Effects Program, on the
 * grid scripts/eiep-reference.py fixed.
 *
 * Gated only where the two codes are meant to be the same equations:
 * the energy, and — on impacts both bring to the ground whole, at no
 * less than 95 % of their entry speed — the craters, the ejecta blanket
 * and the fireball. The program prints two or three significant
 * figures, so a few per cent is its rounding. Where the simulator does
 * something else by design (the entry, the strength, the air blast,
 * the complex crater depth) the report measures it and declares it;
 * no test pretends it agrees.
 */

const ratios = eiepRatios();

const intact = new Set(
  EIEP_REFERENCE.filter(
    (row) =>
      row.error === null &&
      row.impactVelocityKmS !== null &&
      row.impactVelocityKmS !== undefined &&
      row.impactVelocityKmS >= 0.95 * row.velocityKmS &&
      simulateEiepRow(row).entry.regime === 'INTACT'
  )
);

describe('the impact pipeline agrees with its reference implementation where it means to', () => {
  it('computes the energy the program does, to its two figures', () => {
    const energy = ratios.filter((r) => r.quantity === 'energy');
    expect(energy.length).toBeGreaterThan(70);
    for (const r of energy) expect(Math.abs(Math.log(r.model / r.reference))).toBeLessThan(0.03);
  });

  it('digs the same crater, throws the same blanket and lights the same fireball on a whole body', () => {
    const same = ratios.filter(
      (r) =>
        intact.has(r.row) &&
        (r.quantity === 'transientDiameter' ||
          r.quantity === 'finalDiameter' ||
          r.quantity === 'ejectaEdge' ||
          r.quantity === 'fireballRadius')
    );
    expect(same.length).toBeGreaterThan(200);
    for (const r of same) {
      expect(
        Math.abs(Math.log(r.model / r.reference)),
        `${r.quantity} ${String(r.detail ?? '')} for ${r.row.diameterM.toString()} m at ${r.row.velocityKmS.toString()} km/s`
      ).toBeLessThan(0.05);
    }
  });
});
